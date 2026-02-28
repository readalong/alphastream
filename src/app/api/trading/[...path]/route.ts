import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

const BACKEND_API_KEY = process.env.BACKEND_API_KEY || null;

type Params = Promise<{ path: string[] }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  return proxyRequest(request, path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const path = "/api/" + pathSegments.join("/");
  const search = request.nextUrl.search;
  const url = `${BACKEND_URL}${path}${search}`;

  console.log(`[proxy] ${request.method} ${url} (key: ${BACKEND_API_KEY ? "set" : "none"})`);

  const headers: Record<string, string> = {};

  if (BACKEND_API_KEY) {
    headers["X-API-Key"] = BACKEND_API_KEY;
  }

  // Forward LLM key from client if present (user-provided, for AI analysis endpoints)
  const llmKey = request.headers.get("X-LLM-Key");
  if (llmKey) {
    headers["X-LLM-Key"] = llmKey;
  }

  const contentType = request.headers.get("Content-Type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  const init: RequestInit = { method: request.method, headers, cache: "no-store" };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    console.error(`[proxy] fetch failed for ${url}:`, err);
    return NextResponse.json(
      { error: `Backend unreachable: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  console.log(`[proxy] → ${res.status} from ${url}`);

  const responseHeaders = new Headers();
  const resContentType = res.headers.get("Content-Type");
  if (resContentType) responseHeaders.set("Content-Type", resContentType);
  const contentDisposition = res.headers.get("Content-Disposition");
  if (contentDisposition) responseHeaders.set("Content-Disposition", contentDisposition);

  const body = await res.arrayBuffer();
  return new NextResponse(body, { status: res.status, headers: responseHeaders });
}
