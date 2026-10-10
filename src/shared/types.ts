export type RoomPhase =
  | 'LOBBY'
  | 'ROUND_SETUP'
  | 'THEME_SELECTION'
  | 'WORD_REVEAL'
  | 'DRAWING'
  | 'ROUND_RESULT'
  | 'NEXT_ROUND'
  | 'GAME_RESULT'
  | 'PAUSED'
  | 'DISCONNECTED_RECOVERY';

export type ThemeMode = 'drawer_chooses' | 'host_chooses' | 'random';
export type DifficultyLevel = 'easy' | 'medium' | 'mixed';
export type HintType = 'levels' | 'contextual' | 'letters';
export type ScoringMode = 'competitive' | 'casual';
export type RoundDuration = 45 | 60 | 90 | 120;

export type ShapeType =
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'line'
  | 'arrow'
  | 'diamond';

export interface RoomSettings {
  roomName: string;
  maxPlayers: number;
  roundDuration: RoundDuration;
  roundsPerPlayer: 1 | 2 | 3;
  themeMode: ThemeMode;
  difficulty: DifficultyLevel;
  hintsEnabled: boolean;
  hintType: HintType;
  scoringMode: ScoringMode;
  endWhenAllGuessed: boolean;
  allowEarlyFinish: boolean;
  chatEnabled: boolean;
}

export interface ThemeEntry {
  id: string;
  name: string;
  description: string;
  iconName: string;
  enabled: boolean;
}

export interface WordEntry {
  id: string;
  themeId: string;
  text: string;
  difficulty: 'easy' | 'medium';
  acceptedAnswers: string[];
  hints: [string, string, string];
  locale: 'pt-BR';
  enabled: boolean;
  contentRating: 'livre';
}

export interface PlayerPublicState {
  id: string;
  roomId: string;
  nickname: string;
  avatarId: number;
  score: number;
  connectionStatus: 'connected' | 'disconnected';
  joinedAt: number;
  isHost: boolean;
  hasGuessedThisRound: boolean;
  guessOrder?: number;
  roundPointsEarned: number;
  totalCorrectGuesses: number;
  timesDrawn: number;
}

export interface PointNormalized {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
}

export interface ShapeGeometry {
  shapeType: ShapeType;
  x: number; // center x normalized (0..1)
  y: number; // center y normalized (0..1)
  w: number; // width normalized (0.02..1)
  h: number; // height normalized (0.02..1)
  filled: boolean;
}

export interface DrawingStroke {
  id: string;
  roundId: string;
  playerId: string;
  tool: 'brush' | 'eraser' | 'shape';
  color: string;
  width: number;
  points: PointNormalized[];
  shape?: ShapeGeometry;
  sequence: number;
  createdAt: number;
}

export interface RevealedHint {
  index: number;
  text: string;
  type: HintType;
  revealedAt: number;
}

export interface RoundGuessRecord {
  playerId: string;
  nickname: string;
  avatarId: number;
  order: number;
  pointsAwarded: number;
  submittedAt: number;
}

export interface RoundPublicState {
  id: string;
  roomId: string;
  roundNumber: number;
  totalRounds: number;
  drawerPlayerId: string;
  drawerNickname: string;
  themeId: string | null;
  themeName: string | null;
  themeOptions: ThemeEntry[];
  status: RoomPhase;
  startedAt: number | null;
  endsAt: number | null;
  serverNow: number;
  hintsUsed: number;
  maxHints: number;
  lastHintAt: number | null;
  revealedHints: RevealedHint[];
  wordMask: string[];
  wordLetterCount: number;
  unrevealedLettersCount: number;
  correctGuessPlayerIds: string[];
  correctGuessesOrder: RoundGuessRecord[];
  eligibleGuessersCount: number;
  // Revealed only when status === 'ROUND_RESULT' or 'NEXT_ROUND' or 'GAME_RESULT'
  revealedWord?: string;
  drawerPointsEarned?: number;
  endReason?: 'time_up' | 'all_guessed' | 'drawer_finished' | 'drawer_disconnected' | 'host_ended';
}

export interface SystemFeedMessage {
  id: string;
  type: 'system' | 'correct_guess' | 'hint' | 'chat' | 'private_feedback';
  text: string;
  playerNickname?: string;
  timestamp: number;
}

export interface RoomPublicState {
  id: string;
  joinCode: string;
  hostPlayerId: string;
  status: RoomPhase;
  previousStatusBeforePause?: RoomPhase;
  settings: RoomSettings;
  createdAt: number;
  players: PlayerPublicState[];
  currentRound: RoundPublicState | null;
  strokes: DrawingStroke[];
  omitStrokes?: boolean;
  feed: SystemFeedMessage[];
}

export interface ModerationReport {
  id: string;
  roomId: string;
  reporterId: string;
  targetPlayerId?: string;
  wordId?: string;
  reason: string;
  createdAt: number;
}
