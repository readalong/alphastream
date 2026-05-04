"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, X, Trash2, Send, Square, Loader2 } from "lucide-react";
import type { AlphaLensContext } from "@/lib/alpha-lens-context";
import { MessageBubble } from "./message-bubble";
import { QuickActions } from "./quick-actions";

interface AlphaLensPanelProps {
  context: AlphaLensContext;
}

export function AlphaLensPanel({ context }: AlphaLensPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { context },
      }),
    [context]
  );

  const {
    messages,
    sendMessage,
    status,
    stop,
    setMessages,
    error,
  } = useChat({ transport });

  const isActive = status === "submitted" || status === "streaming";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleClear = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim() || isActive) return;
      setInput("");
      sendMessage({ text });
    },
    [isActive, sendMessage]
  );

  const handleQuickAction = useCallback(
    (prompt: string) => {
      if (!open) setOpen(true);
      // Small delay so panel opens first
      setTimeout(() => handleSend(prompt), 50);
    },
    [open, handleSend]
  );

  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      handleSend(input);
    },
    [input, handleSend]
  );

  // Context pills
  const contextPills: string[] = [];
  if (context.screener) contextPills.push("Screener");
  if (context.businessSummary) contextPills.push("Business");
  if (context.aiAnalysis && !context.aiAnalysis.error) contextPills.push("AI Analysis");
  if (context.resistance && context.resistance.levels.length > 0) contextPills.push("Resistance");
  if (context.hasChart) contextPills.push("Chart");

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25 hover:brightness-110 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Alpha Lens</span>
          {messages.length > 0 && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-[10px] font-bold tabular-nums">
              {messages.length}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[420px] max-h-[600px] flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl shadow-black/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--accent)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Alpha Lens
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {context.ticker}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={handleClear}
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Clear conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
                title="Close (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Context pills */}
          {contextPills.length > 0 && messages.length === 0 && (
            <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
              {contextPills.map((pill) => (
                <span
                  key={pill}
                  className="px-2 py-0.5 rounded text-[10px] bg-[var(--accent)]/8 text-[var(--accent)] border border-[var(--accent)]/15"
                >
                  {pill}
                </span>
              ))}
            </div>
          )}

          {/* Quick actions (show when no messages) */}
          {messages.length === 0 && (
            <div className="px-4 pt-2 pb-1">
              <QuickActions context={context} onSelect={handleQuickAction} disabled={isActive} />
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">
                Ask anything about {context.ticker} — signals, stage, news, sector outlook, and more.
              </p>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isActive && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                  <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-400">
                  Error: {error.message}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleFormSubmit}
            className="px-4 py-3 flex gap-2 border-t border-[var(--border)] bg-[var(--bg-card)]"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${context.ticker}...`}
              disabled={isActive}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:border-[var(--accent)]/50 disabled:opacity-50"
            />
            {isActive ? (
              <button
                type="button"
                onClick={() => stop()}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                title="Stop generating"
              >
                <Square className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Send"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      )}
    </>
  );
}
