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
  const [customCreateRoomName, setCustomCreateRoomName] = useState<string>('');
  const [customCreateDuration, setCustomCreateDuration] = useState<string>('60');
  const [lobbyRoomName, setLobbyRoomName] = useState<string>('');
  const [lobbyDurationStr, setLobbyDurationStr] = useState<string>('60');
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
  const nicknameRef = useRef<string>(nickname);
  nicknameRef.current = nickname;
  const avatarIdRef = useRef<number>(avatarId);
  avatarIdRef.current = avatarId;
  const currentDrawerIdRef = useRef<string | null>(null);
  currentDrawerIdRef.current = roomState?.currentRound?.drawerPlayerId ?? null;
  const localDrawingRevisionRef = useRef<number>(0);
  const lastSyncRequestAtRef = useRef<number>(0);
  const lastBatchReceivedAtRef = useRef<number>(0);
  const pendingWsQueueRef = useRef<string[]>([]);

  const sendWs = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    const serialized = JSON.stringify({ event, payload });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(serialized);
        return;
      } catch {
        // Fall through to queue if transient socket error
      }
    }
    // Queue important drawing/action events if socket is momentarily reconnecting
    if (
      event.startsWith('drawing:') ||
      event === 'guess:submit' ||
      event === 'hint:request' ||
      event === 'theme:select'
    ) {
      if (pendingWsQueueRef.current.length < 150) {
        pendingWsQueueRef.current.push(serialized);
      }
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
        }, 12000);

        if (currentJoinCodeRef.current) {
          socket.send(
            JSON.stringify({
              event: 'room:join',
              payload: {
                joinCode: currentJoinCodeRef.current,
                playerId,
                nickname: nicknameRef.current.trim() || defaultNickname,
                avatarId: avatarIdRef.current,
                isReconnect: true,
              },
            })
          );
        }

        // Flush any queued packets emitted during a brief network blip
        if (pendingWsQueueRef.current.length > 0) {
          const queued = pendingWsQueueRef.current.splice(0, pendingWsQueueRef.current.length);
          for (const msg of queued) {
            if (socket.readyState === WebSocket.OPEN) {
              try {
                socket.send(msg);
              } catch {}
            }
          }
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
            if (typeof incomingState.currentRound?.drawingRevision === 'number') {
              localDrawingRevisionRef.current = incomingState.currentRound.drawingRevision;
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
                localDrawingRevisionRef.current = incomingState.currentRound?.drawingRevision ?? 0;
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
            localDrawingRevisionRef.current = 0;
            canvasHandleRef.current?.clearCanvas();
          } else if (event === 'game:timer') {
            if (payload?.serverNow) {
              clockOffsetRef.current = payload.serverNow - Date.now();
            }
            if (typeof payload?.remainingSeconds === 'number') {
              setRemainingSeconds(payload.remainingSeconds);
            }

            // Anti-freeze self-healing verification for up to 35 players
            if (
              typeof payload?.drawingRevision === 'number' &&
              typeof payload?.strokesCount === 'number' &&
              canvasHandleRef.current
            ) {
              const now = Date.now();
              const isCurrentDrawer = currentDrawerIdRef.current === playerId;
              const localCount = canvasHandleRef.current.getStrokesCount();

              if (!isCurrentDrawer) {
                // If drawer cleared the canvas on the server, clear locally immediately
                if (payload.strokesCount === 0 && localCount > 0) {
                  canvasHandleRef.current.clearCanvas();
                } else if (
                  payload.strokesCount > localCount &&
                  now - lastBatchReceivedAtRef.current > 2500 &&
                  now - lastSyncRequestAtRef.current > 4500
                ) {
                  // Only sync when drawing is quiet (no batches in 2.5s) and spectator is missing strokes
                  lastSyncRequestAtRef.current = now;
                  if (socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ event: 'drawing:sync_request', payload: {} }));
                  }
                }
              } else {
                // Drawer: if drawer has completed strokes that the server missed during a micro-blip and is not mid-stroke, push full snapshot
                if (
                  localCount > payload.strokesCount &&
                  !canvasHandleRef.current.isActivelyDrawing() &&
                  now - lastSyncRequestAtRef.current > 2000
                ) {
                  lastSyncRequestAtRef.current = now;
                  if (socket.readyState === WebSocket.OPEN) {
                    socket.send(
                      JSON.stringify({
                        event: 'drawing:drawer_sync',
                        payload: { strokes: canvasHandleRef.current.getStrokes() },
                      })
                    );
                  }
                }
              }
            }
          } else if (event === 'drawing:batch' || event === 'drawing:stroke') {
            // Forward directly to Canvas 2D imperative handle — ZERO React re-renders!
            lastBatchReceivedAtRef.current = Date.now();
            const batchPayload = payload as DrawingBatchPayload;
            canvasHandleRef.current?.applyBatch(batchPayload);

            if (typeof batchPayload.drawingRevision === 'number') {
              localDrawingRevisionRef.current = Math.max(
                localDrawingRevisionRef.current,
                batchPayload.drawingRevision
              );
            }
          } else if (event === 'drawing:clear') {
            if (typeof payload?.drawingRevision === 'number') {
              localDrawingRevisionRef.current = payload.drawingRevision;
            }
            canvasHandleRef.current?.clearCanvas();
          } else if (event === 'drawing:state') {
            if (typeof payload?.drawingRevision === 'number') {
              localDrawingRevisionRef.current = payload.drawingRevision;
            }
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
                if (
                  payload.drawerPlayerId &&
                  p.id === payload.drawerPlayerId &&
                  typeof payload.drawerTotalScore === 'number'
                ) {
                  return {
                    ...p,
                    score: payload.drawerTotalScore,
                    roundPointsEarned: payload.drawerPointsEarned ?? p.roundPointsEarned,
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
                  drawerPointsEarned:
                    payload.drawerPointsEarned ?? prev.currentRound.drawerPointsEarned,
                  drawerPointsPerPerson:
                    payload.drawerPointsPerPerson ?? prev.currentRound.drawerPointsPerPerson,
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

        if (currentJoinCodeRef.current) {
          setReconnecting(true);
        }
        // Fast, resilient reconnection on Render (caps at 3.5s so players never get stuck disconnected)
        const delay = Math.min(3500, 500 * Math.pow(1.4, Math.min(retryAttempt, 6)) + Math.floor(Math.random() * 250));
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
    const desiredName = customCreateRoomName.trim() || `Sala de ${cleanNick}`;
    const parsedSec = parseInt(customCreateDuration, 10);
    const durationSec = Number.isFinite(parsedSec)
      ? Math.max(10, Math.min(600, parsedSec))
      : 60;

    setLobbyRoomName(desiredName);
    setLobbyDurationStr(String(durationSec));

    sendWs('room:create', {
      playerId,
      nickname: cleanNick,
      avatarId,
      settings: {
        roomName: desiredName,
        maxPlayers: 35,
        roundDuration: durationSec,
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
      `Resumo da Partida — SENAI Phone (${roomState.settings.roomName})`,
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

  // Sync lobby inputs when joining a room or when non-host receives updated settings
  useEffect(() => {
    if (roomState?.settings) {
      if (!isHost || !lobbyRoomName) {
        setLobbyRoomName(roomState.settings.roomName);
      }
      setLobbyDurationStr(String(roomState.settings.roundDuration));
    }
  }, [roomState?.id, roomState?.settings?.roomName, roomState?.settings?.roundDuration, isHost]);

  // ============================================================================
  // VIEW 1: ENTRY / JOIN OR CREATE ROOM (MODERN LIGHT MODE HOME)
  // ============================================================================
  if (!roomState) {
    return (
      <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6">
        {errorMsg && (
          <div
            role="alert"
            className="mb-6 flex items-center justify-between gap-3 bg-[#FDF2F2] border border-[#E55353]/40 text-[#202435] px-4 py-3 rounded-xl text-sm font-semibold shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#E55353] shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg('')}
              className="text-xs font-bold text-[#E55353] hover:underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Painel Esquerdo: Criação e Personalização da Sala */}
          <div className="lg:col-span-7 party-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
            {/* Cabeçalho do Painel Esquerdo */}
            <div className="flex items-center justify-between border-b border-[#E5E8F0] pb-4">
              <div>
                <h1 className="text-xl font-bold text-[#202435] font-display">
                  Criar e Personalizar Sala
                </h1>
                <p className="text-xs text-[#687086] mt-0.5">
                  Escolha seu avatar, defina seu apelido e configure sua partida.
                </p>
              </div>
              <span className="text-xs font-medium text-[#687086]">
                {selectedAvatarMeta.label} · {selectedAvatarMeta.role}
              </span>
            </div>

            {/* Área de Personalização do Jogador (Avatar + Apelido + Sortear) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#F5F6FA] border border-[#E5E8F0] rounded-2xl p-4">
              <div className="flex items-center gap-3.5 shrink-0">
                <div className="p-1 rounded-full bg-white border-2 border-[#FF9F1C] shadow-xs">
                  <AvatarSvg avatarId={avatarId} size={64} />
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
                  className="py-2 px-3 rounded-xl bg-white hover:bg-[#FFF6E5] text-[#202435] border border-[#E5E8F0] hover:border-[#FF9F1C] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#FF9F1C]" />
                  <span>Sortear</span>
                </button>
              </div>

              <div className="flex-1">
                <label
                  htmlFor={`nick-${clientSlotId}`}
                  className="block text-xs font-semibold text-[#202435] mb-1.5"
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
                  className="w-full bg-white border border-[#E5E8F0] focus:border-[#FF9F1C] focus:ring-3 focus:ring-[#FF9F1C]/15 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#202435] placeholder:text-[#8E96AA] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Grade de 12 Avatares */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#202435]">Escolha seu Avatar</span>
                <span className="text-[#687086]">12 personagens disponíveis</span>
              </div>
              <div
                className="grid grid-cols-4 sm:grid-cols-6 gap-2.5"
                role="radiogroup"
                aria-label="Escolha seu avatar"
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
                      onClick={() => setAvatarId(av.id)}
                      className={`group p-2 rounded-xl border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        selected
                          ? 'bg-[#FFF8EB] border-[#FF9F1C] ring-2 ring-[#FF9F1C]/25 -translate-y-0.5 shadow-xs'
                          : 'bg-[#F5F6FA] border-[#E5E8F0] hover:border-[#D0D5E2] hover:bg-white'
                      }`}
                    >
                      <AvatarSvg avatarId={av.id} size={44} />
                      <span
                        className={`text-[11px] truncate w-full text-center ${
                          selected ? 'font-bold text-[#202435]' : 'font-medium text-[#687086] group-hover:text-[#202435]'
                        }`}
                      >
                        {av.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configurações Rápidas da Sala (Nome e Tempo) */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-1 border-t border-[#E5E8F0]">
              <div className="sm:col-span-7">
                <label
                  htmlFor={`room-name-${clientSlotId}`}
                  className="block text-xs font-semibold text-[#202435] mb-1.5"
                >
                  Nome da Sala (Personalizado)
                </label>
                <input
                  id={`room-name-${clientSlotId}`}
                  type="text"
                  value={customCreateRoomName}
                  onChange={(e) => setCustomCreateRoomName(e.target.value)}
                  maxLength={45}
                  placeholder={`Ex: Sala de ${nickname.trim() || 'Desenho'}`}
                  className="w-full senaiphone-input rounded-xl px-3.5 py-2.5 text-sm font-medium"
                />
              </div>

              <div className="sm:col-span-5">
                <label
                  htmlFor={`room-time-${clientSlotId}`}
                  className="block text-xs font-semibold text-[#202435] mb-1.5"
                >
                  Tempo da Rodada (segundos)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`room-time-${clientSlotId}`}
                    type="number"
                    min={10}
                    max={600}
                    value={customCreateDuration}
                    onChange={(e) => setCustomCreateDuration(e.target.value)}
                    placeholder="60"
                    className="w-full senaiphone-input rounded-xl px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <span className="text-xs font-semibold text-[#687086] shrink-0">seg</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateRoom}
              disabled={!wsConnected}
              className="party-btn-yellow w-full py-3.5 px-6 rounded-xl disabled:opacity-50 font-bold text-base cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-[#202435]" />
              <span>Criar Sala</span>
            </button>
          </div>

          {/* Painel Direito: Entrada em uma Sala Existente */}
          <div className="lg:col-span-5 party-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <div className="border-b border-[#E5E8F0] pb-4">
                <h2 className="text-xl font-bold text-[#202435] font-display">
                  Entrar em uma Sala
                </h2>
                <p className="text-xs text-[#687086] mt-0.5">
                  Digite o código de convite ou escolha uma sala aberta abaixo.
                </p>
              </div>

              <div>
                <label
                  htmlFor={`code-${clientSlotId}`}
                  className="block text-xs font-semibold text-[#202435] mb-1.5"
                >
                  Código de Convite
                </label>
                <form onSubmit={(e) => handleJoinRoom(e)} className="flex items-center gap-2.5">
                  <input
                    id={`code-${clientSlotId}`}
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="EX: A7K9P2"
                    maxLength={8}
                    className="flex-1 senaiphone-input rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold uppercase tracking-widest"
                  />
                  <button
                    type="submit"
                    disabled={!wsConnected}
                    className="party-btn-emerald px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Entrar
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-[#E5E8F0] flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#202435]">
                  <span>Salas Abertas</span>
                  <span className="font-mono text-[#687086]">{publicRooms.length}</span>
                </div>

                {publicRooms.length === 0 ? (
                  <div className="bg-[#F5F6FA] border border-dashed border-[#D5DAE6] rounded-2xl p-7 text-center flex flex-col items-center gap-2.5">
                    <AvatarSvg avatarId={(avatarId + 3) % AVATAR_LIST.length} size={48} />
                    <p className="text-sm font-bold text-[#202435]">
                      Nenhuma sala aberta no momento
                    </p>
                    <p className="text-xs text-[#687086] max-w-xs leading-relaxed">
                      Clique em <strong className="text-[#202435]">Criar Sala</strong> no painel ao lado para iniciar uma nova partida e convidar seus amigos.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
                    {publicRooms.map((r) => (
                      <div
                        key={r.joinCode}
                        className="flex items-center justify-between gap-3 bg-[#F5F6FA] hover:bg-white border border-[#E5E8F0] hover:border-[#D0D5E2] rounded-xl px-4 py-3 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-[#202435] truncate">
                            {r.roomName}
                          </div>
                          <div className="text-xs text-[#687086] font-mono mt-0.5">
                            #{r.joinCode} · {r.playerCount}/{r.maxPlayers} jogadores
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleJoinRoom(e, r.joinCode)}
                          className="party-btn-yellow px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0"
                        >
                          Entrar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-3.5 text-xs text-[#687086] flex items-center justify-between gap-2">
              <span>Suporte para até 35 jogadores simultâneos em tempo real</span>
              <span className="font-mono font-semibold text-[#16A879] shrink-0">
                {wsConnected ? 'Online' : 'Conectando...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // CONNECTED TO A ROOM (CLEAN LIGHT MODE SOCIAL DRAWING ARENA)
  // ============================================================================
  return (
    <div className="w-full max-w-[1540px] mx-auto px-3 sm:px-6 py-3 flex flex-col gap-3">
      {reconnecting && (
        <div
          role="status"
          className="flex items-center gap-2 bg-[#FFF6E5] border border-[#FF9F1C]/50 text-[#202435] px-4 py-2.5 rounded-xl text-xs font-semibold"
        >
          <WifiOff className="w-4 h-4 text-[#FF9F1C] shrink-0" />
          <span>Reconectando à partida em tempo real...</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 bg-[#FDF2F2] border border-[#E55353]/40 text-[#202435] px-4 py-2.5 rounded-xl text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#E55353] shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs font-bold text-[#E55353] hover:underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* UNIFIED SINGLE COMPACT TOP BAR (Room + Word/Letters + Timer + Actions) */}
      <div className="party-card rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Room & Round Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <AvatarSvg avatarId={me?.avatarId ?? avatarId} size={36} />
          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-bold text-[#202435]">
            <span className="truncate max-w-[160px] sm:max-w-[240px]" title={roomState.settings.roomName}>
              {roomState.settings.roomName}
            </span>
            <span className="font-mono text-[#687086]">({roomState.joinCode})</span>
            {round && roomState.status !== 'LOBBY' && (
              <>
                <span aria-hidden="true" className="text-[#D0D5E2]">·</span>
                <span className="font-mono text-[#687086] font-semibold">
                  Rodada {round.roundNumber}/{round.totalRounds}
                </span>
                {round.themeName && (
                  <>
                    <span aria-hidden="true" className="text-[#D0D5E2]">·</span>
                    <span className="text-[#FF9F1C] font-bold">{round.themeName}</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Center: Word / Letter Slots (ONLY DRAWER CAN REVEAL LETTERS; GUESSERS OBSERVE) */}
        {round && (roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {isDrawer ? (
              <>
                <div
                  className="flex flex-wrap items-center gap-1"
                  aria-label="Sua palavra secreta (clique em uma letra para revelá-la aos jogadores)"
                >
                  {Array.from(privateWord?.word ?? '').map((ch, idx) => {
                    if (ch === ' ') {
                      return <span key={idx} className="w-2.5 h-7 inline-block" />;
                    }
                    if (ch === '-') {
                      return (
                        <span
                          key={idx}
                          className="w-3 h-7 flex items-center justify-center font-mono font-bold text-[#687086]"
                        >
                          -
                        </span>
                      );
                    }
                    const isRevealedToRoom =
                      round.wordMask && round.wordMask[idx] && round.wordMask[idx] !== '_';
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={Boolean(isRevealedToRoom) || roomState.status !== 'DRAWING'}
                        onClick={() => handleRevealLetterHint(idx)}
                        title={
                          isRevealedToRoom
                            ? `Letra "${ch.toUpperCase()}" já visível para a sala`
                            : `Clique para revelar a letra "${ch.toUpperCase()}" para a sala`
                        }
                        className={`w-7 h-8 rounded-lg font-mono text-sm font-bold flex items-center justify-center border transition-all ${
                          isRevealedToRoom
                            ? 'bg-[#FFBF3F] border-[#FF9F1C] text-[#202435]'
                            : 'bg-[#F5F6FA] border-[#E5E8F0] hover:bg-[#FFF6E5] hover:border-[#FF9F1C] text-[#202435] cursor-pointer'
                        }`}
                      >
                        {ch.toUpperCase()}
                      </button>
                    );
                  })}
                  <span className="ml-1 text-xs font-mono font-semibold text-[#687086]">
                    ({round.wordLetterCount})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevealLetterHint()}
                  disabled={roomState.status !== 'DRAWING' || round.unrevealedLettersCount === 0}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFF6E5] hover:bg-[#FFEDC7] text-[#B86800] border border-[#FF9F1C]/40 disabled:opacity-40 font-bold text-xs cursor-pointer"
                  title="Revelar uma letra para os jogadores"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Revelar Letra</span>
                </button>

                {roomState.settings.allowEarlyFinish && (
                  <button
                    type="button"
                    onClick={() => sendWs('round:finish')}
                    className="px-2.5 py-1.5 rounded-lg bg-[#E8F8F2] hover:bg-[#D5F2E7] text-[#11845E] border border-[#16A879]/40 text-xs font-bold cursor-pointer"
                  >
                    Concluir
                  </button>
                )}
              </>
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
                          className="w-3 h-7 flex items-center justify-center font-mono font-bold text-[#687086]"
                        >
                          -
                        </span>
                      );
                    }
                    const isRevealed = ch !== '_';
                    return (
                      <span
                        key={idx}
                        title={
                          isRevealed
                            ? `Letra revelada pelo desenhista: ${ch}`
                            : 'Letra oculta (apenas o desenhista pode revelar)'
                        }
                        className={`w-7 h-8 rounded-lg font-mono text-sm font-bold flex items-center justify-center border select-none ${
                          isRevealed
                            ? 'bg-[#FFBF3F] border-[#FF9F1C] text-[#202435]'
                            : 'bg-[#F5F6FA] border-[#E5E8F0] text-[#687086]'
                        }`}
                      >
                        {isRevealed ? ch : '_'}
                      </span>
                    );
                  })}
                  <span className="ml-1 text-xs font-mono font-semibold text-[#687086]">
                    ({round.wordLetterCount} letras)
                  </span>
                </div>
              )
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
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-bold tabular-nums ${
                  roomState.status === 'PAUSED'
                    ? 'bg-[#FFF6E5] border-[#FF9F1C]/50 text-[#B86800]'
                    : remainingSeconds <= 10 && roomState.status === 'DRAWING'
                    ? 'bg-[#E55353] border-[#CF3E3E] text-white animate-pulse'
                    : 'bg-[#F5F6FA] border-[#E5E8F0] text-[#202435]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#FF9F1C] shrink-0" />
                <span>{roomState.status === 'PAUSED' ? 'PAUSA' : `${remainingSeconds}s`}</span>
              </div>
            )}

          <button
            type="button"
            onClick={handleCopyInvite}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F5F6FA] hover:bg-[#EBEEF5] text-[#202435] border border-[#E5E8F0] text-xs font-semibold cursor-pointer"
            title="Copiar convite"
          >
            {copiedInvite ? (
              <Check className="w-3.5 h-3.5 text-[#16A879]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#687086]" />
            )}
            <span className="hidden sm:inline">{copiedInvite ? 'Copiado' : 'Convite'}</span>
          </button>

          {isHost && (roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && (
            <button
              type="button"
              onClick={() => sendWs('game:pause_toggle')}
              className="p-1.5 rounded-xl bg-[#F5F6FA] hover:bg-[#EBEEF5] text-[#202435] border border-[#E5E8F0] cursor-pointer"
              title={roomState.status === 'PAUSED' ? 'Retomar' : 'Pausar'}
            >
              {roomState.status === 'PAUSED' ? (
                <Play className="w-4 h-4 text-[#16A879]" />
              ) : (
                <Pause className="w-4 h-4 text-[#FF9F1C]" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleLeaveRoom}
            className="p-1.5 rounded-xl bg-[#FDF2F2] hover:bg-[#FCE4E4] text-[#E55353] border border-[#E55353]/30 cursor-pointer"
            title="Sair da sala"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================================
          PHASE 1: LOBBY (WAITING ROOM & MATCH SETUP)
         ======================================================================== */}
      {roomState.status === 'LOBBY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Players Grid */}
          <div className="lg:col-span-5 party-card rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#E5E8F0] pb-3.5">
              <div>
                <h2 className="text-lg font-bold text-[#202435] font-display">
                  Jogadores na Sala
                </h2>
                <p className="text-xs text-[#687086]">
                  Convide seus amigos com o código{' '}
                  <strong className="font-mono text-[#202435]">#{roomState.joinCode}</strong>
                </p>
              </div>
              <span className="font-mono text-xs font-semibold text-[#687086]">
                {roomState.players.filter((p) => p.connectionStatus === 'connected').length}/
                {roomState.settings.maxPlayers} conectados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {roomState.players.map((p) => {
                const avMeta = AVATAR_LIST[Math.abs(p.avatarId || 0) % AVATAR_LIST.length];
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 border transition-colors ${
                      p.id === playerId
                        ? 'bg-[#FFF8EB] border-[#FF9F1C]'
                        : 'bg-[#F5F6FA] border-[#E5E8F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarSvg avatarId={p.avatarId} size={42} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-[#202435] truncate">
                          <span className="truncate">{p.nickname}</span>
                          {p.id === playerId && (
                            <span className="text-[11px] font-semibold text-[#687086] shrink-0">
                              (Você)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#687086] flex items-center gap-1 truncate">
                          <span className="truncate">{avMeta.label}</span>
                          <span aria-hidden="true">·</span>
                          {p.isHost ? (
                            <span className="inline-flex items-center gap-1 text-[#B86800] font-bold shrink-0">
                              <Crown className="w-3 h-3 fill-[#FF9F1C] text-[#FF9F1C]" />
                              Anfitrião
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
                        className="p-1.5 rounded-xl text-[#E55353] hover:bg-[#FDF2F2] transition-colors cursor-pointer shrink-0"
                        title={`Remover ${p.nickname}`}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3.5 border-t border-[#E5E8F0] flex flex-col gap-3">
              {roomState.players.length < 2 && (
                <div className="text-xs text-[#202435] bg-[#FFF8EB] border border-[#FF9F1C]/40 rounded-xl p-3 leading-relaxed">
                  Convide amigos com o código <strong className="font-mono">#{roomState.joinCode}</strong>, clique em <strong>Começar Partida</strong> ou ative o modo <strong>Tela Dupla</strong> no topo para testar 2 jogadores ao mesmo tempo.
                </div>
              )}

              {isHost ? (
                <button
                  type="button"
                  onClick={() => sendWs('game:start')}
                  className="party-btn-yellow w-full py-3.5 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-[#202435]" />
                  <span>Começar Partida Agora</span>
                </button>
              ) : (
                <div className="w-full py-3.5 px-4 rounded-xl bg-[#F5F6FA] border border-[#E5E8F0] text-center text-xs text-[#687086] font-semibold">
                  Aguardando o anfitrião iniciar a partida...
                </div>
              )}
            </div>
          </div>

          {/* Right: Room Configuration */}
          <div className="lg:col-span-7 party-card rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E8F0] pb-3.5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#FF9F1C]" />
                <h2 className="text-lg font-bold text-[#202435] font-display">
                  Regras da Partida
                </h2>
              </div>
              <span className="text-xs font-medium text-[#687086]">
                {isHost ? 'Você pode ajustar as regras' : 'Definido pelo anfitrião'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#202435] mb-1.5">
                  Nome da Sala (Personalizado)
                </label>
                <input
                  type="text"
                  disabled={!isHost}
                  value={isHost ? lobbyRoomName : roomState.settings.roomName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLobbyRoomName(val);
                    if (val.trim().length > 0) {
                      handleUpdateSetting('roomName', val);
                    }
                  }}
                  onBlur={() => {
                    const clean = lobbyRoomName.trim() || `Sala de ${nickname.trim() || 'Jogo'}`;
                    setLobbyRoomName(clean);
                    handleUpdateSetting('roomName', clean);
                  }}
                  placeholder="Digite o nome que quiser para a sala..."
                  maxLength={45}
                  className="w-full senaiphone-input disabled:opacity-60 rounded-xl px-3.5 py-2 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202435] mb-1.5">
                  Limite de Jogadores (Suporta até 35)
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.maxPlayers}
                  onChange={(e) => handleUpdateSetting('maxPlayers', Number(e.target.value))}
                  className="w-full senaiphone-input disabled:opacity-60 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  <option value={8}>Até 8 jogadores</option>
                  <option value={12}>Até 12 jogadores</option>
                  <option value={16}>Até 16 jogadores</option>
                  <option value={24}>Até 24 jogadores</option>
                  <option value={32}>Até 32 jogadores</option>
                  <option value={35}>Até 35 jogadores (Capacidade Máxima)</option>
                </select>
              </div>

              <div className="sm:col-span-2 bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-4 flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-[#202435]">
                    Tempo de Desenho (Personalizado em Segundos — de 10s a 600s)
                  </label>
                  <span className="text-xs font-mono font-semibold text-[#687086]">
                    Atual: {roomState.settings.roundDuration} segundos
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={10}
                      max={600}
                      disabled={!isHost}
                      value={lobbyDurationStr}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setLobbyDurationStr(raw);
                        const num = parseInt(raw, 10);
                        if (Number.isFinite(num) && num >= 10 && num <= 600) {
                          handleUpdateSetting('roundDuration', num);
                        }
                      }}
                      onBlur={() => {
                        const num = parseInt(lobbyDurationStr, 10);
                        const clamped = Number.isFinite(num)
                          ? Math.max(10, Math.min(600, num))
                          : 60;
                        setLobbyDurationStr(String(clamped));
                        handleUpdateSetting('roundDuration', clamped);
                      }}
                      placeholder="Ex: 75"
                      className="w-28 bg-white border border-[#E5E8F0] focus:border-[#FF9F1C] disabled:opacity-60 rounded-xl px-3 py-1.5 text-sm font-mono font-bold text-[#202435] focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-[#687086]">segundos</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    {[30, 45, 60, 90, 120, 180].map((presetSec) => {
                      const isCurrent = roomState.settings.roundDuration === presetSec;
                      return (
                        <button
                          key={presetSec}
                          type="button"
                          disabled={!isHost}
                          onClick={() => {
                            setLobbyDurationStr(String(presetSec));
                            handleUpdateSetting('roundDuration', presetSec);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer disabled:opacity-50 ${
                            isCurrent
                              ? 'bg-[#FF9F1C] border-[#F08C00] text-[#202435]'
                              : 'bg-white border-[#E5E8F0] text-[#687086] hover:text-[#202435] hover:border-[#D0D5E2]'
                          }`}
                        >
                          {presetSec}s
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202435] mb-1.5">
                  Rodadas por Jogador
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.roundsPerPlayer}
                  onChange={(e) =>
                    handleUpdateSetting('roundsPerPlayer', Number(e.target.value) as 1 | 2 | 3)
                  }
                  className="w-full senaiphone-input disabled:opacity-60 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  <option value={1}>1 vez cada jogador</option>
                  <option value={2}>2 vezes cada jogador</option>
                  <option value={3}>3 vezes cada jogador</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202435] mb-1.5">
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
                  className="w-full senaiphone-input disabled:opacity-60 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  <option value="drawer_chooses">Desenhista da vez escolhe</option>
                  <option value="host_chooses">Anfitrião da sala escolhe</option>
                  <option value="random">Sorteio automático</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202435] mb-1.5">
                  Dificuldade das Palavras
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.difficulty}
                  onChange={(e) =>
                    handleUpdateSetting('difficulty', e.target.value as 'easy' | 'medium' | 'mixed')
                  }
                  className="w-full senaiphone-input disabled:opacity-60 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  <option value="easy">Fácil</option>
                  <option value="medium">Médio</option>
                  <option value="mixed">Misto (Fácil + Médio)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202435] mb-1.5">
                  Modo de Pontuação
                </label>
                <select
                  disabled={!isHost}
                  value={roomState.settings.scoringMode}
                  onChange={(e) =>
                    handleUpdateSetting('scoringMode', e.target.value as 'competitive' | 'casual')
                  }
                  className="w-full senaiphone-input disabled:opacity-60 rounded-xl px-3.5 py-2 text-sm font-semibold"
                >
                  <option value="competitive">Competitivo com Ranking</option>
                  <option value="casual">Casual e Descontraído</option>
                </select>
              </div>
            </div>

            <div className="pt-3.5 border-t border-[#E5E8F0] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-[#202435] cursor-pointer bg-[#F5F6FA] p-3 rounded-xl border border-[#E5E8F0]">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.endWhenAllGuessed}
                  onChange={(e) => handleUpdateSetting('endWhenAllGuessed', e.target.checked)}
                  className="rounded accent-[#FF9F1C] w-4 h-4"
                />
                <span>Avançar se todos acertarem</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-[#202435] cursor-pointer bg-[#F5F6FA] p-3 rounded-xl border border-[#E5E8F0]">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.allowEarlyFinish}
                  onChange={(e) => handleUpdateSetting('allowEarlyFinish', e.target.checked)}
                  className="rounded accent-[#FF9F1C] w-4 h-4"
                />
                <span>Permitir concluir desenho</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-[#202435] cursor-pointer bg-[#F5F6FA] p-3 rounded-xl border border-[#E5E8F0]">
                <input
                  type="checkbox"
                  disabled={!isHost}
                  checked={roomState.settings.chatEnabled}
                  onChange={(e) => handleUpdateSetting('chatEnabled', e.target.checked)}
                  className="rounded accent-[#FF9F1C] w-4 h-4"
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
        <div className="party-card rounded-2xl p-7 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="text-center max-w-xl mx-auto">
            <p className="text-xs font-semibold text-[#687086] mb-1">
              Rodada {round.roundNumber} de {round.totalRounds} · Desenhista da Vez: <strong className="text-[#202435]">{round.drawerNickname}</strong>
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202435] mb-2 font-display">
              {(roomState.settings.themeMode === 'host_chooses' ? isHost : isDrawer)
                ? 'Escolha o Tema desta Rodada'
                : `Aguardando ${
                    roomState.settings.themeMode === 'host_chooses'
                      ? 'o anfitrião da sala'
                      : round.drawerNickname
                  } escolher o tema...`}
            </h2>
            <p className="text-sm text-[#687086]">
              Selecione uma categoria abaixo para sortear a palavra secreta da rodada.
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
                      className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                        isSelected
                          ? 'bg-[#FFF8EB] border-[#FF9F1C] ring-2 ring-[#FF9F1C]/25 -translate-y-0.5 shadow-sm'
                          : canSelect
                          ? 'bg-[#F5F6FA] border-[#E5E8F0] hover:border-[#D0D5E2] hover:bg-white cursor-pointer'
                          : 'bg-[#F5F6FA] border-[#E5E8F0] opacity-75 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`p-3 rounded-xl border ${
                            isSelected
                              ? 'bg-[#FF9F1C] text-[#202435] border-[#F08C00]'
                              : 'bg-white text-[#687086] border-[#E5E8F0]'
                          }`}
                        >
                          <ThemeIcon iconName={theme.iconName} className="w-6 h-6" />
                        </div>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#16A879]">
                            <CheckCircle2 className="w-4 h-4" />
                            Selecionado
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-lg font-bold text-[#202435] mb-1 font-display">
                          {theme.name}
                        </div>
                        <p className="text-xs text-[#687086] leading-relaxed">
                          {theme.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(roomState.settings.themeMode === 'host_chooses' ? isHost : isDrawer) && (
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E8F0]">
                  <button
                    type="button"
                    disabled={!selectedThemeCard}
                    onClick={() => {
                      if (selectedThemeCard) {
                        sendWs('theme:select', { themeId: selectedThemeCard });
                      }
                    }}
                    className="party-btn-yellow px-7 py-3 rounded-xl disabled:opacity-40 disabled:pointer-events-none font-bold text-sm whitespace-nowrap cursor-pointer"
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
        <div className="party-card rounded-2xl p-8 max-w-2xl mx-auto w-full text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-[#FFF6E5] border border-[#FF9F1C]/40 text-[#FF9F1C]">
            <Sparkles className="w-8 h-8" />
          </div>
          <p className="text-xs font-semibold text-[#687086]">
            Tema: <span className="text-[#202435] font-bold">{round.themeName}</span> ·{' '}
            <span className="font-mono">{round.wordLetterCount} letras</span>
          </p>

          {isDrawer && privateWord ? (
            <>
              <h2 className="text-lg font-bold text-[#687086]">
                Prepare o pincel! Sua palavra secreta é:
              </h2>
              <div className="px-8 py-4 rounded-2xl bg-[#FFF8EB] border-2 border-[#FF9F1C] text-3xl sm:text-4xl font-bold text-[#202435] tracking-wide font-display">
                {privateWord.word}
              </div>
              <p className="text-xs text-[#687086] max-w-md">
                Use o pincel livre e as formas geométricas para ilustrar a palavra sem escrever letras!
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#202435] font-display">
                {round.drawerNickname} vai começar a desenhar!
              </h2>
              <p className="text-sm text-[#687086] max-w-md">
                Fique de olho na tela! A palavra sorteada possui{' '}
                <strong className="text-[#202435]">{round.wordLetterCount} letras</strong> no tema{' '}
                <strong className="text-[#202435]">{round.themeName}</strong>.
              </p>
            </>
          )}
        </div>
      )}

      {/* ========================================================================
          PHASE 4: MAIN DRAWING & GUESSING ARENA (CLEAN & EXPANDED CANVAS)
         ======================================================================== */}
      {(roomState.status === 'DRAWING' || roomState.status === 'PAUSED') && round && (
        <div className="flex flex-col gap-3">
          {/* Mobile Quick Switcher */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMobilePanel((p) => (p === 'players' ? 'none' : 'players'))
              }
              className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E5E8F0] text-xs font-bold text-[#202435] flex items-center justify-center gap-1.5"
            >
              <Users className="w-4 h-4 text-[#FF9F1C]" />
              <span>Jogadores ({roomState.players.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobilePanel((p) => (p === 'feed' ? 'none' : 'feed'))}
              className="flex-1 py-2 px-3 rounded-xl bg-white border border-[#E5E8F0] text-xs font-bold text-[#202435] flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4 text-[#16A879]" />
              <span>Chat ({roomState.feed.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* MAIN EXPANDED DRAWING BOARD (9 COLS — 75% OF SCREEN WIDTH) */}
            <div className="lg:col-span-9 flex flex-col gap-2.5">
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
                <div className="party-card rounded-2xl p-3 flex flex-col gap-1.5">
                  {me?.hasGuessedThisRound ? (
                    <div className="flex items-center justify-between gap-2 bg-[#E8F8F2] border border-[#16A879]/40 text-[#11845E] px-4 py-2.5 rounded-xl text-sm font-bold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#16A879] shrink-0" />
                        <span>Você acertou a palavra!</span>
                      </div>
                      {roomState.settings.scoringMode === 'competitive' && (
                        <span className="font-mono text-xs font-bold text-[#11845E]">
                          +{me.roundPointsEarned} pts
                        </span>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitGuess} className="flex items-center gap-2.5">
                      <input
                        type="text"
                        value={guessText}
                        onChange={(e) => setGuessText(e.target.value)}
                        disabled={roomState.status !== 'DRAWING'}
                        maxLength={80}
                        placeholder={`Digite seu palpite (${round.wordLetterCount} letras)...`}
                        aria-label="Digite seu palpite"
                        className="flex-1 senaiphone-input rounded-xl px-3.5 py-2.5 text-sm font-semibold"
                      />
                      <button
                        type="submit"
                        disabled={roomState.status !== 'DRAWING' || !guessText.trim()}
                        className="party-btn-emerald px-5 py-2.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none font-bold text-sm flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        <span>Chutar</span>
                      </button>
                    </form>
                  )}

                  {privateGuessFeedback && !me?.hasGuessedThisRound && (
                    <div role="status" className="text-xs text-[#E55353] font-bold px-1">
                      {privateGuessFeedback.text}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR (3 COLS): Compact Players Ranking + Chat */}
            <div className="lg:col-span-3 flex flex-col gap-3.5">
              {/* Compact Players List */}
              <div
                className={`${
                  mobilePanel === 'players' ? 'flex' : 'hidden lg:flex'
                } party-card rounded-2xl p-3.5 flex-col gap-2.5`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E8F0]">
                  <span className="text-xs font-bold text-[#202435]">
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
                          className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl border ${
                            p.hasGuessedThisRound
                              ? 'bg-[#E8F8F2] border-[#16A879]/40'
                              : isCurrentDrawer
                              ? 'bg-[#FFF8EB] border-[#FF9F1C]/50'
                              : 'bg-[#F5F6FA] border-[#E5E8F0]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[11px] font-bold text-[#687086] w-3.5 text-center shrink-0">
                              {idx + 1}
                            </span>
                            <AvatarSvg avatarId={p.avatarId} size={32} />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#202435] truncate">
                                {p.nickname}
                              </div>
                              <div className="text-[10px] font-medium text-[#687086]">
                                {isCurrentDrawer
                                  ? `Desenhando (+${round.drawerPointsPerPerson ?? 0} pts/acerto)`
                                  : p.hasGuessedThisRound
                                  ? `Acertou (${p.guessOrder}º · +${p.roundPointsEarned} pts)`
                                  : 'Adivinhando'}
                              </div>
                            </div>
                          </div>

                          <div className="font-mono text-xs font-bold text-[#202435] shrink-0">
                            {p.score} pts
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Clean Live Feed & Chat */}
              <div
                className={`${
                  mobilePanel === 'feed' ? 'flex' : 'hidden lg:flex'
                } party-card rounded-2xl p-3.5 flex-col gap-2.5`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E8F0]">
                  <span className="text-xs font-bold text-[#202435]">Palpites &amp; Chat</span>
                </div>

                <div
                  className="flex flex-col gap-1.5 max-h-[250px] min-h-[170px] overflow-y-auto pr-1 text-xs"
                  aria-live="polite"
                >
                  {roomState.feed.slice(-14).map((msg) => (
                    <div
                      key={msg.id}
                      className={`px-3 py-2 rounded-xl border leading-snug ${
                        msg.type === 'correct_guess'
                          ? 'bg-[#E8F8F2] border-[#16A879]/40 text-[#11845E] font-bold'
                          : msg.type === 'hint'
                          ? 'bg-[#FFF8EB] border-[#FF9F1C]/40 text-[#B86800] font-bold'
                          : msg.type === 'chat'
                          ? 'bg-[#F5F6FA] border-[#E5E8F0] text-[#202435]'
                          : 'bg-white border-[#E5E8F0] text-[#687086]'
                      }`}
                    >
                      {msg.type === 'chat' && msg.playerNickname ? (
                        <>
                          <strong className="font-bold text-[#202435]">
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
                    className="flex items-center gap-1.5 pt-2 border-t border-[#E5E8F0]"
                  >
                    <input
                      type="text"
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      placeholder="Conversar no chat..."
                      maxLength={100}
                      className="flex-1 senaiphone-input rounded-xl px-3 py-1.5 text-xs font-medium"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl bg-[#202435] hover:bg-[#2E344B] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
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
        <div className="party-card rounded-2xl p-7 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E8F0] pb-4">
            <div>
              <p className="text-xs font-semibold text-[#687086] mb-1">
                Fim da Rodada {round.roundNumber} de {round.totalRounds} · Tema: {round.themeName}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202435] font-display">
                A palavra secreta era:{' '}
                <span className="text-[#16A879] underline decoration-[#FF9F1C] underline-offset-4">
                  {round.revealedWord ?? '---'}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-[#687086]">
                Próxima rodada em {remainingSeconds}s
              </span>
              {isHost && roomState.status === 'ROUND_RESULT' && (
                <button
                  type="button"
                  onClick={() => sendWs('round:next_now')}
                  className="party-btn-yellow px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer"
                >
                  Próxima Rodada Agora
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-6 flex flex-col gap-2">
              <span className="text-xs font-bold text-[#202435]">
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
              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-4 flex flex-col gap-2">
                <div className="text-xs font-semibold text-[#687086] flex items-center justify-between">
                  <span>Resumo do Turno</span>
                  <span>Dicas usadas: {round.hintsUsed}</span>
                </div>
                <div className="text-base font-bold text-[#202435] font-display">
                  {round.correctGuessesOrder.length === 0
                    ? 'Ninguém descobriu a tempo nesta rodada!'
                    : `${round.correctGuessesOrder.length} de ${round.eligibleGuessersCount} jogadores acertaram!`}
                </div>
                <div className="text-xs font-bold text-[#B86800] bg-[#FFF8EB] border border-[#FF9F1C]/40 rounded-xl px-3 py-2 font-mono">
                  Desenhista ({round.drawerNickname}): +{round.drawerPointsEarned ?? 0} pts (
                  {round.correctGuessesOrder.length} acertos × {round.drawerPointsPerPerson ?? 0}{' '}
                  pts/pessoa)
                </div>
              </div>

              {round.correctGuessesOrder.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-[#202435]">
                    Quem Acertou Mais Rápido
                  </span>
                  {round.correctGuessesOrder.map((rec) => (
                    <div
                      key={rec.playerId}
                      className="flex items-center justify-between bg-[#E8F8F2] border border-[#16A879]/40 rounded-xl px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#11845E]">
                          {rec.order}º
                        </span>
                        <AvatarSvg avatarId={rec.avatarId} size={34} />
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#202435]">
                            {rec.nickname}
                          </span>
                          {typeof rec.responseTimeSec === 'number' && (
                            <span className="text-xs font-mono font-semibold text-[#11845E]">
                              ({rec.responseTimeSec}s)
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#11845E]">
                        +{rec.pointsAwarded} pts
                      </span>
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
        <div className="party-card rounded-2xl p-7 max-w-4xl mx-auto w-full flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E8F0] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FFF6E5] border border-[#FF9F1C]/40 text-[#FF9F1C]">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#687086]">
                  Fim de Jogo · Parabéns a todos os participantes!
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#202435] font-display">
                  Pódio dos Campeões
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopyMatchSummary}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F5F6FA] hover:bg-[#EBEEF5] text-[#202435] border border-[#E5E8F0] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                {copiedSummary ? (
                  <>
                    <Check className="w-4 h-4 text-[#16A879]" />
                    <span>Placar Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-[#687086]" />
                    <span>Copiar Placar</span>
                  </>
                )}
              </button>

              {isHost && (
                <>
                  <button
                    type="button"
                    onClick={() => sendWs('game:return_lobby')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F5F6FA] hover:bg-[#EBEEF5] text-[#202435] border border-[#E5E8F0] text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Voltar ao Lobby</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => sendWs('game:start')}
                    className="party-btn-yellow flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-[#202435]" />
                    <span>Jogar Novamente</span>
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
                  className={`rounded-2xl p-5 border flex flex-col items-center text-center gap-2 ${
                    idx === 0
                      ? 'bg-[#FFF8EB] border-[#FF9F1C] ring-2 ring-[#FF9F1C]/20'
                      : 'bg-[#F5F6FA] border-[#E5E8F0]'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-bold text-[#202435]">
                    <Medal className="w-4 h-4 text-[#FF9F1C]" />
                    <span>{idx + 1}º Lugar</span>
                  </div>
                  <AvatarSvg avatarId={p.avatarId} size={64} />
                  <div className="font-bold text-base text-[#202435] font-display truncate max-w-full">
                    {p.nickname}
                  </div>
                  <div className="font-mono text-sm font-bold text-[#16A879]">
                    {p.score} pontos
                  </div>
                </div>
              ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E8F0] text-xs font-semibold text-[#687086]">
                  <th className="py-3 px-4">Posição</th>
                  <th className="py-3 px-4">Jogador</th>
                  <th className="py-3 px-4 text-right">Acertos</th>
                  <th className="py-3 px-4 text-right">Desenhos</th>
                  <th className="py-3 px-4 text-right">Pontuação Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E8F0] text-sm">
                {[...roomState.players]
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <tr key={p.id} className="hover:bg-[#F5F6FA]">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#202435]">
                        <span className="inline-flex items-center gap-1.5">
                          {idx === 0 && <Crown className="w-4 h-4 text-[#FF9F1C] fill-[#FF9F1C]" />}
                          {idx + 1}º
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarSvg avatarId={p.avatarId} size={40} />
                          <div>
                            <div className="font-bold text-[#202435]">
                              {p.nickname} {p.id === playerId && '(Você)'}
                            </div>
                            <div className="text-xs text-[#687086]">
                              {AVATAR_LIST[Math.abs(p.avatarId || 0) % AVATAR_LIST.length].label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#202435]">
                        {p.totalCorrectGuesses}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#202435]">
                        {p.timesDrawn}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#16A879]">
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
