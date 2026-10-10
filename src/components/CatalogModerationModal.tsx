import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, CheckCircle2, Filter } from 'lucide-react';
import { THEMES_CATALOG } from '../shared/catalog';
import { PlayerPublicState } from '../shared/types';

interface CatalogWordItem {
  id: string;
  themeId: string;
  text: string;
  difficulty: 'easy' | 'medium';
  enabled: boolean;
  contentRating: string;
}

interface CatalogModerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  reporterId?: string;
  players?: PlayerPublicState[];
}

export const CatalogModerationModal: React.FC<CatalogModerationModalProps> = ({
  isOpen,
  onClose,
  roomId = 'lobby',
  reporterId = 'anon',
  players = [],
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'report'>('catalog');
  const [words, setWords] = useState<CatalogWordItem[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);

  // Report state
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [reportReason, setReportReason] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.words)) {
          setWords(data.words);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleWord = async (wordId: string, nextEnabled: boolean) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, enabled: nextEnabled } : w))
    );
    try {
      await fetch('/api/catalog/toggle-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId, enabled: nextEnabled }),
      });
    } catch {}
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError('');
    if (!reportReason.trim()) {
      setReportError('Descreva o motivo da denúncia.');
      return;
    }
    try {
      const res = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          reporterId,
          targetPlayerId: targetPlayerId || undefined,
          reason: reportReason.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setReportError(err.error || 'Erro ao enviar denúncia.');
        return;
      }
      setReportSubmitted(true);
      setReportReason('');
      setTimeout(() => setReportSubmitted(false), 4000);
    } catch {
      setReportError('Falha de conexão ao registrar denúncia.');
    }
  };

  const filteredWords =
    selectedTheme === 'all'
      ? words
      : words.filter((w) => w.themeId === selectedTheme);

  return (
    <div
      className="fixed inset-0 z-50 bg-indigo-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-catalog-title"
    >
      <div className="game-panel rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-indigo-100">
          <h2 id="modal-catalog-title" className="text-xl font-extrabold text-indigo-950 font-display">
            Catálogo de Palavras &amp; Moderação
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-500 hover:text-indigo-950 hover:bg-indigo-50 transition-colors cursor-pointer"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b-2 border-indigo-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            Palavras do Jogo ({words.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'report'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
            }`}
          >
            Reportar Comportamento
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'catalog' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-indigo-900/80 font-medium">
                  Ative ou desative palavras do sorteio da sala para personalizar a partida.
                </p>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="bg-indigo-50 border-2 border-indigo-200 rounded-xl px-3 py-1.5 text-xs font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                    aria-label="Filtrar por tema"
                  >
                    <option value="all">Todos os Temas</option>
                    {THEMES_CATALOG.filter((t) => t.id !== 'misturado').map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-sm font-bold text-indigo-600">
                  Carregando catálogo...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredWords.map((w) => {
                    const themeObj = THEMES_CATALOG.find((t) => t.id === w.themeId);
                    return (
                      <div
                        key={w.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-colors ${
                          w.enabled
                            ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-sm font-extrabold truncate">{w.text}</div>
                          <div className="text-xs text-indigo-700/75 flex items-center gap-1.5 font-medium">
                            <span>{themeObj?.name ?? w.themeId}</span>
                            <span aria-hidden="true">·</span>
                            <span>{w.difficulty === 'easy' ? 'Fácil' : 'Médio'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleWord(w.id, !w.enabled)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            w.enabled
                              ? 'bg-emerald-500 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {w.enabled ? 'Ativa' : 'Inativa'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="flex flex-col gap-4 max-w-lg">
              <p className="text-sm text-indigo-900/80 font-medium">
                Use este formulário para reportar apelidos inadequados ou conduta antidesportiva durante a partida.
              </p>

              {players.length > 0 && (
                <div>
                  <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                    Jogador envolvido (opcional)
                  </label>
                  <select
                    value={targetPlayerId}
                    onChange={(e) => setTargetPlayerId(e.target.value)}
                    className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecionar participante...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nickname}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-indigo-950 mb-1.5">
                  Descrição da ocorrência
                </label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explique brevemente o que aconteceu..."
                  maxLength={200}
                  className="w-full bg-indigo-50 border-2 border-indigo-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-indigo-950 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {reportError && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-100 border-2 border-rose-300 rounded-xl px-3.5 py-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {reportSubmitted && (
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100 border-2 border-emerald-300 rounded-xl px-3.5 py-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Registro de moderação enviado com sucesso!</span>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="game-btn-amber px-6 py-2.5 font-extrabold text-sm rounded-xl whitespace-nowrap cursor-pointer"
                >
                  Enviar Denúncia
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
