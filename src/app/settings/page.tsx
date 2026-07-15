"use client";

import { useState } from "react";
import { useThemeStore } from "@/stores/theme-store";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api-client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const {
    llmKey,
    resultsPerPage,
    defaultRefresh,
    density,
    setLlmKey,
    setResultsPerPage,
    setDefaultRefresh,
    setDensity,
  } = useAppStore();

  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [testInfo, setTestInfo] = useState("");

  const testConnection = async () => {
    setTestStatus("loading");
    try {
      const health = await api.health();
      setTestStatus("ok");
      setTestInfo(`v${health.version} (${health.environment})`);
    } catch (e) {
      setTestStatus("error");
      setTestInfo(e instanceof Error ? e.message : "Connection failed");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-6">
        Settings
      </h1>

      {/* Appearance */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Appearance
        </h2>
        <div>
          <label className="text-sm text-[var(--text-primary)] mb-2 block">Theme</label>
          <div className="flex gap-2">
            {(["dark", "light", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-md text-sm capitalize transition-colors ${
                  theme === t
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-[var(--text-primary)] mb-2 block">Density</label>
          <div className="flex gap-2">
            {(["comfortable", "compact"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`px-4 py-2 rounded-md text-sm capitalize transition-colors ${
                  density === d
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)] hover:text-[var(--text-primary)]"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1.5">
            Compact mode reduces padding for more data on screen.
          </p>
        </div>
      </section>

      {/* API Configuration */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          API Configuration
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[var(--text-primary)] mb-1.5 block">
              Google Gemini Key
            </label>
            <input
              type="password"
              value={llmKey || ""}
              onChange={(e) => setLlmKey(e.target.value || null)}
              placeholder="Not set"
              className="w-full h-9 px-3 rounded-md text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Google Gemini key for AI analysis endpoints.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={testConnection}
              disabled={testStatus === "loading"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {testStatus === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
              Test Connection
            </button>
            {testStatus === "ok" && (
              <span className="flex items-center gap-1 text-sm text-[var(--long)]">
                <CheckCircle className="h-4 w-4" />
                Connected {testInfo}
              </span>
            )}
            {testStatus === "error" && (
              <span className="flex items-center gap-1 text-sm text-[var(--short)]">
                <XCircle className="h-4 w-4" />
                {testInfo}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Data Preferences */}
      <section className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Data Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm text-[var(--text-primary)]">
              Default refresh (re-download from Yahoo)
            </label>
            <button
              onClick={() => setDefaultRefresh(!defaultRefresh)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                defaultRefresh ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  defaultRefresh ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </div>
          <div>
            <label className="text-sm text-[var(--text-primary)] mb-1.5 block">
              Results per page
            </label>
            <select
              value={resultsPerPage}
              onChange={(e) => setResultsPerPage(Number(e.target.value))}
              className="h-9 px-3 rounded-md text-sm bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
