import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Filter } from 'lucide-react';
import { THEMES_CATALOG } from '../shared/catalog';
import { PlayerPublicState } from '../shared/types';

interface CatalogWordItem {
  id: string;
  word: string;
  themeId: string;
  themeName: string;
  difficulty: 'easy' | 'medium';
  hint1: string;
  hint2: string;
}

interface CatalogModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  reporterId: string;
  players: PlayerPublicState[];
}

export const CatalogModerationModal: React.FC<CatalogModerationModalProps> = ({
  isOpen,
  onClose,
  roomId,
  reporterId,
  players,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'report'>('catalog');
  const [words, setWords] = useState<CatalogWordItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  // Report state
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [reason, setReason] = useState<string>('Desenho inadequado');
  const [details, setDetails] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'done'>('idle');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedTheme !== 'all') params.set('themeId', selectedTheme);
    if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);

    fetch(`/api/catalog/words?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.words)) {
          setWords(data.words);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, selectedTheme, selectedDifficulty]);

  if (!isOpen) return null;

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportStatus('submitting');
    try {
      await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          reporterId,
          targetPlayerId: targetPlayerId || 'unknown',
          reason,
          details,
        }),
      });
      setReportStatus('done');
      setTimeout(() => {
        setReportStatus('idle');
        setDetails('');
      }, 2500);
    } catch {
      setReportStatus('idle');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-indigo-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-catalog-title"
    >
      <div className="party-card rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-indigo-100 bg-indigo-50/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-indigo-600 text-white shadow-[0_2px_0_#1e1b4b]'
                  : 'text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              Catálogo de Temas e Palavras ({words.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-rose-500 text-white shadow-[0_2px_0_#881337]'
                  : 'text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Denunciar / Moderação
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-indigo-500 hover:text-indigo-950 hover:bg-indigo-100 cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {activeTab === 'catalog' ? (
          <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="modal-catalog-title" className="text-lg font-bold text-indigo-950 font-display">
                  Banco de Palavras em Português
                </h2>
                <p className="text-xs text-indigo-600">
                  Explore os temas que podem ser sorteados nas rodadas do SENAI Phone.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-indigo-50 border-2 border-indigo-200 rounded-xl px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-600" />
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    aria-label="Filtrar por tema"
                    className="bg-transparent text-xs text-indigo-950 font-bold focus:outline-none"
                  >
                    <option value="all">Todos os Temas ({THEMES_CATALOG.length})</option>
                    {THEMES_CATALOG.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  aria-label="Filtrar por dificuldade"
                  className="bg-indigo-50 border-2 border-indigo-200 rounded-xl px-2.5 py-1.5 text-xs text-indigo-950 font-bold focus:outline-none"
                >
                  <option value="all">Fácil + Médio</option>
                  <option value="easy">Apenas Fácil</option>
                  <option value="medium">Apenas Médio</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm font-bold text-indigo-600">
                Carregando catálogo...
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {words.map((item) => (
                  <div
                    key={item.id}
                    className="bg-indigo-50/70 border-2 border-indigo-100 rounded-2xl p-3 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-indigo-950">{item.word}</span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg ${
                          item.difficulty === 'easy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.difficulty === 'easy' ? 'Fácil' : 'Médio'}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-indigo-600">{item.themeName}</div>
                    <div className="text-[11px] text-indigo-800 leading-snug">
                      Dica: {item.hint1}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleReportSubmit} className="p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-indigo-950 font-display">
                Reportar Conduta ou Desenho Inadequado
              </h2>
              <p className="text-xs text-indigo-600">
                Ajude a manter o ambiente divertido e respeitoso para todos na sala.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1.5">
                  Jogador denunciado
                </label>
                <select
                  value={targetPlayerId}
                  onChange={(e) => setTargetPlayerId(e.target.value)}
                  className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Selecionar jogador da sala...</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-900 mb-1.5">
                  Motivo principal
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Desenho inadequado">Desenho inadequado / ofensivo</option>
                  <option value="Escreveu letras na tela">Escreveu a palavra no quadro</option>
                  <option value="Ofensa ou spam no chat">Ofensa ou spam no chat</option>
                  <option value="Apelido impróprio">Apelido impróprio</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-900 mb-1.5">
                Observações adicionais (opcional)
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={250}
                placeholder="Descreva brevemente o ocorrido..."
                className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm text-indigo-950 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {reportStatus === 'done' ? (
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Denúncia registrada com sucesso!
                </div>
              ) : (
                <span className="text-xs text-indigo-500">
                  O anfitrião também pode remover jogadores diretamente no Lobby.
                </span>
              )}

              <button
                type="submit"
                disabled={reportStatus === 'submitting'}
                className="party-btn-coral px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer"
              >
                {reportStatus === 'submitting' ? 'Enviando...' : 'Enviar Denúncia'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
