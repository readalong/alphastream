"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, TrendingUp, BarChart3, Target, Shield, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "alphastream-onboarded";

const STEPS = [
  {
    title: "Welcome to AlphaStream",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          AlphaStream is a stock discovery dashboard powered by Minervini stage analysis, capital flow scoring, and AI chart interpretation. It turns raw market data into clear, actionable signals every day.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: TrendingUp, label: "Stage Analysis", desc: "Minervini/Wyckoff classification" },
            { icon: BarChart3, label: "Sector Rotation", desc: "Capital flow heatmaps" },
            { icon: Target, label: "Daily Signals", desc: "Buy/sell recommendations" },
            { icon: Shield, label: "Risk Controls", desc: "VIX, regime, collar levels" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
              <Icon className="h-4 w-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Your Daily 5-Step Workflow",
    content: (
      <div className="space-y-2.5">
        {[
          { step: 1, label: "Today", desc: "Check Today → what to act on, watch, and avoid", href: "/today" },
          { step: 2, label: "Markets & Flows", desc: "Markets & Flows → regime, VIX, where is money moving?", href: "/markets" },
          { step: 3, label: "Find Opportunities", desc: "Ideas → normalized ranked setups across every engine", href: "/ideas" },
          { step: 4, label: "Assess Risk", desc: "Strategy & Futures → regime allocation, collar, CTA positioning", href: "/strategy" },
          { step: 5, label: "Research & Act", desc: "Ticker Detail → Alpha Lens AI for final validation", href: "/ticker" },
        ].map(({ step, label, desc, href }) => (
          <Link
            key={step}
            href={href}
            className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] hover:border-[var(--accent)]/40 transition-colors group"
          >
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-xs font-bold shrink-0">
              {step}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{desc}</p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
        <p className="text-xs text-[var(--text-muted)] mt-1">Click any step to navigate there now.</p>
      </div>
    ),
  },
  {
    title: "Connect Your Backend",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          AlphaStream requires the Trading Discovery Engine API to be running. By default it connects to <code className="text-[var(--accent)] text-xs">localhost:8000</code>.
        </p>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">API URL</p>
            <p className="text-xs text-[var(--text-muted)]">Configure the backend URL in Settings if your engine runs on a different host or port.</p>
          </div>
          <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">AI Analysis (optional)</p>
            <p className="text-xs text-[var(--text-muted)]">Add a Google Gemini API key in Settings to enable AI chart analysis and the Alpha Lens chat panel.</p>
          </div>
        </div>
        <Link
          href="/settings"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors text-sm font-medium"
        >
          Open Settings
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    ),
  },
];

export function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) setShow(true);
    } catch {}
  }, []);

  function dismiss() {
    try { localStorage.setItem(ONBOARDING_KEY, "1"); } catch {}
    setShow(false);
  }

  if (!show) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={dismiss} />
      <div className="relative w-full max-w-md border border-[var(--border)] bg-[var(--bg-card)] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{current.title}</h2>
          </div>
          <button
            onClick={dismiss}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1.5 px-5 pt-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-[var(--accent)]" : "w-3 bg-[var(--border)] hover:bg-[var(--text-muted)]"
              )}
            />
          ))}
          <span className="ml-auto text-xs text-[var(--text-muted)]">{step + 1} / {STEPS.length}</span>
        </div>

        {/* Content */}
        <div className="px-5 py-4">{current.content}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5 gap-3">
          <button
            onClick={dismiss}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={dismiss}
                className="px-4 py-1.5 rounded-md text-sm bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
