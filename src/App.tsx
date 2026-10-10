import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Music, X, Columns2, CheckCircle2, Palette } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col text-indigo-950">
      {/* Party Game Top Bar */}
      <header className="flex items-center justify-between gap-6 px-5 sm:px-8 py-3 bg-indigo-950/85 backdrop-blur-md border-b-2 border-indigo-400/30 sticky top-0 z-30 shadow-md">
        {/* Zone 1: Expressive Game Logo & Wordmark */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 font-display group"
        >
          <span className="w-9 h-9 rounded-xl bg-amber-400 border-2 border-amber-200 flex items-center justify-center text-indigo-950 shadow-sm group-hover:rotate-6 transition-transform">
            <Palette className="w-5 h-5 stroke-[2.5]" />
          </span>
          <span>
            SENAI <span className="text-amber-300">Phone</span>
          </span>
        </a>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-indigo-100">
          <button
            type="button"
            onClick={() => {
              setShowRulesModal(false);
              setShowAudioModal(false);
            }}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sala de Jogo
          </button>
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Como Jogar
          </button>
          <button
            type="button"
            onClick={() =>
              setModerationModalCtx((prev) => ({ ...prev, isOpen: true }))
            }
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Catálogo de Palavras
          </button>
          <button
            type="button"
            onClick={() => setShowAudioModal(true)}
            className="hover:text-amber-300 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Áudio &amp; Som
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setSplitScreenMode((prev) => !prev)}
            className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              splitScreenMode
                ? 'game-btn-emerald'
                : 'game-btn-amber'
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
            <div className="border-3 border-indigo-300/70 rounded-3xl bg-indigo-950/35 overflow-hidden shadow-xl">
              <div className="bg-indigo-900/90 px-4 py-2 border-b border-indigo-400/30 flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-300">
                  Jogador #1 (Anfitrião / Tela Principal)
                </span>
                <span className="text-indigo-200 font-medium">Conectado via WebSocket</span>
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

            <div className="border-3 border-indigo-300/70 rounded-3xl bg-indigo-950/35 overflow-hidden shadow-xl">
              <div className="bg-indigo-900/90 px-4 py-2 border-b border-indigo-400/30 flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-300">
                  Jogador #2 (Convidado em Tempo Real)
                </span>
                <span className="text-indigo-200 font-medium">
                  {activeJoinCode
                    ? `Conectado à sala #${activeJoinCode}`
                    : 'Crie uma sala no Jogador #1 para conectar'}
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
          className="fixed inset-0 z-50 bg-indigo-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-title"
        >
          <div className="game-panel rounded-3xl max-w-2xl w-full p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b-2 border-indigo-100 pb-3">
              <h2 id="rules-title" className="text-xl font-extrabold text-indigo-950 font-display">
                Como Jogar — SENAI Phone
              </h2>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-xl text-indigo-500 hover:text-indigo-950 hover:bg-indigo-50 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-indigo-950 font-display">01. Mais de 80 Temas Sem Repetir</h3>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  A cada rodada, o <strong>Desenhista</strong> escolhe entre 80+ temas diferentes. Os temas jogados não se repetem nas rodadas seguintes!
                </p>
              </div>

              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-indigo-950 font-display">02. Pincel Livre &amp; Formas</h3>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Use o pincel colorido ou adicione formas geométricas redimensionáveis na folha. Os outros jogadores tentam adivinhar em tempo real!
                </p>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-indigo-950 font-display">03. Dicas de Letras</h3>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Apenas quem está desenhando pode clicar nas letras ou no botão <strong>Revelar Letra</strong> para dar dicas, enquanto os adivinhadores observam as letras reveladas!
                </p>
              </div>

              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-indigo-950 font-display">04. Velocidade &amp; Pontos por Pessoa</h3>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Quanto mais rápido você acertar, mais pontos ganha (até 160 pts); perto do fim do tempo ganha menos. O desenhista ganha pontos <strong>por cada pessoa que acertar</strong>, ajustados pelo tamanho da sala!
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t-2 border-indigo-100">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="game-btn-amber px-6 py-2.5 rounded-xl font-extrabold text-sm cursor-pointer"
              >
                Entendi, Vamos Jogar!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Settings Modal */}
      {showAudioModal && (
        <div
          className="fixed inset-0 z-50 bg-indigo-950/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-title"
        >
          <div className="game-panel rounded-3xl max-w-md w-full p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b-2 border-indigo-100 pb-3">
              <h2 id="audio-title" className="text-xl font-extrabold text-indigo-950 font-display">
                Áudio &amp; Efeitos Sonoros
              </h2>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                className="p-2 rounded-xl text-indigo-500 hover:text-indigo-950 hover:bg-indigo-50 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between bg-indigo-50/80 border-2 border-indigo-100 rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  {sfxEnabled ? (
                    <Volume2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <div className="text-sm font-extrabold text-indigo-950">Efeitos Sonoros</div>
                    <div className="text-xs text-indigo-800/75">
                      Sons de rodada, acertos, dicas e relógio
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSfx}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                    sfxEnabled
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {sfxEnabled ? 'Ligado' : 'Mudo'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-indigo-50/80 border-2 border-indigo-100 rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <Music className={`w-5 h-5 ${musicEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-extrabold text-indigo-950">Trilha Ambiente</div>
                    <div className="text-xs text-indigo-800/75">
                      Notas musicais suaves durante a partida
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMusic}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                    musicEnabled
                      ? 'bg-emerald-500 text-white shadow-2xs'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {musicEnabled ? 'Ligada' : 'Muda'}
                </button>
              </div>

              <div className="bg-indigo-50/80 border-2 border-indigo-100 rounded-2xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-indigo-950">
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
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="text-xs text-indigo-900/75 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Todos os avisos visuais funcionam com ou sem som.</span>
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
