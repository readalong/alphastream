"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { formatSource, relativeTime } from "@/lib/news-utils";
import type { NewsArticle } from "@/lib/types";

interface ArticleDrawerProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  useEffect(() => {
    if (!article) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Source + time */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold text-[var(--accent)]">
              {formatSource(article.source)}
            </span>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <span className="text-xs text-[var(--text-muted)]">
              {relativeTime(article.published_at)}
            </span>
            <span className="text-[var(--text-muted)] text-xs">·</span>
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(article.published_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-base font-semibold text-[var(--text-primary)] leading-snug mb-4 pr-6">
            {article.title}
          </h2>

          {/* Description */}
          {article.description && (
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">
              {article.description}
            </p>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Read Full Article
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
