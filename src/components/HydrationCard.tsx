import { useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Droplets, Plus, Zap } from 'lucide-react';
import type { HydrationTargets } from '../utils/calculations';
import { MINERAL_GUIDES, FIBRE_GUIDE, type MineralKey } from '../data/mineralGuide';
import { Sheet } from './Sheet';

export type HydrationIntake = {
  waterMl: number;
  sodiumMg: number;
  potassiumMg: number;
  magnesiumMg: number;
  calciumMg: number;
  fiberG: number;
};

// Where today's mineral came from, richest contributor first (e.g. logged
// meals for sodium, or a manual electrolyte entry). Optional per mineral.
export type MineralSource = { label: string; mg: number };
export type MineralSources = Partial<Record<MineralKey, MineralSource[]>>;

// Goal-aware hydration + electrolyte targets, with today's intake tracked
// against them and a caution when water is high but sodium is low (the
// dilution / over-hydration risk).
export function HydrationCard({
  targets,
  intake,
  sources,
  currentWaterGoalMl,
  onApplyWater,
  onLogElectrolytes,
  onAddMineralFromFood,
}: {
  targets: HydrationTargets;
  intake?: HydrationIntake;
  sources?: MineralSources;
  currentWaterGoalMl: number;
  onApplyWater: (ml: number) => void;
  onLogElectrolytes?: () => void;
  onAddMineralFromFood?: (key: MineralKey, mg: number) => void | Promise<void>;
}) {
  const applied = currentWaterGoalMl === targets.waterMl;
  const [openMineral, setOpenMineral] = useState<MineralKey | null>(null);
  const [openFibre, setOpenFibre] = useState(false);
  const [addedFood, setAddedFood] = useState<string | null>(null);

  async function handleAddFood(key: MineralKey, name: string, mg: number) {
    if (!onAddMineralFromFood) return;
    setAddedFood(name);
    await onAddMineralFromFood(key, mg);
    window.setTimeout(() => setAddedFood(cur => (cur === name ? null : cur)), 1400);
  }

  const cells: {
    label: string;
    tint: string;
    target: number;
    have: number | null;
    fmt: (v: number) => string;
    mineral?: MineralKey;
    fibre?: boolean;
  }[] = [
    { label: 'Water', tint: '#0ea5e9', target: targets.waterMl, have: intake?.waterMl ?? null, fmt: (v: number) => `${(v / 1000).toFixed(1)} L` },
    { label: 'Fibre', tint: '#84cc16', target: targets.fiberG, have: intake?.fiberG ?? null, fmt: (v: number) => `${Math.round(v)} g`, fibre: true },
    { label: 'Sodium', tint: '#f59e0b', target: targets.sodiumMg, have: intake?.sodiumMg ?? null, fmt: (v: number) => `${Math.round(v)} mg`, mineral: 'sodium' },
    { label: 'Potassium', tint: '#22c55e', target: targets.potassiumMg, have: intake?.potassiumMg ?? null, fmt: (v: number) => `${Math.round(v)} mg`, mineral: 'potassium' },
    { label: 'Magnesium', tint: '#a855f7', target: targets.magnesiumMg, have: intake?.magnesiumMg ?? null, fmt: (v: number) => `${Math.round(v)} mg`, mineral: 'magnesium' },
    { label: 'Calcium', tint: '#eab308', target: targets.calciumMg, have: intake?.calciumMg ?? null, fmt: (v: number) => `${Math.round(v)} mg`, mineral: 'calcium' },
  ];

  // Drinking plenty but under-salted → the water won't hold / hyponatremia risk.
  const dilutionRisk =
    intake != null &&
    intake.waterMl >= targets.waterMl * 0.8 &&
    intake.sodiumMg < targets.sodiumMg * 0.5;

  return (
    <>
    <div className="glass-card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10">
            <Droplets size={16} className="text-sky-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Hydration & minerals</p>
            <p className="text-[10px] text-[var(--muted)]">
              {intake ? 'Today vs your goal · protein, fibre, sweat & goal' : 'Scaled to your protein, fibre, activity & goal'}
            </p>
          </div>
        </div>
        {onLogElectrolytes ? (
          <button
            type="button"
            onClick={onLogElectrolytes}
            className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #4b3fe0)' }}
          >
            <Zap size={12} /> Log
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {cells.map(c => {
          const pct = c.have != null ? Math.min(100, Math.round((c.have / c.target) * 100)) : null;
          const tappable = c.mineral != null || c.fibre === true;
          const body = (
            <>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">{c.label}</p>
                {tappable ? <ChevronRight size={12} className="text-[var(--muted)]" /> : null}
              </div>
              {c.have != null ? (
                <>
                  <p className="text-sm font-black leading-tight text-[var(--text)]">
                    {c.fmt(c.have)}
                    <span className="text-[10px] font-semibold text-[var(--muted)]"> / {c.fmt(c.target)}</span>
                  </p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--card-border)]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.tint }} />
                  </div>
                </>
              ) : (
                <p className="text-base font-black leading-tight" style={{ color: c.tint }}>
                  {c.fmt(c.target)}
                  <span className="text-[9px] font-semibold text-[var(--muted)]"> / day</span>
                </p>
              )}
            </>
          );
          return tappable ? (
            <button
              key={c.label}
              type="button"
              onClick={() => (c.fibre ? setOpenFibre(true) : setOpenMineral(c.mineral!))}
              className="rounded-2xl bg-[var(--bg)] p-3 text-left transition active:scale-[0.98]"
            >
              {body}
            </button>
          ) : (
            <div key={c.label} className="rounded-2xl bg-[var(--bg)] p-3">
              {body}
            </div>
          );
        })}
      </div>
      {intake ? (
        <p className="-mt-1 text-center text-[9px] text-[var(--muted)]">Tap fibre or a mineral to see your sources & best foods</p>
      ) : null}

      {/* Potassium : sodium balance — the ratio that actually drives cramps and
          blood pressure. Aim for at least as much potassium as sodium. */}
      {intake && intake.sodiumMg + intake.potassiumMg > 0 ? (() => {
        const na = intake.sodiumMg;
        const k = intake.potassiumMg;
        const total = na + k;
        const naShare = Math.round((na / total) * 100);
        const balanced = k >= na; // potassium at least matches sodium
        return (
          <div className="rounded-2xl bg-[var(--bg)] p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Sodium : potassium balance</p>
              <span className={`text-[10px] font-bold ${balanced ? 'text-green-600' : 'text-amber-600'}`}>
                {balanced ? 'Balanced' : 'Low potassium'}
              </span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full">
              <div style={{ width: `${naShare}%`, background: '#f59e0b' }} />
              <div style={{ width: `${100 - naShare}%`, background: '#22c55e' }} />
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] font-semibold">
              <span className="text-amber-600">Na {Math.round(na)} mg</span>
              <span className="text-green-600">K {Math.round(k)} mg</span>
            </div>
            {!balanced ? (
              <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--muted)]">
                Sodium is outpacing potassium — lean on banana, spinach, beans or coconut water to even it out.
              </p>
            ) : null}
          </div>
        );
      })() : null}

      {dilutionRisk ? (
        <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 px-3 py-2">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-relaxed text-[var(--text)]">
            You're drinking plenty but sodium is low — add a little salt or an electrolyte drink so
            the water is actually retained (avoids that watered-down, foggy feeling).
          </p>
        </div>
      ) : null}

      <p className="text-[11px] leading-relaxed text-[var(--muted)]">{targets.note}</p>

      <button
        type="button"
        onClick={() => onApplyWater(targets.waterMl)}
        disabled={applied}
        className="flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white disabled:opacity-70"
        style={{ background: applied ? '#16a34a' : 'linear-gradient(135deg, #0ea5e9, #0369a1)' }}
      >
        {applied ? (
          <><Check size={14} /> Water goal set to {(targets.waterMl / 1000).toFixed(1)} L</>
        ) : (
          <>Use {(targets.waterMl / 1000).toFixed(1)} L as my water goal</>
        )}
      </button>
      <p className="text-center text-[9px] text-[var(--muted)]">
        General wellness guidance — not medical advice. Adjust to how you feel and any clinical advice.
      </p>
    </div>

    {openMineral ? (() => {
      const g = MINERAL_GUIDES[openMineral];
      const targetByKey = { sodium: targets.sodiumMg, potassium: targets.potassiumMg, magnesium: targets.magnesiumMg, calcium: targets.calciumMg };
      const haveByKey = { sodium: intake?.sodiumMg ?? 0, potassium: intake?.potassiumMg ?? 0, magnesium: intake?.magnesiumMg ?? 0, calcium: intake?.calciumMg ?? 0 };
      const target = targetByKey[openMineral];
      const have = haveByKey[openMineral];
      const mineralSources = sources?.[openMineral] ?? [];
      const pct = target > 0 ? Math.min(100, Math.round((have / target) * 100)) : 0;
      const remaining = Math.max(0, Math.round(target - have));
      return (
        <Sheet open onClose={() => setOpenMineral(null)} title={g.label}>
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-[var(--text)]">{g.role}</p>

            {/* Today's tally + where it came from */}
            <div className="rounded-2xl bg-[var(--bg)] p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Today</p>
                <p className="text-sm font-black text-[var(--text)]">
                  {Math.round(have)} <span className="text-[10px] font-semibold text-[var(--muted)]">/ {Math.round(target)} mg</span>
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--card-border)]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: g.tint }} />
              </div>
              {mineralSources.length > 0 ? (
                <div className="mt-3 flex flex-col gap-1.5">
                  <p className="text-[10px] font-semibold text-[var(--muted)]">Where it came from</p>
                  {mineralSources.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="truncate text-[var(--text)]">{s.label}</span>
                      <span className="shrink-0 font-semibold text-[var(--muted)]">{Math.round(s.mg)} mg</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-[var(--muted)]">
                  Nothing logged yet today. Log a meal with this mineral, or tap “Log” on the card to add it manually.
                </p>
              )}
              {remaining > 0 ? (
                <p className="mt-2 text-[11px] font-semibold" style={{ color: g.tint }}>
                  {remaining} mg to go{onAddMineralFromFood ? ' — tap a food below to log what you ate' : ''}:
                </p>
              ) : (
                <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-green-600">
                  <Check size={12} /> Target reached
                </p>
              )}
            </div>

            {/* Best foods to top up */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Best foods · richest first</p>
              <div className="flex flex-col gap-1.5">
                {g.foods.map(f => (
                  <div key={f.name} className="flex items-center gap-3 rounded-2xl bg-[var(--bg)] px-3 py-2">
                    <span className="text-lg">{f.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--text)]">{f.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{f.per}</p>
                    </div>
                    {onAddMineralFromFood ? (
                      <button
                        type="button"
                        onClick={() => handleAddFood(g.key, f.name, f.mg)}
                        disabled={addedFood === f.name}
                        aria-label={`Add ${f.name}`}
                        className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white transition-transform active:scale-95 disabled:opacity-80"
                        style={{ background: addedFood === f.name ? '#16a34a' : g.tint }}
                      >
                        {addedFood === f.name ? <Check size={12} /> : <Plus size={12} />}
                        {f.mg}
                      </button>
                    ) : (
                      <span className="shrink-0 text-[13px] font-black" style={{ color: g.tint }}>+{f.mg} mg</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* How it fits the protein → fibre → water flow */}
            <div className="rounded-2xl px-3 py-2.5" style={{ background: `${g.tint}1a` }}>
              <p className="text-[11px] leading-relaxed text-[var(--text)]">
                <span className="font-bold">Why it matters: </span>{g.flowNote}
              </p>
            </div>
          </div>
        </Sheet>
      );
    })() : null}

    {openFibre ? (() => {
      const target = targets.fiberG;
      const have = intake?.fiberG ?? 0;
      const pct = target > 0 ? Math.min(100, Math.round((have / target) * 100)) : 0;
      const remaining = Math.max(0, Math.round(target - have));
      return (
        <Sheet open onClose={() => setOpenFibre(false)} title={FIBRE_GUIDE.label}>
          <div className="flex flex-col gap-4">
            <p className="text-sm leading-relaxed text-[var(--text)]">{FIBRE_GUIDE.role}</p>

            <div className="rounded-2xl bg-[var(--bg)] p-4">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Today</p>
                <p className="text-sm font-black text-[var(--text)]">
                  {Math.round(have)} <span className="text-[10px] font-semibold text-[var(--muted)]">/ {Math.round(target)} g</span>
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--card-border)]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: FIBRE_GUIDE.tint }} />
              </div>
              <p className="mt-2 text-[11px] text-[var(--muted)]">
                Fibre is counted from the food you log in your diary. {remaining > 0 ? `About ${remaining} g to go today — reach for one of these:` : 'Target reached — nice.'}
              </p>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">Best sources · per serving</p>
              <div className="flex flex-col gap-1.5">
                {FIBRE_GUIDE.foods.map(f => (
                  <div key={f.name} className="flex items-center gap-3 rounded-2xl bg-[var(--bg)] px-3 py-2">
                    <span className="text-lg">{f.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--text)]">{f.name}</p>
                      <p className="text-[10px] text-[var(--muted)]">{f.per}</p>
                    </div>
                    <span className="shrink-0 text-[13px] font-black" style={{ color: FIBRE_GUIDE.tint }}>+{f.g} g</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl px-3 py-2.5" style={{ background: `${FIBRE_GUIDE.tint}1a` }}>
              <p className="text-[11px] leading-relaxed text-[var(--text)]">
                <span className="font-bold">Why it matters: </span>{FIBRE_GUIDE.flowNote}
              </p>
            </div>
          </div>
        </Sheet>
      );
    })() : null}
    </>
  );
}
