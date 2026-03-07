"use client";

import { useState, useEffect, useRef } from "react";
import { Newspaper, ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { useTickerNews } from "@/hooks/use-news";
import { formatSource, relativeTime, formatAbsoluteDate } from "@/lib/news-utils";
import type { TickerNewsArticle } from "@/lib/types";

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="divide-y divide-[var(--border)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="py-3.5">
          <div className="h-4 w-full rounded bg-[var(--bg-primary)] animate-pulse mb-2" />
          <div className="h-3.5 w-4/5 rounded bg-[var(--bg-primary)] animate-pulse mb-2" />
          <div className="h-2.5 w-1/3 rounded bg-[var(--bg-primary)] animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ── Article detail modal ───────────────────────────────────────────────────

function ArticleModal({
  article,
  onClose,
}: {
  article: TickerNewsArticle;
  onClose: () => void;
}) {
  const hasText = article.full_text.trim().length > 0;
  const paragraphs = hasText
    ? article.full_text.split(/\n\n+/).filter((p) => p.trim().length > 0)
    : [];
  const date = formatAbsoluteDate(article.published_at);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      {/* Modal card */}
      <div
        className="relative z-10 w-full max-w-3xl max-h-[90vh] rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[var(--border)] shrink-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          {article.source && (
            <span className="text-xs text-[var(--text-muted)] ml-auto font-medium">
              {formatSource(article.source)}
            </span>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Title */}
          <h2 className="text-lg font-semibold text-[var(--text-primary)] leading-snug mb-2">
            {article.title}
          </h2>

          {/* Source + date */}
          {(article.source || date) && (
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {[article.source ? formatSource(article.source) : null, date]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <hr className="border-[var(--border)] mb-5" />

          {/* Article body */}
          {hasText ? (
            <div className="text-sm text-[var(--text-primary)] leading-relaxed space-y-3">
              {paragraphs.map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic py-4">
              Full text not available for this source — the article may be
              paywalled or bot-protected.
            </p>
          )}
        </div>

        {/* Footer CTA */}
        <div className="shrink-0 px-6 py-4 border-t border-[var(--border)]">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline font-medium"
          >
            Open original article
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Headline row ───────────────────────────────────────────────────────────

function HeadlineItem({
  article,
  onClick,
}: {
  article: TickerNewsArticle;
  onClick: () => void;
}) {
  const time = relativeTime(article.published_at);

  return (
    <button
      onClick={onClick}
      className="w-full text-left py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-primary)] -mx-4 px-4 transition-colors"
    >
      <p className="text-sm text-[var(--text-primary)] font-medium leading-snug line-clamp-2 mb-1.5">
        {article.title}
      </p>
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        {article.source && (
          <span className="font-medium text-[var(--accent)]/80">
            {formatSource(article.source)}
          </span>
        )}
        {article.source && time && (
          <span>·</span>
        )}
        {time && <span>{time}</span>}
        {article.full_text.trim().length > 0 && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
            Full text
          </span>
        )}
      </div>
    </button>
  );
}

// ── TickerNewsPanel ────────────────────────────────────────────────────────

interface TickerNewsPanelProps {
  ticker: string;
  withCard?: boolean;
}

export function TickerNewsPanel({ ticker, withCard = true }: TickerNewsPanelProps) {
  const [openArticle, setOpenArticle] = useState<TickerNewsArticle | null>(null);
  const { data, isLoading, isError, refetch, isFetching } = useTickerNews(ticker);

  const body = (() => {
    if (isLoading) {
      return (
        <>
          <SkeletonList />
          <p className="text-[11px] text-[var(--text-muted)] text-center mt-3">
            Fetching articles — may take a few seconds on first load…
          </p>
        </>
      );
    }

    if (isError) {
      return (
        <div className="py-8 text-center space-y-2">
          <p className="text-xs text-[var(--text-muted)]">Could not load news.</p>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      );
    }

    if (!data?.articles.length) {
      return (
        <div className="py-8 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            No recent news for {ticker}.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-y-auto">
        {data.articles.map((article, i) => (
          <HeadlineItem
            key={article.id || `${ticker}-${i}`}
            article={article}
            onClick={() => setOpenArticle(article)}
          />
        ))}
      </div>
    );
  })();

  const modal = openArticle ? (
    <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
  ) : null;

  if (!withCard) {
    return (
      <>
        {body}
        {modal}
      </>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
          <Newspaper className="h-3.5 w-3.5 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            {ticker} News
          </h3>
          {data?.cached && (
            <span className="ml-auto text-[10px] text-[var(--text-muted)]/60">cached</span>
          )}
        </div>
        <div className="px-4 py-1 max-h-[600px] overflow-y-auto">{body}</div>
      </div>
      {modal}
    </>
  );
}

// ── NewsTickerCard — compact auto-scrolling widget for sidebar ─────────────

interface NewsTickerCardProps {
  ticker: string;
  onMoreNews: () => void;
}

export function NewsTickerCard({ ticker, onMoreNews }: NewsTickerCardProps) {
  const [openArticle, setOpenArticle] = useState<TickerNewsArticle | null>(null);
  const { data, isLoading } = useTickerNews(ticker);

  const articles = data?.articles ?? [];
  // Only animate when there are enough articles to fill + overflow the container
  const shouldAnimate = articles.length >= 4;

  const innerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const posRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    // Reset scroll position whenever ticker or animate-eligibility changes
    posRef.current = 0;
    if (innerRef.current) innerRef.current.style.transform = "";

    const inner = innerRef.current;
    if (!inner || !shouldAnimate) return;

    const SPEED = 28; // px per second
    let lastTime = 0;

    function tick(now: number) {
      if (lastTime && !pausedRef.current) {
        const dt = (now - lastTime) / 1000;
        posRef.current += SPEED * dt;
        // The inner div contains the list twice — scroll until the halfway point
        // then jump back to create a seamless loop
        const halfH = inner!.scrollHeight / 2;
        if (posRef.current >= halfH) posRef.current = 0;
        inner!.style.transform = `translateY(-${posRef.current}px)`;
      }
      lastTime = now;
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [shouldAnimate, ticker]);

  return (
    <>
      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Latest News
          </h3>
          <button
            onClick={onMoreNews}
            className="text-xs text-[var(--accent)] hover:underline"
          >
            More news →
          </button>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i}>
                <div className="h-3 w-full rounded bg-[var(--bg-primary)] animate-pulse mb-1" />
                <div className="h-2.5 w-1/3 rounded bg-[var(--bg-primary)] animate-pulse" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-2">No recent news.</p>
        ) : (
          /* Clipping window — fixed height, no scrollbar */
          <div
            className="relative overflow-hidden h-44"
            onMouseEnter={() => { pausedRef.current = true; }}
            onMouseLeave={() => { pausedRef.current = false; }}
          >
            {/* Inner strip — duplicated for seamless loop */}
            <div ref={innerRef} className="absolute top-0 left-0 w-full will-change-transform">
              {(shouldAnimate ? [...articles, ...articles] : articles).map((article, i) => (
                <button
                  key={`${article.id}-${i}`}
                  onClick={() => setOpenArticle(article)}
                  className="w-full text-left py-2 border-b border-[var(--border)] last:border-0 group"
                >
                  <p className="text-xs text-[var(--text-primary)] group-hover:text-[var(--accent)] leading-snug line-clamp-1 transition-colors">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {article.source && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatSource(article.source)}
                      </span>
                    )}
                    {article.source && article.published_at && (
                      <span className="text-[10px] text-[var(--text-muted)]">·</span>
                    )}
                    {article.published_at && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {relativeTime(article.published_at)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {openArticle && (
        <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />
      )}
    </>
  );
}
