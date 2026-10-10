import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  DrawingStroke,
  ModerationReport,
  PlayerPublicState,
  RevealedHint,
  RoomPhase,
  RoomPublicState,
  RoomSettings,
  RoundDuration,
  RoundGuessRecord,
  ShapeGeometry,
  ShapeType,
  SystemFeedMessage,
  ThemeEntry,
  WordEntry,
} from './src/shared/types';
import { THEMES_CATALOG, WORDS_CATALOG } from './src/shared/catalog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
}

interface InternalPlayer extends PlayerPublicState {
  ws: ExtendedWebSocket | null;
  lastGuessAt: number;
  lastStrokeSeq: number;
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
  players: Map<string, InternalPlayer>;
  bannedPlayerIds: Set<string>;
  turnOrder: string[];
  currentTurnIndex: number;
  currentRound: InternalRound | null;
  usedWordIds: Set<string>;
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
    maxPlayers: 32,
    roundDuration: 60,
    roundsPerPlayer: 1,
    themeMode: 'drawer_chooses',
    difficulty: 'mixed',
    hintsEnabled: true,
    hintType: 'letters',
    scoringMode: 'competitive',
    endWhenAllGuessed: true,
    allowEarlyFinish: true,
    chatEnabled: false,
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
    typeof partial.maxPlayers === 'number'
      ? Math.max(2, Math.min(32, Math.round(partial.maxPlayers)))
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
) {
  const msg: SystemFeedMessage = {
    id: generateId('msg'),
    type,
    text,
    playerNickname,
    timestamp: Date.now(),
  };
  room.feed.push(msg);
  if (room.feed.length > 45) {
    room.feed.shift();
  }
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

function buildPublicState(room: InternalRoom, includeStrokes = true): RoomPublicState {
  const players: PlayerPublicState[] = Array.from(room.players.values()).map((p) => ({
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
  }));

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
      revealedWord: isEndedPhase && r.secretWord ? r.secretWord.text : undefined,
      drawerPointsEarned: isEndedPhase ? r.drawerPointsEarned : undefined,
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
  };
}

function sendToPlayer(player: InternalPlayer, event: string, payload: unknown) {
  if (player.ws && player.ws.readyState === WebSocket.OPEN) {
    player.ws.send(JSON.stringify({ event, payload }));
  }
}

function sendFullStateToPlayer(room: InternalRoom, player: InternalPlayer) {
  sendToPlayer(player, 'room:state', buildPublicState(room, true));
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
 * High-efficiency O(1)-serialization broadcast for up to 32 concurrent players.
 * By default omits the full strokes array during active rounds so guesses/hints/chat
 * never re-serialize or re-transmit megabytes of canvas data.
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
      if (skipIfBackpressured && ws.bufferedAmount > 512 * 1024) {
        continue;
      }
      ws.send(serialized);
    }
  }
}

function clearPhaseTimer(room: InternalRoom) {
  if (room.phaseTimer) {
    clearTimeout(room.phaseTimer);
    room.phaseTimer = null;
  }
}

function pickWordForTheme(room: InternalRoom, themeId: string): { word: WordEntry; resolvedTheme: ThemeEntry } {
  const enabledWords = WORDS_CATALOG.filter((w) => w.enabled && !customDisabledWordIds.has(w.id));
  let pool =
    themeId === 'misturado'
      ? enabledWords
      : enabledWords.filter((w) => w.themeId === themeId);

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

  return { word: chosen, resolvedTheme };
}

function getEligibleGuessers(room: InternalRoom, drawerId: string): InternalPlayer[] {
  return Array.from(room.players.values()).filter(
    (p) => p.connectionStatus === 'connected' && p.id !== drawerId
  );
}

function startRoundSetup(room: InternalRoom) {
  clearPhaseTimer(room);

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
  }

  room.strokes = [];
  room.redoStack = [];

  const specificThemes = THEMES_CATALOG.filter((t) => t.id !== 'misturado' && t.enabled);
  const shuffled = [...specificThemes].sort(() => Math.random() - 0.5).slice(0, 5);
  const misturado = THEMES_CATALOG.find((t) => t.id === 'misturado');
  const themeOptions = misturado ? [...shuffled, misturado] : shuffled;

  const eligibleGuessers = getEligibleGuessers(room, drawer.id);

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
    ended: false,
  };

  room.currentRound = round;
  room.status = 'ROUND_SETUP';
  addFeedMessage(room, 'system', `Rodada ${round.roundNumber} de ${round.totalRounds}: ${drawer.nickname} vai desenhar!`);
  broadcastRoomState(room, true);

  room.phaseTimer = setTimeout(() => {
    if (!room.currentRound || room.currentRound.id !== round.id) return;
    if (room.settings.themeMode === 'random') {
      const randomTheme = specificThemes[Math.floor(Math.random() * specificThemes.length)] || THEMES_CATALOG[0];
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
  }, 1000);
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
  round.endsAt = now + 3200;

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
  }, 3200);
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
  round.status = 'DRAWING';
  room.status = 'DRAWING';

  const now = Date.now();
  const durationMs = room.settings.roundDuration * 1000;
  round.startedAt = now;
  round.endsAt = now + durationMs;

  const { wordLetterCount } = computeWordMaskState(round);
  addFeedMessage(
    room,
    'system',
    `Valendo! A palavra tem ${wordLetterCount} letras no tema "${round.themeName}".`
  );
  broadcastRoomState(room, true);
  broadcastEvent(room, 'round:started', {
    roundId: round.id,
    startedAt: round.startedAt,
    endsAt: round.endsAt,
    themeName: round.themeName,
  });

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
  const eligible = Math.max(1, round.eligibleGuessersCount);
  let drawerPts = 0;

  if (hits > 0) {
    drawerPts = 50;
    if (hits / eligible > 0.5 && eligible > 1) {
      drawerPts += 15;
    }
    if (room.settings.scoringMode === 'competitive') {
      drawerPts = Math.max(15, drawerPts - Math.min(30, round.hintsUsed * 5));
    }
  }

  round.drawerPointsEarned = drawerPts;
  const drawer = room.players.get(round.drawerPlayerId);
  if (drawer) {
    drawer.score += drawerPts;
    drawer.roundPointsEarned = drawerPts;
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
  round.endsAt = now + 6500;

  broadcastRoomState(room, true);
  broadcastEvent(room, 'round:ended', {
    roundId: round.id,
    revealedWord: secretText,
    endReason: reason,
    correctGuessesOrder: round.correctGuessesOrder,
    drawerPointsEarned: drawerPts,
  });

  room.phaseTimer = setTimeout(() => {
    if (!room.currentRound || room.currentRound.id !== round.id) return;
    advanceToNextRound(room);
  }, 6500);
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
  }, 1400);
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

  // Disable perMessageDeflate to eliminate zlib compression overhead when broadcasting to 32 players
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    perMessageDeflate: false,
    maxPayload: 256 * 1024,
  });

  app.use(express.json());

  // Render health check endpoint
  app.get('/healthz', (_req, res) => {
    res.status(200).json({ status: 'ok', rooms: rooms.size, uptime: process.uptime() });
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

  // Render & Cloud Proxy Keep-Alive Heartbeat (every 20s prevents 60s idle disconnect)
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
  }, 20000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (rawWs: WebSocket) => {
    const ws = rawWs as ExtendedWebSocket;
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    let boundRoomId: string | null = null;
    let boundPlayerId: string | null = null;

    const sendError = (message: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'error', payload: { message } }));
      }
    };

    ws.on('message', (rawBuffer) => {
      ws.isAlive = true;

      let parsed: { event?: string; payload?: any };
      try {
        parsed = JSON.parse(rawBuffer.toString());
      } catch {
        return;
      }

      const { event, payload = {} } = parsed;

      // Lightweight client keep-alive ping
      if (event === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'pong', payload: { serverNow: Date.now() } }));
        }
        return;
      }

      // 1. CREATE ROOM
      if (event === 'room:create') {
        const rawNickname = sanitizeText(payload.nickname, 18);
        if (rawNickname.length < 2) {
          sendError('Seu apelido deve ter entre 2 e 18 caracteres.');
          return;
        }
        const avatarId = typeof payload.avatarId === 'number' ? Math.max(0, Math.min(11, payload.avatarId)) : 0;
        const playerId = sanitizeText(payload.playerId, 48) || generateId('plr');

        let joinCode = generateJoinCode();
        while (rooms.has(joinCode)) {
          joinCode = generateJoinCode();
        }

        const settings = sanitizeSettings(payload.settings || {});
        const room: InternalRoom = {
          id: generateId('room'),
          joinCode,
          hostPlayerId: playerId,
          status: 'LOBBY',
          settings,
          createdAt: Date.now(),
          players: new Map(),
          bannedPlayerIds: new Set(),
          turnOrder: [],
          currentTurnIndex: 0,
          currentRound: null,
          usedWordIds: new Set(),
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
          joinedAt: Date.now(),
          isHost: true,
          hasGuessedThisRound: false,
          roundPointsEarned: 0,
          totalCorrectGuesses: 0,
          timesDrawn: 0,
          ws,
          lastGuessAt: 0,
          lastStrokeSeq: -1,
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
        });
        sendFullStateToPlayer(room, hostPlayer);
        return;
      }

      // 2. JOIN ROOM
      if (event === 'room:join') {
        const joinCode = sanitizeText(payload.joinCode, 10).toUpperCase();
        const room = rooms.get(joinCode);
        if (!room) {
          sendError('Sala não encontrada. Verifique o código de convite.');
          return;
        }

        const requestedPlayerId = sanitizeText(payload.playerId, 48) || generateId('plr');
        if (room.bannedPlayerIds.has(requestedPlayerId)) {
          sendError('Você foi removido desta sala pelo anfitrião.');
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

          sendToPlayer(existingPlayer, 'room:joined_ack', {
            playerId: existingPlayer.id,
            joinCode,
            roomId: room.id,
          });
          // Send full state (including strokes) to the reconnecting player, and lightweight meta state to others
          sendFullStateToPlayer(room, existingPlayer);
          broadcastRoomState(room, false);
          return;
        }

        const connectedCount = Array.from(room.players.values()).filter(
          (p) => p.connectionStatus === 'connected'
        ).length;
        if (connectedCount >= room.settings.maxPlayers) {
          sendError(`Esta sala atingiu o limite máximo de ${room.settings.maxPlayers} jogadores.`);
          return;
        }

        let rawNickname = sanitizeText(payload.nickname, 18);
        if (rawNickname.length < 2) {
          sendError('Seu apelido deve ter entre 2 e 18 caracteres.');
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

        const avatarId = typeof payload.avatarId === 'number' ? Math.max(0, Math.min(11, payload.avatarId)) : 0;
        const newPlayer: InternalPlayer = {
          id: requestedPlayerId,
          roomId: room.id,
          nickname: rawNickname,
          avatarId,
          score: 0,
          connectionStatus: 'connected',
          joinedAt: Date.now(),
          isHost: false,
          hasGuessedThisRound: false,
          roundPointsEarned: 0,
          totalCorrectGuesses: 0,
          timesDrawn: 0,
          ws,
          lastGuessAt: 0,
          lastStrokeSeq: -1,
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

        addFeedMessage(room, 'system', `${rawNickname} entrou na sala.`);
        sendToPlayer(newPlayer, 'room:joined_ack', {
          playerId: requestedPlayerId,
          joinCode,
          roomId: room.id,
        });
        sendFullStateToPlayer(room, newPlayer);
        broadcastRoomState(room, false);
        return;
      }

      if (!boundRoomId || !boundPlayerId) {
        sendError('Você não está conectado a uma sala.');
        return;
      }
      const room = rooms.get(boundRoomId);
      if (!room) {
        sendError('A sala não existe mais.');
        return;
      }
      const player = room.players.get(boundPlayerId);
      if (!player) {
        sendError('Jogador não encontrado na sala.');
        return;
      }

      // 3. STATE REQUEST
      if (event === 'state:request') {
        sendFullStateToPlayer(room, player);
        return;
      }

      // 4. UPDATE SETTINGS
      if (event === 'room:settings') {
        if (player.id !== room.hostPlayerId) {
          sendError('Somente o anfitrião pode alterar as configurações da sala.');
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
          sendError('Somente o anfitrião pode remover participantes.');
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
        addFeedMessage(room, 'system', `${target.nickname} foi removido da sala pelo anfitrião.`);

        if (room.currentRound && room.currentRound.drawerPlayerId === targetId && room.status === 'DRAWING') {
          endRound(room, 'drawer_disconnected');
        } else {
          broadcastRoomState(room, false);
        }
        return;
      }

      // 6. START GAME
      if (event === 'game:start') {
        if (player.id !== room.hostPlayerId) {
          sendError('Somente o anfitrião pode iniciar a partida.');
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
          sendError('Você não tem permissão para escolher o tema desta rodada.');
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

      // 8. DRAWING STROKE OR GEOMETRIC SHAPE UPSERT
      if (event === 'drawing:stroke') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        if (player.id !== room.currentRound.drawerPlayerId) return;

        const strokeId = sanitizeText(payload.strokeId, 48);
        if (!strokeId) return;

        const tool: 'brush' | 'eraser' | 'shape' =
          payload.tool === 'eraser' ? 'eraser' : payload.tool === 'shape' ? 'shape' : 'brush';
        const color = sanitizeText(payload.color, 16) || '#0F172A';
        const width = typeof payload.width === 'number' ? Math.max(2, Math.min(48, payload.width)) : 8;
        const sequence = typeof payload.sequence === 'number' ? payload.sequence : 0;

        if (tool === 'shape' && payload.shape) {
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
          const shapeGeom: ShapeGeometry = {
            shapeType: sType,
            x: Math.max(0, Math.min(1, Number((payload.shape.x ?? 0.5).toFixed(4)))),
            y: Math.max(0, Math.min(1, Number((payload.shape.y ?? 0.5).toFixed(4)))),
            w: Math.max(0.02, Math.min(1, Number((payload.shape.w ?? 0.2).toFixed(4)))),
            h: Math.max(0.02, Math.min(1, Number((payload.shape.h ?? 0.2).toFixed(4)))),
            filled: Boolean(payload.shape.filled),
          };

          let existingShape = room.strokes.find((s) => s.id === strokeId);
          if (!existingShape) {
            if (room.strokes.length >= 400) room.strokes.shift();
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
              createdAt: Date.now(),
            };
            room.strokes.push(existingShape);
            room.redoStack = [];
          } else {
            existingShape.color = color;
            existingShape.width = width;
            existingShape.shape = shapeGeom;
            existingShape.sequence = Math.max(existingShape.sequence, sequence);
          }

          broadcastEvent(
            room,
            'drawing:stroke',
            {
              roundId: room.currentRound.id,
              strokeId,
              playerId: player.id,
              tool: 'shape',
              color,
              width,
              points: [],
              shape: shapeGeom,
              sequence,
            },
            player.id,
            true
          );
          return;
        }

        const rawPoints = Array.isArray(payload.points) ? payload.points : [];
        const validPoints = rawPoints
          .slice(0, 120)
          .filter(
            (pt: any) =>
              pt &&
              typeof pt.x === 'number' &&
              typeof pt.y === 'number' &&
              !Number.isNaN(pt.x) &&
              !Number.isNaN(pt.y)
          )
          .map((pt: any) => ({
            x: Math.max(0, Math.min(1, Number(pt.x.toFixed(4)))),
            y: Math.max(0, Math.min(1, Number(pt.y.toFixed(4)))),
          }));

        if (validPoints.length === 0) return;

        let existingStroke = room.strokes.find((s) => s.id === strokeId);
        if (!existingStroke) {
          if (room.strokes.length >= 400) {
            room.strokes.shift();
          }
          existingStroke = {
            id: strokeId,
            roundId: room.currentRound.id,
            playerId: player.id,
            tool,
            color,
            width,
            points: validPoints,
            sequence,
            createdAt: Date.now(),
          };
          room.strokes.push(existingStroke);
          room.redoStack = [];
        } else {
          existingStroke.points.push(...validPoints);
          existingStroke.sequence = Math.max(existingStroke.sequence, sequence);
        }

        broadcastEvent(
          room,
          'drawing:stroke',
          {
            roundId: room.currentRound.id,
            strokeId,
            playerId: player.id,
            tool,
            color,
            width,
            points: validPoints,
            sequence,
          },
          player.id,
          true
        );
        return;
      }

      // 9. UNDO / REDO / CLEAR
      if (event === 'drawing:undo') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        if (player.id !== room.currentRound.drawerPlayerId) return;

        const popped = room.strokes.pop();
        if (popped) {
          room.redoStack.push(popped);
          broadcastEvent(room, 'drawing:state', {
            roundId: room.currentRound.id,
            strokes: room.strokes,
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
          broadcastEvent(room, 'drawing:state', {
            roundId: room.currentRound.id,
            strokes: room.strokes,
          });
        }
        return;
      }

      if (event === 'drawing:clear') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        if (player.id !== room.currentRound.drawerPlayerId) return;

        room.strokes = [];
        room.redoStack = [];
        broadcastEvent(room, 'drawing:state', {
          roundId: room.currentRound.id,
          strokes: [],
        });
        return;
      }

      // 10. REQUEST HINT / REVEAL LETTER UNLIMITED TIMES
      if (event === 'hint:request') {
        if (room.status !== 'DRAWING' || !room.currentRound || !room.currentRound.secretWord) {
          sendError('Dicas só podem ser usadas durante a fase de desenho.');
          return;
        }
        const round = room.currentRound;
        const word = round.secretWord;
        if (!word) return;
        const mode = payload.mode === 'context' ? 'context' : 'letter';

        if (mode === 'context') {
          if (round.contextHintsUsed >= word.hints.length) {
            sendError('Todas as dicas textuais desta palavra já foram reveladas.');
            return;
          }
          const rawHint = word.hints[round.contextHintsUsed];
          round.contextHintsUsed += 1;
          round.hintsUsed += 1;
          round.lastHintAt = Date.now();
          const hint: RevealedHint = {
            index: round.revealedHints.length + 1,
            type: 'contextual',
            text: `Pista ${round.contextHintsUsed}: ${rawHint}`,
            revealedAt: Date.now(),
          };
          round.revealedHints.push(hint);
          addFeedMessage(room, 'hint', `${player.nickname} liberou uma pista: ${hint.text}`);
          broadcastEvent(room, 'hint:revealed', {
            roundId: round.id,
            hint,
            hintsUsed: round.hintsUsed,
            maxHints: round.maxHints,
          });
          broadcastRoomState(room, false);
          return;
        }

        const chars = Array.from(word.text);
        const unrevealedPositions = chars
          .map((ch, idx) => ({ ch, idx }))
          .filter(
            (item) =>
              item.ch !== ' ' &&
              item.ch !== '-' &&
              !round.revealedLetterIndices.includes(item.idx)
          );

        if (unrevealedPositions.length === 0) {
          sendError('Todas as letras da palavra já foram reveladas!');
          return;
        }

        let chosenPos = unrevealedPositions[Math.floor(Math.random() * unrevealedPositions.length)];
        if (typeof payload.letterIndex === 'number') {
          const specific = unrevealedPositions.find((p) => p.idx === payload.letterIndex);
          if (specific) chosenPos = specific;
        }

        round.revealedLetterIndices.push(chosenPos.idx);
        round.hintsUsed += 1;
        round.lastHintAt = Date.now();

        const { wordMask } = computeWordMaskState(round);
        const formattedMask = wordMask.map((c) => (c === ' ' ? '   ' : c)).join(' ');

        const hint: RevealedHint = {
          index: round.revealedHints.length + 1,
          type: 'letters',
          text: `Letra "${chosenPos.ch.toUpperCase()}" revelada → ${formattedMask}`,
          revealedAt: Date.now(),
        };

        round.revealedHints.push(hint);
        if (round.revealedHints.length > 12) {
          round.revealedHints.shift();
        }

        addFeedMessage(
          room,
          'hint',
          `Dica de letra ativada por ${player.nickname}: letra "${chosenPos.ch.toUpperCase()}" na posição ${chosenPos.idx + 1}!`
        );

        broadcastEvent(room, 'hint:revealed', {
          roundId: round.id,
          hint,
          hintsUsed: round.hintsUsed,
          maxHints: round.maxHints,
        });
        broadcastRoomState(room, false);
        return;
      }

      // 11. SUBMIT GUESS
      if (event === 'guess:submit') {
        if (room.status !== 'DRAWING' || !room.currentRound || !room.currentRound.secretWord) {
          sendError('Os palpites estão fechados neste momento.');
          return;
        }
        const round = room.currentRound;
        if (player.id === round.drawerPlayerId) {
          sendError('O desenhista não pode enviar palpites na própria rodada.');
          return;
        }
        if (player.hasGuessedThisRound) {
          sendError('Você já acertou a palavra desta rodada!');
          return;
        }

        const now = Date.now();
        if (now - player.lastGuessAt < 350) {
          sendError('Aguarde um instante antes de enviar outro palpite.');
          return;
        }
        player.lastGuessAt = now;

        const rawGuess = sanitizeText(payload.text, 80);
        if (!rawGuess) return;

        const normalizedGuess = normalizeAnswer(rawGuess);
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

          let pointsAwarded = 100;
          if (order === 2) pointsAwarded = 80;
          else if (order === 3) pointsAwarded = 60;
          else if (order >= 4) pointsAwarded = 40;

          player.score += pointsAwarded;
          player.roundPointsEarned = pointsAwarded;

          round.correctGuessesOrder.push({
            playerId: player.id,
            nickname: player.nickname,
            avatarId: player.avatarId,
            order,
            pointsAwarded,
            submittedAt: now,
          });

          sendToPlayer(player, 'guess:feedback', {
            correct: true,
            text: `Você acertou! +${pointsAwarded} pontos`,
            pointsAwarded,
            order,
          });

          addFeedMessage(
            room,
            'correct_guess',
            `${player.nickname} acertou a palavra secreta! (${order}º lugar)`,
            player.nickname
          );

          broadcastEvent(room, 'guess:correct', {
            roundId: round.id,
            playerId: player.id,
            nickname: player.nickname,
            order,
            correctCount: round.correctGuessPlayerIds.length,
            eligibleCount: round.eligibleGuessersCount,
          });

          const currentEligible = getEligibleGuessers(room, round.drawerPlayerId);
          const allGuessed =
            currentEligible.length > 0 &&
            currentEligible.every((p) => round.correctGuessPlayerIds.includes(p.id));

          if (room.settings.endWhenAllGuessed && allGuessed) {
            endRound(room, 'all_guessed');
          } else {
            broadcastRoomState(room, false);
          }
        } else {
          sendToPlayer(player, 'guess:feedback', {
            correct: false,
            guessText: rawGuess,
            text: `Palpite enviado: "${rawGuess}" — ainda não é essa!`,
          });
        }
        return;
      }

      // 12. SEPARATE CHAT MESSAGE
      if (event === 'chat:message') {
        if (!room.settings.chatEnabled) {
          sendError('O chat geral está desativado nas configurações desta sala.');
          return;
        }
        const text = sanitizeText(payload.text, 100);
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

        addFeedMessage(room, 'chat', text, player.nickname);
        broadcastRoomState(room, false);
        return;
      }

      // 13. EARLY FINISH ROUND
      if (event === 'round:finish') {
        if (room.status !== 'DRAWING' || !room.currentRound) return;
        const isDrawer = player.id === room.currentRound.drawerPlayerId && room.settings.allowEarlyFinish;
        const isHost = player.id === room.hostPlayerId;
        if (!isDrawer && !isHost) {
          sendError('Você não tem permissão para encerrar a rodada antecipadamente.');
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
          sendError('Somente o anfitrião pode pausar ou retomar a partida.');
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
          sendError('Somente o anfitrião pode voltar a sala para o lobby.');
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

    if (explicitLeave) {
      room.players.delete(player.id);
      addFeedMessage(room, 'system', `${player.nickname} saiu da sala.`);
      broadcastEvent(room, 'player:left', { playerId: player.id, nickname: player.nickname });
    } else {
      player.connectionStatus = 'disconnected';
    }

    const connectedPlayers = Array.from(room.players.values()).filter(
      (p) => p.connectionStatus === 'connected'
    );

    if (connectedPlayers.length === 0 && explicitLeave) {
      clearPhaseTimer(room);
      rooms.delete(room.joinCode);
      return;
    }

    if (room.hostPlayerId === player.id && connectedPlayers.length > 0) {
      const nextHost = [...connectedPlayers].sort((a, b) => a.joinedAt - b.joinedAt)[0];
      if (nextHost) {
        room.hostPlayerId = nextHost.id;
        addFeedMessage(room, 'system', `${nextHost.nickname} agora é o anfitrião da sala.`);
      }
    }

    if (
      room.currentRound &&
      room.currentRound.drawerPlayerId === player.id &&
      (room.status === 'THEME_SELECTION' || room.status === 'WORD_REVEAL' || room.status === 'DRAWING')
    ) {
      if (explicitLeave) {
        endRound(room, 'drawer_disconnected');
      } else {
        // 25s grace period for mobile/Render proxy transient reconnects
        const roundId = room.currentRound.id;
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
      }
    }

    broadcastRoomState(room, false);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Traço & Tema server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
