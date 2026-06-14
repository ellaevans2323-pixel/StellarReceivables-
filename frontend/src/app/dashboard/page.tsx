'use client';
import { useState, useEffect, useCallback } from 'react';
import { getWallet, connectWallet } from '@/lib/stellar';
import { createReceivable, fetchFarmerReceivables } from '@/lib/api';
import StatusPill from '@/components/StatusPill';

interface Receivable {
  id: string;
  crop_type: string;
  estimated_yield_kg: number;
  estimated_value: number;
  harvest_date: string;
  discount_rate_bps: number;
  status: string;
  funded_amount: number | null;
}

const CROPS = ['Maize', 'Wheat', 'Rice', 'Sorghum', 'Cassava', 'Coffee', 'Cocoa', 'Cotton'];
const INPUT = 'w-full px-3 py-2 rounded-lg bg-[#111a14] border border-[#1e3327] text-[#e8f5e9] text-sm focus:outline-none focus:border-[#16a34a]';
const LABEL = 'block text-xs text-[#6b9e7c] mb-1';

const EMPTY = {
  crop_type: 'Maize', estimated_yield_kg: '', estimated_value: '',
  harvest_date: '', discount_rate_bps: '800', risk_score: '40', location: '',
};

export default function DashboardPage() {
  const [wallet, setWallet]       = useState<string | null>(null);
  const [receivables, setRows]    = useState<Receivable[]>([]);
  const [form, setForm]           = useState(EMPTY);
  const [loading, setLoading]     = useState(false);

  const load = useCallback(async (w: string) => {
    setRows((await fetchFarmerReceivables(w)) as Receivable[]);
  }, []);

  useEffect(() => {
    getWallet().then(w => { if (w) { setWallet(w); load(w); } });
  }, [load]);

  async function handleConnect() {
    const w = await connectWallet();
    if (w) { setWallet(w); load(w); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) return;
    setLoading(true);
    try {
      await createReceivable({
        ...form,
        farmer_wallet: wallet,
        estimated_yield_kg: Number(form.estimated_yield_kg),
        estimated_value:    Number(form.estimated_value),
        discount_rate_bps:  Number(form.discount_rate_bps),
        risk_score:         Number(form.risk_score),
      });
      await load(wallet);
      setForm(EMPTY);
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-[#6b9e7c]">Connect your Freighter wallet to access your dashboard.</p>
      <button onClick={handleConnect}
        className="px-6 py-3 rounded-xl bg-[#f59e0b] text-[#0a0f0d] font-semibold hover:bg-[#b45309] transition-colors">
        Connect Wallet
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Farmer Dashboard</h1>

      {/* Create Form */}
      <div className="p-6 rounded-xl bg-[#111a14] border border-[#1e3327]">
        <h2 className="font-semibold mb-4">Create New Receivable</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Crop Type</label>
            <select className={INPUT} value={form.crop_type}
              onChange={e => setForm(f => ({ ...f, crop_type: e.target.value }))}>
              {CROPS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL}>Yield Estimate (kg)</label>
            <input className={INPUT} type="number" required placeholder="e.g. 1000"
              value={form.estimated_yield_kg}
              onChange={e => setForm(f => ({ ...f, estimated_yield_kg: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Estimated Value (XLM)</label>
            <input className={INPUT} type="number" required placeholder="e.g. 5000"
              value={form.estimated_value}
              onChange={e => setForm(f => ({ ...f, estimated_value: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Harvest Date</label>
            <input className={INPUT} type="date" required
              value={form.harvest_date}
              onChange={e => setForm(f => ({ ...f, harvest_date: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Discount Rate (bps, e.g. 800 = 8%)</label>
            <input className={INPUT} type="number" required
              value={form.discount_rate_bps}
              onChange={e => setForm(f => ({ ...f, discount_rate_bps: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL}>Location</label>
            <input className={INPUT} type="text" placeholder="e.g. Kenya, Rift Valley"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="col-span-2 md:col-span-3 flex justify-end">
            <button type="submit" disabled={loading}
              className="px-6 py-2 rounded-lg bg-[#f59e0b] text-[#0a0f0d] font-semibold hover:bg-[#b45309] transition-colors disabled:opacity-50">
              {loading ? 'Creating…' : 'Create Receivable'}
            </button>
          </div>
        </form>
      </div>

      {/* Receivables Table */}
      <div className="rounded-xl border border-[#1e3327] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#111a14] text-[#6b9e7c] text-xs uppercase">
            <tr>
              {['Crop', 'Yield (kg)', 'Value (XLM)', 'Harvest Date', 'Rate', 'Status', 'Funded'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e3327]">
            {receivables.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#6b9e7c]">No receivables yet</td></tr>
            )}
            {receivables.map(r => (
              <tr key={r.id} className="hover:bg-[#111a14]/50">
                <td className="px-4 py-3 font-medium">{r.crop_type}</td>
                <td className="px-4 py-3 mono">{r.estimated_yield_kg.toLocaleString()}</td>
                <td className="px-4 py-3 mono">{Number(r.estimated_value).toLocaleString()}</td>
                <td className="px-4 py-3">{new Date(r.harvest_date).toLocaleDateString()}</td>
                <td className="px-4 py-3 mono">{r.discount_rate_bps / 100}%</td>
                <td className="px-4 py-3"><StatusPill status={r.status} /></td>
                <td className="px-4 py-3 mono">{r.funded_amount ? Number(r.funded_amount).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
