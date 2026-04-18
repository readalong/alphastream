import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

const BACKEND_API_KEY = process.env.BACKEND_API_KEY || null;

type Params = Promise<{ sessionId: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { sessionId } = await params;
  const search = request.nextUrl.search;
  const url = `${BACKEND_URL}/api/trading/sessions/${sessionId}/upside-report${search}`;

  console.log(`[proxy:upside-report] GET ${url}`);

  const headers: Record<string, string> = {};
  if (BACKEND_API_KEY) headers["X-API-Key"] = BACKEND_API_KEY;

  const llmKey = request.headers.get("X-LLM-Key");
  if (llmKey) headers["X-LLM-Key"] = llmKey;

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers, cache: "no-store" });
  } catch (err) {
    console.error(`[proxy:upside-report] fetch failed:`, err);
    return NextResponse.json(
      { error: `Backend unreachable: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  console.log(`[proxy:upside-report] → ${res.status}`);

  const responseHeaders = new Headers();
  const ct = res.headers.get("Content-Type");
  if (ct) responseHeaders.set("Content-Type", ct);

  const body = await res.arrayBuffer();
  return new NextResponse(body, { status: res.status, headers: responseHeaders });
}
