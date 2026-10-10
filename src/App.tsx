import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Music, X, Columns2, CheckCircle2, Palette } from 'lucide-react';
import { GameClientView } from './components/GameClientView';
import { CatalogModerationModal } from './components/CatalogModerationModal';
import { soundManager, MUSIC_STYLES, MusicStyleId } from './utils/sound';
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

  // Audio settings state synced with soundManager
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(soundManager.sfxEnabled);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(soundManager.musicEnabled);
  const [musicStyle, setMusicStyle] = useState<MusicStyleId>(soundManager.musicStyle);
  const [volume, setVolume] = useState<number>(soundManager.volume);

  useEffect(() => {
    return soundManager.subscribe(() => {
      setSfxEnabled(soundManager.sfxEnabled);
      setMusicEnabled(soundManager.musicEnabled);
      setMusicStyle(soundManager.musicStyle);
      setVolume(soundManager.volume);
    });
  }, []);

  const handleToggleSfx = () => {
    soundManager.setSfxEnabled(!sfxEnabled);
  };

  const handleToggleMusic = () => {
    soundManager.toggleMusic();
  };

  const handleSelectMusicStyle = (style: MusicStyleId) => {
    soundManager.setMusicStyle(style);
    if (!soundManager.musicEnabled) {
      soundManager.setMusicEnabled(true);
    }
  };

  const handleVolumeChange = (val: number) => {
    soundManager.setVolume(val);
  };

  return (
    <div className="min-h-screen flex flex-col text-slate-100">
      {/* Modern Game Top Bar */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-8 py-3 bg-slate-950/80 backdrop-blur-xl border-b border-indigo-500/20 sticky top-0 z-30 shadow-2xl">
        {/* Zone 1: Game Logo & Wordmark */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 font-display group"
        >
          <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 border border-amber-200/60 flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform">
            <Palette className="w-5 h-5 stroke-[2.5]" />
          </span>
          <span className="flex items-center gap-1">
            <span className="text-white font-extrabold">SENAI</span>
            <span className="text-amber-400 font-extrabold">Phone</span>
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-300">
          <button
            type="button"
            onClick={() => {
              setShowRulesModal(false);
              setShowAudioModal(false);
            }}
            className="px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Sala de Jogo
          </button>
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-3 py-1.5 rounded-lg hover:text-amber-400 hover:bg-white/5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Como Jogar
          </button>
          <button
            type="button"
            onClick={() =>
              setModerationModalCtx((prev) => ({ ...prev, isOpen: true }))
            }
            className="px-3 py-1.5 rounded-lg hover:text-amber-400 hover:bg-white/5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Catálogo de Palavras
          </button>
          <button
            type="button"
            onClick={() => setShowAudioModal(true)}
            className="px-3 py-1.5 rounded-lg hover:text-amber-400 hover:bg-white/5 transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Opções de Áudio
          </button>
        </nav>

        {/* Zone 3: Quick Music Toggle + Split Screen Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleMusic}
            aria-pressed={musicEnabled}
            title={
              musicEnabled
                ? 'Clique para desativar a música de fundo'
                : 'Clique para ativar a música de fundo'
            }
            className={`px-3 py-2 text-xs font-extrabold rounded-xl border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              musicEnabled
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-700/60'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${musicEnabled ? 'text-emerald-400 animate-pulse' : 'opacity-60'}`} />
            <span>{musicEnabled ? 'Música: ON' : 'Música: OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAudioModal(true)}
            title="Configurações de Som e Estilo Musical"
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white transition-colors cursor-pointer"
            aria-label="Configurações de Áudio"
          >
            {sfxEnabled || musicEnabled ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSplitScreenMode((prev) => !prev)}
            className={`px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
              splitScreenMode
                ? 'game-btn-emerald'
                : 'game-btn-amber'
            }`}
            title="Abre um 2º cliente multiplayer via WebSocket ao lado para testar Desenhista e Adivinhador na mesma tela"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {splitScreenMode ? 'Fechar Tela Dupla' : 'Tela Dupla (2 Jogadores)'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col">
        {splitScreenMode ? (
          <div className="w-full max-w-[1600px] mx-auto px-3 py-3 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            <div className="border border-indigo-500/30 rounded-3xl bg-slate-950/50 overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="bg-slate-900/90 px-4 py-2.5 border-b border-indigo-500/20 flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-400">
                  Jogador #1 (Anfitrião / Tela Principal)
                </span>
                <span className="text-slate-400 font-medium">Conectado via WebSocket</span>
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

            <div className="border border-indigo-500/30 rounded-3xl bg-slate-950/50 overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="bg-slate-900/90 px-4 py-2.5 border-b border-indigo-500/20 flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-400">
                  Jogador #2 (Convidado em Tempo Real)
                </span>
                <span className="text-slate-400 font-medium">
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-title"
        >
          <div className="game-panel rounded-3xl max-w-2xl w-full p-6 sm:p-7 flex flex-col gap-5 border border-indigo-500/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h2 id="rules-title" className="text-xl font-extrabold text-white font-display">
                Como Jogar — SENAI Phone
              </h2>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-amber-300 font-display">01. Mais de 80 Temas Sem Repetir</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A cada rodada, o <strong className="text-amber-200">Desenhista</strong> escolhe entre 80+ temas diferentes. Os temas jogados não se repetem nas rodadas seguintes!
                </p>
              </div>

              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-indigo-300 font-display">02. Pincel Livre &amp; Formas</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Use o pincel colorido ou adicione formas geométricas redimensionáveis na folha. Os outros jogadores tentam adivinhar em tempo real!
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-emerald-300 font-display">03. Dicas de Letras</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Apenas quem está desenhando pode clicar nas letras ou no botão <strong className="text-emerald-200">Revelar Letra</strong> para dar dicas, enquanto os adivinhadores observam as letras reveladas!
                </p>
              </div>

              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col gap-1.5">
                <h3 className="font-extrabold text-rose-300 font-display">04. Velocidade &amp; Pontos por Pessoa</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Quanto mais rápido você acertar, mais pontos ganha (até 160 pts). O desenhista ganha <strong className="text-rose-200">acertos × pontosPorPessoa</strong> em tempo real!
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-700/60">
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
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-title"
        >
          <div className="game-panel rounded-3xl max-w-md w-full p-6 flex flex-col gap-5 border border-indigo-500/30 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h2 id="audio-title" className="text-xl font-extrabold text-white font-display">
                Música &amp; Efeitos Sonoros
              </h2>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Background Music Toggle */}
              <div className="flex items-center justify-between bg-slate-900/70 border border-slate-700/60 rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  <Music className={`w-5 h-5 ${musicEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-sm font-extrabold text-white">Música de Fundo</div>
                    <div className="text-xs text-slate-400">
                      Trilha sonora animada durante o jogo
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMusic}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    musicEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-md'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {musicEnabled ? 'Ativada' : 'Desativada'}
                </button>
              </div>

              {/* Background Music Style Selector */}
              <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col gap-2">
                <div className="text-xs font-extrabold text-slate-300 uppercase tracking-wide">
                  Estilo da Música de Fundo
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {MUSIC_STYLES.map((st) => {
                    const active = musicStyle === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSelectMusicStyle(st.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                            : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-extrabold">{st.name}</div>
                          <div className="text-[11px] text-slate-400">{st.description}</div>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                            active
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-700/80 text-slate-300'
                          }`}
                        >
                          {active ? 'Tocando' : 'Ouvir'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SFX Toggle */}
              <div className="flex items-center justify-between bg-slate-900/70 border border-slate-700/60 rounded-2xl p-3.5">
                <div className="flex items-center gap-3">
                  {sfxEnabled ? (
                    <Volume2 className="w-5 h-5 text-indigo-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-500" />
                  )}
                  <div>
                    <div className="text-sm font-extrabold text-white">Efeitos Sonoros</div>
                    <div className="text-xs text-slate-400">
                      Sons de rodada, acertos, dicas e relógio
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSfx}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    sfxEnabled
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold shadow-md'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {sfxEnabled ? 'Ativados' : 'Desativados'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="bg-slate-900/70 border border-slate-700/60 rounded-2xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-extrabold text-white">
                  <span>Volume Geral</span>
                  <span className="font-mono tabular-nums text-amber-400">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Você pode ligar ou desligar a música a qualquer momento no topo da tela.</span>
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
