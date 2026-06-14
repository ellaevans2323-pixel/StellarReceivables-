'use client';
import { useState, useEffect } from 'react';
import { getWallet, daysUntil } from '@/lib/stellar';
import { fetchReceivables, fundReceivable } from '@/lib/api';
import StatusPill from '@/components/StatusPill';
import RiskBadge from '@/components/RiskBadge';

interface Receivable {
  id: string;
  crop_type: string;
  estimated_yield_kg: number;
  estimated_value: number;
  harvest_date: string;
  discount_rate_bps: number;
  status: string;
  risk_score: number;
  location: string | null;
}

const CROP_FILTERS = ['All', 'Maize', 'Wheat', 'Rice', 'Sorghum', 'Cassava', 'Coffee', 'Cocoa'];

export default function MarketplacePage() {
  const [wallet, setWallet]       = useState<string | null>(null);
  const [receivables, setRows]    = useState<Receivable[]>([]);
  const [crop, setCrop]           = useState('All');
  const [funding, setFunding]     = useState<string | null>(null);

  useEffect(() => {
    getWallet().then(setWallet);
    (fetchReceivables('Created') as Promise<Receivable[]>).then(setRows);
  }, []);

  const filtered = crop === 'All' ? receivables : receivables.filter(r => r.crop_type === crop);

  async function handleFund(r: Receivable) {
    if (!wallet) { alert('Connect wallet first'); return; }
    setFunding(r.id);
    try {
      const amount = r.estimated_value * (1 - r.discount_rate_bps / 10_000);
      await fundReceivable(r.id, wallet, amount);
      setRows(await fetchReceivables('Created') as Receivable[]);
    } finally {
      setFunding(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <span className="text-sm text-[#6b9e7c]">{filtered.length} available</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {CROP_FILTERS.map(c => (
          <button key={c} onClick={() => setCrop(c)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              crop === c
                ? 'bg-[#f59e0b] text-[#0a0f0d] font-semibold'
                : 'bg-[#111a14] border border-[#1e3327] text-[#6b9e7c] hover:border-[#16a34a]'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <p className="col-span-3 text-center py-12 text-[#6b9e7c]">No receivables available</p>
        )}
        {filtered.map(r => {
          const price    = r.estimated_value * (1 - r.discount_rate_bps / 10_000);
          const yieldPct = (r.discount_rate_bps / 100).toFixed(1);
          const days     = daysUntil(r.harvest_date);
          return (
            <div key={r.id}
              className="p-5 rounded-xl bg-[#111a14] border border-[#1e3327] space-y-4 hover:border-[#16a34a]/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{r.crop_type}</h3>
                  <p className="text-xs text-[#6b9e7c] mt-0.5">{r.location ?? 'Unknown location'}</p>
                </div>
                <RiskBadge score={r.risk_score ?? 50} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[#6b9e7c] text-xs">Yield</div>
                  <div className="mono font-medium">{r.estimated_yield_kg.toLocaleString()} kg</div>
                </div>
                <div>
                  <div className="text-[#6b9e7c] text-xs">Investor Yield</div>
                  <div className="mono font-medium text-[#f59e0b]">{yieldPct}%</div>
                </div>
                <div>
                  <div className="text-[#6b9e7c] text-xs">Price (XLM)</div>
                  <div className="mono font-medium">{price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-[#6b9e7c] text-xs">Days to Harvest</div>
                  <div className="mono font-medium">{days}d</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <StatusPill status={r.status} />
                <button onClick={() => handleFund(r)} disabled={funding === r.id}
                  className="px-4 py-1.5 rounded-lg bg-[#0f3d2e] border border-[#16a34a] text-sm hover:bg-[#16a34a]/20 transition-colors disabled:opacity-50">
                  {funding === r.id ? 'Funding…' : 'Fund'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
