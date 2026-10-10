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
  PointNormalized,
  RevealedHint,
  RoomPublicState,
  RoomSettings,
  ShapeGeometry,
  ThemeEntry,
} from '../shared/types';
import { AvatarSvg, AVATAR_LIST } from './AvatarSvg';
import { DrawingCanvas } from './DrawingCanvas';
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
          } else if (event === 'room:joined_ack') {
            currentJoinCodeRef.current = payload.joinCode;
            if (onRoomJoined) onRoomJoined(payload.joinCode);
          } else if (event === 'room:kicked') {
            currentJoinCodeRef.current = null;
            setRoomState(null);
            setPrivateWord(null);
            setErrorMsg(payload?.reason || 'Você foi removido da sala.');
          } else if (event === 'room:state') {
            const incomingState = payload as RoomPublicState;
            if (incomingState.currentRound?.serverNow) {
              clockOffsetRef.current = incomingState.currentRound.serverNow - Date.now();
            }
            setRoomState((prev) => {
              const isSameRound = prev && prev.currentRound?.id === incomingState.currentRound?.id;
              if (!isSameRound) {
                setPrivateGuessFeedback(null);
                setSelectedThemeCard(null);
                setGuessText('');
              }
              // Preserve client strokes when server omits strokes array for high-speed 32-player delta broadcasts
              if (incomingState.omitStrokes && prev) {
                return {
                  ...incomingState,
                  strokes: prev.strokes,
                };
              }
              return incomingState;
            });
          } else if (event === 'word:private') {
            setPrivateWord({
              roundId: payload.roundId,
              word: payload.word,
              themeName: payload.themeName,
              hints: payload.hints || [],
            });
          } else if (event === 'round:started') {
            soundManager.playRoundStart();
            setPrivateGuessFeedback(null);
          } else if (event === 'drawing:stroke') {
            setRoomState((prev) => {
              if (!prev || prev.currentRound?.id !== payload.roundId) return prev;
              const existingIdx = prev.strokes.findIndex((s) => s.id === payload.strokeId);
              const nextStrokes = [...prev.strokes];

              if (payload.tool === 'shape' && payload.shape) {
                if (existingIdx === -1) {
                  nextStrokes.push({
                    id: payload.strokeId,
                    roundId: payload.roundId,
                    playerId: payload.playerId,
                    tool: 'shape',
                    color: payload.color,
                    width: payload.width,
                    points: [],
                    shape: payload.shape,
                    sequence: payload.sequence,
                    createdAt: Date.now(),
                  });
                } else {
                  nextStrokes[existingIdx] = {
                    ...nextStrokes[existingIdx],
                    color: payload.color,
                    width: payload.width,
                    shape: payload.shape,
                    sequence: Math.max(nextStrokes[existingIdx].sequence, payload.sequence),
                  };
                }
                return { ...prev, strokes: nextStrokes };
              }

              if (existingIdx === -1) {
                nextStrokes.push({
                  id: payload.strokeId,
                  roundId: payload.roundId,
                  playerId: payload.playerId,
                  tool: payload.tool,
                  color: payload.color,
                  width: payload.width,
                  points: payload.points,
                  sequence: payload.sequence,
                  createdAt: Date.now(),
                });
              } else {
                const updated = {
                  ...nextStrokes[existingIdx],
                  points: [...nextStrokes[existingIdx].points, ...payload.points],
                  sequence: Math.max(nextStrokes[existingIdx].sequence, payload.sequence),
                };
                nextStrokes[existingIdx] = updated;
              }
              return { ...prev, strokes: nextStrokes };
            });
          } else if (event === 'drawing:state') {
            setRoomState((prev) => {
              if (!prev || prev.currentRound?.id !== payload.roundId) return prev;
              return { ...prev, strokes: payload.strokes || [] };
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
          } else if (event === 'round:ended') {
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
        if (currentJoinCodeRef.current) {
          setReconnecting(true);
        }
        const delay = Math.min(4000, 900 + retryAttempt * 500 + Math.floor(Math.random() * 400));
        retryAttempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible') {
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

  const handleEmitStrokeChunk = useCallback(
    (chunk: {
      strokeId: string;
      tool: 'brush' | 'eraser' | 'shape';
      color: string;
      width: number;
      points: PointNormalized[];
      shape?: ShapeGeometry;
      sequence: number;
    }) => {
      setRoomState((prev) => {
        if (!prev || !prev.currentRound) return prev;
        const idx = prev.strokes.findIndex((s) => s.id === chunk.strokeId);
        const nextStrokes = [...prev.strokes];

        if (chunk.tool === 'shape' && chunk.shape) {
          if (idx === -1) {
            nextStrokes.push({
              id: chunk.strokeId,
              roundId: prev.currentRound.id,
              playerId,
              tool: 'shape',
              color: chunk.color,
              width: chunk.width,
              points: [],
              shape: chunk.shape,
              sequence: chunk.sequence,
              createdAt: Date.now(),
            });
          } else {
            nextStrokes[idx] = {
              ...nextStrokes[idx],
              color: chunk.color,
              width: chunk.width,
              shape: chunk.shape,
              sequence: chunk.sequence,
            };
          }
          return { ...prev, strokes: nextStrokes };
        }

        if (idx === -1) {
          nextStrokes.push({
            id: chunk.strokeId,
            roundId: prev.currentRound.id,
            playerId,
            tool: chunk.tool,
            color: chunk.color,
            width: chunk.width,
            points: chunk.points,
            sequence: chunk.sequence,
            createdAt: Date.now(),
          });
        } else {
          nextStrokes[idx] = {
            ...nextStrokes[idx],
            points: [...nextStrokes[idx].points, ...chunk.points],
            sequence: chunk.sequence,
          };
        }
        return { ...prev, strokes: nextStrokes };
      });

      sendWs('drawing:stroke', chunk);
    },
    [playerId, sendWs]
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
  // VIEW 1: ENTRY / JOIN OR CREATE ROOM (GAME STUDIO LOBBY)
  // ============================================================================
  if (!roomState) {
    return (
      <div className="w-full max-w-6xl mx-auto py-6 px-4">
        {errorMsg && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 bg-red-950/90 border border-red-500/60 text-red-100 px-4 py-3 rounded-2xl text-sm shadow-lg"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-xs font-semibold text-red-300 hover:text-white cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch">
          {/* Left Column: Character Customization & Room Creation */}
          <div className="lg:col-span-7 game-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 mb-2">
                <Wand2 className="w-4 h-4" />
                <span>Party Game Multiplayer Online</span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2.5 font-display"
                style={{ textWrap: 'balance' }}
              >
                Escolha seu Herói Criativo, desenhe e desafie seus amigos!
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Personalize seu personagem e apelido abaixo. Na rodada, combine pincel livre e formas geométricas redimensionáveis ou revele letras ilimitadas para adivinhar!
              </p>
            </div>

            <div className="flex flex-col gap-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5">
              {/* Selected Hero Showcase + Nickname Input */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3.5 shrink-0">
                  <div className="relative">
                    <AvatarSvg avatarId={avatarId} size={68} className="ring-2 ring-amber-400/80" />
                  </div>
                  <div className="sm:hidden">
                    <div className="text-sm font-bold text-amber-300">{selectedAvatarMeta.label}</div>
                    <div className="text-xs text-slate-400">{selectedAvatarMeta.role}</div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor={`nick-${clientSlotId}`}
                      className="text-xs font-bold text-slate-200"
                    >
                      Apelido do Jogador
                    </label>
                    <span className="hidden sm:inline text-xs text-amber-300 font-semibold">
                      {selectedAvatarMeta.label} · {selectedAvatarMeta.role}
                    </span>
                  </div>
                  <input
                    id={`nick-${clientSlotId}`}
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={18}
                    placeholder="Ex: ArtistaSolar"
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-base font-bold text-white placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 12 Illustrated Game Avatars Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-200">
                    Selecione seu Avatar ({AVATAR_LIST.length} personagens originais)
                  </span>
                </div>
                <div
                  className="grid grid-cols-4 sm:grid-cols-6 gap-2.5"
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
                        aria-label={`${av.label} — ${av.role}`}
                        title={`${av.label} (${av.role})`}
                        onClick={() => setAvatarId(av.id)}
                        className={`group p-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          selected
                            ? 'bg-amber-500/20 border-amber-400 scale-105 shadow-lg'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
                        }`}
                      >
                        <AvatarSvg
                          avatarId={av.id}
                          size={46}
                          className="group-hover:scale-105 transition-transform"
                        />
                        <span
                          className={`text-[10px] font-bold truncate w-full text-center ${
                            selected ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        >
                          {av.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Status da Arena:{' '}
                <strong className="text-emerald-400">
                  {wsConnected ? 'Conectado em Tempo Real' : 'Conectando...'}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={!wsConnected}
                className="game-btn-amber px-7 py-3.5 rounded-2xl disabled:opacity-50 font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer shadow-lg flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Criar Nova Sala de Jogo</span>
              </button>
            </div>
          </div>

          {/* Right Column: Join Room & Public Rooms */}
          <div className="lg:col-span-5 game-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1 font-display">
                  Entrar em Sala Existente
                </h2>
                <p className="text-xs text-slate-400">
                  Digite o código de 6 caracteres da sala ou escolha uma arena aberta abaixo.
                </p>
              </div>

              <form onSubmit={(e) => handleJoinRoom(e)} className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <input
                    id={`code-${clientSlotId}`}
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="CÓDIGO (EX: K7M9P2)"
                    maxLength={8}
                    className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-emerald-400 rounded-xl px-4 py-3 text-base font-mono font-bold uppercase tracking-widest text-amber-300 placeholder:text-slate-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!wsConnected}
                    className="game-btn-emerald px-6 py-3.5 rounded-xl font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer shadow-md"
                  >
                    Entrar
                  </button>
                </div>
              </form>

              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3">
                  <span>Arenas Abertas Agora</span>
                  <span className="font-mono text-amber-400 tabular-nums">{publicRooms.length}</span>
                </div>
                {publicRooms.length === 0 ? (
                  <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 text-xs text-slate-400 leading-relaxed">
                    Nenhuma sala aberta no momento. Clique em <strong className="text-amber-300">Criar Nova Sala de Jogo</strong> ao lado para abrir a primeira arena!
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {publicRooms.map((r) => (
                      <div
                        key={r.joinCode}
                        className="flex items-center justify-between gap-3 bg-slate-950/90 border border-slate-800 hover:border-slate-700 rounded-2xl px-4 py-3 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {r.roomName}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono tabular-nums">
                            <span className="text-amber-400">#{r.joinCode}</span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {r.playerCount}/{r.maxPlayers} jogadores
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleJoinRoom(e, r.joinCode)}
                          className="game-btn-amber px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Jogar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
              <strong className="text-amber-300">Modo Tela Dupla Instantâneo:</strong> Clique em{' '}
              <span className="text-white font-bold">Tela Dupla (2 Jogadores)</span> no topo para dividir a tela entre Desenhista e Adivinhador conectados em tempo real!
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CONNECTED TO A ROOM
  // ============================================================================
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 py-3 flex flex-col gap-3">
      {reconnecting && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 bg-amber-950/90 border border-amber-500/60 text-amber-100 px-4 py-2 rounded-2xl text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Reconectando ao servidor sem perder seu desenho ou pontuação...</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 bg-red-950/90 border border-red-500/60 text-red-100 px-4 py-2 rounded-2xl text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs font-semibold text-red-300 hover:text-white cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Compact Game HUD Header */}
      <div className="game-panel rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AvatarSvg avatarId={me?.avatarId ?? avatarId} size={38} className="ring-1 ring-amber-400/50" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold text-white truncate">
              <span>{roomState.settings.roomName}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-xs text-amber-400">#{roomState.joinCode}</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Herói: <strong className="text-slate-200">{me?.nickname}</strong></span>
              {isHost && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-300 font-semibold">Anfitrião</span>
                </>
              )}
              {round && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    Turno {round.roundNumber}/{round.totalRounds}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Theme & Synchronized Timer */}
        {round && roomState.status !== 'LOBBY' && roomState.status !== 'GAME_RESULT' && (
          <div className="flex items-center gap-3">
            <div className="text-xs sm:text-sm bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl">
              <span className="text-slate-400 mr-1.5">Tema:</span>
              <span className="font-bold text-amber-300">
                {round.themeName ?? 'Escolhendo...'}
              </span>
            </div>

            {(roomState.status === 'DRAWING' ||
              roomState.status === 'THEME_SELECTION' ||
              roomState.status === 'WORD_REVEAL' ||
              roomState.status === 'PAUSED') && (
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border font-mono text-sm font-bold tabular-nums ${
                  roomState.status === 'PAUSED'
                    ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                    : remainingSeconds <= 10 && roomState.status === 'DRAWING'
                    ? 'bg-red-950/80 border-red-500 text-red-200'
                    : 'bg-slate-950 border-slate-700 text-white'
                }`}
                aria-label={`Tempo restante: ${remainingSeconds} segundos`}
              >
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {roomState.status === 'PAUSED' ? 'PAUSADO' : `${remainingSeconds}s`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedInvite ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Convite</span>
              </>
            )}
          </button>

          {isHost && (roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && (
            <button
              type="button"
              onClick={() => sendWs('game:pause_toggle')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {roomState.status === 'PAUSED' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Retomar</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pausar</span>
                </>
              )}
            </button>
          )}

          {onOpenModerationModal && (
            <button
              type="button"
              onClick={() =>
                onOpenModerationModal({
                  roomId: roomState.id,
                  reporterId: playerId,
                  players: roomState.players,
                })
              }
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Moderação e Catálogo"
            >
              <Flag className="w-3.5 h-3.5" />
              {!isSplitScreenChild && <span>Catálogo</span>}
            </button>
          )}

          <button
            type="button"
            onClick={handleLeaveRoom}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/70 text-slate-300 hover:text-red-200 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* ========================================================================
          PHASE 1: LOBBY
         ======================================================================== */}
      {roomState.status === 'LOBBY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Players List */}
          <div className="lg:col-span-5 game-panel rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-white font-display">Jogadores na Arena</h2>
                <p className="text-xs text-slate-400">
                  Código de convite:{' '}
                  <span className="font-mono text-amber-400 font-bold">{roomState.joinCode}</span>
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-slate-300 tabular-nums">
                {roomState.players.filter((p) => p.connectionStatus === 'connected').length}/
                {roomState.settings.maxPlayers} vagas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
              {roomState.players.map((p) => {
                const avMeta = AVATAR_LIST[Math.abs(p.avatarId || 0) % AVATAR_LIST.length];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2.5 bg-slate-950/85 border border-slate-800 rounded-2xl px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarSvg avatarId={p.avatarId} size={42} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-white truncate">
                          <span className="truncate">{p.nickname}</span>
                          {p.id === playerId && (
                            <span className="text-xs font-normal text-amber-400 shrink-0">(Você)</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                          <span className="truncate">{avMeta.label}</span>
                          <span aria-hidden="true">·</span>
                          {p.isHost ? (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-semibold shrink-0">
                              <Crown className="w-3 h-3" />
                              Anfitrião
                            </span>
                          ) : (
                            <span>Desafiante</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isHost && p.id !== playerId && (
                      <button
                        type="button"
                        onClick={() => sendWs('room:kick', { targetPlayerId: p.id, ban: false })}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-950/50 transition-colors cursor-pointer shrink-0"
                        title={`Remover ${p.nickname}`}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
              {roomState.players.length < 2 && (
                <div className="text-xs text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-2xl p-3.5 leading-relaxed">
                  Você já pode clicar em <strong>Iniciar Partida Agora</strong> ou ativar o botão{' '}
                  <strong>Tela Dupla (2 Jogadores)</strong> no topo para jogar com 2 jogadores simultâneos!
                </div>
              )}

              {isHost ? (
                <button
                  type="button"
                  onClick={() => sendWs('game:start')}
                  className="game-btn-amber w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Partida Agora</span>
                </button>
              ) : (
                <div className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-300 font-medium">
                  Aguardando o anfitrião iniciar a partida...
                </div>
              )}
            </div>
          </div>

          {/* Right: Room Configuration */}
          <div className="lg:col-span-7 game-panel rounded-3xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <h2 className="text-lg font-bold text-white font-display">
                  Regras da Arena
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {isHost ? 'Configurável pelo anfitrião' : 'Definido pelo anfitrião'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome da Sala
                </label>
                <input
                  type="text"
                  disabled={!isHost}
                  value={roomState.settings.roomName}
                  onChange={(e) => handleUpdateSetting('roomName', e.target.value)}
                  maxLength={32}
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Capacidade da Sala (Até 32 Jogadores)
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.maxPlayers}
                  onChange={(e) => handleUpdateSetting('maxPlayers', Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={8}>Até 8 jogadores</option>
                  <option value={12}>Até 12 jogadores</option>
                  <option value={16}>Até 16 jogadores</option>
                  <option value={24}>Até 24 jogadores</option>
                  <option value={32}>Até 32 jogadores (Arena Completa)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tempo por Rodada
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.roundDuration}
                  onChange={(e) =>
                    handleUpdateSetting('roundDuration', Number(e.target.value) as 45 | 60 | 90 | 120)
                  }
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={45}>45 segundos (Turbo)</option>
                  <option value={60}>60 segundos (Clássico)</option>
                  <option value={90}>90 segundos (Criativo)</option>
                  <option value={120}>120 segundos (Mestre)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Turnos por Jogador
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.roundsPerPlayer}
                  onChange={(e) =>
                    handleUpdateSetting('roundsPerPlayer', Number(e.target.value) as 1 | 2 | 3)
                  }
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value={1}>1 rodada por jogador</option>
                  <option value={2}>2 rodadas por jogador</option>
                  <option value={3}>3 rodadas por jogador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
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
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="drawer_chooses">Desenhista da vez escolhe</option>
                  <option value="host_chooses">Anfitrião escolhe</option>
                  <option value="random">Sorteio automático (Tema aleatório)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Dificuldade das Palavras
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.difficulty}
                  onChange={(e) =>
                    handleUpdateSetting('difficulty', e.target.value as 'easy' | 'medium' | 'mixed')
                  }
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="mixed">Misto (Fácil + Médio)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Modo de Pontuação
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.scoringMode}
                  onChange={(e) =>
                    handleUpdateSetting('scoringMode', e.target.value as 'competitive' | 'casual')
                  }
                  className="w-full bg-slate-950 border border-slate-700 disabled:opacity-60 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="competitive">Competitivo (100/80/60/40 pts)</option>
                  <option value="casual">Casual (Livre e sem penalidade)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.endWhenAllGuessed}
                  onChange={(e) => handleUpdateSetting('endWhenAllGuessed', e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>Encerrar ao acertarem todos</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.allowEarlyFinish}
                  onChange={(e) => handleUpdateSetting('allowEarlyFinish', e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>Permitir finalizar desenho</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.chatEnabled}
                  onChange={(e) => handleUpdateSetting('chatEnabled', e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span>Habilitar chat geral</span>
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
            <p className="text-xs font-bold text-amber-400 mb-1">
              Rodada {round.roundNumber} de {round.totalRounds} · Desenhista: {round.drawerNickname}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display">
              {(roomState.settings.themeMode === 'host_chooses' ? isHost : isDrawer)
                ? 'Escolha o Tema da Rodada'
                : `Aguardando ${
                    roomState.settings.themeMode === 'host_chooses'
                      ? 'o anfitrião'
                      : round.drawerNickname
                  } escolher o tema...`}
            </h2>
            <p className="text-sm text-slate-300">
              Selecione um cartão abaixo para sortear a palavra secreta desta rodada.
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
                      className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3.5 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-lg scale-[1.02]'
                          : canSelect
                          ? 'bg-slate-950/90 border-slate-800 hover:border-slate-600 cursor-pointer'
                          : 'bg-slate-950/50 border-slate-800/60 opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`p-3 rounded-xl border ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-amber-400 border-slate-700'
                          }`}
                        >
                          <ThemeIcon iconName={theme.iconName} className="w-6 h-6" />
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                            <CheckCircle2 className="w-4 h-4" />
                            Selecionado
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-base font-bold text-white mb-1 font-display">
                          {theme.name}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {theme.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(roomState.settings.themeMode === 'host_chooses' ? isHost : isDrawer) && (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={!selectedThemeCard}
                    onClick={() => {
                      if (selectedThemeCard) {
                        sendWs('theme:select', { themeId: selectedThemeCard });
                      }
                    }}
                    className="game-btn-amber px-7 py-3.5 rounded-2xl disabled:opacity-40 disabled:pointer-events-none font-bold text-sm whitespace-nowrap cursor-pointer shadow-lg"
                  >
                    Confirmar Tema e Sortear Palavra
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
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/40 text-amber-300">
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="text-xs font-bold text-slate-400">
            Tema da Rodada: <span className="text-amber-300">{round.themeName}</span> ·{' '}
            <span className="text-white font-mono">{round.wordLetterCount} letras</span>
          </p>

          {isDrawer && privateWord ? (
            <>
              <h2 className="text-lg font-medium text-slate-300">
                Você é o desenhista! Sua palavra secreta é:
              </h2>
              <div className="px-8 py-4 rounded-2xl bg-slate-950 border-2 border-amber-400 text-3xl font-bold text-amber-300 tracking-wide font-display shadow-inner">
                {privateWord.word}
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Use o pincel livre e as formas geométricas redimensionáveis para ilustrar a ideia!
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-white font-display">
                {round.drawerNickname} está preparando o desenho!
              </h2>
              <p className="text-sm text-slate-300 max-w-md">
                A palavra sorteada tem <strong>{round.wordLetterCount} letras</strong> dentro do tema{' '}
                <strong>{round.themeName}</strong>.
              </p>
            </>
          )}
        </div>
      )}

      {/* ========================================================================
          PHASE 4: MAIN DRAWING & GUESSING SCREEN (ZERO-SCROLL ERGONOMIC STUDIO)
         ======================================================================== */}
      {(roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && round && (
        <div className="flex flex-col gap-2.5">
          {/* Compact Interactive Word Letters Panel + Unlimited Letter Hint Button */}
          <div className="game-panel rounded-2xl px-3.5 py-2.5 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {isDrawer ? (
                  <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-400/60 px-3 py-1 rounded-xl">
                    <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs text-amber-200 font-medium">Palavra:</span>
                    <span className="text-sm font-bold text-white tracking-wide font-display">
                      {privateWord?.word ?? '...'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl text-xs">
                    <span className="text-slate-400">Desenhista:</span>
                    <strong className="text-white">{round.drawerNickname}</strong>
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono tabular-nums bg-slate-950/90 border border-slate-800 px-3 py-1 rounded-xl">
                  <span className="font-bold text-amber-400">
                    {round.wordLetterCount} LETRAS
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>
                    {round.wordLetterCount - round.unrevealedLettersCount}/{round.wordLetterCount} reveladas
                  </span>
                </div>

                {/* Inline Interactive Letter Slots */}
                {round.wordMask && round.wordMask.length > 0 && (
                  <div
                    className="flex flex-wrap items-center gap-1 ml-1"
                    aria-label={`Estrutura da palavra com ${round.wordLetterCount} letras`}
                  >
                    {round.wordMask.map((ch, idx) => {
                      if (ch === ' ') {
                        return (
                          <span
                            key={idx}
                            className="w-2.5 h-7 inline-block"
                            aria-label="Espaço entre palavras"
                          />
                        );
                      }
                      if (ch === '-') {
                        return (
                          <span
                            key={idx}
                            className="w-3.5 h-7 flex items-center justify-center font-mono font-bold text-slate-400"
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
                              : `Clique para revelar a ${idx + 1}ª letra como dica`
                          }
                          className={`w-7 h-8 rounded-lg font-mono text-sm font-bold flex items-center justify-center border-2 transition-all ${
                            isRevealed
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-xs'
                              : 'bg-slate-950 border-slate-700 hover:border-amber-400 text-slate-400 hover:text-amber-300 cursor-pointer'
                          }`}
                        >
                          {isRevealed ? ch : '_'}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right: Unlimited Reveal Letter Hint Button + Contextual Hint + Finish */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleRevealLetterHint()}
                  disabled={
                    roomState.status !== 'DRAWING' || round.unrevealedLettersCount === 0
                  }
                  className="game-btn-amber flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl disabled:opacity-40 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer"
                  title="Clique quantas vezes quiser para revelar letras da palavra sorteada!"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>
                    {round.unrevealedLettersCount === 0
                      ? 'Letras Reveladas'
                      : `Revelar Letra (${round.unrevealedLettersCount})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleRevealContextHint}
                  disabled={roomState.status !== 'DRAWING'}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-semibold text-xs border border-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Liberar uma pista textual sobre a palavra"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Pista</span>
                </button>

                {isDrawer && roomState.settings.allowEarlyFinish && (
                  <button
                    type="button"
                    onClick={() => sendWs('round:finish')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Finalizar
                  </button>
                )}
              </div>
            </div>

            {round.revealedHints.some((h) => h.type === 'contextual') && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-amber-200 bg-amber-950/35 border border-amber-500/30 rounded-xl px-3 py-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {round.revealedHints
                  .filter((h) => h.type === 'contextual')
                  .map((h: RevealedHint, idx: number) => (
                    <React.Fragment key={h.index}>
                      {idx > 0 && <span aria-hidden="true">·</span>}
                      <span className="font-medium">{h.text}</span>
                    </React.Fragment>
                  ))}
              </div>
            )}
          </div>

          {/* Main 12-Col Grid: Canvas (8 cols) + Scoreboard & Guess Panel (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            <div className="lg:col-span-8 flex flex-col gap-2.5">
              <DrawingCanvas
                strokes={roomState.strokes}
                isDrawer={isDrawer}
                isDrawingPhase={roomState.status === 'DRAWING'}
                onEmitStrokeChunk={handleEmitStrokeChunk}
                onUndo={() => sendWs('drawing:undo')}
                onRedo={() => sendWs('drawing:redo')}
                onClear={() => sendWs('drawing:clear')}
                compactMode={isSplitScreenChild}
              />

              {/* Guess Input Bar for Guessers */}
              {!isDrawer && (
                <div className="game-panel rounded-2xl p-3 flex flex-col gap-2">
                  {me?.hasGuessedThisRound ? (
                    <div className="flex items-center justify-between gap-2 bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 px-4 py-2.5 rounded-xl text-sm font-bold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Parabéns! Você acertou a palavra secreta desta rodada!</span>
                      </div>
                      {roomState.settings.scoringMode === 'competitive' && (
                        <span className="font-mono text-xs text-emerald-300 tabular-nums">
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
                        className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none min-h-[42px]"
                      />
                      <button
                        type="submit"
                        disabled={roomState.status !== 'DRAWING' || !guessText.trim()}
                        className="game-btn-amber px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none font-bold text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[42px] cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Enviar Palpite</span>
                      </button>
                    </form>
                  )}

                  {privateGuessFeedback && !me?.hasGuessedThisRound && (
                    <div
                      role="status"
                      className="text-xs text-amber-300 font-medium flex items-center justify-between px-1"
                    >
                      <span>{privateGuessFeedback.text}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Sidebar: Scoreboard & Feed */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              <div className="flex lg:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setMobilePanel((p) => (p === 'players' ? 'none' : 'players'))
                  }
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Jogadores ({roomState.players.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobilePanel((p) => (p === 'feed' ? 'none' : 'feed'))}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Eventos ({roomState.feed.length})</span>
                </button>
              </div>

              {/* Players & Scoreboard Card */}
              <div
                className={`${
                  mobilePanel === 'players' ? 'flex' : 'hidden lg:flex'
                } game-panel rounded-2xl p-3.5 flex-col gap-2.5`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">
                    Placar ao Vivo
                  </span>
                  <span className="text-xs text-slate-400">
                    {roomState.settings.scoringMode === 'competitive'
                      ? 'Competitivo'
                      : 'Casual'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
                  {roomState.players.map((p) => {
                    const isCurrentDrawer = p.id === round.drawerPlayerId;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between gap-2.5 p-2 rounded-xl border ${
                          p.hasGuessedThisRound
                            ? 'bg-emerald-950/35 border-emerald-500/40'
                            : isCurrentDrawer
                            ? 'bg-amber-950/25 border-amber-500/40'
                            : 'bg-slate-950/75 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AvatarSvg avatarId={p.avatarId} size={36} />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {p.nickname} {p.id === playerId && '(Você)'}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              {isCurrentDrawer ? (
                                <span className="text-amber-300 font-semibold">Desenhando agora</span>
                              ) : p.hasGuessedThisRound ? (
                                <span className="text-emerald-300 font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  Acertou ({p.guessOrder}º)
                                </span>
                              ) : (
                                <span>Adivinhando</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {roomState.settings.scoringMode === 'competitive' && (
                          <div className="font-mono text-xs font-bold text-amber-300 tabular-nums shrink-0">
                            {p.score} pts
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* System Feed & Chat */}
              <div
                className={`${
                  mobilePanel === 'feed' ? 'flex' : 'hidden lg:flex'
                } game-panel rounded-2xl p-3.5 flex-col gap-2.5`}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white">
                    Mural da Partida
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Tempo real
                  </span>
                </div>

                <div
                  className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 text-xs"
                  aria-live="polite"
                >
                  {roomState.feed.slice(-18).map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-xl ${
                        msg.type === 'correct_guess'
                          ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 font-semibold'
                          : msg.type === 'hint'
                          ? 'bg-amber-950/50 border border-amber-500/30 text-amber-200 font-medium'
                          : msg.type === 'chat'
                          ? 'bg-slate-950 text-slate-200'
                          : 'text-slate-400 bg-slate-950/40'
                      }`}
                    >
                      {msg.type === 'chat' && msg.playerNickname ? (
                        <>
                          <strong className="text-white">{msg.playerNickname}: </strong>
                          <span>{msg.text}</span>
                        </>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                  ))}
                </div>

                {roomState.settings.chatEnabled && (
                  <form onSubmit={handleSubmitChat} className="flex items-center gap-1.5 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Conversar no chat..."
                      maxLength={100}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <p className="text-xs font-bold text-amber-400 mb-1">
                Resultado da Rodada {round.roundNumber} de {round.totalRounds} · Tema: {round.themeName}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
                A palavra sorteada era:{' '}
                <span className="text-amber-300 underline decoration-amber-400/50 underline-offset-4">
                  {round.revealedWord ?? '---'}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-slate-400 tabular-nums">
                Próximo turno em {remainingSeconds}s
              </span>
              {isHost && roomState.status === 'ROUND_RESULT' && (
                <button
                  type="button"
                  onClick={() => sendWs('round:next_now')}
                  className="game-btn-amber px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer"
                >
                  Avançar Agora
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-6 flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-300">
                Arte Final de {round.drawerNickname}
              </span>
              <DrawingCanvas
                strokes={roomState.strokes}
                isDrawer={false}
                isDrawingPhase={false}
                onEmitStrokeChunk={() => {}}
                onUndo={() => {}}
                onRedo={() => {}}
                onClear={() => {}}
              />
            </div>

            <div className="md:col-span-6 flex flex-col gap-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Resumo da Rodada</span>
                  <span>Dicas reveladas: {round.hintsUsed}</span>
                </div>
                <div className="text-sm font-bold text-white">
                  {round.correctGuessesOrder.length === 0
                    ? 'Ninguém descobriu a palavra a tempo — ótimo desafio para a próxima!'
                    : `${round.correctGuessesOrder.length} de ${round.eligibleGuessersCount} jogadores acertaram!`}
                </div>
                {roomState.settings.scoringMode === 'competitive' && (
                  <div className="text-xs text-amber-300 font-mono tabular-nums">
                    Desenhista ({round.drawerNickname}): +{round.drawerPointsEarned ?? 0} pontos
                  </div>
                )}
              </div>

              {round.correctGuessesOrder.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-slate-300">
                    Ordem de Acertos na Rodada
                  </span>
                  {round.correctGuessesOrder.map((rec) => (
                    <div
                      key={rec.playerId}
                      className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-amber-400 tabular-nums">
                          {rec.order}º
                        </span>
                        <AvatarSvg avatarId={rec.avatarId} size={32} />
                        <span className="text-sm font-bold text-white">{rec.nickname}</span>
                      </div>
                      {roomState.settings.scoringMode === 'competitive' && (
                        <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
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
          PHASE 6: GAME RESULT / PODIUM
         ======================================================================== */}
      {roomState.status === 'GAME_RESULT' && (
        <div className="game-panel rounded-3xl p-7 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-400">Partida Finalizada</p>
                <h2 className="text-2xl font-bold text-white font-display">
                  Pódio e Placar Final
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyMatchSummary}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Resumo Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Resumo</span>
                  </>
                )}
              </button>

              {isHost && (
                <>
                  <button
                    type="button"
                    onClick={() => sendWs('game:return_lobby')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Voltar ao Lobby</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendWs('game:start')}
                    className="game-btn-amber flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Jogar Novamente</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-bold text-slate-400">
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Herói</th>
                  <th className="py-3 px-4 text-right">Acertos</th>
                  <th className="py-3 px-4 text-right">Turnos Desenhados</th>
                  <th className="py-3 px-4 text-right">Pontuação Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {[...roomState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400 tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          {idx === 0 && <Medal className="w-4 h-4 text-amber-400" />}
                          {idx + 1}º
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarSvg avatarId={p.avatarId} size={40} />
                          <div>
                            <div className="font-bold text-white">
                              {p.nickname} {p.id === playerId && '(Você)'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {AVATAR_LIST[Math.abs(p.avatarId || 0) % AVATAR_LIST.length].label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-200 tabular-nums">
                        {p.totalCorrectGuesses}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-200 tabular-nums">
                        {p.timesDrawn}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 tabular-nums">
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
