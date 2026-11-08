import React, { useState, useEffect, useMemo } from 'react';
import { NewsItem, NewsCategory, Language } from '../types';
import { fetchExpeditionNews, EDSM_EXPEDITION_URL } from '../services/newsService';
import { i18n } from '../data/i18n';
import {
  Radio,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Fuel,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  Share2,
  Check,
} from 'lucide-react';

interface ExpeditionNewsfeedProps {
  currentLang: Language;
}

export const ExpeditionNewsfeed: React.FC<ExpeditionNewsfeedProps> = ({ currentLang }) => {
  const t = i18n[currentLang];

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulated API fetch
  const loadNews = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchExpeditionNews();
      setNews(data);
    } catch (err) {
      console.error('Failed to fetch expedition news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleShare = (item: NewsItem) => {
    const title = currentLang === 'ru' ? item.titleRu : item.title;
    const text = `${title} — Belka & Strelka Expedition (EDSM #229)\n${EDSM_EXPEDITION_URL}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredNews = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return news.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (!q) return true;
      const title = (currentLang === 'ru' ? item.titleRu : item.title).toLowerCase();
      const summary = (currentLang === 'ru' ? item.summaryRu : item.summary).toLowerCase();
      const system = item.system?.toLowerCase() || '';
      const author = item.author.toLowerCase();
      return title.includes(q) || summary.includes(q) || system.includes(q) || author.includes(q);
    });
  }, [news, selectedCategory, searchQuery, currentLang]);

  return (
    <section className="bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
      {/* Header and Telemetry Link Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-orbitron text-lg sm:text-xl font-bold text-white tracking-wide">
              {t.newsTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.newsSub}
          </p>
        </div>

        {/* Action Controls: Refresh & Direct EDSM Link */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={EDSM_EXPEDITION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-space-800 hover:bg-space-750 text-cyan-400 hover:text-cyan-300 border border-space-700 hover:border-cyan-500/40 transition-colors cursor-pointer"
          >
            <span>{t.newsViewEdsm}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => loadNews(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? t.newsRefreshing : t.newsRefresh}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Category Filter Segments */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-space-750 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.newsFilterAll}
          </button>
          <button
            onClick={() => setSelectedCategory('carrier')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'carrier'
                ? 'bg-space-750 text-orange-400 border border-orange-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.newsFilterCarrier}
          </button>
          <button
            onClick={() => setSelectedCategory('discovery')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'discovery'
                ? 'bg-space-750 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.newsFilterDiscovery}
          </button>
          <button
            onClick={() => setSelectedCategory('operations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'operations'
                ? 'bg-space-750 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.newsFilterOps}
          </button>
          <button
            onClick={() => setSelectedCategory('edsm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'edsm'
                ? 'bg-space-750 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.newsFilterEdsm}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.newsSearchPlaceholder}
            className="w-full bg-space-800 border border-space-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-space-800/40 border border-space-700/60 rounded-xl p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 bg-space-700/60 rounded w-1/4" />
              <div className="h-6 bg-space-700/80 rounded w-3/4" />
              <div className="h-4 bg-space-700/40 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-mono text-sm bg-space-950/40 rounded-xl border border-space-800">
          No dispatches matching current filter parameters.
        </div>
      ) : (
        /* Newsfeed List */
        <div className="space-y-4">
          {filteredNews.map((item) => {
            const isExpanded = !!expandedIds[item.id];
            const title = currentLang === 'ru' ? item.titleRu : item.title;
            const summary = currentLang === 'ru' ? item.summaryRu : item.summary;
            const content = currentLang === 'ru' ? item.contentRu : item.content;
            const region = currentLang === 'ru' && item.regionRu ? item.regionRu : item.region;
            const isCopied = copiedId === item.id;

            return (
              <article
                key={item.id}
                className={`bg-space-850 border rounded-xl p-5 sm:p-6 transition-all space-y-3 ${
                  item.isPinned
                    ? 'border-orange-500/40 bg-gradient-to-br from-space-850 to-space-900 shadow-md'
                    : 'border-space-700/80 hover:border-space-600'
                }`}
              >
                {/* Top Meta Line: Timestamp & Category Tag */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center space-x-2 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-300 font-medium tabular-nums">{item.gameDate}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-slate-400">{item.author}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.isPinned && (
                      <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-0.5 rounded">
                        {t.newsPinned}
                      </span>
                    )}
                    <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-space-800 px-2 py-0.5 rounded border border-space-700">
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Article Headline */}
                <h4 className="font-orbitron text-base sm:text-lg font-bold text-white tracking-wide leading-snug">
                  {title}
                </h4>

                {/* Summary */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {summary}
                </p>

                {/* System & Carrier Stats Strip if available */}
                {(item.system || item.region || item.carrierStatus) && (
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                    {item.system && (
                      <div className="flex items-center space-x-1.5 bg-space-800/80 px-2.5 py-1 rounded-lg border border-space-700 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-slate-200">{item.system}</span>
                      </div>
                    )}

                    {region && (
                      <div className="flex items-center space-x-1.5 bg-space-800/80 px-2.5 py-1 rounded-lg border border-space-700">
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-300">{region}</span>
                      </div>
                    )}

                    {item.carrierStatus && (
                      <div className="flex items-center space-x-1.5 bg-space-800/80 px-2.5 py-1 rounded-lg border border-space-700 font-mono text-amber-400">
                        <Fuel className="w-3.5 h-3.5 text-amber-400" />
                        <span>{t.newsCarrierFuel}: {item.carrierStatus.tritiumTons.toLocaleString()} T</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded Transmission Details */}
                {isExpanded && (
                  <div className="pt-3 border-t border-space-800 space-y-3 animate-fade-in text-xs sm:text-sm text-slate-300 leading-relaxed bg-space-950/40 p-4 rounded-xl border border-space-800/80">
                    <p>{content}</p>

                    {item.carrierStatus?.nextJumpSchedule && (
                      <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 pt-2 border-t border-space-800">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.newsNextJump}: {item.carrierStatus.nextJumpSchedule}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="inline-flex items-center space-x-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <span>{isExpanded ? t.newsReadLess : t.newsReadMore}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleShare(item)}
                      className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 bg-space-800 hover:bg-space-750 px-2.5 py-1 rounded-lg border border-space-700 transition-colors cursor-pointer"
                      title="Copy dispatch link"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3" />
                          <span>Share</span>
                        </>
                      )}
                    </button>

                    {item.edsmUrl && (
                      <a
                        href={item.edsmUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-cyan-400 bg-space-800 hover:bg-space-750 px-2.5 py-1 rounded-lg border border-space-700 transition-colors cursor-pointer"
                      >
                        <span>EDSM</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Subspace Link Telemetry Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-mono pt-3 border-t border-space-800 gap-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-pulse" />
          <span>{t.newsStatus}</span>
        </div>
        <div>
          Official EDSM Expedition ID: 229 • Fleet Carrier Space Tourist (J7Q-9KY)
        </div>
      </div>
    </section>
  );
};
