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
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-catalog-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 id="modal-catalog-title" className="text-lg font-bold text-white">
            Catálogo de Palavras & Moderação
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Moderação do Catálogo ({words.length} palavras)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'report'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Denunciar Comportamento ou Conteúdo
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'catalog' ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-300">
                  Ative ou desative palavras do sorteio da sala para adequar a partida ao grupo.
                </p>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
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
                <div className="py-12 text-center text-sm text-slate-400">
                  Carregando catálogo...
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {filteredWords.map((w) => {
                    const themeObj = THEMES_CATALOG.find((t) => t.id === w.themeId);
                    return (
                      <div
                        key={w.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                          w.enabled
                            ? 'bg-slate-800/70 border-slate-700 text-slate-100'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="text-sm font-semibold truncate">{w.text}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5">
                            <span>{themeObj?.name ?? w.themeId}</span>
                            <span aria-hidden="true">·</span>
                            <span>{w.difficulty === 'easy' ? 'Fácil' : 'Médio'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleWord(w.id, !w.enabled)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                            w.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
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
              <p className="text-sm text-slate-300">
                Use este formulário para reportar apelidos inadequados, spam ou conduta antidesportiva durante a sessão.
              </p>

              {players.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Jogador envolvido (opcional)
                  </label>
                  <select
                    value={targetPlayerId}
                    onChange={(e) => setTargetPlayerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Descrição da ocorrência
                </label>
                <textarea
                  rows={3}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Explique brevemente o que aconteceu..."
                  maxLength={200}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {reportError && (
                <div className="flex items-center gap-2 text-xs text-red-300 bg-red-950/60 border border-red-800/60 rounded-lg px-3 py-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {reportSubmitted && (
                <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Registro de moderação enviado com sucesso.</span>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={handleSubmitReport}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap"
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
