import type { ScreenerResult, AiAnalysis, ResistanceLevel } from "./types";

export interface AlphaLensContext {
  ticker: string;
  screener?: ScreenerResult;
  businessSummary?: string;
  aiAnalysis?: AiAnalysis;
  resistance?: { currentPrice: number; levels: ResistanceLevel[] };
  hasChart: boolean;
}

export function buildSystemPrompt(ctx: AlphaLensContext): string {
  const sections: string[] = [
    `You are Alpha Lens, an AI analyst assistant focused exclusively on ${ctx.ticker}. You help users understand the technical and fundamental picture for this specific stock.`,
    `IMPORTANT RULES:
- Only discuss ${ctx.ticker}. If asked about other tickers, politely redirect.
- Base your answers on the provided data when possible.
- Use the web_search tool when asked about news, earnings, fundamentals, sector trends, or any information not present in the provided data.
- Be concise and direct. Use bullet points for clarity.
- When referencing data, cite the source (e.g. "According to the screener data..." or "The AI analysis shows...").`,
  ];

  if (ctx.screener) {
    const s = ctx.screener;
    const signals = s.signals
      ? s.signals.split("|").map((sig) => sig.trim()).filter(Boolean).join(", ")
      : "None";
    sections.push(
      `SCREENER DATA:
- Price: $${s.close_price}
- Stage: ${s.stage}
- Category: ${s.category}
- Sector: ${s.sector || "N/A"} (ETF: ${s.sector_etf || "N/A"})
- Industry: ${s.industry || "N/A"}
- Signals: ${signals}`
    );
  }

  if (ctx.businessSummary) {
    sections.push(`BUSINESS SUMMARY:\n${ctx.businessSummary}`);
  }

  if (ctx.aiAnalysis && !ctx.aiAnalysis.error) {
    const a = ctx.aiAnalysis;
    const parts: string[] = ["AI ANALYSIS:"];
    if (a.decision) {
      parts.push(`- Verdict: ${a.decision.verdict || "N/A"}`);
      if (a.decision.confidence_score != null)
        parts.push(`- Confidence: ${a.decision.confidence_score}%`);
      if (a.decision.weighted_rationale)
        parts.push(`- Score Breakdown: ${a.decision.weighted_rationale}`);
    }
    if (a.visual_audit) {
      if (a.visual_audit.trend_structure)
        parts.push(`- Trend Structure: ${a.visual_audit.trend_structure}`);
      if (a.visual_audit.key_levels)
        parts.push(`- Key Levels: ${a.visual_audit.key_levels}`);
      if (a.visual_audit.obv_analysis)
        parts.push(`- OBV Analysis: ${a.visual_audit.obv_analysis}`);
    }
    if (a.reasoning) parts.push(`- Reasoning: ${a.reasoning}`);
    sections.push(parts.join("\n"));
  }

  if (ctx.resistance && ctx.resistance.levels.length > 0) {
    const r = ctx.resistance;
    const levelLines = r.levels
      .slice(0, 5)
      .map(
        (l) =>
          `  $${l.price.toFixed(2)} (${l.pct_above.toFixed(1)}% above, strength: ${l.strength}, source: ${l.source})`
      )
      .join("\n");
    sections.push(
      `RESISTANCE LEVELS (current price: $${r.currentPrice.toFixed(2)}):\n${levelLines}`
    );
  }

  if (ctx.hasChart) {
    sections.push(
      "NOTE: The user can see a technical chart on screen (price, volume, moving averages, OBV). You cannot see the chart image but you can discuss the technical indicators based on the screener and AI analysis data."
    );
  }

  return sections.join("\n\n");
}
