import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  X,
  Columns2,
  CheckCircle2,
  Palette,
  Maximize2,
  Minimize2,
  Gamepad2,
  BookOpen,
  Library,
  Sliders,
} from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

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
    <div className="relative min-h-screen flex flex-col text-[#202435] bg-[#F7F8FC] senaiphone-doodle-pattern overflow-x-hidden">
      {/* Custom Illustrated Game Background Layer */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
        aria-hidden="true"
      >
        <img
          src="/src/assets/images/senaiphone_game_bg_1791673334959.jpg"
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-40"
          style={{
            maskImage:
              'radial-gradient(ellipse 68% 62% at 50% 52%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.95) 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 68% 62% at 50% 52%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.45) 65%, rgba(0,0,0,0.95) 100%)',
          }}
        />
      </div>

      {/* Light Mode Navigation Bar */}
      <header className="flex items-center justify-between gap-4 px-4 sm:px-8 h-16 bg-white/95 backdrop-blur-md border-b border-[#E5E8F0] sticky top-0 z-30 shadow-[0_1px_3px_rgba(32,36,53,0.03)]">
        {/* Zone 1: Brand Logo & Wordmark */}
        <a
          href="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#202435] whitespace-nowrap shrink-0 font-display group focus-visible:outline-2 focus-visible:outline-[#FF9F1C] rounded-xl"
        >
          <span className="w-9 h-9 rounded-xl bg-[#FFF6E5] border border-[#FF9F1C]/40 flex items-center justify-center text-[#FF9F1C] shadow-xs group-hover:bg-[#FF9F1C] group-hover:text-white transition-colors">
            <Palette className="w-5 h-5 stroke-[2.2]" />
          </span>
          <span className="flex items-center gap-1">
            <span className="text-[#202435] font-bold">SENAI</span>
            <span className="text-[#FF9F1C] font-bold">Phone</span>
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold text-[#687086]">
          <button
            type="button"
            onClick={() => {
              setShowRulesModal(false);
              setShowAudioModal(false);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[#202435] hover:bg-[#F5F6FA] focus-visible:outline-2 focus-visible:outline-[#FF9F1C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-[#FF9F1C]" />
            <span>Sala de Jogo</span>
          </button>
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-[#202435] hover:bg-[#F5F6FA] focus-visible:outline-2 focus-visible:outline-[#FF9F1C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#687086]" />
            <span>Como Jogar</span>
          </button>
          <button
            type="button"
            onClick={() =>
              setModerationModalCtx((prev) => ({ ...prev, isOpen: true }))
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-[#202435] hover:bg-[#F5F6FA] focus-visible:outline-2 focus-visible:outline-[#FF9F1C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Library className="w-4 h-4 text-[#687086]" />
            <span>Catálogo de Palavras</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAudioModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-[#202435] hover:bg-[#F5F6FA] focus-visible:outline-2 focus-visible:outline-[#FF9F1C] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[#687086]" />
            <span>Opções de Áudio</span>
          </button>
        </nav>

        {/* Zone 3: Compact Audio Controls + Fullscreen + Split Screen */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Music ON/OFF Compact Toggle */}
          <button
            type="button"
            onClick={handleToggleMusic}
            aria-pressed={musicEnabled}
            title={
              musicEnabled
                ? 'Música ligada — clique para desligar'
                : 'Música desligada — clique para ligar'
            }
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF9F1C] ${
              musicEnabled
                ? 'bg-[#E8F8F2] hover:bg-[#D5F2E7] text-[#11845E] border-[#16A879]/40'
                : 'bg-[#F5F6FA] hover:bg-[#EBEEF5] text-[#687086] border-[#E5E8F0]'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${musicEnabled ? 'text-[#16A879]' : 'text-[#687086]'}`} />
            <span>{musicEnabled ? 'Música: ON' : 'Música: OFF'}</span>
          </button>

          {/* Compact Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl px-2.5 py-1.5">
            <button
              type="button"
              onClick={handleToggleSfx}
              title={sfxEnabled ? 'Efeitos sonoros ligados' : 'Efeitos sonoros desligados'}
              className="text-[#687086] hover:text-[#202435] transition-colors cursor-pointer"
              aria-label="Alternar efeitos sonoros"
            >
              {sfxEnabled || musicEnabled ? (
                <Volume2 className="w-4 h-4 text-[#FF9F1C]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#687086]" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              aria-label="Controle de volume"
              title={`Volume: ${Math.round(volume * 100)}%`}
              className="w-16 h-1.5 accent-[#FF9F1C] cursor-pointer"
            />
          </div>

          {/* Mobile Audio Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowAudioModal(true)}
            title="Opções de Áudio"
            className="sm:hidden p-2 rounded-xl bg-[#F5F6FA] hover:bg-[#EBEEF5] text-[#202435] border border-[#E5E8F0] transition-colors cursor-pointer"
            aria-label="Opções de Áudio"
          >
            {sfxEnabled || musicEnabled ? (
              <Volume2 className="w-4 h-4 text-[#FF9F1C]" />
            ) : (
              <VolumeX className="w-4 h-4 text-[#687086]" />
            )}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Ativar tela cheia'}
            className="p-2 rounded-xl bg-[#F5F6FA] hover:bg-[#EBEEF5] text-[#687086] hover:text-[#202435] border border-[#E5E8F0] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF9F1C]"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Split Screen Action */}
          <button
            type="button"
            onClick={() => setSplitScreenMode((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#FF9F1C] ${
              splitScreenMode
                ? 'bg-[#E8F8F2] text-[#11845E] border-[#16A879]/40'
                : 'bg-[#FFF6E5] hover:bg-[#FFEDC7] text-[#B86800] border-[#FF9F1C]/40'
            }`}
            title="Abre um 2º cliente multiplayer via WebSocket ao lado para testar Desenhista e Adivinhador na mesma tela"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {splitScreenMode ? 'Fechar Tela Dupla' : 'Tela Dupla (2 Jogadores)'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="relative z-10 flex-1 flex flex-col">
        {splitScreenMode ? (
          <div className="w-full max-w-[1600px] mx-auto px-3 py-4 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            <div className="border border-[#E5E8F0] rounded-2xl bg-white overflow-hidden shadow-sm">
              <div className="bg-[#F5F6FA] px-4 py-2.5 border-b border-[#E5E8F0] flex items-center justify-between text-xs">
                <span className="font-bold text-[#202435]">
                  Jogador #1 (Anfitrião / Tela Principal)
                </span>
                <span className="text-[#687086] font-medium">Conectado via WebSocket</span>
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

            <div className="border border-[#E5E8F0] rounded-2xl bg-white overflow-hidden shadow-sm">
              <div className="bg-[#F5F6FA] px-4 py-2.5 border-b border-[#E5E8F0] flex items-center justify-between text-xs">
                <span className="font-bold text-[#16A879]">
                  Jogador #2 (Convidado em Tempo Real)
                </span>
                <span className="text-[#687086] font-medium">
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
          className="fixed inset-0 z-50 bg-[#202435]/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-title"
        >
          <div className="party-card rounded-2xl max-w-2xl w-full p-6 sm:p-7 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E8F0] pb-3.5">
              <h2 id="rules-title" className="text-xl font-bold text-[#202435] font-display">
                Como Jogar — SENAI Phone
              </h2>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-2 rounded-xl text-[#687086] hover:text-[#202435] hover:bg-[#F5F6FA] cursor-pointer transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-4 flex flex-col gap-1.5">
                <h3 className="font-bold text-[#202435] font-display">01. Mais de 80 Temas Sem Repetir</h3>
                <p className="text-xs text-[#687086] leading-relaxed">
                  A cada rodada, o <strong className="text-[#202435]">Desenhista</strong> escolhe entre mais de 80 temas variados. Os temas jogados não se repetem nas rodadas seguintes.
                </p>
              </div>

              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-4 flex flex-col gap-1.5">
                <h3 className="font-bold text-[#202435] font-display">02. Pincel Livre &amp; Formas</h3>
                <p className="text-xs text-[#687086] leading-relaxed">
                  Use o pincel colorido ou adicione formas geométricas rotacionáveis na folha. Os outros jogadores tentam adivinhar em tempo real.
                </p>
              </div>

              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-4 flex flex-col gap-1.5">
                <h3 className="font-bold text-[#202435] font-display">03. Dicas de Letras</h3>
                <p className="text-xs text-[#687086] leading-relaxed">
                  Apenas quem está desenhando pode clicar nas letras ou no botão <strong className="text-[#202435]">Revelar Letra</strong> para dar dicas, enquanto os adivinhadores observam as letras reveladas.
                </p>
              </div>

              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-4 flex flex-col gap-1.5">
                <h3 className="font-bold text-[#202435] font-display">04. Velocidade &amp; Pontos por Pessoa</h3>
                <p className="text-xs text-[#687086] leading-relaxed">
                  Quanto mais rápido você acertar, mais pontos ganha (até 160 pts). O desenhista ganha <strong className="text-[#202435]">acertos × pontosPorPessoa</strong> em tempo real.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E8F0]">
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="party-btn-yellow px-6 py-2.5 rounded-xl font-bold text-sm cursor-pointer"
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
          className="fixed inset-0 z-50 bg-[#202435]/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="audio-title"
        >
          <div className="party-card rounded-2xl max-w-md w-full p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#E5E8F0] pb-3.5">
              <h2 id="audio-title" className="text-xl font-bold text-[#202435] font-display">
                Música &amp; Efeitos Sonoros
              </h2>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                className="p-2 rounded-xl text-[#687086] hover:text-[#202435] hover:bg-[#F5F6FA] cursor-pointer transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Background Music Toggle */}
              <div className="flex items-center justify-between bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  <Music className={`w-5 h-5 ${musicEnabled ? 'text-[#16A879]' : 'text-[#687086]'}`} />
                  <div>
                    <div className="text-sm font-bold text-[#202435]">Música de Fundo</div>
                    <div className="text-xs text-[#687086]">
                      Trilha sonora animada durante o jogo
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleMusic}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    musicEnabled
                      ? 'bg-[#16A879] hover:bg-[#128C65] text-white'
                      : 'bg-white text-[#687086] border border-[#E5E8F0]'
                  }`}
                >
                  {musicEnabled ? 'Ativada' : 'Desativada'}
                </button>
              </div>

              {/* Background Music Style Selector */}
              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-3.5 flex flex-col gap-2">
                <div className="text-xs font-bold text-[#202435]">
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
                            ? 'bg-[#FFF6E5] border-[#FF9F1C] text-[#202435]'
                            : 'bg-white border-[#E5E8F0] hover:border-[#D0D5E2] text-[#202435]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{st.name}</div>
                          <div className="text-[11px] text-[#687086]">{st.description}</div>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                            active
                              ? 'bg-[#FF9F1C] text-[#202435]'
                              : 'bg-[#F5F6FA] text-[#687086]'
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
              <div className="flex items-center justify-between bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-3.5">
                <div className="flex items-center gap-3">
                  {sfxEnabled ? (
                    <Volume2 className="w-5 h-5 text-[#FF9F1C]" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-[#687086]" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-[#202435]">Efeitos Sonoros</div>
                    <div className="text-xs text-[#687086]">
                      Sons de rodada, acertos, dicas e relógio
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleSfx}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    sfxEnabled
                      ? 'bg-[#16A879] hover:bg-[#128C65] text-white'
                      : 'bg-white text-[#687086] border border-[#E5E8F0]'
                  }`}
                >
                  {sfxEnabled ? 'Ativados' : 'Desativados'}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="bg-[#F5F6FA] border border-[#E5E8F0] rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#202435]">
                  <span>Volume Geral</span>
                  <span className="font-mono tabular-nums text-[#FF9F1C]">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full accent-[#FF9F1C] cursor-pointer"
                />
              </div>
            </div>

            <div className="text-xs text-[#687086] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-[#16A879] shrink-0" />
              <span>Você pode ligar ou desligar a música a qualquer momento na barra superior.</span>
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
