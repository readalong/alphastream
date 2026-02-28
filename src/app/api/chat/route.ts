import { streamText, tool, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { getModel } from "@/lib/ai-provider";
import { buildSystemPrompt, type AlphaLensContext } from "@/lib/alpha-lens-context";

export const maxDuration = 60;

export async function POST(req: Request) {
  const body = await req.json();
  const messages = body.messages as UIMessage[];
  const context = body.context as AlphaLensContext;
  const systemPrompt = buildSystemPrompt(context);

  const braveApiKey = process.env.BRAVE_SEARCH_API_KEY;

  console.log("[Alpha Lens] Chat request for", context.ticker, "| messages:", messages.length, "| brave key:", braveApiKey ? "set" : "missing");

  const result = streamText({
    model: getModel(),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 4096,
    stopWhen: stepCountIs(5),
    tools: braveApiKey
      ? {
          web_search: tool({
            description:
              "Search the web for current news, earnings, fundamentals, sector trends, or other external information about the stock. Use this when the user asks about something not covered by the provided data.",
            inputSchema: z.object({
              query: z.string().describe("The search query"),
            }),
            execute: async ({ query }) => {
              console.log("[Alpha Lens] web_search tool called with query:", query);

              const url = new URL(
                "https://api.search.brave.com/res/v1/web/search"
              );
              url.searchParams.set("q", query);
              url.searchParams.set("count", "5");

              try {
                const res = await fetch(url.toString(), {
                  headers: {
                    Accept: "application/json",
                    "Accept-Encoding": "gzip",
                    "X-Subscription-Token": braveApiKey,
                  },
                });

                console.log("[Alpha Lens] Brave API response status:", res.status);

                if (!res.ok) {
                  const errorText = await res.text().catch(() => "");
                  console.error("[Alpha Lens] Brave API error:", res.status, errorText);
                  return { error: `Search failed (${res.status}): ${errorText}` };
                }

                const data = await res.json();
                const results = (
                  data.web?.results || []
                ).map(
                  (r: { title: string; url: string; description: string }) => ({
                    title: r.title,
                    url: r.url,
                    snippet: r.description,
                  })
                );

                console.log("[Alpha Lens] Brave search returned", results.length, "results");
                return { results };
              } catch (err) {
                console.error("[Alpha Lens] Brave API fetch error:", err);
                return { error: `Search failed: ${err instanceof Error ? err.message : String(err)}` };
              }
            },
          }),
        }
      : undefined,
  });

  return result.toUIMessageStreamResponse();
}
