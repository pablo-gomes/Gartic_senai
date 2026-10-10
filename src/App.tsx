import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Music, X, Columns2, CheckCircle2 } from 'lucide-react';
import { GameClientView } from './components/GameClientView';
import { CatalogModerationModal } from './components/CatalogModerationModal';
import { soundManager } from './utils/sound';
import { RoomPublicState } from './shared/types';

export default function App() {
  const [urlRoomCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    return code ? code.trim().toUpperCase() : null;
  });

  const [activeJoinCode, setActiveJoinCode] = useState<string | null>(urlRoomCode);
  const [splitScreenMode, setSplitScreenMode] = useState<boolean>(false);

  // Modals
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [moderationModalCtx, setModerationModalCtx] = useState<{
    isOpen: boolean;
    roomId: string;
    reporterId: string;
    players: RoomPublicState['players'];
  }>({
    isOpen: false,
    roomId: 'lobby',
    reporterId: 'host',
    players: [],
  });

  // Audio settings state
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(soundManager.sfxEnabled);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(soundManager.musicEnabled);
  const [volume, setVolume] = useState<number>(soundManager.volume);

  useEffect(() => {
    soundManager.volume = volume;
  }, [volume]);

  const handleToggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    soundManager.setSfxEnabled(next);
  };

  const handleToggleMusic = () => {
    const next = !musicEnabled;
    setMusicEnabled(next);
    soundManager.setMusicEnabled(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-[#F8FAFC]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-slate-950/90 sticky top-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/"
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 font-display"
        >
          Traço & Tema
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => {
              setShowRulesModal(false);
              setShowAudioModal(false);
            }}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sala de Jogo
          </button>
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Como Jogar
          </button>
          <button
            type="button"
            onClick={() =>
              setModerationModalCtx((prev) => ({ ...prev, isOpen: true }))
            }
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Catálogo
          </button>
          <button
            type="button"
            onClick={() => setShowAudioModal(true)}
            className="hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Opções de Áudio
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSplitScreenMode((prev) => !prev)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              splitScreenMode
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
            title="Abre um 2º cliente multiplayer via WebSocket ao lado para testar Desenhista e Adivinhador na mesma tela"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>
              {splitScreenMode ? 'Fechar Tela Dupla' : 'Tela Dupla (2 Jogadores)'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col">
        {splitScreenMode ? (
          <div className="w-full max-w-[1600px] mx-auto px-3 py-3 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            <div className="border border-slate-800 rounded-2xl bg-slate-950/50 overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-amber-400">
                  Cliente WebSocket #1 (Jogador Principal)
                </span>
                <span className="text-slate-400">Sessão independente</span>
              </div>
              <GameClientView
                clientSlotId="p1"
                defaultNickname="ArtistaSolar"
                defaultAvatarId={0}
                autoJoinCode={urlRoomCode}
                onRoomJoined={(code) => setActiveJoinCode(code)}
                onOpenModerationModal={(ctx) =>
                  setModerationModalCtx({ isOpen: true, ...ctx })
                }
                isSplitScreenChild={true}
              />
            </div>

            <div className="border border-slate-800 rounded-2xl bg-slate-950/50 overflow-hidden">
              <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">
                  Cliente WebSocket #2 (Convidado em Tempo Real)
                </span>
                <span className="text-slate-400">
                  {activeJoinCode
                    ? `Conectado à sala #${activeJoinCode}`
                    : 'Crie uma sala no Cliente #1 para conectar'}
                </span>
              </div>
              <GameClientView
                clientSlotId="p2"
                defaultNickname="MestreDosPalpites"
                defaultAvatarId={1}
                autoJoinCode={activeJoinCode}
                onOpenModerationModal={(ctx) =>
                  setModerationModalCtx({ isOpen: true, ...ctx })
                }
                isSplitScreenChild={true}
              />
            </div>
          </div>
        ) : (
          <GameClientView
            clientSlotId="p1"
            defaultNickname="ArtistaSolar"
            defaultAvatarId={0}
            autoJoinCode={urlRoomCode}
            onRoomJoined={(code) => setActiveJoinCode(code)}
            onOpenModerationModal={(ctx) =>
              setModerationModalCtx({ isOpen: true, ...ctx })
            }
          />
        )}
      </main>

      {/* Rules / How to Play Modal */}
      {showRulesModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 id="rules-title" className="text-lg font-bold text-white">
                Como Jogar — Traço & Tema
              </h2>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <h3 className="font-bold text-white">01. Escolha de Tema e Palavra</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  A cada rodada, um jogador assume o papel de <strong>Desenhista</strong>, escolhe um tema e recebe uma palavra secreta exclusiva. Os demais jogadores veem apenas o tema público.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <h3 className="font-bold text-white">02. Desenho e Palpites Simultâneos</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enquanto o desenhista ilustra a ideia no canvas sincronizado, os adivinhadores enviam palpites. Palpites incorretos são privados para não entregar respostas aos demais.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <h3 className="font-bold text-white">03. Dicas Progressivas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  O desenhista pode liberar até 3 dicas (contextuais, em níveis ou revelação de letras) com intervalo mínimo de 5 segundos para ajudar a sala.
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
                <h3 className="font-bold text-white">04. Pontuação Competitiva ou Casual</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No modo competitivo: 1º acerto ganha 100 pts, 2º 80 pts, 3º 60 pts e demais 40 pts. O desenhista ganha 50 pts (+15 bônus se a maioria acertar), menos 10 pts por dica usada.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Entendi, Vamos Jogar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Settings Modal (Section 12.2 & 16.5) */}
      {showAudioModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-title"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 flex flex-col gap-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 id="audio-title" className="text-lg font-bold text-white">
                Configurações de Áudio
              </h2>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  {sfxEnabled ? (
                    <Volume2 className="w-5 h-5 text-amber-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-500" />
                  )}
                  <div>
                    <div className="text-sm font-semibold text-white">Efeitos Sonoros</div>
                    <div className="text-xs text-slate-400">
                      Início de rodada, acertos, dicas e últimos segundos
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSfx}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    sfxEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {sfxEnabled ? 'Ativado' : 'Desativado'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <Music className={`w-5 h-5 ${musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-sm font-semibold text-white">Trilha Ambiente Suave</div>
                    <div className="text-xs text-slate-400">
                      Notas sintetizadas discretas de fundo
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMusic}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    musicEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {musicEnabled ? 'Ativada' : 'Desativada'}
                </button>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Volume Geral</span>
                  <span className="font-mono tabular-nums">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>O jogo funciona integralmente com ou sem áudio ativado.</span>
            </div>
          </div>
        </div>
      )}

      {/* Catalog & Moderation Modal */}
      <CatalogModerationModal
        isOpen={moderationModalCtx.isOpen}
        onClose={() =>
          setModerationModalCtx((prev) => ({ ...prev, isOpen: false }))
        }
        roomId={moderationModalCtx.roomId}
        reporterId={moderationModalCtx.reporterId}
        players={moderationModalCtx.players}
      />
    </div>
  );
}
