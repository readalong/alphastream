"use client";

import { isToolUIPart, getToolName, type UIMessage } from "ai";

interface MessageBubbleProps {
  message: UIMessage;
}

function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    const text = getTextContent(message);
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] px-3 py-2 rounded-lg bg-[var(--accent)]/15 text-sm text-[var(--text-primary)] border border-[var(--accent)]/20">
          {text}
        </div>
      </div>
    );
  }

  // Render assistant message parts
  const textContent = getTextContent(message);

  // Extract tool parts — handles both static (tool-{name}) and dynamic-tool types
  const toolParts = message.parts.filter((p) => isToolUIPart(p));

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] space-y-2">
        {toolParts.map((part) => {
          const p = part as unknown as {
            type: string;
            toolName?: string;
            toolCallId: string;
            input?: Record<string, unknown>;
            state: string;
          };
          const query = p.input?.query;
          const name = p.toolName ?? getToolName(part as Parameters<typeof getToolName>[0]);
          return (
            <div
              key={p.toolCallId}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)]"
            >
              <span className="shrink-0">
                {p.state === "result" ? "\u{1F50D}" : "\u23F3"}
              </span>
              <span className="truncate">
                Searched: {query ? String(query) : name}
              </span>
            </div>
          );
        })}
        {textContent && (
          <div className="px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)]">
            <AssistantMarkdown content={textContent} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Lightweight markdown renderer — bold, italic, bullets, code */
function AssistantMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
      continue;
    }

    if (/^[-*\u2022]\s/.test(line)) {
      elements.push(
        <div key={i} className="flex gap-1.5 text-sm">
          <span className="text-[var(--text-muted)] shrink-0">{"\u2022"}</span>
          <span><InlineMarkdown text={line.replace(/^[-*\u2022]\s/, "")} /></span>
        </div>
      );
      continue;
    }

    if (/^\*\*[^*]+\*\*:?\s*$/.test(line.trim())) {
      elements.push(
        <p key={i} className="text-sm font-semibold text-[var(--text-primary)] mt-1.5">
          <InlineMarkdown text={line} />
        </p>
      );
      continue;
    }

    elements.push(
      <p key={i} className="text-sm text-[var(--text-primary)]">
        <InlineMarkdown text={line} />
      </p>
    );
  }

  return <>{elements}</>;
}

/** Inline markdown: **bold**, *italic*, `code` */
function InlineMarkdown({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(
        <code
          key={match.index}
          className="px-1 py-0.5 rounded text-xs bg-[var(--bg-primary)] border border-[var(--border)] font-mono"
        >
          {match[4]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
