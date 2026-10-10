import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import {
  DrawingStroke,
  ModerationReport,
  PlayerPublicState,
  PointNormalized,
  RevealedHint,
  RoomPhase,
  RoomPublicState,
  RoomSettings,
  RoundDuration,
  RoundGuessRecord,
  ShapeGeometry,
  ShapeType,
  StrokePhase,
  SystemFeedMessage,
  ThemeEntry,
  WordEntry,
} from './src/shared/types';
import { THEMES_CATALOG, WORDS_CATALOG } from './src/shared/catalog';

// ============================================================================
// RESOURCE, SECURITY & RATE LIMITS (Sections 4, 5, 8, 9, 10, 11)
// ============================================================================
const SERVER_BOOT_ID = `boot_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const MAX_PLAYERS_PER_ROOM = 35;
const MAX_ACTIVE_ROOMS = 64;
const MAX_WS_PAYLOAD_BYTES = 64 * 1024; // 64 KB max message size
const MAX_POINTS_PER_BATCH = 128;
const MAX_STROKES_PER_ROUND = 400;
const MAX_TOTAL_POINTS_PER_ROUND = 12000;
const MAX_CHAT_HISTORY = 35;
const MAX_GUESS_LENGTH = 80;
const MIN_GUESS_INTERVAL_MS = 400; // Per-player anti-spam cooldown
const MAX_MESSAGES_PER_WINDOW = 7; // Max 7 chat/guess messages per 4s window
const MESSAGE_WINDOW_MS = 4000;
const MAX_DRAW_BATCHES_PER_SEC = 120; // Allows TCP proxy bursts without ever dropping legitimate strokes
const EMPTY_ROOM_TTL_MS = 60 * 1000; // Remove empty rooms after 60s
const INACTIVE_ROOM_TTL_MS = 20 * 60 * 1000; // Remove inactive rooms after 20m

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}

interface InternalPlayer extends PlayerPublicState {
  ws: ExtendedWebSocket | null;
  lastGuessAt: number;
  messageWindowStart: number;
  messageCountInWindow: number;
  lastDrawBatchAt: number;
  drawWindowStart: number;
  drawCountInWindow: number;
  lastStrokeSeqMap: Map<string, number>;
  disconnectTimer: NodeJS.Timeout | null;
}

interface InternalRound {
  id: string;
  roomId: string;
  roundNumber: number;
  totalRounds: number;
  drawerPlayerId: string;
  drawerNickname: string;
  themeId: string | null;
  themeName: string | null;
  themeOptions: ThemeEntry[];
  secretWord: WordEntry | null;
  revealedLetterIndices: number[];
  contextHintsUsed: number;
  status: RoomPhase;
  startedAt: number | null;
  endsAt: number | null;
  pausedRemainingMs: number | null;
  hintsUsed: number;
  maxHints: number;
  lastHintAt: number | null;
  revealedHints: RevealedHint[];
  correctGuessPlayerIds: string[];
  correctGuessesOrder: RoundGuessRecord[];
  eligibleGuessersCount: number;
  drawerPointsEarned: number;
  drawerPointsPerPerson: number;
  totalPointsCount: number;
  drawingRevision: number;
  endReason?: 'time_up' | 'all_guessed' | 'drawer_finished' | 'drawer_disconnected' | 'host_ended';
  ended: boolean;
}

interface InternalRoom {
  id: string;
  joinCode: string;
  hostPlayerId: string;
  status: RoomPhase;
  previousStatusBeforePause?: RoomPhase;
  settings: RoomSettings;
  createdAt: number;
  lastActivityAt: number;
  emptySince: number | null;
  players: Map<string, InternalPlayer>;
  bannedPlayerIds: Set<string>;
  turnOrder: string[];
  currentTurnIndex: number;
  currentRound: InternalRound | null;
  usedWordIds: Set<string>;
  usedThemeIds: Set<string>;
  shownThemeIds: Set<string>;
  strokes: DrawingStroke[];
  redoStack: DrawingStroke[];
  feed: SystemFeedMessage[];
  phaseTimer: NodeJS.Timeout | null;
}

const rooms = new Map<string, InternalRoom>();
const reports: ModerationReport[] = [];
const customDisabledWordIds = new Set<string>();

function sanitizeText(raw: unknown, maxLen = 80): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

function normalizeAnswer(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function sanitizeSettings(partial: Partial<RoomSettings>, current?: RoomSettings): RoomSettings {
  const base: RoomSettings = current ?? {
    roomName: 'Arena 32 Players',
    maxPlayers: MAX_PLAYERS_PER_ROOM,
    roundDuration: 60,
    roundsPerPlayer: 1,
    themeMode: 'drawer_chooses',
    difficulty: 'mixed',
    hintsEnabled: true,
    hintType: 'letters',
    scoringMode: 'competitive',
    endWhenAllGuessed: true,
    allowEarlyFinish: true,
    chatEnabled: true,
  };

  const validDurations: RoundDuration[] = [45, 60, 90, 120];
  const duration = validDurations.includes(partial.roundDuration as RoundDuration)
    ? (partial.roundDuration as RoundDuration)
    : base.roundDuration;

  const roundsPerPlayer =
    partial.roundsPerPlayer === 1 || partial.roundsPerPlayer === 2 || partial.roundsPerPlayer === 3
      ? partial.roundsPerPlayer
      : base.roundsPerPlayer;

  const maxPlayers =
    typeof partial.maxPlayers === 'number' && Number.isFinite(partial.maxPlayers)
      ? Math.max(2, Math.min(MAX_PLAYERS_PER_ROOM, Math.round(partial.maxPlayers)))
      : base.maxPlayers;

  const themeMode =
    partial.themeMode === 'drawer_chooses' ||
    partial.themeMode === 'host_chooses' ||
    partial.themeMode === 'random'
      ? partial.themeMode
      : base.themeMode;

  const difficulty =
    partial.difficulty === 'easy' || partial.difficulty === 'medium' || partial.difficulty === 'mixed'
      ? partial.difficulty
      : base.difficulty;

  const hintType =
    partial.hintType === 'levels' || partial.hintType === 'contextual' || partial.hintType === 'letters'
      ? partial.hintType
      : base.hintType;

  const scoringMode =
    partial.scoringMode === 'competitive' || partial.scoringMode === 'casual'
      ? partial.scoringMode
      : base.scoringMode;

  return {
    roomName: sanitizeText(partial.roomName ?? base.roomName, 32) || 'Arena 32 Players',
    maxPlayers,
    roundDuration: duration,
    roundsPerPlayer,
    themeMode,
    difficulty,
    hintsEnabled: typeof partial.hintsEnabled === 'boolean' ? partial.hintsEnabled : base.hintsEnabled,
    hintType,
    scoringMode,
    endWhenAllGuessed:
      typeof partial.endWhenAllGuessed === 'boolean' ? partial.endWhenAllGuessed : base.endWhenAllGuessed,
    allowEarlyFinish:
      typeof partial.allowEarlyFinish === 'boolean' ? partial.allowEarlyFinish : base.allowEarlyFinish,
    chatEnabled: typeof partial.chatEnabled === 'boolean' ? partial.chatEnabled : base.chatEnabled,
  };
}

function addFeedMessage(
  room: InternalRoom,
  type: SystemFeedMessage['type'],
  text: string,
  playerNickname?: string
): SystemFeedMessage {
  const msg: SystemFeedMessage = {
    id: generateId('msg'),
    type,
    text,
    playerNickname,
    timestamp: Date.now(),
  };
  room.feed.push(msg);
  if (room.feed.length > MAX_CHAT_HISTORY) {
    room.feed.shift();
  }
  return msg;
}

function computeWordMaskState(round: InternalRound): {
  wordMask: string[];
  wordLetterCount: number;
  unrevealedLettersCount: number;
} {
  if (!round.secretWord) {
    return { wordMask: [], wordLetterCount: 0, unrevealedLettersCount: 0 };
  }
  const chars = Array.from(round.secretWord.text);
  let wordLetterCount = 0;
  let unrevealedLettersCount = 0;

  const wordMask = chars.map((ch, idx) => {
    if (ch === ' ') return ' ';
    if (ch === '-') return '-';
    wordLetterCount += 1;
    if (round.revealedLetterIndices.includes(idx)) {
      return ch.toUpperCase();
    }
    unrevealedLettersCount += 1;
    return '_';
  });

  return { wordMask, wordLetterCount, unrevealedLettersCount };
}

function toPublicPlayer(room: InternalRoom, p: InternalPlayer): PlayerPublicState {
  return {
    id: p.id,
    roomId: p.roomId,
    nickname: p.nickname,
    avatarId: p.avatarId,
    score: p.score,
    connectionStatus: p.connectionStatus,
    joinedAt: p.joinedAt,
    isHost: p.id === room.hostPlayerId,
    hasGuessedThisRound: p.hasGuessedThisRound,
    guessOrder: p.guessOrder,
    roundPointsEarned: p.roundPointsEarned,
    totalCorrectGuesses: p.totalCorrectGuesses,
    timesDrawn: p.timesDrawn,
  };
}

function buildPublicState(room: InternalRoom, includeStrokes = true): RoomPublicState {
  const players: PlayerPublicState[] = Array.from(room.players.values()).map((p) =>
    toPublicPlayer(room, p)
  );

  let currentRound: RoomPublicState['currentRound'] = null;
  if (room.currentRound) {
    const r = room.currentRound;
    const isEndedPhase =
      r.status === 'ROUND_RESULT' || r.status === 'NEXT_ROUND' || r.status === 'GAME_RESULT';
    const { wordMask, wordLetterCount, unrevealedLettersCount } = computeWordMaskState(r);

    currentRound = {
      id: r.id,
      roomId: r.roomId,
      roundNumber: r.roundNumber,
      totalRounds: r.totalRounds,
      drawerPlayerId: r.drawerPlayerId,
      drawerNickname: r.drawerNickname,
      themeId: r.themeId,
      themeName: r.themeName,
      themeOptions: r.themeOptions,
      status: r.status,
      startedAt: r.startedAt,
      endsAt: r.endsAt,
      serverNow: Date.now(),
      hintsUsed: r.hintsUsed,
      maxHints: r.maxHints,
      lastHintAt: r.lastHintAt,
      revealedHints: r.revealedHints,
      wordMask,
      wordLetterCount,
      unrevealedLettersCount,
      correctGuessPlayerIds: r.correctGuessPlayerIds,
      correctGuessesOrder: r.correctGuessesOrder,
      eligibleGuessersCount: r.eligibleGuessersCount,
      drawingRevision: r.drawingRevision,
      revealedWord: isEndedPhase && r.secretWord ? r.secretWord.text : undefined,
      drawerPointsEarned: r.drawerPointsEarned,
      drawerPointsPerPerson: r.drawerPointsPerPerson,
      endReason: r.endReason,
    };
  }

  return {
    id: room.id,
    joinCode: room.joinCode,
    hostPlayerId: room.hostPlayerId,
    status: room.status,
    previousStatusBeforePause: room.previousStatusBeforePause,
    settings: room.settings,
    createdAt: room.createdAt,
    players,
    currentRound,
    strokes: includeStrokes ? room.strokes : [],
    omitStrokes: !includeStrokes,
    feed: room.feed,
    serverBootId: SERVER_BOOT_ID,
  };
}

function sendToPlayer(player: InternalPlayer, event: string, payload: unknown) {
  if (player.ws && player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify({ event, payload }));
  }
}

function sendFullStateToPlayer(room: InternalRoom, player: InternalPlayer) {
  const fullState = buildPublicState(room, true);
  sendToPlayer(player, 'room:state', fullState);
  sendToPlayer(player, 'game:state-sync', fullState);

  if (
    room.currentRound &&
    room.currentRound.secretWord &&
    room.currentRound.drawerPlayerId === player.id &&
    (room.status === 'WORD_REVEAL' || room.status === 'DRAWING' || room.status === 'PAUSED')
  ) {
    sendToPlayer(player, 'word:private', {
      roundId: room.currentRound.id,
      word: room.currentRound.secretWord.text,
      themeName: room.currentRound.themeName,
      hints: room.currentRound.secretWord.hints,
    });
  }
}

/**
 * O(1)-serialization broadcast for phase transitions.
 * Never used for high-frequency drawing or chat events!
 */
function broadcastRoomState(room: InternalRoom, includeStrokes = false) {
  const state = buildPublicState(room, includeStrokes);
  const serializedStateMsg = JSON.stringify({ event: 'room:state', payload: state });

  let serializedPrivateWordMsg: string | null = null;
  if (
    room.currentRound &&
    room.currentRound.secretWord &&
    (room.status === 'WORD_REVEAL' || room.status === 'DRAWING' || room.status === 'PAUSED')
  ) {
    serializedPrivateWordMsg = JSON.stringify({
      event: 'word:private',
      payload: {
        roundId: room.currentRound.id,
        word: room.currentRound.secretWord.text,
        themeName: room.currentRound.themeName,
        hints: room.currentRound.secretWord.hints,
      },
    });
  }

  for (const player of room.players.values()) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(serializedStateMsg);
      if (
        serializedPrivateWordMsg &&
        room.currentRound &&
        room.currentRound.drawerPlayerId === player.id
      ) {
        player.ws.send(serializedPrivateWordMsg);
      }
    }
  }
}

function broadcastEvent(
  room: InternalRoom,
  event: string,
  payload: unknown,
  excludePlayerId?: string,
  skipIfBackpressured = false
) {
  const serialized = JSON.stringify({ event, payload });
  for (const player of room.players.values()) {
    if (excludePlayerId && player.id === excludePlayerId) continue;
    const ws = player.ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (skipIfBackpressured && ws.bufferedAmount > 2 * 1024 * 1024) {
        continue;
      }
      try {
        ws.send(serialized);
      } catch {
        // Ignore transient socket write error
      }
    }
  }
}

function clearPhaseTimer(room: InternalRoom) {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }
}

function cleanupRoomResources(room: InternalRoom) {
  clearPhaseTimer(room);
  for (const p of room.players.values()) {
    if (p.disconnectTimer) {
      clearTimeout(p.disconnectTimer);
      p.disconnectTimer = null;
    }
    p.lastStrokeSeqMap.clear();
  }
  room.strokes = [];
  room.redoStack = [];
  room.feed = [];
}

function pickWordForTheme(room: InternalRoom, themeId: string): { word: WordEntry; resolvedTheme: ThemeEntry } {
  const enabledWords = WORDS_CATALOG.filter((w) => w.enabled && !customDisabledWordIds.has(w.id));
  let pool: WordEntry[];

  if (themeId === 'misturado') {
    const unusedThemeWords = enabledWords.filter((w) => !room.usedThemeIds.has(w.themeId));
    pool = unusedThemeWords.length > 0 ? unusedThemeWords : enabledWords;
  } else {
    pool = enabledWords.filter((w) => w.themeId === themeId);
  }

  if (room.settings.difficulty !== 'mixed') {
    const diffFiltered = pool.filter((w) => w.difficulty === room.settings.difficulty);
    if (diffFiltered.length > 0) {
      pool = diffFiltered;
    }
  }

  const unused = pool.filter((w) => !room.usedWordIds.has(w.id));
  const candidateList = unused.length > 0 ? unused : pool.length > 0 ? pool : enabledWords;

  const chosen = candidateList[Math.floor(Math.random() * candidateList.length)] || WORDS_CATALOG[0];
  room.usedWordIds.add(chosen.id);

  const resolvedTheme =
    THEMES_CATALOG.find((t) => t.id === (themeId === 'misturado' ? chosen.themeId : themeId)) ||
    THEMES_CATALOG[0];

  // Mark this theme as used so it never repeats in future rounds of the match
  if (resolvedTheme && resolvedTheme.id !== 'misturado') {
    room.usedThemeIds.add(resolvedTheme.id);
  }
  if (themeId !== 'misturado') {
    room.usedThemeIds.add(themeId);
  }

  return { word: chosen, resolvedTheme };
}

function getEligibleGuessers(room: InternalRoom, drawerId: string): InternalPlayer[] {
  return Array.from(room.players.values()).filter(
    (p) => p.connectionStatus === 'connected' && p.id !== drawerId
  );
}

/**
 * Dynamic points per person for the drawer based on the number of eligible guessers in the room.
 * - Fewer players in the room -> higher points per correct guesser (e.g., 113 pts for 1 guesser, 58 pts for 2 guessers).
 * - More players in the room -> balanced points per correct guesser (e.g., 14 pts for 10 guessers, 6 pts for 34 guessers).
 * - Total drawer points = (number of players who guessed right) * pointsPerPerson.
 */
function computeDrawerPointsPerPerson(eligibleGuessersCount: number): number {
  const eligible = Math.max(1, eligibleGuessersCount);
  const fullRoomPool = Math.min(210, 110 + eligible * 3);
  return Math.max(6, Math.round(fullRoomPool / eligible));
}

/**
 * Speed-based points for a guesser:
 * - The faster the player responds (more time remaining), the more points they earn (up to 160 pts).
 * - The closer to the timer running out, the fewer points they earn (down to 20 pts).
 */
function computeGuesserSpeedPoints(
  round: InternalRound,
  room: InternalRoom,
  now: number,
  order: number
): { points: number; responseTimeSec: number } {
  const totalDurationMs = Math.max(10000, room.settings.roundDuration * 1000);
  const remainingMs = Math.max(0, (round.endsAt ?? now) - now);
  const elapsedMs = Math.max(0, totalDurationMs - remainingMs);
  const responseTimeSec = Math.max(1, Math.round(elapsedMs / 1000));
  const timeRatio = Math.max(0, Math.min(1, remainingMs / totalDurationMs));

  const speedPoints = Math.round(20 + 125 * timeRatio);
  const orderBonus = order === 1 ? 15 : order === 2 ? 8 : order === 3 ? 4 : 0;
  const hintPenalty = Math.min(20, round.hintsUsed * 3);
  const points = Math.max(15, speedPoints + orderBonus - hintPenalty);

  return { points, responseTimeSec };
}

function checkMessageRateLimit(player: InternalPlayer, now: number): boolean {
  if (now - player.lastGuessAt < MIN_GUESS_INTERVAL_MS) {
    return false;
  }
  if (now - player.messageWindowStart > MESSAGE_WINDOW_MS) {
    player.messageWindowStart = now;
    player.messageCountInWindow = 0;
  }
  if (player.messageCountInWindow >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  }
  player.lastGuessAt = now;
  player.messageCountInWindow += 1;
  return true;
}

function startRoundSetup(room: InternalRoom) {
  clearPhaseTimer(room);
  room.lastActivityAt = Date.now();

  const activeConnectedIds = Array.from(room.players.values())
    .filter((p) => p.connectionStatus === 'connected')
    .map((p) => p.id);

  if (activeConnectedIds.length === 0) {
    room.status = 'LOBBY';
    room.currentRound = null;
    broadcastRoomState(room, true);
    return;
  }

  if (room.currentTurnIndex >= room.turnOrder.length) {
    endGame(room);
    return;
  }

  while (
    room.currentTurnIndex < room.turnOrder.length &&
    !activeConnectedIds.includes(room.turnOrder[room.currentTurnIndex])
  ) {
    room.currentTurnIndex++;
  }

  if (room.currentTurnIndex >= room.turnOrder.length) {
    endGame(room);
    return;
  }

  const drawerId = room.turnOrder[room.currentTurnIndex];
  const drawer = room.players.get(drawerId);
  if (!drawer) {
    room.currentTurnIndex++;
    startRoundSetup(room);
    return;
  }

  for (const p of room.players.values()) {
    p.hasGuessedThisRound = false;
    p.guessOrder = undefined;
    p.roundPointsEarned = 0;
    p.lastStrokeSeqMap.clear();
  }

  room.strokes = [];
  room.redoStack = [];

  const allSpecificThemes = THEMES_CATALOG.filter((t) => t.id !== 'misturado' && t.enabled);
  // Filter out themes already played in this match so themes never repeat across rounds
  let unplayedThemes = allSpecificThemes.filter((t) => !room.usedThemeIds.has(t.id));
  if (unplayedThemes.length < 11) {
    room.usedThemeIds.clear();
    unplayedThemes = allSpecificThemes;
  }

  // Prioritize themes that haven't even been shown as cards yet in previous rounds
  let unshownThemes = unplayedThemes.filter((t) => !room.shownThemeIds.has(t.id));
  if (unshownThemes.length < 11) {
    room.shownThemeIds.clear();
    unshownThemes = unplayedThemes;
  }

  const shuffled = [...unshownThemes].sort(() => Math.random() - 0.5).slice(0, 11);
  for (const t of shuffled) {
    room.shownThemeIds.add(t.id);
  }
  const misturado = THEMES_CATALOG.find((t) => t.id === 'misturado');
  const themeOptions = misturado ? [...shuffled, misturado] : shuffled;

  const eligibleGuessers = getEligibleGuessers(room, drawer.id);
  const initialPointsPerPerson = computeDrawerPointsPerPerson(eligibleGuessers.length);

  const round: InternalRound = {
    id: generateId('rnd'),
    roomId: room.id,
    roundNumber: room.currentTurnIndex + 1,
    totalRounds: room.turnOrder.length,
    drawerPlayerId: drawer.id,
    drawerNickname: drawer.nickname,
    themeId: null,
    themeName: null,
    themeOptions,
    secretWord: null,
    revealedLetterIndices: [],
    contextHintsUsed: 0,
    status: 'ROUND_SETUP',
    startedAt: null,
    endsAt: null,
    pausedRemainingMs: null,
    hintsUsed: 0,
    maxHints: 99,
    lastHintAt: null,
    revealedHints: [],
    correctGuessPlayerIds: [],
    correctGuessesOrder: [],
    eligibleGuessersCount: eligibleGuessers.length,
    drawerPointsEarned: 0,
    drawerPointsPerPerson: initialPointsPerPerson,
    totalPointsCount: 0,
    drawingRevision: 0,
    ended: false,
  };

  room.currentRound = round;
  room.status = 'ROUND_SETUP';
  addFeedMessage(room, 'system', `Rodada ${round.roundNumber} de ${round.totalRounds}: ${drawer.nickname} vai desenhar!`);
  broadcastRoomState(room, true);

  room.phaseTimer = setTimeout(() => {
    if (!room.currentRound || room.currentRound.id !== round.id) return;
    if (room.settings.themeMode === 'random') {
      const randomTheme = shuffled[Math.floor(Math.random() * shuffled.length)] || allSpecificThemes[0];
      applyThemeAndRevealWord(room, randomTheme.id);
    } else {
      room.status = 'THEME_SELECTION';
      room.currentRound.status = 'THEME_SELECTION';
      const now = Date.now();
      room.currentRound.startedAt = now;
      room.currentRound.endsAt = now + 18000;
      broadcastRoomState(room, false);

      room.phaseTimer = setTimeout(() => {
        if (room.currentRound && room.currentRound.id === round.id && room.status === 'THEME_SELECTION') {
          const fallback = round.themeOptions[0] || THEMES_CATALOG[0];
          applyThemeAndRevealWord(room, fallback.id);
        }
      }, 18000);
    }
  }, 600);
}

function applyThemeAndRevealWord(room: InternalRoom, themeId: string) {
  if (!room.currentRound) return;
  clearPhaseTimer(room);

  const round = room.currentRound;
  const { word, resolvedTheme } = pickWordForTheme(room, themeId);

  round.themeId = resolvedTheme.id;
  round.themeName = resolvedTheme.name;
  round.secretWord = word;
  round.revealedLetterIndices = [];
  round.contextHintsUsed = 0;

  const { wordLetterCount } = computeWordMaskState(round);
  round.maxHints = wordLetterCount;
  round.status = 'WORD_REVEAL';
  room.status = 'WORD_REVEAL';

  const now = Date.now();
  round.startedAt = now;
  round.endsAt = now + 2800;

  addFeedMessage(
    room,
    'system',
    `Tema escolhido: ${resolvedTheme.name} (${wordLetterCount} letras). O desenhista está se preparando...`
  );
  broadcastRoomState(room, false);
  broadcastEvent(room, 'theme:selected', { themeId: resolvedTheme.id, themeName: resolvedTheme.name });

  room.phaseTimer = setTimeout(() => {
    if (!room.currentRound || room.currentRound.id !== round.id) return;
    startDrawingPhase(room);
  }, 2800);
}

function startDrawingPhase(room: InternalRoom) {
  if (!room.currentRound) return;
  clearPhaseTimer(room);

  const round = room.currentRound;
  const drawer = room.players.get(round.drawerPlayerId);
  if (drawer) {
    drawer.timesDrawn += 1;
  }

  round.eligibleGuessersCount = getEligibleGuessers(room, round.drawerPlayerId).length;
  round.drawerPointsPerPerson = computeDrawerPointsPerPerson(round.eligibleGuessersCount);
  round.status = 'DRAWING';
  room.status = 'DRAWING';

  const now = Date.now();
  const durationMs = room.settings.roundDuration * 1000;
  round.startedAt = now;
  round.endsAt = now + durationMs;

  const { wordMask, wordLetterCount } = computeWordMaskState(round);
  addFeedMessage(
    room,
    'system',
    `Valendo! A palavra tem ${wordLetterCount} letras no tema "${round.themeName}".`
  );
  broadcastRoomState(room, true);

  const startPayload = {
    roundId: round.id,
    roundNumber: round.roundNumber,
    totalRounds: round.totalRounds,
    drawerPlayerId: round.drawerPlayerId,
    drawerNickname: round.drawerNickname,
    startedAt: round.startedAt,
    endsAt: round.endsAt,
    serverNow: now,
    themeName: round.themeName,
    wordMask,
    wordLetterCount,
  };
  broadcastEvent(room, 'round:started', startPayload);
  broadcastEvent(room, 'game:round-start', startPayload);

  room.phaseTimer = setTimeout(() => {
    if (room.currentRound && room.currentRound.id === round.id && room.status === 'DRAWING') {
      endRound(room, 'time_up');
    }
  }, durationMs);
}

function endRound(
  room: InternalRoom,
  reason: 'time_up' | 'all_guessed' | 'drawer_finished' | 'drawer_disconnected' | 'host_ended'
) {
  if (!room.currentRound || room.currentRound.ended) return;
  clearPhaseTimer(room);

  const round = room.currentRound;
  round.ended = true;
  round.endReason = reason;
  round.status = 'ROUND_RESULT';
  room.status = 'ROUND_RESULT';

  const hits = round.correctGuessPlayerIds.length;
  const pointsPerPerson = computeDrawerPointsPerPerson(round.eligibleGuessersCount);
  round.drawerPointsPerPerson = pointsPerPerson;
  const finalDrawerPts = hits * pointsPerPerson;

  const deltaDrawerPts = finalDrawerPts - round.drawerPointsEarned;
  round.drawerPointsEarned = finalDrawerPts;
  const drawer = room.players.get(round.drawerPlayerId);
  if (drawer) {
    drawer.score = Math.max(0, drawer.score + deltaDrawerPts);
    drawer.roundPointsEarned = finalDrawerPts;
  }

  const secretText = round.secretWord?.text ?? '---';
  if (hits === 0) {
    addFeedMessage(
      room,
      'system',
      `Fim da rodada! A resposta era "${secretText}". Vamos para o próximo desafio!`
    );
  } else {
    addFeedMessage(
      room,
      'system',
      `Fim da rodada! A palavra secreta era "${secretText}". ${hits} jogador(es) acertaram!`
    );
  }

  const now = Date.now();
  round.startedAt = now;
  round.endsAt = now + 6000;

  broadcastRoomState(room, true);
  const endPayload = {
    roundId: round.id,
    revealedWord: secretText,
    endReason: reason,
    correctGuessesOrder: round.correctGuessesOrder,
    drawerPointsEarned: finalDrawerPts,
    drawerPointsPerPerson: pointsPerPerson,
  };
  broadcastEvent(room, 'round:ended', endPayload);
  broadcastEvent(room, 'game:round-end', endPayload);

  room.phaseTimer = setTimeout(() => {
    if (!room.currentRound || room.currentRound.id !== round.id) return;
    advanceToNextRound(room);
  }, 6000);
}

function advanceToNextRound(room: InternalRoom) {
  clearPhaseTimer(room);
  room.currentTurnIndex += 1;

  if (room.currentTurnIndex >= room.turnOrder.length) {
    endGame(room);
    return;
  }

  room.status = 'NEXT_ROUND';
  if (room.currentRound) {
    room.currentRound.status = 'NEXT_ROUND';
  }
  broadcastRoomState(room, false);

  room.phaseTimer = setTimeout(() => {
    startRoundSetup(room);
  }, 1200);
}

function endGame(room: InternalRoom) {
  clearPhaseTimer(room);
  room.status = 'GAME_RESULT';
  if (room.currentRound) {
    room.currentRound.status = 'GAME_RESULT';
  }
  addFeedMessage(room, 'system', 'Partida encerrada! Confira o placar final da sala.');
  broadcastRoomState(room, false);
  broadcastEvent(room, 'game:ended', {
    roomId: room.id,
  });
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Disable perMessageDeflate to eliminate zlib CPU/RAM overhead when broadcasting to 32 players
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    perMessageDeflate: false,
    maxPayload: MAX_WS_PAYLOAD_BYTES,
  });

  app.use(express.json({ limit: '32kb' }));

  // Render health check & diagnostics endpoint
  app.get('/healthz', (_req, res) => {
    const mem = process.memoryUsage();
    res.status(200).json({
      status: 'ok',
      serverBootId: SERVER_BOOT_ID,
      rooms: rooms.size,
      clients: wss.clients.size,
      rssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      uptime: Math.round(process.uptime()),
    });
  });

  app.get('/api/catalog', (_req, res) => {
    res.json({
      themes: THEMES_CATALOG,
      wordsCount: WORDS_CATALOG.length,
      words: WORDS_CATALOG.map((w) => ({
        id: w.id,
        themeId: w.themeId,
        text: w.text,
        difficulty: w.difficulty,
        enabled: w.enabled && !customDisabledWordIds.has(w.id),
        contentRating: w.contentRating,
      })),
    });
  });

  app.post('/api/catalog/toggle-word', (req, res) => {
    const { wordId, enabled } = req.body ?? {};
    if (typeof wordId === 'string') {
      if (enabled === false) {
        customDisabledWordIds.add(wordId);
      } else {
        customDisabledWordIds.delete(wordId);
      }
    }
    res.json({ ok: true, disabledIds: Array.from(customDisabledWordIds) });
  });

  app.post('/api/moderation/report', (req, res) => {
    const { roomId, reporterId, targetPlayerId, wordId, reason } = req.body ?? {};
    const cleanReason = sanitizeText(reason, 200);
    if (!cleanReason) {
      res.status(400).json({ error: 'Informe um motivo válido para a denúncia.' });
      return;
    }
    const report: ModerationReport = {
      id: generateId('rep'),
      roomId: sanitizeText(roomId, 40),
      reporterId: sanitizeText(reporterId, 40),
      targetPlayerId: targetPlayerId ? sanitizeText(targetPlayerId, 40) : undefined,
      wordId: wordId ? sanitizeText(wordId, 40) : undefined,
      reason: cleanReason,
      createdAt: Date.now(),
    };
    reports.push(report);
    if (reports.length > 200) reports.shift();
    res.json({ ok: true, reportId: report.id });
  });

  app.get('/api/rooms/public', (_req, res) => {
    const activeRooms = Array.from(rooms.values()).map((r) => ({
      joinCode: r.joinCode,
      roomName: r.settings.roomName,
      playerCount: Array.from(r.players.values()).filter((p) => p.connectionStatus === 'connected').length,
      maxPlayers: r.settings.maxPlayers,
      status: r.status,
    }));
    res.json({ rooms: activeRooms });
  });

  // 1. Render & Cloud Proxy Keep-Alive Heartbeat (every 15s prevents 55s idle disconnect)
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((rawWs) => {
      const ws = rawWs as ExtendedWebSocket;
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      try {
        ws.ping();
      } catch {}
    });
  }, 15000);

  // 2. Single Global Timer Sync & Inactive Room Garbage Collector (Sections 7 & 9)
  let gcCounter = 0;
  const globalTimerInterval = setInterval(() => {
    const now = Date.now();
    gcCounter += 1;

    for (const [code, room] of rooms.entries()) {
      // Emit lightweight game:timer once per second for active timed rounds, including drawingRevision for auto-healing
      if (
        room.currentRound &&
        room.currentRound.endsAt &&
        (room.status === 'DRAWING' || room.status === 'THEME_SELECTION' || room.status === 'WORD_REVEAL')
      ) {
        const remainingSeconds = Math.max(0, Math.ceil((room.currentRound.endsAt - now) / 1000));
        broadcastEvent(
          room,
          'game:timer',
          {
            roundId: room.currentRound.id,
            remainingSeconds,
            endsAt: room.currentRound.endsAt,
            serverNow: now,
            drawingRevision: room.currentRound.drawingRevision,
            strokesCount: room.strokes.length,
          },
          undefined,
          true
        );
      }

      // Periodic garbage collection every 15 ticks (15s)
      if (gcCounter % 15 === 0) {
        const connectedCount = Array.from(room.players.values()).filter(
          (p) => p.connectionStatus === 'connected'
        ).length;

        if (connectedCount === 0) {
          if (!room.emptySince) {
            room.emptySince = now;
          } else if (now - room.emptySince >= EMPTY_ROOM_TTL_MS) {
            cleanupRoomResources(room);
            rooms.delete(code);
            continue;
          }
        } else {
          room.emptySince = null;
        }

        if (now - room.lastActivityAt >= INACTIVE_ROOM_TTL_MS) {
          cleanupRoomResources(room);
          rooms.delete(code);
        }
      }
    }
  }, 1000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
    clearInterval(globalTimerInterval);
  });

  wss.on('connection', (rawWs: WebSocket, req) => {
    const ws = rawWs as ExtendedWebSocket;
    ws.isAlive = true;

    // Disable Nagle's algorithm so real-time drawing packets flush immediately on Render
    if (req?.socket) {
      req.socket.setNoDelay(true);
      req.socket.setKeepAlive(true, 15000);
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('error', () => {
      // Prevent unhandled socket error crashes
    });

    let boundRoomId: string | null = null;
    let boundPlayerId: string | null = null;

    const sendError = (message: string, code?: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'error', payload: { message, code } }));
      }
    };

    ws.on('message', (rawBuffer, isBinary) => {
      ws.isAlive = true;

      // Reject binary frames or oversized messages immediately (Section 11 & 12 Test F)
      if (isBinary) {
        sendError('Formato binário não suportado.', 'INVALID_FORMAT');
        return;
      }

      const rawStr = rawBuffer.toString();
      const byteLen = Buffer.byteLength(rawStr);
      if (byteLen > MAX_WS_PAYLOAD_BYTES) {
        sendError('Mensagem excede o tamanho máximo permitido.', 'PAYLOAD_TOO_LARGE');
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawStr);
      } catch {
        sendError('Formato JSON inválido.', 'MALFORMED_JSON');
        return;
      }

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        sendError('Estrutura de mensagem inválida.', 'INVALID_PAYLOAD');
        return;
      }

      const { event, payload: rawPayload } = parsed as { event?: unknown; payload?: unknown };
      if (typeof event !== 'string' || event.length === 0 || event.length > 48) {
        sendError('Evento inválido.', 'INVALID_EVENT');
        return;
      }

      const payload: Record<string, any> =
        rawPayload && typeof rawPayload === 'object' && !Array.isArray(rawPayload)
          ? (rawPayload as Record<string, any>)
          : {};

      // Lightweight client keep-alive ping
      if (event === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              event: 'pong',
              payload: { serverNow: Date.now(), serverBootId: SERVER_BOOT_ID },
            })
          );
        }
        return;
      }

      // 1. CREATE ROOM
      if (event === 'room:create') {
        if (rooms.size >= MAX_ACTIVE_ROOMS) {
          sendError('Limite máximo de salas simultâneas atingido no servidor. Tente novamente em instantes.');
          return;
        }

        const rawNickname = sanitizeText(payload.nickname, 18);
        if (rawNickname.length < 2) {
          sendError('Seu apelido deve ter entre 2 e 18 caracteres.');
          return;
        }
        const avatarId =
          typeof payload.avatarId === 'number' && Number.isFinite(payload.avatarId)
            ? Math.max(0, Math.min(11, Math.floor(payload.avatarId)))
            : 0;
        const playerId = sanitizeText(payload.playerId, 48) || generateId('plr');

        let joinCode = generateJoinCode();
        while (rooms.has(joinCode)) {
          joinCode = generateJoinCode();
        }

        const now = Date.now();
        const settings = sanitizeSettings(payload.settings || {});
        const room: InternalRoom = {
          id: generateId('room'),
          joinCode,
          hostPlayerId: playerId,
          status: 'LOBBY',
          settings,
          createdAt: now,
          lastActivityAt: now,
          emptySince: null,
          players: new Map(),
          bannedPlayerIds: new Set(),
          turnOrder: [],
          currentTurnIndex: 0,
          currentRound: null,
          usedWordIds: new Set(),
          usedThemeIds: new Set(),
          shownThemeIds: new Set(),
          strokes: [],
          redoStack: [],
          feed: [],
          phaseTimer: null,
        };

        const hostPlayer: InternalPlayer = {
          id: playerId,
          roomId: room.id,
          nickname: rawNickname,
          avatarId,
          score: 0,
          connectionStatus: 'connected',
          joinedAt: now,
          isHost: true,
          hasGuessedThisRound: false,
          roundPointsEarned: 0,
          totalCorrectGuesses: 0,
          timesDrawn: 0,
          ws,
          lastGuessAt: 0,
          messageWindowStart: now,
          messageCountInWindow: 0,
          lastDrawBatchAt: 0,
          drawWindowStart: now,
          drawCountInWindow: 0,
          lastStrokeSeqMap: new Map(),
          disconnectTimer: null,
        };

        room.players.set(playerId, hostPlayer);
        rooms.set(joinCode, room);

        boundRoomId = joinCode;
        boundPlayerId = playerId;

        addFeedMessage(room, 'system', `Sala "${settings.roomName}" criada por ${rawNickname}.`);
        sendToPlayer(hostPlayer, 'room:joined_ack', {
          playerId,
          joinCode,
          roomId: room.id,
          serverBootId: SERVER_BOOT_ID,
        });
        sendFullStateToPlayer(room, hostPlayer);
        return;
      }

      // 2. JOIN / RECONNECT ROOM
      if (event === 'room:join') {
        const joinCode = sanitizeText(payload.joinCode, 10).toUpperCase();
        const room = rooms.get(joinCode);
        if (!room) {
          if (payload.isReconnect) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  event: 'room:interrupted',
                  payload: {
                    reason: 'server_restarted_or_expired',
                    message:
                      'A partida anterior foi encerrada ou o servidor reiniciou (dados em memória RAM não persistentes).',
                  },
                })
              );
            }
          } else {
            sendError('Sala não encontrada. Verifique o código de convite.', 'ROOM_NOT_FOUND');
          }
          return;
        }

        room.lastActivityAt = Date.now();
        room.emptySince = null;

        const requestedPlayerId = sanitizeText(payload.playerId, 48) || generateId('plr');
        if (room.bannedPlayerIds.has(requestedPlayerId)) {
          sendError('Você foi removido desta sala pelo anfitrião.', 'BANNED');
          return;
        }

        const existingPlayer = room.players.get(requestedPlayerId);
        if (existingPlayer) {
          if (existingPlayer.disconnectTimer) {
            clearTimeout(existingPlayer.disconnectTimer);
            existingPlayer.disconnectTimer = null;
          }
          existingPlayer.ws = ws;
          existingPlayer.connectionStatus = 'connected';
          if (payload.nickname) {
            const cleanNick = sanitizeText(payload.nickname, 18);
            if (cleanNick.length >= 2) existingPlayer.nickname = cleanNick;
          }

          boundRoomId = joinCode;
          boundPlayerId = existingPlayer.id;

          if (room.currentRound) {
            room.currentRound.eligibleGuessersCount = getEligibleGuessers(
              room,
              room.currentRound.drawerPlayerId
            ).length;
          }

          sendToPlayer(existingPlayer, 'room:joined_ack', {
            playerId: existingPlayer.id,
            joinCode,
            roomId: room.id,
            serverBootId: SERVER_BOOT_ID,
            reconnected: true,
          });
          // Send full state (including compact stroke snapshot) ONLY to the reconnecting player
          sendFullStateToPlayer(room, existingPlayer);

          // Notify other players via lightweight delta event
          broadcastEvent(
            room,
            'room:player-joined',
            {
              player: toPublicPlayer(room, existingPlayer),
              hostPlayerId: room.hostPlayerId,
              totalRounds: room.currentRound?.totalRounds ?? room.turnOrder.length,
              eligibleGuessersCount: room.currentRound?.eligibleGuessersCount ?? 0,
              reconnected: true,
            },
            existingPlayer.id
          );
          return;
        }

        const connectedCount = Array.from(room.players.values()).filter(
          (p) => p.connectionStatus === 'connected'
        ).length;
        if (connectedCount >= room.settings.maxPlayers) {
          sendError(
            `Esta sala atingiu o limite máximo de ${room.settings.maxPlayers} jogadores.`,
            'ROOM_FULL'
          );
          return;
        }

        let rawNickname = sanitizeText(payload.nickname, 18);
        if (rawNickname.length < 2) {
          sendError('Seu apelido deve ter entre 2 e 18 caracteres.', 'INVALID_NICKNAME');
          return;
        }

        const existingNicks = new Set(
          Array.from(room.players.values()).map((p) => p.nickname.toLowerCase())
        );
        if (existingNicks.has(rawNickname.toLowerCase())) {
          let suffix = 2;
          while (existingNicks.has(`${rawNickname.slice(0, 14)} #${suffix}`.toLowerCase())) {
            suffix++;
          }
          rawNickname = `${rawNickname.slice(0, 14)} #${suffix}`;
        }

        const avatarId =
          typeof payload.avatarId === 'number' && Number.isFinite(payload.avatarId)
            ? Math.max(0, Math.min(11, Math.floor(payload.avatarId)))
            : 0;
        const now = Date.now();
        const newPlayer: InternalPlayer = {
          id: requestedPlayerId,
          roomId: room.id,
          nickname: rawNickname,
          avatarId,
          score: 0,
          connectionStatus: 'connected',
          joinedAt: now,
          isHost: false,
          hasGuessedThisRound: false,
          roundPointsEarned: 0,
          totalCorrectGuesses: 0,
          timesDrawn: 0,
          ws,
          lastGuessAt: 0,
          messageWindowStart: now,
          messageCountInWindow: 0,
          lastDrawBatchAt: 0,
          drawWindowStart: now,
          drawCountInWindow: 0,
          lastStrokeSeqMap: new Map(),
          disconnectTimer: null,
        };

        room.players.set(requestedPlayerId, newPlayer);
        if (room.status !== 'LOBBY' && room.status !== 'GAME_RESULT') {
          room.turnOrder.push(requestedPlayerId);
          if (room.currentRound) {
            room.currentRound.totalRounds = room.turnOrder.length;
            room.currentRound.eligibleGuessersCount = getEligibleGuessers(
              room,
              room.currentRound.drawerPlayerId
            ).length;
          }
        }

        boundRoomId = joinCode;
        boundPlayerId = requestedPlayerId;

        const joinFeedMsg = addFeedMessage(room, 'system', `${rawNickname} entrou na sala.`);
        sendToPlayer(newPlayer, 'room:joined_ack', {
          playerId: requestedPlayerId,
          joinCode,
          roomId: room.id,
          serverBootId: SERVER_BOOT_ID,
        });
        sendFullStateToPlayer(room, newPlayer);

        // Broadcast lightweight delta event to other players instead of full room state
        broadcastEvent(
          room,
          'room:player-joined',
          {
            player: toPublicPlayer(room, newPlayer),
            hostPlayerId: room.hostPlayerId,
            totalRounds: room.currentRound?.totalRounds ?? room.turnOrder.length,
            eligibleGuessersCount: room.currentRound?.eligibleGuessersCount ?? 0,
            feedMessage: joinFeedMsg,
          },
          newPlayer.id
        );
        return;
      }

      if (!boundRoomId || !boundPlayerId) {
        sendError('Você não está conectado a uma sala.', 'UNAUTHORIZED');
        return;
      }
      const room = rooms.get(boundRoomId);
      if (!room) {
        sendError('A sala não existe mais.', 'ROOM_EXPIRED');
        return;
      }
      const player = room.players.get(boundPlayerId);
      if (!player) {
        sendError('Jogador não encontrado na sala.', 'UNAUTHORIZED');
        return;
      }

      room.lastActivityAt = Date.now();

      // 3. STATE REQUEST / GAME READY
      if (event === 'state:request' || event === 'game:ready') {
        sendFullStateToPlayer(room, player);
        return;
      }

      // 4. UPDATE SETTINGS
      if (event === 'room:settings') {
        if (player.id !== room.hostPlayerId) {
          sendError('Somente o anfitrião pode alterar as configurações da sala.', 'FORBIDDEN');
          return;
        }
        if (room.status !== 'LOBBY') {
          sendError('As configurações só podem ser alteradas no lobby antes da partida.');
          return;
        }
        room.settings = sanitizeSettings(payload.settings || {}, room.settings);
        broadcastRoomState(room, false);
        return;
      }

      // 5. KICK PLAYER
      if (event === 'room:kick') {
        if (player.id !== room.hostPlayerId) {
          sendError('Somente o anfitrião pode remover participantes.', 'FORBIDDEN');
          return;
        }
        const targetId = sanitizeText(payload.targetPlayerId, 48);
        const target = room.players.get(targetId);
        if (!target || target.id === room.hostPlayerId) return;

        if (payload.ban === true) {
          room.bannedPlayerIds.add(targetId);
        }
        sendToPlayer(target, 'room:kicked', { reason: 'Removido pelo anfitrião da sala.' });
        if (target.ws) {
          target.ws.close();
        }
        room.players.delete(targetId);
        const kickMsg = addFeedMessage(room, 'system', `${target.nickname} foi removido da sala pelo anfitrião.`);

        if (room.currentRound && room.currentRound.drawerPlayerId === targetId && room.status === 'DRAWING') {
          endRound(room, 'drawer_disconnected');
        } else {
          broadcastEvent(room, 'room:player-left', {
            playerId: targetId,
            nickname: target.nickname,
            explicitLeave: true,
            connectionStatus: 'disconnected',
            hostPlayerId: room.hostPlayerId,
            eligibleGuessersCount: room.currentRound
              ? getEligibleGuessers(room, room.currentRound.drawerPlayerId).length
              : 0,
            feedMessage: kickMsg,
          });
        }
        return;
      }

      // 6. START GAME
      if (event === 'game:start') {
        if (player.id !== room.hostPlayerId) {
          sendError('Somente o anfitrião pode iniciar a partida.', 'FORBIDDEN');
          return;
        }
        const connectedPlayers = Array.from(room.players.values()).filter(
          (p) => p.connectionStatus === 'connected'
        );
        if (connectedPlayers.length < 1) {
          sendError('É necessário pelo menos 1 jogador conectado para iniciar.');
          return;
        }

        for (const p of room.players.values()) {
          p.score = 0;
          p.totalCorrectGuesses = 0;
          p.timesDrawn = 0;
          p.hasGuessedThisRound = false;
          p.roundPointsEarned = 0;
          p.lastStrokeSeqMap.clear();
        }

        const playerIds = connectedPlayers.map((p) => p.id);
        const turnOrder: string[] = [];
        for (let cycle = 0; cycle < room.settings.roundsPerPlayer; cycle++) {
          const cycleOrder = [...playerIds].sort(() => Math.random() - 0.5);
          if (
            turnOrder.length > 0 &&
            cycleOrder.length > 1 &&
            cycleOrder[0] === turnOrder[turnOrder.length - 1]
          ) {
            const temp = cycleOrder[0];
            cycleOrder[0] = cycleOrder[1];
            cycleOrder[1] = temp;
          }
          turnOrder.push(...cycleOrder);
        }

        room.turnOrder = turnOrder;
        room.currentTurnIndex = 0;
        room.usedWordIds.clear();
        room.usedThemeIds.clear();
        room.shownThemeIds.clear();

        startRoundSetup(room);
        return;
      }

      // 7. SELECT THEME
      if (event === 'theme:select') {
        if (room.status !== 'THEME_SELECTION' || !room.currentRound) {
          sendError('A seleção de tema não está ativa no momento.');
          return;
        }
        const canSelect =
          room.settings.themeMode === 'host_chooses'
            ? player.id === room.hostPlayerId
            : player.id === room.currentRound.drawerPlayerId;

        if (!canSelect) {
          sendError('Você não tem permissão para escolher o tema desta rodada.', 'FORBIDDEN');
          return;
        }

        const themeId = sanitizeText(payload.themeId, 32);
        const validOption = room.currentRound.themeOptions.find((t) => t.id === themeId);
        if (!validOption) {
          sendError('Tema selecionado inválido.');
          return;
        }

        applyThemeAndRevealWord(room, validOption.id);
        return;
      }

      // 8. DRAWING BATCH / STROKE (Sections 4, 6, 9, 11)
      if (event === 'drawing:batch' || event === 'drawing:stroke') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        // Rule 14: Strictly reject drawing events from anyone other than the current drawer
        if (player.id !== room.currentRound.drawerPlayerId) {
          sendError('Apenas o desenhista da rodada pode enviar traços.', 'FORBIDDEN_NOT_DRAWER');
          return;
        }

        const now = Date.now();
        if (now - player.drawWindowStart > 1000) {
          player.drawWindowStart = now;
          player.drawCountInWindow = 0;
        }
        player.drawCountInWindow += 1;
        if (
          player.drawCountInWindow > MAX_DRAW_BATCHES_PER_SEC &&
          payload.phase !== 'end' &&
          payload.phase !== 'start'
        ) {
          return;
        }
        player.lastDrawBatchAt = now;

        const strokeId = sanitizeText(payload.strokeId, 48);
        if (!strokeId) return;

        const tool: 'brush' | 'eraser' | 'shape' =
          payload.tool === 'eraser' ? 'eraser' : payload.tool === 'shape' ? 'shape' : 'brush';
        const color = /^#[0-9A-Fa-f]{6}$/.test(String(payload.color || ''))
          ? String(payload.color)
          : '#0F172A';
        const width =
          typeof payload.width === 'number' && Number.isFinite(payload.width)
            ? Math.max(2, Math.min(48, Math.round(payload.width)))
            : 8;
        const sequence =
          typeof payload.sequence === 'number' && Number.isFinite(payload.sequence)
            ? Math.floor(payload.sequence)
            : 0;
        const phase: StrokePhase =
          payload.phase === 'start' ||
          payload.phase === 'move' ||
          payload.phase === 'end' ||
          payload.phase === 'shape'
            ? payload.phase
            : 'move';

        // Duplicate sequence guard per strokeId (Section 8)
        const prevSeq = player.lastStrokeSeqMap.get(strokeId) ?? -1;
        if (sequence > 0 && sequence <= prevSeq && tool !== 'shape') {
          return;
        }
        if (sequence > prevSeq) {
          player.lastStrokeSeqMap.set(strokeId, sequence);
        }

        if (tool === 'shape' && payload.shape && typeof payload.shape === 'object') {
          const validShapes: ShapeType[] = [
            'rect',
            'circle',
            'triangle',
            'star',
            'heart',
            'line',
            'arrow',
            'diamond',
          ];
          const sType: ShapeType = validShapes.includes(payload.shape.shapeType)
            ? payload.shape.shapeType
            : 'rect';
          const rawX = Number(payload.shape.x);
          const rawY = Number(payload.shape.y);
          const rawW = Number(payload.shape.w);
          const rawH = Number(payload.shape.h);
          if (
            !Number.isFinite(rawX) ||
            !Number.isFinite(rawY) ||
            !Number.isFinite(rawW) ||
            !Number.isFinite(rawH)
          ) {
            return;
          }

          const shapeGeom: ShapeGeometry = {
            shapeType: sType,
            x: Math.max(0, Math.min(1, Number(rawX.toFixed(4)))),
            y: Math.max(0, Math.min(1, Number(rawY.toFixed(4)))),
            w: Math.max(0.02, Math.min(1, Number(rawW.toFixed(4)))),
            h: Math.max(0.02, Math.min(1, Number(rawH.toFixed(4)))),
            filled: Boolean(payload.shape.filled),
          };

          let existingShape = room.strokes.find((s) => s.id === strokeId);
          if (!existingShape) {
            if (room.strokes.length >= MAX_STROKES_PER_ROUND) room.strokes.shift();
            existingShape = {
              id: strokeId,
              roundId: room.currentRound.id,
              playerId: player.id,
              tool: 'shape',
              color,
              width,
              points: [],
              shape: shapeGeom,
              sequence,
              createdAt: now,
            };
            room.strokes.push(existingShape);
            room.redoStack = [];
          } else {
            existingShape.color = color;
            existingShape.width = width;
            existingShape.shape = shapeGeom;
            existingShape.sequence = Math.max(existingShape.sequence, sequence);
          }

          room.currentRound.drawingRevision += 1;

          const batchOut = {
            roundId: room.currentRound.id,
            strokeId,
            playerId: player.id,
            phase: 'shape' as StrokePhase,
            tool: 'shape' as const,
            color,
            width,
            points: [],
            shape: shapeGeom,
            sequence,
            drawingRevision: room.currentRound.drawingRevision,
            strokesCount: room.strokes.length,
          };
          broadcastEvent(room, 'drawing:batch', batchOut, player.id, false);
          return;
        }

        // Brush / Eraser batch validation (Rules 8, 12, 13)
        const rawPoints = Array.isArray(payload.points) ? payload.points : [];
        if (rawPoints.length === 0 || rawPoints.length > MAX_POINTS_PER_BATCH) {
          return;
        }

        const cleanPoints: PointNormalized[] = [];
        for (let i = 0; i < rawPoints.length; i++) {
          const pt = rawPoints[i];
          if (!pt || typeof pt !== 'object') continue;
          const px = Number(pt.x);
          const py = Number(pt.y);
          if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
          if (px < -0.05 || px > 1.05 || py < -0.05 || py > 1.05) continue;
          cleanPoints.push({
            x: Math.max(0, Math.min(1, Number(px.toFixed(4)))),
            y: Math.max(0, Math.min(1, Number(py.toFixed(4)))),
          });
        }

        if (cleanPoints.length === 0) return;

        // Enforce maximum recoverable snapshot size (Section 8 & 9)
        if (room.currentRound.totalPointsCount + cleanPoints.length > MAX_TOTAL_POINTS_PER_ROUND) {
          while (
            room.strokes.length > 1 &&
            room.currentRound.totalPointsCount + cleanPoints.length > MAX_TOTAL_POINTS_PER_ROUND
          ) {
            const removed = room.strokes.shift();
            if (removed) {
              room.currentRound.totalPointsCount = Math.max(
                0,
                room.currentRound.totalPointsCount - removed.points.length
              );
            }
          }
        }

        let stroke = room.strokes.find((s) => s.id === strokeId);
        if (!stroke) {
          if (room.strokes.length >= MAX_STROKES_PER_ROUND) {
            const removed = room.strokes.shift();
            if (removed) {
              room.currentRound.totalPointsCount = Math.max(
                0,
                room.currentRound.totalPointsCount - removed.points.length
              );
            }
          }
          stroke = {
            id: strokeId,
            roundId: room.currentRound.id,
            playerId: player.id,
            tool,
            color,
            width,
            points: cleanPoints,
            sequence,
            createdAt: now,
          };
          room.strokes.push(stroke);
          room.redoStack = [];
        } else {
          if (stroke.points.length + cleanPoints.length <= 2400) {
            stroke.points.push(...cleanPoints);
          }
          stroke.sequence = Math.max(stroke.sequence, sequence);
        }
        room.currentRound.totalPointsCount += cleanPoints.length;
        room.currentRound.drawingRevision += 1;

        const batchPayload = {
          roundId: room.currentRound.id,
          strokeId,
          playerId: player.id,
          phase,
          tool,
          color,
          width,
          points: cleanPoints,
          sequence,
          drawingRevision: room.currentRound.drawingRevision,
          strokesCount: room.strokes.length,
        };

        // Single serialization broadcast to all 34 spectators without dropping packets
        broadcastEvent(room, 'drawing:batch', batchPayload, player.id, false);
        return;
      }

      // 8B. AUTO-HEALING CANVAS SYNC REQUEST (Spectator missed a packet or tab woke up)
      if (event === 'drawing:sync_request') {
        if (!room.currentRound) return;
        sendToPlayer(player, 'drawing:state', {
          roundId: room.currentRound.id,
          strokes: room.strokes,
          drawingRevision: room.currentRound.drawingRevision,
        });
        return;
      }

      // 8C. DRAWER FULL SNAPSHOT RECOVERY (If drawer had a brief network blip)
      if (event === 'drawing:drawer_sync') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        if (player.id !== room.currentRound.drawerPlayerId) return;
        if (!Array.isArray(payload.strokes)) return;

        const syncedStrokes: DrawingStroke[] = [];
        let totalPts = 0;
        for (const rawS of payload.strokes.slice(-MAX_STROKES_PER_ROUND)) {
          if (!rawS || typeof rawS !== 'object' || typeof rawS.id !== 'string') continue;
          const sTool: 'brush' | 'eraser' | 'shape' =
            rawS.tool === 'eraser' ? 'eraser' : rawS.tool === 'shape' ? 'shape' : 'brush';
          const sColor = /^#[0-9A-Fa-f]{6}$/.test(String(rawS.color || ''))
            ? String(rawS.color)
            : '#0F172A';
          const sWidth =
            typeof rawS.width === 'number' && Number.isFinite(rawS.width)
              ? Math.max(2, Math.min(48, Math.round(rawS.width)))
              : 8;
          const pts: PointNormalized[] = [];
          if (Array.isArray(rawS.points)) {
            for (const p of rawS.points.slice(0, 2400)) {
              if (p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))) {
                pts.push({
                  x: Math.max(0, Math.min(1, Number(Number(p.x).toFixed(4)))),
                  y: Math.max(0, Math.min(1, Number(Number(p.y).toFixed(4)))),
                });
              }
            }
          }
          totalPts += pts.length;
          syncedStrokes.push({
            id: sanitizeText(rawS.id, 48),
            roundId: room.currentRound.id,
            playerId: player.id,
            tool: sTool,
            color: sColor,
            width: sWidth,
            points: pts,
            shape: rawS.shape,
            sequence: Number(rawS.sequence) || 1,
            createdAt: Number(rawS.createdAt) || Date.now(),
          });
        }

        room.strokes = syncedStrokes;
        room.currentRound.totalPointsCount = totalPts;
        room.currentRound.drawingRevision += 1;
        broadcastEvent(
          room,
          'drawing:state',
          {
            roundId: room.currentRound.id,
            strokes: room.strokes,
            drawingRevision: room.currentRound.drawingRevision,
          },
          player.id
        );
        return;
      }

      // 9. UNDO / REDO / CLEAR CANVAS
      if (event === 'drawing:undo') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        if (player.id !== room.currentRound.drawerPlayerId) return;
        const popped = room.strokes.pop();
        if (popped) {
          room.redoStack.push(popped);
          room.currentRound.totalPointsCount = Math.max(
            0,
            room.currentRound.totalPointsCount - popped.points.length
          );
          room.currentRound.drawingRevision += 1;
          broadcastEvent(room, 'drawing:state', {
            roundId: room.currentRound.id,
            strokes: room.strokes,
            drawingRevision: room.currentRound.drawingRevision,
          });
        }
        return;
      }

      if (event === 'drawing:redo') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        if (player.id !== room.currentRound.drawerPlayerId) return;
        const restored = room.redoStack.pop();
        if (restored) {
          room.strokes.push(restored);
          room.currentRound.totalPointsCount += restored.points.length;
          room.currentRound.drawingRevision += 1;
          broadcastEvent(room, 'drawing:state', {
            roundId: room.currentRound.id,
            strokes: room.strokes,
            drawingRevision: room.currentRound.drawingRevision,
          });
        }
        return;
      }

      if (event === 'drawing:clear') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        if (player.id !== room.currentRound.drawerPlayerId) {
          sendError('Apenas o desenhista pode limpar o desenho.', 'FORBIDDEN');
          return;
        }
        room.strokes = [];
        room.redoStack = [];
        room.currentRound.totalPointsCount = 0;
        room.currentRound.drawingRevision += 1;
        player.lastStrokeSeqMap.clear();
        broadcastEvent(room, 'drawing:clear', {
          roundId: room.currentRound.id,
          drawingRevision: room.currentRound.drawingRevision,
        });
        return;
      }

      // 10. REQUEST HINT (ONLY THE CURRENT DRAWER CAN REVEAL LETTERS OR HINTS)
      if (event === 'hint:request') {
        if (room.status !== 'DRAWING' || !room.currentRound || !room.currentRound.secretWord) return;
        const round = room.currentRound;
        if (player.id !== round.drawerPlayerId) {
          sendError(
            'Apenas quem está desenhando pode revelar letras para os outros jogadores.',
            'FORBIDDEN_NOT_DRAWER'
          );
          return;
        }
        const word = round.secretWord;
        if (!word) return;
        const mode = payload.mode === 'context' ? 'context' : 'letter';

        if (mode === 'context') {
          if (round.contextHintsUsed >= 3) {
            sendError('Todas as 3 dicas descritivas desta palavra já foram reveladas.');
            return;
          }
          const hintIdx = round.contextHintsUsed;
          const hintText = word.hints[hintIdx] || `Dica: pertence ao tema ${round.themeName}.`;
          round.contextHintsUsed += 1;
          round.hintsUsed += 1;
          round.lastHintAt = Date.now();

          const revealed: RevealedHint = {
            index: round.revealedHints.length + 1,
            text: hintText,
            type: 'contextual',
            revealedAt: Date.now(),
          };
          round.revealedHints.push(revealed);
          const feedMsg = addFeedMessage(room, 'hint', `Dica liberada: ${hintText}`);
          const maskState = computeWordMaskState(round);

          broadcastEvent(room, 'hint:revealed', {
            roundId: round.id,
            hint: revealed,
            hintsUsed: round.hintsUsed,
            lastHintAt: round.lastHintAt,
            ...maskState,
            feedMessage: feedMsg,
          });
          return;
        }

        const chars = Array.from(word.text);
        const unrevealedPositions: number[] = [];
        chars.forEach((ch, idx) => {
          if (ch !== ' ' && ch !== '-' && !round.revealedLetterIndices.includes(idx)) {
            unrevealedPositions.push(idx);
          }
        });

        if (unrevealedPositions.length === 0) {
          sendError('Todas as letras da palavra já foram reveladas!');
          return;
        }

        let targetIdx: number;
        if (
          typeof payload.letterIndex === 'number' &&
          unrevealedPositions.includes(payload.letterIndex)
        ) {
          targetIdx = payload.letterIndex;
        } else {
          targetIdx =
            unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
        }

        round.revealedLetterIndices.push(targetIdx);
        round.hintsUsed += 1;
        round.lastHintAt = Date.now();

        const maskState = computeWordMaskState(round);
        const revealedChar = chars[targetIdx].toUpperCase();
        const hintText = `Letra revelada na posição ${targetIdx + 1}: "${revealedChar}" (${maskState.wordMask.join(' ')})`;

        const revealed: RevealedHint = {
          index: round.revealedHints.length + 1,
          text: hintText,
          type: 'letters',
          revealedAt: Date.now(),
        };
        round.revealedHints.push(revealed);

        const feedMsg = addFeedMessage(
          room,
          'hint',
          `Dica de Letra: ${maskState.wordMask.join(' ')}`
        );

        broadcastEvent(room, 'hint:revealed', {
          roundId: round.id,
          hint: revealed,
          hintsUsed: round.hintsUsed,
          lastHintAt: round.lastHintAt,
          ...maskState,
          feedMessage: feedMsg,
        });
        return;
      }

      // 11. SUBMIT GUESS (Supports both 'guess:submit' and 'chat:guess' — Section 5 & 6)
      if (event === 'guess:submit' || event === 'chat:guess') {
        if (room.status !== 'DRAWING' || !room.currentRound || !room.currentRound.secretWord) {
          return;
        }
        const round = room.currentRound;
        if (player.id === round.drawerPlayerId) {
          sendError('Você é o desenhista desta rodada e não pode enviar palpites.');
          return;
        }
        if (player.hasGuessedThisRound) {
          sendError('Você já acertou a palavra desta rodada!');
          return;
        }

        const now = Date.now();
        if (!checkMessageRateLimit(player, now)) {
          sendError('Aguarde um instante antes de enviar outro palpite.', 'RATE_LIMITED');
          return;
        }

        const rawGuess = sanitizeText(payload.text, MAX_GUESS_LENGTH);
        if (!rawGuess) return;

        const normalizedGuess = normalizeAnswer(rawGuess);
        if (!normalizedGuess) return;

        const secret = round.secretWord;
        if (!secret) return;
        const acceptedNormalized = new Set(
          [secret.text, ...secret.acceptedAnswers].map((ans) => normalizeAnswer(ans))
        );

        if (acceptedNormalized.has(normalizedGuess)) {
          player.hasGuessedThisRound = true;
          player.totalCorrectGuesses += 1;
          round.correctGuessPlayerIds.push(player.id);

          const order = round.correctGuessPlayerIds.length;
          player.guessOrder = order;

          // 1. Speed-based guesser points: faster response = more points, closer to time end = fewer points
          const { points: pts, responseTimeSec } = computeGuesserSpeedPoints(round, room, now, order);
          player.score += pts;
          player.roundPointsEarned = pts;

          // 2. Per-person dynamic drawer points: scales with number of players in the room
          round.eligibleGuessersCount = Math.max(
            round.correctGuessPlayerIds.length,
            getEligibleGuessers(room, round.drawerPlayerId).length
          );
          const pointsPerPerson = computeDrawerPointsPerPerson(round.eligibleGuessersCount);
          round.drawerPointsPerPerson = pointsPerPerson;
          const newDrawerRoundTotal = round.correctGuessPlayerIds.length * pointsPerPerson;
          const drawerDelta = newDrawerRoundTotal - round.drawerPointsEarned;
          round.drawerPointsEarned = newDrawerRoundTotal;

          const drawer = room.players.get(round.drawerPlayerId);
          if (drawer) {
            drawer.score = Math.max(0, drawer.score + drawerDelta);
            drawer.roundPointsEarned = newDrawerRoundTotal;
          }

          const record: RoundGuessRecord = {
            playerId: player.id,
            nickname: player.nickname,
            avatarId: player.avatarId,
            order,
            pointsAwarded: pts,
            submittedAt: now,
            responseTimeSec,
          };
          round.correctGuessesOrder.push(record);

          const hitMsg = `${player.nickname} acertou em ${responseTimeSec}s! (+${pts} pts · Desenhista +${pointsPerPerson} pts)`;
          const feedMsg = addFeedMessage(room, 'correct_guess', hitMsg, player.nickname);

          sendToPlayer(player, 'guess:feedback', {
            correct: true,
            pointsAwarded: pts,
            order,
            text: `Você acertou em ${responseTimeSec}s e ganhou +${pts} pontos!`,
          });

          const correctPayload = {
            roundId: round.id,
            playerId: player.id,
            nickname: player.nickname,
            avatarId: player.avatarId,
            order,
            pointsAwarded: pts,
            responseTimeSec,
            playerTotalScore: player.score,
            drawerPlayerId: round.drawerPlayerId,
            drawerTotalScore: drawer?.score,
            drawerPointsEarned: round.drawerPointsEarned,
            drawerPointsPerPerson: pointsPerPerson,
            correctGuessPlayerIds: round.correctGuessPlayerIds,
            correctGuessesOrder: round.correctGuessesOrder,
            eligibleGuessersCount: round.eligibleGuessersCount,
            feedMessage: feedMsg,
          };

          broadcastEvent(room, 'guess:correct', correctPayload);
          broadcastEvent(room, 'game:correct-answer', correctPayload);

          const eligible = getEligibleGuessers(room, round.drawerPlayerId);
          const allGuessed =
            eligible.length > 0 &&
            eligible.every((p) => round.correctGuessPlayerIds.includes(p.id));

          if (room.settings.endWhenAllGuessed && allGuessed) {
            endRound(room, 'all_guessed');
          }
        } else {
          // Send private feedback to the guesser
          sendToPlayer(player, 'guess:feedback', {
            correct: false,
            text: `Palpite incorreto: "${rawGuess}". Tente novamente!`,
          });

          // Broadcast safe wrong guess to the room chat feed so all 32 players see live guessing activity
          const guessFeedMsg = addFeedMessage(room, 'chat', rawGuess, player.nickname);
          broadcastEvent(room, 'chat:message', { message: guessFeedMsg });
        }
        return;
      }

      // 12. SEPARATE CHAT MESSAGE
      if (event === 'chat:message') {
        if (!room.settings.chatEnabled) {
          sendError('O chat geral está desativado nas configurações desta sala.');
          return;
        }
        const now = Date.now();
        if (!checkMessageRateLimit(player, now)) {
          sendError('Aguarde um instante antes de enviar outra mensagem.', 'RATE_LIMITED');
          return;
        }

        const text = sanitizeText(payload.text, MAX_GUESS_LENGTH);
        if (!text) return;

        if (room.currentRound && room.currentRound.secretWord && room.status === 'DRAWING') {
          const normChat = normalizeAnswer(text);
          const secret = room.currentRound.secretWord;
          const spoilers = [secret.text, ...secret.acceptedAnswers].map((a) => normalizeAnswer(a));
          if (spoilers.some((sp) => normChat.includes(sp))) {
            sendError('Sua mensagem de chat contém a resposta secreta e foi bloqueada.');
            return;
          }
        }

        const chatMsg = addFeedMessage(room, 'chat', text, player.nickname);
        broadcastEvent(room, 'chat:message', { message: chatMsg });
        return;
      }

      // 13. EARLY FINISH ROUND
      if (event === 'round:finish') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        const isDrawer = player.id === room.currentRound.drawerPlayerId && room.settings.allowEarlyFinish;
        const isHost = player.id === room.hostPlayerId;
        if (!isDrawer && !isHost) {
          sendError('Você não tem permissão para encerrar a rodada antecipadamente.', 'FORBIDDEN');
          return;
        }
        endRound(room, isDrawer ? 'drawer_finished' : 'host_ended');
        return;
      }

      // 14. ADVANCE FROM ROUND RESULT IMMEDIATELY
      if (event === 'round:next_now') {
        if (player.id !== room.hostPlayerId) return;
        if (room.status === 'ROUND_RESULT') {
          advanceToNextRound(room);
        }
        return;
      }

      // 15. PAUSE / RESUME MATCH
      if (event === 'game:pause_toggle') {
        if (player.id !== room.hostPlayerId) {
          sendError('Somente o anfitrião pode pausar ou retomar a partida.', 'FORBIDDEN');
          return;
        }
        if (room.status === 'DRAWING' && room.currentRound) {
          clearPhaseTimer(room);
          room.previousStatusBeforePause = 'DRAWING';
          room.status = 'PAUSED';
          room.currentRound.status = 'PAUSED';
          room.currentRound.pausedRemainingMs = Math.max(
            2000,
            (room.currentRound.endsAt ?? Date.now()) - Date.now()
          );
          addFeedMessage(room, 'system', 'Partida pausada pelo anfitrião.');
          broadcastRoomState(room, false);
        } else if (room.status === 'PAUSED' && room.currentRound) {
          const remaining = room.currentRound.pausedRemainingMs ?? 15000;
          room.status = 'DRAWING';
          room.currentRound.status = 'DRAWING';
          const now = Date.now();
          room.currentRound.startedAt = now;
          room.currentRound.endsAt = now + remaining;
          room.currentRound.pausedRemainingMs = null;
          addFeedMessage(room, 'system', 'Partida retomada pelo anfitrião!');
          broadcastRoomState(room, false);
          const rId = room.currentRound.id;
          room.phaseTimer = setTimeout(() => {
            if (room.currentRound && room.currentRound.id === rId && room.status === 'DRAWING') {
              endRound(room, 'time_up');
            }
          }, remaining);
        }
        return;
      }

      // 16. RETURN TO LOBBY
      if (event === 'game:return_lobby') {
        if (player.id !== room.hostPlayerId) {
          sendError('Somente o anfitrião pode voltar a sala para o lobby.', 'FORBIDDEN');
          return;
        }
        clearPhaseTimer(room);
        room.status = 'LOBBY';
        room.currentRound = null;
        room.strokes = [];
        room.redoStack = [];
        for (const p of room.players.values()) {
          p.hasGuessedThisRound = false;
          p.guessOrder = undefined;
          p.roundPointsEarned = 0;
          p.lastStrokeSeqMap.clear();
        }
        addFeedMessage(room, 'system', 'A sala retornou ao lobby para uma nova partida.');
        broadcastRoomState(room, true);
        return;
      }

      // 17. LEAVE ROOM
      if (event === 'room:leave') {
        handlePlayerLeave(room, player, true);
        boundRoomId = null;
        boundPlayerId = null;
        return;
      }

      sendError(`Evento desconhecido: ${event}`, 'UNKNOWN_EVENT');
    });

    ws.on('close', () => {
      if (!boundRoomId || !boundPlayerId) return;
      const room = rooms.get(boundRoomId);
      if (!room) return;
      const player = room.players.get(boundPlayerId);
      if (!player) return;
      handlePlayerLeave(room, player, false);
    });
  });

  function handlePlayerLeave(room: InternalRoom, player: InternalPlayer, explicitLeave: boolean) {
    player.ws = null;
    let leaveFeedMsg: SystemFeedMessage | undefined;

    if (explicitLeave) {
      if (player.disconnectTimer) {
        clearTimeout(player.disconnectTimer);
        player.disconnectTimer = null;
      }
      room.players.delete(player.id);
      leaveFeedMsg = addFeedMessage(room, 'system', `${player.nickname} saiu da sala.`);
    } else {
      player.connectionStatus = 'disconnected';
    }

    const connectedPlayers = Array.from(room.players.values()).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (connectedPlayers.length === 0) {
      room.emptySince = Date.now();
      if (explicitLeave) {
        cleanupRoomResources(room);
        rooms.delete(room.joinCode);
        return;
      }
    }

    if (room.hostPlayerId === player.id && connectedPlayers.length > 0) {
      const nextHost = [...connectedPlayers].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      if (nextHost) {
        room.hostPlayerId = nextHost.id;
        leaveFeedMsg = addFeedMessage(room, 'system', `${nextHost.nickname} agora é o anfitrião da sala.`);
      }
    }

    if (
      room.currentRound &&
      room.currentRound.drawerPlayerId === player.id &&
      (room.status === 'THEME_SELECTION' || room.status === 'WORD_REVEAL' || room.status === 'DRAWING')
    ) {
      if (explicitLeave) {
        endRound(room, 'drawer_disconnected');
        return;
      } else {
        const roundId = room.currentRound.id;
        if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
        player.disconnectTimer = setTimeout(() => {
          if (
            player.connectionStatus === 'disconnected' &&
            room.currentRound &&
            room.currentRound.id === roundId &&
            !room.currentRound.ended
          ) {
            endRound(room, 'drawer_disconnected');
          }
        }, 25000);
      }
    } else if (room.status === 'DRAWING' && room.currentRound) {
      room.currentRound.eligibleGuessersCount = getEligibleGuessers(
        room,
        room.currentRound.drawerPlayerId
      ).length;
      const currentEligible = getEligibleGuessers(room, room.currentRound.drawerPlayerId);
      const allGuessed =
        currentEligible.length > 0 &&
        currentEligible.every((p) => room.currentRound!.correctGuessPlayerIds.includes(p.id));
      if (room.settings.endWhenAllGuessed && allGuessed) {
        endRound(room, 'all_guessed');
        return;
      }
    }

    const leftPayload = {
      playerId: player.id,
      nickname: player.nickname,
      explicitLeave,
      connectionStatus: player.connectionStatus,
      hostPlayerId: room.hostPlayerId,
      eligibleGuessersCount: room.currentRound
        ? getEligibleGuessers(room, room.currentRound.drawerPlayerId).length
        : 0,
      feedMessage: leaveFeedMsg,
    };
    broadcastEvent(room, 'room:player-left', leftPayload);
    broadcastEvent(room, 'player:left', leftPayload);
  }

  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.IS_BUNDLED_PROD === 'true' ||
    Boolean(process.env.RENDER);

  // Listen on 0.0.0.0:$PORT immediately so Render detects the open port without delay
  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(
      `SENAI Phone server listening on http://0.0.0.0:${PORT} (mode=${
        isProd ? 'production' : 'development'
      }, bootId=${SERVER_BOOT_ID})`
    );
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
