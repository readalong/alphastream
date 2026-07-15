"use client";

import { useState, useEffect } from "react";
import { Newspaper, RefreshCw } from "lucide-react";
import { useNewsFeed, type NewsFeedType } from "@/hooks/use-news";
import { formatSource, relativeTime } from "@/lib/news-utils";
import { ArticleDrawer } from "./article-drawer";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/types";

const LIMIT = 15;

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonList() {
  return (
    <div className="divide-y divide-[var(--border)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="py-3.5">
          <div className="h-4 w-full rounded bg-[var(--bg-primary)] mb-2" />
          <div className="h-3 w-3/4 rounded bg-[var(--bg-primary)] mb-1.5" />
          <div className="h-2.5 w-1/3 rounded bg-[var(--bg-primary)]" />
        </div>
      ))}
    </div>
  );
}

// ── Headline row ───────────────────────────────────────────────────────────

function HeadlineItem({
  article,
  onClick,
}: {
  article: NewsArticle;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left py-3.5 border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-primary)] -mx-5 px-5 transition-colors"
    >
      <p className="text-sm text-[var(--text-primary)] font-medium leading-snug line-clamp-2 mb-1.5">
        {article.title}
      </p>
      <div className="flex items-center flex-wrap gap-x-1.5 gap-y-1">
        <span className="text-xs font-medium text-[var(--accent)]/80">
          {formatSource(article.source)}
        </span>
        <span className="text-[var(--text-muted)] text-xs">·</span>
        <span className="text-xs text-[var(--text-muted)]">
          {relativeTime(article.published_at)}
        </span>
        {article.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-xs px-1.5 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

// ── Feed content (keyed per tab so state resets on tab switch) ─────────────

function FeedContent({
  feed,
  onArticleClick,
}: {
  feed: NewsFeedType;
  onArticleClick: (a: NewsArticle) => void;
}) {
  const [offset, setOffset] = useState(0);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isLoading, isFetching, isError } = useNewsFeed(feed, LIMIT, offset);

  useEffect(() => {
    if (!data?.articles) return;
    setArticles((prev) =>
      offset === 0 ? data.articles : [...prev, ...data.articles]
    );
    if (data.articles.length < LIMIT) setHasMore(false);
  }, [data, offset]);

  if (isLoading && articles.length === 0) return <SkeletonList />;

  if (isError && articles.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs text-[var(--text-muted)]">
          News feed unavailable — TIINGO_API_KEY may not be configured.
        </p>
      </div>
    );
  }

  if (!isLoading && articles.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs text-[var(--text-muted)]">No recent news available.</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        {articles.map((article, i) => (
          <HeadlineItem
            key={article.id ?? `${feed}-${i}`}
            article={article}
            onClick={() => onArticleClick(article)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="pt-4 text-center">
          <button
            onClick={() => setOffset(articles.length)}
            disabled={isFetching}
            className="text-xs text-[var(--accent)] hover:underline disabled:opacity-50 flex items-center gap-1.5 mx-auto"
          >
            {isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
            {isFetching ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── NewsFeedPanel ──────────────────────────────────────────────────────────

const TABS: { key: NewsFeedType; label: string }[] = [
  { key: "us", label: "US Markets" },
  { key: "global", label: "Global / Macro" },
];

export function NewsFeedPanel() {
  const [activeTab, setActiveTab] = useState<NewsFeedType>("us");
  const [openArticle, setOpenArticle] = useState<NewsArticle | null>(null);

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Market News
          </h2>
        </div>
        <div className="flex items-center gap-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed — keyed so component resets on tab switch */}
      <div className="px-5 py-1">
        <FeedContent
          key={activeTab}
          feed={activeTab}
          onArticleClick={setOpenArticle}
        />
      </div>

      <ArticleDrawer
        article={openArticle}
        onClose={() => setOpenArticle(null)}
      />
    </section>
  );
}
