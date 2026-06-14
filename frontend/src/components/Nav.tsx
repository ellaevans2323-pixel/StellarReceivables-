'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { connectWallet, getWallet, shortAddress } from '@/lib/stellar';

const links = [
  { href: '/',            label: 'Home' },
  { href: '/dashboard',   label: 'Dashboard' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/portfolio',   label: 'Portfolio' },
];

export default function Nav() {
  const path = usePathname();
  const [wallet, setWallet] = useState<string | null>(null);

  useEffect(() => { getWallet().then(setWallet); }, []);

  async function handleConnect() {
    const addr = await connectWallet();
    setWallet(addr);
  }

  return (
    <nav className="border-b border-[#1e3327] bg-[#0a0f0d]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-[#f59e0b] text-lg tracking-tight">
          🌾 StellarReceivables
        </Link>
        <div className="flex items-center gap-6">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`text-sm transition-colors ${
                path === l.href ? 'text-[#f59e0b]' : 'text-[#6b9e7c] hover:text-[#e8f5e9]'
              }`}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleConnect}
            className="ml-4 px-3 py-1.5 rounded-lg bg-[#0f3d2e] border border-[#16a34a] text-sm text-[#e8f5e9] hover:bg-[#16a34a]/20 transition-colors mono">
            {wallet ? shortAddress(wallet) : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </nav>
  );
}
