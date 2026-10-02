'use client';
import { useEffect, useState } from 'react';
import type { TrainingPlan } from '@/lib/training';
type Data = { profile?: { goal: string }; scans: { measuredAt: string }[]; checkins: { day: string; notes: string; preferences: string; energy: number; sleepHours: string }[]; currentPlan: TrainingPlan; versions: { id: string; createdAt: string; plan: TrainingPlan }[] };
async function api(method = 'GET', body?: unknown) {
  const res = await fetch('/api/coach/training', { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const value = await res.json(); if (!res.ok) throw new Error(value.error || 'Could not save'); return value;
}
export default function TrainingWorkspace({ onPlanApplied }: { onPlanApplied: () => Promise<void> }) {
  const [data, setData] = useState<Data>(); const [plan, setPlan] = useState<TrainingPlan>();
  const [baseVersion, setBaseVersion] = useState<string | null>(null);
  const [goal, setGoal] = useState('maintain'); const [notes, setNotes] = useState(''); const [preferences, setPreferences] = useState('');
  const [day, setDay] = useState(() => [new Date().getFullYear(), String(new Date().getMonth() + 1).padStart(2, '0'), String(new Date().getDate()).padStart(2, '0')].join('-'));
  const [energy, setEnergy] = useState(3); const [sleepHours, setSleep] = useState(8);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  async function load() { const next: Data = await api(); setData(next); setPlan(next.currentPlan); setBaseVersion(next.versions[0]?.id ?? null); setGoal(next.profile?.goal ?? 'maintain'); }
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  async function run(task: () => Promise<void>) { setBusy(true); setError(''); setNotice(''); try { await task(); } catch (e) { setError(e instanceof Error ? e.message : 'Request failed'); } finally { setBusy(false); } }
  async function saveCheckin() { await api('PATCH', { day, goal, energy, sleepHours, notes, preferences }); }
  function edit(dayIndex: number, exerciseIndex: number, key: string, value: string | number) {
    setPlan(p => p && ({ ...p, days: p.days.map((d, i) => i !== dayIndex ? d : ({ ...d, exercises: d.exercises.map((e, j) => j !== exerciseIndex ? e : { ...e, [key]: value }) })) }));
  }
  return <section className="card mb-5 space-y-4">
    <div className="label text-violet-300">Adaptive training</div><h3 className="text-2xl font-bold">Your plan evolves with you</h3>
    <p className="muted text-sm">Save your daily update, generate a proposal, then review and apply it. New plans replace your upcoming rotation; a workout already in progress keeps its original exercises.</p>
    {error && <p role="alert" className="text-rose-300">{error}</p>}{notice && <p role="status" className="text-teal-300">{notice}</p>}
    <fieldset disabled={busy || !data} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <label className="field">Check-in date<input type="date" value={day} onChange={e => setDay(e.target.value)} /></label>
        <label className="field">Goal<select value={goal} onChange={e => setGoal(e.target.value)}><option value="lose">Lose fat</option><option value="maintain">Maintain</option><option value="gain">Build muscle</option></select></label>
        <label className="field">Energy · 1–5<input type="number" min="1" max="5" value={energy} onChange={e => setEnergy(Number(e.target.value))} /></label>
        <label className="field">Sleep hours<input type="number" min="0" max="24" step="0.5" value={sleepHours} onChange={e => setSleep(Number(e.target.value))} /></label>
      </div>
      <label className="field">How are you feeling today?<textarea value={notes} maxLength={2000} onChange={e => setNotes(e.target.value)} placeholder="Recovery, soreness, what worked, or what changed…" /></label>
      <label className="field">What would you like to try?<textarea value={preferences} maxLength={1000} onChange={e => setPreferences(e.target.value)} placeholder="Equipment, available days, time limits, exercises to try or avoid…" /></label>
      <p className="muted text-xs">Latest InBody: {data?.scans[0]?.measuredAt ?? 'No scan yet — add one in your body tracking screen'}. Generating sends your profile, recent scans, check-ins and training history to your connected AI provider.</p>
      <div className="flex flex-wrap gap-3"><button className="ghost" onClick={() => run(async () => { await saveCheckin(); const next = await api(); setData(next); setNotice('Check-in and goal saved.'); })}>Save daily update</button>
      <button className="btn" onClick={() => run(async () => { await saveCheckin(); const result = await api('POST', { action: 'generate' }); setPlan(result.plan); setBaseVersion(result.baseVersion); setNotice('Proposal ready. Review the exercises before applying.'); })}>Generate updated plan</button>
      <button className="ghost" onClick={() => run(load)}>Reload saved plan</button></div>
      {plan && <div className="space-y-4">
        <label className="field">Reason for this plan<textarea value={plan.rationale} maxLength={2000} onChange={e => setPlan({ ...plan, rationale: e.target.value })} /></label>
        {plan.days.map((d, i) => <div className="rounded-xl border border-white/10 p-4 space-y-3" key={i}>
          <div className="flex gap-3"><label className="field grow">Training day<input value={d.name} onChange={e => setPlan({ ...plan, days: plan.days.map((v, j) => j === i ? { ...v, name: e.target.value } : v) })} /></label><button className="ghost" onClick={() => setPlan({ ...plan, days: plan.days.filter((_, j) => j !== i) })}>Remove day</button></div>
          {d.exercises.map((e, j) => <div className="grid gap-2 md:grid-cols-[2fr_1fr_70px_70px_70px_auto]" key={j}>
            <label className="field">Exercise<input value={e.name} onChange={v => edit(i, j, 'name', v.target.value)} /></label>
            <label className="field">Muscle group<input value={e.muscleGroup ?? ''} onChange={v => edit(i, j, 'muscleGroup', v.target.value)} /></label>
            {(['sets', 'repMin', 'repMax'] as const).map(k => <label className="field" key={k}>{k === 'sets' ? 'Sets' : k === 'repMin' ? 'Min reps' : 'Max reps'}<input type="number" min="1" max={k === 'sets' ? 6 : 30} value={e[k]} onChange={v => edit(i, j, k, Number(v.target.value))} /></label>)}
            <button className="ghost" aria-label={`Remove ${e.name || 'exercise'}`} onClick={() => setPlan({ ...plan, days: plan.days.map((v, n) => n === i ? { ...v, exercises: v.exercises.filter((_, m) => m !== j) } : v) })}>×</button>
          </div>)}
          <button className="ghost" disabled={d.exercises.length >= 10} onClick={() => setPlan({ ...plan, days: plan.days.map((v, j) => j === i ? { ...v, exercises: [...v.exercises, { name: '', muscleGroup: '', sets: 3, repMin: 8, repMax: 12 }] } : v) })}>Add exercise</button>
        </div>)}
        <div className="flex gap-3"><button className="ghost" disabled={plan.days.length >= 7} onClick={() => setPlan({ ...plan, days: [...plan.days, { name: 'New day', exercises: [{ name: '', muscleGroup: '', sets: 3, repMin: 8, repMax: 12 }] }] })}>Add training day</button>
        <button className="btn" onClick={() => run(async () => { await api('POST', { action: 'apply', plan, baseVersion }); await load(); await onPlanApplied(); setNotice('Plan saved. Open Train to use your updated rotation.'); })}>Apply reviewed plan</button></div>
      </div>}
    </fieldset>
    {busy && <p role="status" className="muted">Working…</p>}
    {!!data?.versions.length && <details><summary>Plan history · {data.versions.length} recent versions</summary><div className="space-y-3 mt-3">{data.versions.map(v => <div key={v.id}><b>{new Date(v.createdAt).toLocaleString()}</b><p className="muted">{v.plan.rationale}</p><button className="ghost" disabled={busy} onClick={() => { setPlan(v.plan); setNotice('Previous version loaded as a draft. Apply it to restore this rotation.'); }}>Review this version</button></div>)}</div></details>}
    {!!data?.checkins.length && <details><summary>Recent daily updates</summary>{data.checkins.map(c => <p className="muted mt-2" key={c.day}>{c.day} · Energy {c.energy}/5 · Sleep {c.sleepHours}h · {c.notes} {c.preferences}</p>)}</details>}
  </section>;
}
