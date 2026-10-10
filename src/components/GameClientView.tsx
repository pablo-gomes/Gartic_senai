import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Copy,
  Check,
  Crown,
  Clock,
  Lightbulb,
  Send,
  Play,
  Pause,
  RotateCcw,
  LogOut,
  UserX,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Sparkles,
  Flag,
  MessageSquare,
  Users,
  Settings,
  Eye,
  WifiOff,
  HelpCircle,
  Wand2,
  Medal,
} from 'lucide-react';
import {
  DrawingBatchPayload,
  RevealedHint,
  RoomPublicState,
  RoomSettings,
  ThemeEntry,
} from '../shared/types';
import { AvatarSvg, AVATAR_LIST } from './AvatarSvg';
import { DrawingCanvas, DrawingCanvasHandle } from './DrawingCanvas';
import { ThemeIcon } from './ThemeIcon';
import { soundManager } from '../utils/sound';

interface GameClientViewProps {
  clientSlotId: string;
  defaultNickname: string;
  defaultAvatarId: number;
  autoJoinCode?: string | null;
  onRoomJoined?: (joinCode: string) => void;
  onOpenModerationModal?: (ctx: {
    roomId: string;
    reporterId: string;
    players: RoomPublicState['players'];
  }) => void;
  isSplitScreenChild?: boolean;
}

export const GameClientView: React.FC<GameClientViewProps> = ({
  clientSlotId,
  defaultNickname,
  defaultAvatarId,
  autoJoinCode,
  onRoomJoined,
  onOpenModerationModal,
  isSplitScreenChild = false,
}) => {
  const [playerId] = useState<string>(() => {
    const key = `tt_player_id_${clientSlotId}`;
    try {
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      const created = `plr_${clientSlotId}_${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(key, created);
      return created;
    } catch {
      return `plr_${clientSlotId}_${Math.random().toString(36).slice(2, 9)}`;
    }
  });

  const [nickname, setNickname] = useState<string>(defaultNickname);
  const [avatarId, setAvatarId] = useState<number>(defaultAvatarId);
  const [joinCodeInput, setJoinCodeInput] = useState<string>(autoJoinCode || '');
  const [roomState, setRoomState] = useState<RoomPublicState | null>(null);
  const [privateWord, setPrivateWord] = useState<{
    roundId: string;
    word: string;
    themeName: string | null;
    hints: string[];
  } | null>(null);

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const [selectedThemeCard, setSelectedThemeCard] = useState<string | null>(null);

  const [guessText, setGuessText] = useState<string>('');
  const [chatText, setChatText] = useState<string>('');
  const [privateGuessFeedback, setPrivateGuessFeedback] = useState<{
    correct: boolean;
    text: string;
  } | null>(null);

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const clockOffsetRef = useRef<number>(0);
  const lastTickedSecondRef = useRef<number | null>(null);

  const [mobilePanel, setMobilePanel] = useState<'none' | 'players' | 'feed'>('none');

  const [publicRooms, setPublicRooms] = useState<
    Array<{
      joinCode: string;
      roomName: string;
      playerCount: number;
      maxPlayers: number;
      status: string;
    }>
  >([]);

  const wsRef = useRef<WebSocket | null>(null);
  const canvasHandleRef = useRef<DrawingCanvasHandle | null>(null);
  const currentJoinCodeRef = useRef<string | null>(null);
  const autoJoinedRef = useRef<string | null>(null);

  const sendWs = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimer: number | null = null;
    let pingTimer: number | null = null;
    let retryAttempt = 0;
    const MAX_RECONNECT_ATTEMPTS = 8;

    const connect = () => {
      if (!isMounted) return;
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        retryAttempt = 0;
        setWsConnected(true);
        setReconnecting(false);

        if (pingTimer) clearInterval(pingTimer);
        pingTimer = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ event: 'ping', payload: { clientTime: Date.now() } }));
          }
        }, 18000);

        if (currentJoinCodeRef.current) {
          socket.send(
            JSON.stringify({
              event: 'room:join',
              payload: {
                joinCode: currentJoinCodeRef.current,
                playerId,
                nickname,
                avatarId,
                isReconnect: true,
              },
            })
          );
        }
      };

      socket.onmessage = (msgEvent) => {
        if (!isMounted) return;
        try {
          const { event, payload } = JSON.parse(msgEvent.data);

          if (event === 'pong') {
            if (payload?.serverNow) {
              clockOffsetRef.current = payload.serverNow - Date.now();
            }
            return;
          }

          if (event === 'error') {
            setErrorMsg(payload?.message || 'Ocorreu um erro.');
            setTimeout(() => {
              if (isMounted) setErrorMsg('');
            }, 4000);
          } else if (event === 'room:interrupted') {
            currentJoinCodeRef.current = null;
            setRoomState(null);
            setPrivateWord(null);
            setReconnecting(false);
            setErrorMsg(
              payload?.message ||
                'A partida foi interrompida porque o servidor foi reiniciado.'
            );
          } else if (event === 'room:joined_ack') {
            currentJoinCodeRef.current = payload.joinCode;
            if (onRoomJoined) onRoomJoined(payload.joinCode);
          } else if (event === 'room:kicked') {
            currentJoinCodeRef.current = null;
            setRoomState(null);
            setPrivateWord(null);
            setErrorMsg(payload?.reason || 'Você foi removido da sala.');
          } else if (event === 'room:state' || event === 'game:state-sync') {
            const incomingState = payload as RoomPublicState;
            if (incomingState.currentRound?.serverNow) {
              clockOffsetRef.current = incomingState.currentRound.serverNow - Date.now();
            }
            if (!incomingState.omitStrokes && Array.isArray(incomingState.strokes)) {
              canvasHandleRef.current?.replaceStrokes(incomingState.strokes);
            }
            setRoomState((prev) => {
              const isSameRound = prev && prev.currentRound?.id === incomingState.currentRound?.id;
              if (!isSameRound) {
                setPrivateGuessFeedback(null);
                setSelectedThemeCard(null);
                setGuessText('');
              }
              if (incomingState.omitStrokes && prev) {
                return {
                  ...incomingState,
                  strokes: prev.strokes,
                };
              }
              return incomingState;
            });
          } else if (event === 'room:player-joined') {
            setRoomState((prev) => {
              if (!prev || !payload?.player) return prev;
              const incomingPlayer = payload.player;
              const exists = prev.players.some((p) => p.id === incomingPlayer.id);
              const nextPlayers = exists
                ? prev.players.map((p) => (p.id === incomingPlayer.id ? incomingPlayer : p))
                : [...prev.players, incomingPlayer];
              const nextFeed = payload.feedMessage
                ? [...prev.feed.slice(-34), payload.feedMessage]
                : prev.feed;
              return {
                ...prev,
                hostPlayerId: payload.hostPlayerId ?? prev.hostPlayerId,
                players: nextPlayers,
                currentRound: prev.currentRound
                  ? {
                      ...prev.currentRound,
                      totalRounds: payload.totalRounds ?? prev.currentRound.totalRounds,
                      eligibleGuessersCount:
                        payload.eligibleGuessersCount ?? prev.currentRound.eligibleGuessersCount,
                    }
                  : null,
                feed: nextFeed,
              };
            });
          } else if (event === 'room:player-left') {
            setRoomState((prev) => {
              if (!prev || !payload?.playerId) return prev;
              const nextPlayers = payload.explicitLeave
                ? prev.players.filter((p) => p.id !== payload.playerId)
                : prev.players.map((p) =>
                    p.id === payload.playerId
                      ? { ...p, connectionStatus: 'disconnected' as const }
                      : p
                  );
              const nextFeed = payload.feedMessage
                ? [...prev.feed.slice(-34), payload.feedMessage]
                : prev.feed;
              return {
                ...prev,
                hostPlayerId: payload.hostPlayerId ?? prev.hostPlayerId,
                players: nextPlayers.map((p) => ({
                  ...p,
                  isHost: p.id === (payload.hostPlayerId ?? prev.hostPlayerId),
                })),
                currentRound: prev.currentRound
                  ? {
                      ...prev.currentRound,
                      eligibleGuessersCount:
                        payload.eligibleGuessersCount ?? prev.currentRound.eligibleGuessersCount,
                    }
                  : null,
                feed: nextFeed,
              };
            });
          } else if (event === 'word:private') {
            setPrivateWord({
              roundId: payload.roundId,
              word: payload.word,
              themeName: payload.themeName,
              hints: payload.hints || [],
            });
          } else if (event === 'round:started' || event === 'game:round-start') {
            soundManager.playRoundStart();
            setPrivateGuessFeedback(null);
            canvasHandleRef.current?.clearCanvas();
          } else if (event === 'game:timer') {
            if (payload?.serverNow) {
              clockOffsetRef.current = payload.serverNow - Date.now();
            }
            if (typeof payload?.remainingSeconds === 'number') {
              setRemainingSeconds(payload.remainingSeconds);
            }
          } else if (event === 'drawing:batch' || event === 'drawing:stroke') {
            // Rule 2 & 9: Forward directly to Canvas 2D imperative handle — ZERO React re-renders!
            canvasHandleRef.current?.applyBatch(payload as DrawingBatchPayload);
          } else if (event === 'drawing:clear') {
            canvasHandleRef.current?.clearCanvas();
          } else if (event === 'drawing:state') {
            canvasHandleRef.current?.replaceStrokes(payload.strokes || []);
          } else if (event === 'chat:message') {
            if (payload?.message) {
              setRoomState((prev) => {
                if (!prev) return prev;
                if (prev.feed.some((m) => m.id === payload.message.id)) return prev;
                return {
                  ...prev,
                  feed: [...prev.feed.slice(-34), payload.message],
                };
              });
            }
          } else if (event === 'game:correct-answer' || event === 'guess:correct') {
            setRoomState((prev) => {
              if (!prev || !prev.currentRound || prev.currentRound.id !== payload.roundId) {
                return prev;
              }
              const nextPlayers = prev.players.map((p) => {
                if (p.id === payload.playerId) {
                  return {
                    ...p,
                    hasGuessedThisRound: true,
                    guessOrder: payload.order,
                    roundPointsEarned: payload.pointsAwarded,
                    score: payload.playerTotalScore ?? p.score,
                    totalCorrectGuesses: p.totalCorrectGuesses + 1,
                  };
                }
                return p;
              });
              const nextFeed =
                payload.feedMessage && !prev.feed.some((m) => m.id === payload.feedMessage.id)
                  ? [...prev.feed.slice(-34), payload.feedMessage]
                  : prev.feed;

              return {
                ...prev,
                players: nextPlayers,
                currentRound: {
                  ...prev.currentRound,
                  correctGuessPlayerIds:
                    payload.correctGuessPlayerIds ?? prev.currentRound.correctGuessPlayerIds,
                  correctGuessesOrder:
                    payload.correctGuessesOrder ?? prev.currentRound.correctGuessesOrder,
                  eligibleGuessersCount:
                    payload.eligibleGuessersCount ?? prev.currentRound.eligibleGuessersCount,
                },
                feed: nextFeed,
              };
            });
          } else if (event === 'guess:feedback') {
            setPrivateGuessFeedback({
              correct: payload.correct,
              text: payload.text,
            });
            if (payload.correct) {
              soundManager.playCorrectGuess();
            }
          } else if (event === 'hint:revealed') {
            soundManager.playHintRevealed();
            setRoomState((prev) => {
              if (!prev || !prev.currentRound || prev.currentRound.id !== payload?.roundId) {
                return prev;
              }
              const exists = prev.currentRound.revealedHints.some(
                (h) => h.index === payload.hint?.index
              );
              const nextHints =
                payload.hint && !exists
                  ? [...prev.currentRound.revealedHints, payload.hint]
                  : prev.currentRound.revealedHints;
              const nextFeed =
                payload.feedMessage && !prev.feed.some((m) => m.id === payload.feedMessage.id)
                  ? [...prev.feed.slice(-34), payload.feedMessage]
                  : prev.feed;
              return {
                ...prev,
                currentRound: {
                  ...prev.currentRound,
                  hintsUsed: payload.hintsUsed ?? prev.currentRound.hintsUsed,
                  lastHintAt: payload.lastHintAt ?? prev.currentRound.lastHintAt,
                  wordMask: payload.wordMask ?? prev.currentRound.wordMask,
                  wordLetterCount: payload.wordLetterCount ?? prev.currentRound.wordLetterCount,
                  unrevealedLettersCount:
                    payload.unrevealedLettersCount ?? prev.currentRound.unrevealedLettersCount,
                  revealedHints: nextHints,
                },
                feed: nextFeed,
              };
            });
          } else if (event === 'round:ended' || event === 'game:round-end') {
            soundManager.playRoundEnd();
          }
        } catch {
          // Ignore malformed packet
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        if (pingTimer) {
          clearInterval(pingTimer);
          pingTimer = null;
        }
        setWsConnected(false);

        if (retryAttempt >= MAX_RECONNECT_ATTEMPTS) {
          setReconnecting(false);
          setErrorMsg(
            'Conexão perdida com o servidor após várias tentativas. Verifique sua rede ou recarregue a página.'
          );
          return;
        }

        if (currentJoinCodeRef.current) {
          setReconnecting(true);
        }
        const delay = Math.min(10000, 1000 * Math.pow(1.6, retryAttempt) + Math.floor(Math.random() * 400));
        retryAttempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible') {
        retryAttempt = 0;
        if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          connect();
        } else if (wsRef.current.readyState === WebSocket.OPEN && currentJoinCodeRef.current) {
          wsRef.current.send(JSON.stringify({ event: 'state:request', payload: {} }));
        }
      }
    };

    window.addEventListener('online', handleVisibilityOrOnline);
    document.addEventListener('visibilitychange', handleVisibilityOrOnline);

    connect();

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleVisibilityOrOnline);
      document.removeEventListener('visibilitychange', handleVisibilityOrOnline);
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [playerId]);

  useEffect(() => {
    if (
      wsConnected &&
      autoJoinCode &&
      !roomState &&
      autoJoinedRef.current !== autoJoinCode
    ) {
      autoJoinedRef.current = autoJoinCode;
      setJoinCodeInput(autoJoinCode);
      sendWs('room:join', {
        joinCode: autoJoinCode,
        playerId,
        nickname: nickname.trim() || defaultNickname,
        avatarId,
      });
    }
  }, [wsConnected, autoJoinCode, roomState, playerId, nickname, defaultNickname, avatarId, sendWs]);

  useEffect(() => {
    if (roomState) return;
    const loadRooms = () => {
      fetch('/api/rooms/public')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.rooms)) setPublicRooms(data.rooms);
        })
        .catch(() => {});
    };
    loadRooms();
    const interval = window.setInterval(loadRooms, 4000);
    return () => clearInterval(interval);
  }, [roomState]);

  useEffect(() => {
    const round = roomState?.currentRound;
    if (!round || !round.endsAt || roomState?.status === 'PAUSED') {
      return;
    }

    const updateTimer = () => {
      const serverTimeNow = Date.now() + clockOffsetRef.current;
      const msLeft = Math.max(0, (round.endsAt ?? 0) - serverTimeNow);
      const secLeft = Math.ceil(msLeft / 1000);
      setRemainingSeconds(secLeft);

      if (
        roomState?.status === 'DRAWING' &&
        (secLeft === 10 || secLeft === 5 || secLeft === 3 || secLeft === 2 || secLeft === 1) &&
        lastTickedSecondRef.current !== secLeft
      ) {
        lastTickedSecondRef.current = secLeft;
        soundManager.playLowTimeTick();
      }
    };

    updateTimer();
    const timerId = window.setInterval(updateTimer, 200);
    return () => clearInterval(timerId);
  }, [roomState?.currentRound, roomState?.status]);

  // Rule 2 & 6: Emit compact batch directly over WebSocket without calling setRoomState!
  const handleEmitBatch = useCallback(
    (batch: DrawingBatchPayload) => {
      sendWs('drawing:batch', batch as unknown as Record<string, unknown>);
    },
    [sendWs]
  );

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (cleanNick.length < 2 || cleanNick.length > 18) {
      setErrorMsg('Digite um apelido entre 2 e 18 caracteres.');
      return;
    }
    sendWs('room:create', {
      playerId,
      nickname: cleanNick,
      avatarId,
      settings: {
        roomName: `Arena de ${cleanNick}`,
        maxPlayers: 32,
      },
    });
  };

  const handleJoinRoom = (e: React.FormEvent, codeOverride?: string) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (cleanNick.length < 2 || cleanNick.length > 18) {
      setErrorMsg('Digite um apelido entre 2 e 18 caracteres.');
      return;
    }
    const targetCode = (codeOverride ?? joinCodeInput).trim().toUpperCase();
    if (!targetCode) {
      setErrorMsg('Informe o código da sala para entrar.');
      return;
    }
    sendWs('room:join', {
      joinCode: targetCode,
      playerId,
      nickname: cleanNick,
      avatarId,
    });
  };

  const handleLeaveRoom = () => {
    sendWs('room:leave');
    currentJoinCodeRef.current = null;
    setRoomState(null);
    setPrivateWord(null);
  };

  const handleCopyInvite = () => {
    if (!roomState) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomState.joinCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  const handleCopyMatchSummary = () => {
    if (!roomState) return;
    const sorted = [...roomState.players].sort((a, b) => b.score - a.score);
    const lines = [
      `Resumo da Partida — Traço & Tema (${roomState.settings.roomName})`,
      ...sorted.map(
        (p, idx) =>
          `${idx + 1}º ${p.nickname}: ${p.score} pts · ${p.totalCorrectGuesses} acertos · ${p.timesDrawn} desenhos`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {});
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handleUpdateSetting = <K extends keyof RoomSettings>(key: K, val: RoomSettings[K]) => {
    if (!roomState) return;
    sendWs('room:settings', {
      settings: {
        ...roomState.settings,
        [key]: val,
      },
    });
  };

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guessText.trim();
    if (!trimmed) return;
    sendWs('guess:submit', { text: trimmed });
    setGuessText('');
  };

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatText.trim();
    if (!trimmed) return;
    sendWs('chat:message', { text: trimmed });
    setChatText('');
  };

  const handleRevealLetterHint = (specificLetterIndex?: number) => {
    sendWs('hint:request', {
      mode: 'letter',
      letterIndex: specificLetterIndex,
    });
  };

  const handleRevealContextHint = () => {
    sendWs('hint:request', {
      mode: 'context',
    });
  };

  const me = roomState?.players.find((p) => p.id === playerId) || null;
  const isHost = roomState?.hostPlayerId === playerId;
  const round = roomState?.currentRound || null;
  const isDrawer = round?.drawerPlayerId === playerId;
  const selectedAvatarMeta = AVATAR_LIST[Math.abs(avatarId || 0) % AVATAR_LIST.length];

  // ============================================================================
  // VIEW 1: ENTRY / JOIN OR CREATE ROOM (CLEAN PARTY STUDIO HOME)
  // ============================================================================
  if (!roomState) {
    return (
      <div className="w-full max-w-5xl mx-auto py-6 px-4">
        {errorMsg && (
          <div
            role="alert"
            className="mb-5 flex items-center justify-between gap-3 bg-rose-100 border-2 border-rose-400 text-rose-950 px-4 py-3 rounded-2xl text-sm font-bold shadow-md"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-xs font-extrabold text-rose-700 hover:text-rose-950 cursor-pointer underline"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Character & Nickname + Create Room */}
          <div className="lg:col-span-7 game-panel rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b-2 border-indigo-100">
              <div className="flex items-center gap-3 shrink-0">
                <div className="p-1.5 rounded-3xl bg-indigo-50 border-2 border-amber-400">
                  <AvatarSvg avatarId={avatarId} size={72} />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAvatarId(
                      (prev) =>
                        (prev + 1 + Math.floor(Math.random() * (AVATAR_LIST.length - 1))) %
                        AVATAR_LIST.length
                    )
                  }
                  title="Sortear outro personagem"
                  className="py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-indigo-950 border border-amber-500 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sortear</span>
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-1.5">
                <label
                  htmlFor={`nick-${clientSlotId}`}
                  className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide"
                >
                  Seu Apelido
                </label>
                <input
                  id={`nick-${clientSlotId}`}
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={18}
                  placeholder="Digite seu apelido..."
                  className="w-full bg-indigo-50/70 border-2 border-indigo-200 focus:border-indigo-600 rounded-2xl px-4 py-2.5 text-base font-extrabold text-indigo-950 placeholder:text-indigo-300 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* 12 Avatars Grid */}
            <div
              className="grid grid-cols-4 sm:grid-cols-6 gap-2"
              role="radiogroup"
              aria-label="Avatares disponíveis"
            >
              {AVATAR_LIST.map((av) => {
                const selected = avatarId === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={av.label}
                    title={av.label}
                    onClick={() => setAvatarId(av.id)}
                    className={`group p-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selected
                        ? 'bg-amber-100 border-amber-500 scale-105 shadow-sm'
                        : 'bg-indigo-50/40 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <AvatarSvg avatarId={av.id} size={44} />
                    <span className="text-[10px] font-extrabold text-indigo-950 truncate w-full text-center">
                      {av.label.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={!wsConnected}
              className="game-btn-amber w-full py-3.5 px-6 rounded-2xl disabled:opacity-50 font-extrabold text-base cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>CRIAR SALA</span>
            </button>
          </div>

          {/* Right Column: Join Room with Code & Open Rooms */}
          <div className="lg:col-span-5 game-panel rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-extrabold text-indigo-950 font-display">
                Entrar com Código
              </h2>

              <form onSubmit={(e) => handleJoinRoom(e)} className="flex items-center gap-2">
                <input
                  id={`code-${clientSlotId}`}
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="CÓDIGO"
                  maxLength={8}
                  className="flex-1 bg-indigo-50/80 border-2 border-indigo-200 focus:border-emerald-500 rounded-2xl px-4 py-3 text-base font-mono font-extrabold uppercase tracking-widest text-indigo-950 placeholder:text-indigo-300 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!wsConnected}
                  className="game-btn-emerald px-5 py-3 rounded-2xl font-extrabold text-sm whitespace-nowrap shrink-0 cursor-pointer"
                >
                  ENTRAR
                </button>
              </form>

              <div className="pt-3 border-t-2 border-indigo-100">
                <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950 uppercase tracking-wide mb-2.5">
                  <span>Salas Abertas</span>
                  <span className="font-mono text-indigo-600 tabular-nums">
                    {publicRooms.length}
                  </span>
                </div>
                {publicRooms.length === 0 ? (
                  <div className="bg-indigo-50/60 border-2 border-dashed border-indigo-200 rounded-2xl p-4 text-center text-xs font-semibold text-indigo-700/80">
                    Nenhuma sala aberta agora. Crie uma sala ao lado para começar!
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {publicRooms.map((r) => (
                      <div
                        key={r.joinCode}
                        className="flex items-center justify-between gap-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-indigo-950 truncate">
                            {r.roomName}
                          </div>
                          <div className="text-xs font-bold text-indigo-600 font-mono tabular-nums">
                            #{r.joinCode} · {r.playerCount}/{r.maxPlayers}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleJoinRoom(e, r.joinCode)}
                          className="game-btn-amber px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer"
                        >
                          Jogar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CONNECTED TO A ROOM (CLEAN & SPACIOUS PARTY ARENA)
  // ============================================================================
  return (
    <div className="w-full max-w-[1540px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col gap-2.5">
      {reconnecting && (
        <div
          role="status"
          className="flex items-center gap-2 bg-amber-100 border-2 border-amber-400 text-amber-950 px-4 py-2 rounded-2xl text-xs font-extrabold"
        >
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Reconectando...</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 bg-rose-100 border-2 border-rose-400 text-rose-950 px-4 py-2 rounded-2xl text-xs font-extrabold"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs font-extrabold text-rose-700 hover:text-rose-950 cursor-pointer underline"
          >
            Fechar
          </button>
        </div>
      )}

      {/* UNIFIED SINGLE TOP BAR (No double stacked headers!) */}
      <div className="game-panel rounded-2xl px-3.5 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Room & Round Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <AvatarSvg avatarId={me?.avatarId ?? avatarId} size={36} />
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-extrabold text-indigo-950">
            <span className="font-mono text-indigo-600">#{roomState.joinCode}</span>
            {round && roomState.status !== 'LOBBY' && (
              <>
                <span aria-hidden="true" className="text-indigo-300">·</span>
                <span className="font-mono tabular-nums">
                  {round.roundNumber}/{round.totalRounds}
                </span>
                {round.themeName && (
                  <>
                    <span aria-hidden="true" className="text-indigo-300">·</span>
                    <span className="text-indigo-700">{round.themeName}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Center: Word / Interactive Letter Slots + Hint Action (During Drawing) */}
        {round && (roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {isDrawer ? (
              <div className="flex items-center gap-2 bg-amber-300 border-2 border-amber-500 px-3.5 py-1 rounded-xl">
                <Eye className="w-4 h-4 text-indigo-950 shrink-0" />
                <span className="text-sm font-extrabold text-indigo-950 tracking-wide font-display uppercase">
                  {privateWord?.word ?? '...'}
                </span>
              </div>
            ) : (
              round.wordMask &&
              round.wordMask.length > 0 && (
                <div
                  className="flex flex-wrap items-center gap-1"
                  aria-label={`Palavra com ${round.wordLetterCount} letras`}
                >
                  {round.wordMask.map((ch, idx) => {
                    if (ch === ' ') {
                      return <span key={idx} className="w-2.5 h-7 inline-block" />;
                    }
                    if (ch === '-') {
                      return (
                        <span
                          key={idx}
                          className="w-3 h-7 flex items-center justify-center font-mono font-extrabold text-indigo-400"
                        >
                          -
                        </span>
                      );
                    }
                    const isRevealed = ch !== '_';
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={isRevealed || roomState.status !== 'DRAWING'}
                        onClick={() => handleRevealLetterHint(idx)}
                        title={
                          isRevealed
                            ? `Letra ${idx + 1}: ${ch}`
                            : `Clique para revelar a ${idx + 1}ª letra`
                        }
                        className={`w-7 h-8 rounded-lg font-mono text-sm font-extrabold flex items-center justify-center border-2 transition-all ${
                          isRevealed
                            ? 'bg-amber-300 border-amber-500 text-indigo-950'
                            : 'bg-indigo-50 border-indigo-200 hover:border-amber-400 text-indigo-400 hover:text-indigo-950 cursor-pointer'
                        }`}
                      >
                        {isRevealed ? ch : '_'}
                      </button>
                    );
                  })}
                  <span className="ml-1 text-xs font-mono font-extrabold text-indigo-600">
                    ({round.wordLetterCount})
                  </span>
                </div>
              )
            )}

            <button
              type="button"
              onClick={() => handleRevealLetterHint()}
              disabled={roomState.status !== 'DRAWING' || round.unrevealedLettersCount === 0}
              className="game-btn-amber flex items-center gap-1 px-2.5 py-1 rounded-xl disabled:opacity-40 font-extrabold text-xs cursor-pointer"
              title="Revelar uma letra da palavra"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Dica</span>
            </button>

            {isDrawer && roomState.settings.allowEarlyFinish && (
              <button
                type="button"
                onClick={() => sendWs('round:finish')}
                className="px-2.5 py-1 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-extrabold cursor-pointer"
              >
                Concluir
              </button>
            )}
          </div>
        )}

        {/* Right: Timer & Room Actions */}
        <div className="flex items-center gap-1.5">
          {round &&
            (roomState.status === 'DRAWING' ||
              roomState.status === 'THEME_SELECTION' ||
              roomState.status === 'WORD_REVEAL' ||
              roomState.status === 'PAUSED') && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border-2 font-mono text-xs sm:text-sm font-extrabold tabular-nums ${
                  roomState.status === 'PAUSED'
                    ? 'bg-amber-100 border-amber-400 text-amber-900'
                    : remainingSeconds <= 10 && roomState.status === 'DRAWING'
                    ? 'bg-rose-500 border-rose-700 text-white animate-pulse'
                    : 'bg-amber-300 border-amber-500 text-indigo-950'
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>{roomState.status === 'PAUSED' ? 'PAUSA' : `${remainingSeconds}s`}</span>
              </div>
            )}

          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 text-xs font-extrabold cursor-pointer"
            title="Copiar link de convite"
          >
            {copiedInvite ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span className="hidden sm:inline">{copiedInvite ? 'Copiado' : 'Convite'}</span>
          </button>

          {isHost && (roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && (
            <button
              type="button"
              onClick={() => sendWs('game:pause_toggle')}
              className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 cursor-pointer"
              title={roomState.status === 'PAUSED' ? 'Retomar' : 'Pausar'}
            >
              {roomState.status === 'PAUSED' ? (
                <Play className="w-3.5 h-3.5 text-emerald-700" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-800" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleLeaveRoom}
            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
            title="Sair da sala"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================
          PHASE 1: LOBBY (WAITING ROOM & PARTY SETUP)
         ======================================================================== */}
      {roomState.status === 'LOBBY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Players Grid ("Galera na Sala") */}
          <div className="lg:col-span-5 game-panel rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b-2 border-indigo-100 pb-3">
              <div>
                <h2 className="text-xl font-extrabold text-indigo-950 font-display">
                  Galera na Sala
                </h2>
                <p className="text-xs font-bold text-indigo-700/80">
                  Código de convite:{' '}
                  <span className="font-mono text-indigo-950 font-extrabold">
                    #{roomState.joinCode}
                  </span>
                </p>
              </div>
              <span className="font-mono text-xs font-extrabold text-indigo-700 tabular-nums">
                {roomState.players.filter((p) => p.connectionStatus === 'connected').length}/
                {roomState.settings.maxPlayers} jogadores
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {roomState.players.map((p) => {
                const avMeta = AVATAR_LIST[Math.abs(p.avatarId || 0) % AVATAR_LIST.length];
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2.5 rounded-2xl px-3.5 py-2.5 border-2 transition-colors ${
                      p.id === playerId
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-indigo-50/70 border-indigo-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarSvg avatarId={p.avatarId} size={44} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-extrabold text-indigo-950 truncate">
                          <span className="truncate">{p.nickname}</span>
                          {p.id === playerId && (
                            <span className="text-xs font-bold text-indigo-600 shrink-0">(Você)</span>
                          )}
                        </div>
                        <div className="text-[11px] font-bold text-indigo-700/80 flex items-center gap-1 truncate">
                          <span className="truncate">{avMeta.label}</span>
                          <span aria-hidden="true">·</span>
                          {p.isHost ? (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-extrabold shrink-0">
                              <Crown className="w-3 h-3 fill-amber-400 text-amber-600" />
                              Líder
                            </span>
                          ) : (
                            <span>Pronto</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHost && p.id !== playerId && (
                      <button
                        type="button"
                        onClick={() => sendWs('room:kick', { targetPlayerId: p.id, ban: false })}
                        className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
                        title={`Remover ${p.nickname}`}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t-2 border-indigo-100 flex flex-col gap-3">
              {roomState.players.length < 2 && (
                <div className="text-xs font-bold text-indigo-950 bg-amber-100/85 border-2 border-amber-300 rounded-2xl p-3.5 leading-relaxed">
                  Você já pode clicar em <strong>COMEÇAR PARTIDA AGORA</strong> ou ativar o botão{' '}
                  <strong>Tela Dupla (2 Jogadores)</strong> no topo para testar com 2 jogadores simultâneos!
                </div>
              )}

              {isHost ? (
                <button
                  type="button"
                  onClick={() => sendWs('game:start')}
                  className="game-btn-amber w-full py-4 px-6 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>COMEÇAR PARTIDA AGORA!</span>
                </button>
              ) : (
                <div className="w-full py-4 px-4 rounded-2xl bg-indigo-50 border-2 border-indigo-200 text-center text-xs text-indigo-900 font-extrabold">
                  Aguardando o líder da sala iniciar a partida...
                </div>
              )}
            </div>
          </div>

          {/* Right: Room Configuration */}
          <div className="lg:col-span-7 game-panel rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b-2 border-indigo-100 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xl font-extrabold text-indigo-950 font-display">
                  Configurações da Partida
                </h2>
              </div>
              <span className="text-xs font-bold text-indigo-600">
                {isHost ? 'Você pode ajustar as regras' : 'Definido pelo líder da sala'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Nome da Sala
                </label>
                <input
                  type="text"
                  disabled={!isHost}
                  value={roomState.settings.roomName}
                  onChange={(e) => handleUpdateSetting('roomName', e.target.value)}
                  maxLength={32}
                  className="w-full bg-indigo-50/80 border-2 border-indigo-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Limite de Jogadores (Até 32)
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.maxPlayers}
                  onChange={(e) => handleUpdateSetting('maxPlayers', Number(e.target.value))}
                  className="w-full bg-indigo-50/80 border-2 border-indigo-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600"
                >
                  <option value={8}>Até 8 jogadores</option>
                  <option value={12}>Até 12 jogadores</option>
                  <option value={16}>Até 16 jogadores</option>
                  <option value={24}>Até 24 jogadores</option>
                  <option value={32}>Até 32 jogadores (Sala Completa)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Tempo de Desenho
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.roundDuration}
                  onChange={(e) =>
                    handleUpdateSetting('roundDuration', Number(e.target.value) as 45 | 60 | 90 | 120)
                  }
                  className="w-full bg-indigo-50/80 border-2 border-indigo-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600"
                >
                  <option value={45}>45 segundos (Rápido)</option>
                  <option value={60}>60 segundos (Clássico)</option>
                  <option value={90}>90 segundos (Criativo)</option>
                  <option value={120}>120 segundos (Caprichado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Rodadas por Jogador
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.roundsPerPlayer}
                  onChange={(e) =>
                    handleUpdateSetting('roundsPerPlayer', Number(e.target.value) as 1 | 2 | 3)
                  }
                  className="w-full bg-indigo-50/80 border-2 border-indigo-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600"
                >
                  <option value={1}>1 vez cada jogador</option>
                  <option value={2}>2 vezes cada jogador</option>
                  <option value={3}>3 vezes cada jogador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Escolha do Tema
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.themeMode}
                  onChange={(e) =>
                    handleUpdateSetting(
                      'themeMode',
                      e.target.value as 'drawer_chooses' | 'host_chooses' | 'random'
                    )
                  }
                  className="w-full bg-indigo-50/80 border-2 border-indigo-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600"
                >
                  <option value="drawer_chooses">Desenhista da vez escolhe</option>
                  <option value="host_chooses">Líder da sala escolhe</option>
                  <option value="random">Sorteio surpresa automático</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Dificuldade das Palavras
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.difficulty}
                  onChange={(e) =>
                    handleUpdateSetting('difficulty', e.target.value as 'easy' | 'medium' | 'mixed')
                  }
                  className="w-full bg-indigo-50/80 border-2 border-indigo-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="mixed">Misto (Fácil + Médio)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Estilo de Pontuação
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.scoringMode}
                  onChange={(e) =>
                    handleUpdateSetting('scoringMode', e.target.value as 'competitive' | 'casual')
                  }
                  className="w-full bg-indigo-50/80 border-2 border-indigo-200 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600"
                >
                  <option value="competitive">Competitivo com Ranking (100/80/60/40 pts)</option>
                  <option value="casual">Casual e Descontraído (Sem pressão)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t-2 border-indigo-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 text-xs font-bold text-indigo-900 cursor-pointer bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.endWhenAllGuessed}
                  onChange={(e) => handleUpdateSetting('endWhenAllGuessed', e.target.checked)}
                  className="rounded accent-indigo-600 w-4 h-4"
                />
                <span>Avançar se todos acertarem</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-indigo-900 cursor-pointer bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.allowEarlyFinish}
                  onChange={(e) => handleUpdateSetting('allowEarlyFinish', e.target.checked)}
                  className="rounded accent-indigo-600 w-4 h-4"
                />
                <span>Permitir concluir desenho</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-bold text-indigo-900 cursor-pointer bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.chatEnabled}
                  onChange={(e) => handleUpdateSetting('chatEnabled', e.target.checked)}
                  className="rounded accent-indigo-600 w-4 h-4"
                />
                <span>Chat livre habilitado</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          PHASE 2: ROUND_SETUP & THEME_SELECTION
         ======================================================================== */}
      {(roomState.status === 'ROUND_SETUP' || roomState.status === 'THEME_SELECTION') && round && (
        <div className="game-panel rounded-3xl p-7 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider mb-1">
              Rodada {round.roundNumber} de {round.totalRounds} · Desenhista da Vez: {round.drawerNickname}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 mb-2 font-display">
              {(roomState.settings.themeMode === 'host_chooses' ? isHost : isDrawer)
                ? 'Escolha o Tema desta Rodada!'
                : `Aguardando ${
                    roomState.settings.themeMode === 'host_chooses'
                      ? 'o líder da sala'
                      : round.drawerNickname
                  } escolher o tema...`}
            </h2>
            <p className="text-sm font-medium text-indigo-800/80">
              Clique em um cartão abaixo para sortear a palavra secreta do desenho.
            </p>
          </div>

          {roomState.status === 'THEME_SELECTION' && (
            <>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                role="radiogroup"
                aria-label="Opções de tema para a rodada"
              >
                {round.themeOptions.map((theme: ThemeEntry) => {
                  const canSelect =
                    roomState.settings.themeMode === 'host_chooses' ? isHost : isDrawer;
                  const isSelected = selectedThemeCard === theme.id;

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      disabled={!canSelect}
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedThemeCard(theme.id)}
                      className={`text-left p-5 rounded-3xl border-3 transition-all flex flex-col justify-between gap-3.5 ${
                        isSelected
                          ? 'bg-amber-100 border-amber-500 shadow-lg scale-[1.02]'
                          : canSelect
                          ? 'bg-indigo-50/70 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 cursor-pointer'
                          : 'bg-slate-50 border-slate-200 opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`p-3 rounded-2xl border-2 ${
                            isSelected
                              ? 'bg-amber-400 text-indigo-950 border-amber-600'
                              : 'bg-white text-indigo-600 border-indigo-200'
                          }`}
                        >
                          <ThemeIcon iconName={theme.iconName} className="w-6 h-6" />
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-900">
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            Escolhido!
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-lg font-extrabold text-indigo-950 mb-1 font-display">
                          {theme.name}
                        </div>
                        <p className="text-xs font-medium text-indigo-800/80 leading-relaxed">
                          {theme.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(roomState.settings.themeMode === 'host_chooses' ? isHost : isDrawer) && (
                <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-indigo-100">
                  <button
                    type="button"
                    disabled={!selectedThemeCard}
                    onClick={() => {
                      if (selectedThemeCard) {
                        sendWs('theme:select', { themeId: selectedThemeCard });
                      }
                    }}
                    className="game-btn-amber px-8 py-4 rounded-2xl disabled:opacity-40 disabled:pointer-events-none font-extrabold text-sm whitespace-nowrap cursor-pointer"
                  >
                    Confirmar Tema e Sortear Palavra!
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ========================================================================
          PHASE 3: WORD_REVEAL
         ======================================================================== */}
      {roomState.status === 'WORD_REVEAL' && round && (
        <div className="game-panel rounded-3xl p-8 max-w-2xl mx-auto w-full text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-3xl bg-amber-300 border-3 border-amber-500 text-indigo-950 shadow-md">
            <Sparkles className="w-9 h-9" />
          </div>
          <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
            Tema: <span className="text-indigo-950">{round.themeName}</span> ·{' '}
            <span className="font-mono text-amber-700">{round.wordLetterCount} letras</span>
          </p>

          {isDrawer && privateWord ? (
            <>
              <h2 className="text-lg font-extrabold text-indigo-900">
                Prepare o pincel! Sua palavra secreta é:
              </h2>
              <div className="px-10 py-4 rounded-3xl bg-amber-100 border-4 border-amber-400 text-3xl sm:text-4xl font-extrabold text-indigo-950 tracking-wide font-display shadow-sm">
                {privateWord.word}
              </div>
              <p className="text-xs font-medium text-indigo-800/80 max-w-md">
                Capriche no desenho usando o pincel livre e as formas geométricas!
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 font-display">
                {round.drawerNickname} vai começar a desenhar!
              </h2>
              <p className="text-sm font-medium text-indigo-800/80 max-w-md">
                Fique de olho na tela! A palavra sorteada tem{' '}
                <strong className="text-indigo-950">{round.wordLetterCount} letras</strong> no tema{' '}
                <strong className="text-indigo-950">{round.themeName}</strong>.
              </p>
            </>
          )}
        </div>
      )}

      {/* ========================================================================
          PHASE 4: MAIN DRAWING & GUESSING ARENA (EXPANDED CANVAS + CLEAN SIDEBAR)
         ======================================================================== */}
      {(roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && round && (
        <div className="flex flex-col gap-2.5">
          {/* Mobile Quick Switcher */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMobilePanel((p) => (p === 'players' ? 'none' : 'players'))
              }
              className="flex-1 py-2 px-3 rounded-xl bg-white border-2 border-indigo-200 text-xs font-extrabold text-indigo-950 flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Jogadores ({roomState.players.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel((p) => (p === 'feed' ? 'none' : 'feed'))}
              className="flex-1 py-2 px-3 rounded-xl bg-white border-2 border-indigo-200 text-xs font-extrabold text-indigo-950 flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Chat ({roomState.feed.length})</span>
            </button>
          </div>

          {/* 2-COLUMN CLEAN ARENA:
              Left/Center (8 cols): Large Drawing Board + Guess Input
              Right (4 cols): Compact Players Ranking + Chat Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* MAIN EXPANDED DRAWING BOARD (8 COLS) */}
            <div className="lg:col-span-8 flex flex-col gap-2.5">
              <DrawingCanvas
                ref={canvasHandleRef}
                initialStrokes={roomState.strokes}
                roundId={round.id}
                isDrawer={isDrawer}
                isDrawingPhase={roomState.status === 'DRAWING'}
                onEmitBatch={handleEmitBatch}
                onUndo={() => sendWs('drawing:undo')}
                onRedo={() => sendWs('drawing:redo')}
                onClear={() => sendWs('drawing:clear')}
                compactMode={isSplitScreenChild}
              />

              {/* Direct Guess Input Box right under the canvas for Guessers */}
              {!isDrawer && (
                <div className="game-panel rounded-2xl p-2.5 flex flex-col gap-1.5">
                  {me?.hasGuessedThisRound ? (
                    <div className="flex items-center justify-between gap-2 bg-emerald-100 border-2 border-emerald-400 text-emerald-950 px-4 py-2 rounded-xl text-sm font-extrabold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Você acertou a palavra!</span>
                      </div>
                      {roomState.settings.scoringMode === 'competitive' && (
                        <span className="font-mono text-xs font-extrabold text-emerald-800 tabular-nums">
                          +{me.roundPointsEarned} pts
                        </span>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitGuess} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={guessText}
                        onChange={(e) => setGuessText(e.target.value)}
                        disabled={roomState.status !== 'DRAWING'}
                        maxLength={80}
                        placeholder={`Digite seu palpite (${round.wordLetterCount} letras)...`}
                        aria-label="Digite seu palpite"
                        className="flex-1 bg-indigo-50/90 border-2 border-indigo-200 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm font-extrabold text-indigo-950 placeholder:text-indigo-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={roomState.status !== 'DRAWING' || !guessText.trim()}
                        className="game-btn-amber px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none font-extrabold text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Chutar</span>
                      </button>
                    </form>
                  )}

                  {privateGuessFeedback && !me?.hasGuessedThisRound && (
                    <div role="status" className="text-xs text-rose-700 font-extrabold px-1">
                      {privateGuessFeedback.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR (4 COLS): Compact Players Ranking + Chat */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {/* Compact Players List */}
              <div
                className={`${
                  mobilePanel === 'players' ? 'flex' : 'hidden lg:flex'
                } game-panel rounded-3xl p-3.5 flex-col gap-2`}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                  <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                    Jogadores ({roomState.players.length})
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {[...roomState.players]
                    .sort((a, b) => b.score - a.score)
                    .map((p, idx) => {
                      const isCurrentDrawer = p.id === round.drawerPlayerId;
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl border ${
                            p.hasGuessedThisRound
                              ? 'bg-emerald-50 border-emerald-300'
                              : isCurrentDrawer
                              ? 'bg-amber-50 border-amber-300'
                              : 'bg-indigo-50/50 border-indigo-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-extrabold text-indigo-400 w-4 text-center tabular-nums shrink-0">
                              {idx + 1}º
                            </span>
                            <AvatarSvg avatarId={p.avatarId} size={32} />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-indigo-950 truncate">
                                {p.nickname}
                              </div>
                              <div className="text-[10px] font-bold text-indigo-600/80">
                                {isCurrentDrawer
                                  ? '✏️ Desenhando'
                                  : p.hasGuessedThisRound
                                  ? `✅ Acertou (${p.guessOrder}º)`
                                  : 'Adivinhando'}
                              </div>
                            </div>
                          </div>

                          {roomState.settings.scoringMode === 'competitive' && (
                            <div className="font-mono text-xs font-extrabold text-indigo-950 tabular-nums shrink-0">
                              {p.score} pts
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Clean Live Feed & Chat */}
              <div
                className={`${
                  mobilePanel === 'feed' ? 'flex' : 'hidden lg:flex'
                } game-panel rounded-3xl p-3.5 flex-col gap-2`}
              >
                <div
                  className="flex flex-col gap-1.5 max-h-[260px] min-h-[180px] overflow-y-auto pr-1 text-xs"
                  aria-live="polite"
                >
                  {roomState.feed.slice(-16).map((msg) => (
                    <div
                      key={msg.id}
                      className={`px-3 py-2 rounded-xl border font-medium leading-snug ${
                        msg.type === 'correct_guess'
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-950 font-extrabold'
                          : msg.type === 'hint'
                          ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold'
                          : msg.type === 'chat'
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-950'
                          : 'bg-slate-50 border-slate-200 text-indigo-800/80'
                      }`}
                    >
                      {msg.type === 'chat' && msg.playerNickname ? (
                        <>
                          <strong className="font-extrabold text-indigo-700">
                            {msg.playerNickname}:{' '}
                          </strong>
                          <span>{msg.text}</span>
                        </>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  ))}
                </div>

                {roomState.settings.chatEnabled && (
                  <form
                    onSubmit={handleSubmitChat}
                    className="flex items-center gap-1.5 pt-1.5 border-t border-indigo-100"
                  >
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Conversar no chat..."
                      maxLength={100}
                      className="flex-1 bg-indigo-50/90 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-bold text-indigo-950 placeholder:text-indigo-400 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="game-btn-violet px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap cursor-pointer"
                    >
                      Enviar
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          PHASE 5: ROUND RESULT & NEXT ROUND
         ======================================================================== */}
      {(roomState.status === 'ROUND_RESULT' || roomState.status === 'NEXT_ROUND') && round && (
        <div className="game-panel rounded-3xl p-7 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-indigo-100 pb-4">
            <div>
              <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider mb-1">
                Fim da Rodada {round.roundNumber} de {round.totalRounds} · Tema: {round.themeName}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 font-display">
                A palavra secreta era:{' '}
                <span className="text-amber-600 underline decoration-amber-400 underline-offset-4">
                  {round.revealedWord ?? '---'}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-extrabold text-indigo-700 tabular-nums">
                Próxima rodada em {remainingSeconds}s
              </span>
              {isHost && roomState.status === 'ROUND_RESULT' && (
                <button
                  type="button"
                  onClick={() => sendWs('round:next_now')}
                  className="game-btn-amber px-5 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap cursor-pointer"
                >
                  Próxima Rodada Agora
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-6 flex flex-col gap-2">
              <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                Obra de Arte de {round.drawerNickname}
              </span>
              <DrawingCanvas
                initialStrokes={roomState.strokes}
                roundId={round.id}
                isDrawer={false}
                isDrawingPhase={false}
                onEmitBatch={() => {}}
                onUndo={() => {}}
                onRedo={() => {}}
                onClear={() => {}}
              />
            </div>

            <div className="md:col-span-6 flex flex-col gap-4">
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col gap-2">
                <div className="text-xs font-bold text-indigo-700 flex items-center justify-between">
                  <span>Resumo do Turno</span>
                  <span>Dicas usadas: {round.hintsUsed}</span>
                </div>
                <div className="text-base font-extrabold text-indigo-950 font-display">
                  {round.correctGuessesOrder.length === 0
                    ? 'Ninguém descobriu a tempo — estava difícil!'
                    : `${round.correctGuessesOrder.length} de ${round.eligibleGuessersCount} jogadores acertaram!`}
                </div>
                {roomState.settings.scoringMode === 'competitive' && (
                  <div className="text-xs font-extrabold text-amber-800 font-mono tabular-nums">
                    Artista ({round.drawerNickname}): +{round.drawerPointsEarned ?? 0} pontos
                  </div>
                )}
              </div>

              {round.correctGuessesOrder.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-extrabold text-indigo-950 uppercase tracking-wide">
                    Quem Acertou Mais Rápido
                  </span>
                  {round.correctGuessesOrder.map((rec) => (
                    <div
                      key={rec.playerId}
                      className="flex items-center justify-between bg-emerald-50 border-2 border-emerald-300 rounded-2xl px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-extrabold text-emerald-700 tabular-nums">
                          {rec.order}º
                        </span>
                        <AvatarSvg avatarId={rec.avatarId} size={34} />
                        <span className="text-sm font-extrabold text-indigo-950">
                          {rec.nickname}
                        </span>
                      </div>
                      {roomState.settings.scoringMode === 'competitive' && (
                        <span className="font-mono text-xs font-extrabold text-emerald-700 tabular-nums">
                          +{rec.pointsAwarded} pts
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          PHASE 6: GAME RESULT / CELEBRATORY PODIUM
         ======================================================================== */}
      {roomState.status === 'GAME_RESULT' && (
        <div className="game-panel rounded-3xl p-7 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-indigo-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-300 border-2 border-amber-500 text-indigo-950 shadow-sm">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-indigo-600 uppercase tracking-wider">
                  Fim de Jogo!
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 font-display">
                  Pódio dos Campeões
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyMatchSummary}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-2 border-indigo-200 text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Placar Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-indigo-600" />
                    <span>Copiar Placar</span>
                  </>
                )}
              </button>

              {isHost && (
                <>
                  <button
                    type="button"
                    onClick={() => sendWs('game:return_lobby')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border-2 border-indigo-200 text-xs font-extrabold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Voltar ao Lobby</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendWs('game:start')}
                    className="game-btn-amber flex items-center gap-1.5 px-6 py-2.5 rounded-xl font-extrabold text-xs whitespace-nowrap cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Jogar Novamente!</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Top 3 Visual Podium Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...roomState.players]
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map((p, idx) => (
                <div
                  key={p.id}
                  className={`rounded-3xl p-5 border-3 flex flex-col items-center text-center gap-2 ${
                    idx === 0
                      ? 'bg-amber-100 border-amber-400 shadow-md'
                      : idx === 1
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-extrabold text-indigo-900">
                    <Medal className="w-4 h-4 text-amber-600" />
                    <span>{idx + 1}º Lugar</span>
                  </div>
                  <AvatarSvg avatarId={p.avatarId} size={64} />
                  <div className="font-extrabold text-base text-indigo-950 font-display truncate max-w-full">
                    {p.nickname}
                  </div>
                  <div className="font-mono text-sm font-extrabold text-emerald-700 tabular-nums">
                    {p.score} pontos
                  </div>
                </div>
              ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-indigo-100 text-xs font-extrabold text-indigo-700 uppercase">
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Jogador</th>
                  <th className="py-3 px-4 text-right">Acertos</th>
                  <th className="py-3 px-4 text-right">Desenhos</th>
                  <th className="py-3 px-4 text-right">Pontuação Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-100 text-sm">
                {[...roomState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <tr key={p.id} className="hover:bg-indigo-50/60">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-indigo-950 tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          {idx === 0 && <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />}
                          {idx + 1}º
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarSvg avatarId={p.avatarId} size={40} />
                          <div>
                            <div className="font-extrabold text-indigo-950">
                              {p.nickname} {p.id === playerId && '(Você)'}
                            </div>
                            <div className="text-xs font-bold text-indigo-600">
                              {AVATAR_LIST[Math.abs(p.avatarId || 0) % AVATAR_LIST.length].label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-900 tabular-nums">
                        {p.totalCorrectGuesses}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-900 tabular-nums">
                        {p.timesDrawn}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700 tabular-nums">
                        {p.score} pts
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
