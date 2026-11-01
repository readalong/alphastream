"use client";

/**
 * /research — validation reports that gate what the desk is allowed to show.
 *
 *  - Phase 3 ranker (app/ranker.py): can a model re-rank the validated
 *    breakout trades? Pre-registered bar: top-quintile-minus-pool gap within
 *    each date ≥ 0.10R, on ≥ 3 walk-forward folds, with the bootstrap CI floor
 *    above zero. A FAIL here is a result, not an error.
 *  - Basket leans (app/leans.py): within-date AUC and Brier improvement,
 *    each with a CI. A horizon prints in colour on /desk only once both
 *    floors clear; until then leans are grey, observation-only.
 */

import { FlaskConical } from "lucide-react";
import { useLeansReport, useRankerReport } from "@/hooks/use-desk";
import { cn } from "@/lib/utils";
import { Chip, Panel, fmtNum, fmtSigned, isNotFound, signClass } from "@/components/desk/primitives";
import type { BootstrapCI, LeanKey, LeansReport, RankerReport } from "@/lib/types";

const MODEL_LABEL: Record<string, string> = {
  gbm: "Gradient boosting (primary)",
  ridge: "Ridge",
  breakout_score: "Current breakout score",
};

function ciText(ci: BootstrapCI | null | undefined, digits = 3, suffix = "") {
  if (!ci) return "—";
  return `[${fmtSigned(ci.ci_low, digits)}, ${fmtSigned(ci.ci_high, digits)}]${suffix}`;
}

function Deciles({ rows }: { rows: { decile: number; mean_r: number; n: number }[] }) {
  if (!rows.length) return <p className="text-xs text-[var(--text-muted)]">Too few trades for deciles.</p>;
  const max = Math.max(...rows.map((r) => Math.abs(r.mean_r)), 0.01);
  return (
    <div className="space-y-0.5">
      {rows.map((r) => (
        <div key={r.decile} className="flex items-center gap-2 text-xs font-mono tabular-nums">
          <span className="w-5 text-right text-[var(--text-muted)]">{r.decile}</span>
          <div className="relative flex-1 h-3">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)]" />
            <div
              className={cn("absolute top-0.5 bottom-0.5", r.mean_r >= 0 ? "bg-[var(--long)]" : "bg-[var(--short)]")}
              style={{
                opacity: 0.7,
                width: `${(Math.abs(r.mean_r) / max) * 50}%`,
                left: r.mean_r >= 0 ? "50%" : `${50 - (Math.abs(r.mean_r) / max) * 50}%`,
              }}
            />
          </div>
          <span className={cn("w-16 text-right", signClass(r.mean_r))}>{fmtSigned(r.mean_r, 3, "R")}</span>
          <span className="w-12 text-right text-[var(--text-faint)]">{r.n}</span>
        </div>
      ))}
      <p className="text-xs text-[var(--text-muted)] pt-1">
        1 = lowest predicted score, 10 = highest. Pooled across dates, so market regime is mixed in; the verdict uses
        the within-date gap.
      </p>
    </div>
  );
}

function RankerSection({ r }: { r: RankerReport }) {
  const v = r.verdict;
  const tone = v.status === "PASS" ? "long" : v.status === "FAIL" ? "short" : "muted";
  return (
    <Panel
      title="Phase 3 ranker"
      subtitle={`${r.run_id} · ${r.labelled_trades.toLocaleString()} labelled trades · ${r.oos_n.toLocaleString()} out of sample · ${r.generated_at.slice(0, 10)}`}
    >
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Chip tone={tone}>{v.status.replaceAll("_", " ")}</Chip>
          <span className="text-sm">
            {MODEL_LABEL[v.model] ?? v.model}: gap <span className="font-mono">{fmtSigned(v.gap_r, 3, "R")}</span>, CI{" "}
            <span className="font-mono">
              [{fmtSigned(v.ci_lo, 3)}, {fmtSigned(v.ci_hi, 3)}]
            </span>{" "}
            over {v.folds} folds
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          Bar: gap ≥ {v.bar.min_gap_r}R, ≥ {v.bar.min_folds} folds, CI floor &gt; {v.bar.ci_lo_above}. Pool average{" "}
          {fmtSigned(r.oos_pool_mean_r, 3, "R")}.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
              Top quintile minus its own date pool
            </p>
            <table className="w-full text-xs font-mono tabular-nums">
              <thead className="text-[var(--text-muted)] font-sans">
                <tr className="text-left">
                  <th className="py-1 pr-3 font-normal">Model</th>
                  <th className="py-1 pr-3 font-normal">Gap</th>
                  <th className="py-1 pr-3 font-normal">CI</th>
                  <th className="py-1 font-normal">Picked</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.overall).map(([k, o]) => (
                  <tr key={k} className="border-t border-[var(--border)]/50">
                    <td className="py-1 pr-3 font-sans">{MODEL_LABEL[k] ?? k}</td>
                    <td className={cn("py-1 pr-3", signClass(o.gap_r))}>{fmtSigned(o.gap_r, 3, "R")}</td>
                    <td className={cn("py-1 pr-3", o.ci?.includes_zero && "text-[var(--text-muted)]")}>{ciText(o.ci)}</td>
                    <td className="py-1">{o.top_n.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {r.sensitivity_all_setups && (
            <div className="overflow-x-auto">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
                Sensitivity: ranked among all setups
              </p>
              <table className="w-full text-xs font-mono tabular-nums">
                <thead className="text-[var(--text-muted)] font-sans">
                  <tr className="text-left">
                    <th className="py-1 pr-3 font-normal">Model</th>
                    <th className="py-1 pr-3 font-normal">Gap</th>
                    <th className="py-1 pr-3 font-normal">CI</th>
                    <th className="py-1 font-normal">Filled picks</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(r.sensitivity_all_setups.models).map(([k, o]) => (
                    <tr key={k} className="border-t border-[var(--border)]/50">
                      <td className="py-1 pr-3 font-sans">{MODEL_LABEL[k] ?? k}</td>
                      <td className={cn("py-1 pr-3", signClass(o.gap_r))}>{fmtSigned(o.gap_r, 3, "R")}</td>
                      <td className={cn("py-1 pr-3", o.ci?.includes_zero && "text-[var(--text-muted)]")}>{ciText(o.ci)}</td>
                      <td className="py-1">{o.top_filled_n.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                The live picker ranks all {r.sensitivity_all_setups.setups.toLocaleString()} setups before any fill is
                known; this ranks them the same way and scores the {r.sensitivity_all_setups.filled.toLocaleString()} that
                filled and resolved. A check on the verdict, not a second test.
              </p>
            </div>
          )}

          <div className="overflow-x-auto">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">By test year</p>
            <table className="w-full text-xs font-mono tabular-nums">
              <thead className="text-[var(--text-muted)] font-sans">
                <tr className="text-left">
                  <th className="py-1 pr-3 font-normal">Year</th>
                  <th className="py-1 pr-3 font-normal">Train</th>
                  <th className="py-1 pr-3 font-normal">Test</th>
                  <th className="py-1 pr-3 font-normal">GBM</th>
                  <th className="py-1 pr-3 font-normal">Ridge</th>
                  <th className="py-1 font-normal">Score</th>
                </tr>
              </thead>
              <tbody>
                {r.per_fold.map((f) => (
                  <tr key={f.year} className="border-t border-[var(--border)]/50">
                    <td className="py-1 pr-3">{f.year}</td>
                    <td className="py-1 pr-3 text-[var(--text-muted)]">{f.train_n.toLocaleString()}</td>
                    <td className="py-1 pr-3 text-[var(--text-muted)]">{f.test_n.toLocaleString()}</td>
                    <td className={cn("py-1 pr-3", signClass(f.gap_gbm))}>{fmtSigned(f.gap_gbm, 3)}</td>
                    <td className={cn("py-1 pr-3", signClass(f.gap_ridge))}>{fmtSigned(f.gap_ridge, 3)}</td>
                    <td className={cn("py-1", signClass(f.gap_breakout_score))}>{fmtSigned(f.gap_breakout_score, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
              Gradient boosting: mean R by score decile
            </p>
            <Deciles rows={r.overall.gbm?.deciles ?? []} />
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1">
              Ridge coefficients (standardised, largest first)
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs font-mono tabular-nums">
              {r.ridge_coefficients.slice(0, 12).map((c) => (
                <li key={c.feature} className="flex justify-between gap-2">
                  <span className="text-[var(--text-muted)] truncate">{c.feature}</span>
                  <span className={signClass(c.coef)}>{fmtSigned(c.coef, 3)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Panel>
  );
}

const LEAN_LABEL: Record<LeanKey, string> = {
  d3: "3-day beats SPY",
  d10: "10-day beats SPY",
  d20: "20-day beats SPY",
  crash20: "≥10% fall in 20 days",
};

function LeansSection({ l }: { l: LeansReport }) {
  const keys = (Object.keys(LEAN_LABEL) as LeanKey[]).filter((k) => l.validation[k]);
  return (
    <Panel
      title="Basket leans"
      subtitle={`${l.rows.toLocaleString()} basket-days, ${l.baskets} baskets · yearly walk-forward from ${l.first_test_year} · trained through ${l.trained_through}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono tabular-nums">
          <thead className="text-[var(--text-muted)] font-sans">
            <tr className="text-left">
              <th className="py-1 pr-3 font-normal">Lean</th>
              <th className="py-1 pr-3 font-normal">Folds</th>
              <th className="py-1 pr-3 font-normal">OOS rows</th>
              <th className="py-1 pr-3 font-normal">Base rate</th>
              <th className="py-1 pr-3 font-normal">Within-date AUC</th>
              <th className="py-1 pr-3 font-normal">CI</th>
              <th className="py-1 pr-3 font-normal">Brier skill</th>
              <th className="py-1 pr-3 font-normal">Improvement CI</th>
              <th className="py-1 font-normal">On /desk</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => {
              const v = l.validation[k];
              return (
                <tr key={k} className="border-t border-[var(--border)]/50">
                  <td className="py-1 pr-3 font-sans">{LEAN_LABEL[k]}</td>
                  <td className="py-1 pr-3">{v.folds}</td>
                  <td className="py-1 pr-3">{v.oos_rows.toLocaleString()}</td>
                  <td className="py-1 pr-3">{v.base_rate == null ? "—" : `${fmtNum(v.base_rate * 100, 0)}%`}</td>
                  <td className="py-1 pr-3">{fmtNum(v.within_date_auc, 3)}</td>
                  <td className="py-1 pr-3">{ciText(v.within_date_auc_ci)}</td>
                  <td className={cn("py-1 pr-3", signClass(v.brier_skill))}>{fmtSigned(v.brier_skill, 3)}</td>
                  <td className="py-1 pr-3">{ciText(v.brier_improvement_ci, 4)}</td>
                  <td className="py-1">
                    <Chip tone={v.printable ? "long" : "muted"}>{v.printable ? "colour" : "grey"}</Chip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-[var(--text-muted)]">
        A lean shows in colour only when the AUC CI floor is above 0.5 and the Brier improvement CI floor is above
        zero. Leans never select or size a trade, coloured or not.
      </p>
    </Panel>
  );
}

function Missing({ title, command, error }: { title: string; command: string; error: unknown }) {
  const real = error && !isNotFound(error);
  return (
    <Panel title={title}>
      {real ? (
        <p className="text-sm text-[var(--short)] font-mono break-words">
          {error instanceof Error ? error.message : String(error)}
        </p>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">
          No report yet. Run <code className="font-mono">python main.py {command}</code>.
        </p>
      )}
    </Panel>
  );
}

export default function ResearchPage() {
  const ranker = useRankerReport();
  const leans = useLeansReport();
  return (
    <div className="space-y-4 max-w-6xl">
      <header className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-[var(--text-muted)]" />
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Research</h1>
      </header>
      <p className="text-sm text-[var(--text-muted)] max-w-3xl">
        Pre-registered tests. Each bar was fixed before its first run; a failing result stays on this page so nobody
        re-runs the same idea.
      </p>
      {ranker.isLoading ? (
        <div className="h-64 bg-[var(--bg-card)]" />
      ) : ranker.data ? (
        <RankerSection r={ranker.data} />
      ) : (
        <Missing title="Phase 3 ranker" command="--ranker-experiment" error={ranker.error} />
      )}
      {leans.isLoading ? (
        <div className="h-40 bg-[var(--bg-card)]" />
      ) : leans.data ? (
        <LeansSection l={leans.data} />
      ) : (
        <Missing title="Basket leans" command="--leans" error={leans.error} />
      )}
    </div>
  );
}
