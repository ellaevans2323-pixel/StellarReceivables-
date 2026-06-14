'use client';

import * as StellarSdk from '@stellar/stellar-sdk';

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const HORIZON_URL = 'https://horizon-testnet.stellar.org';
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? '';

declare global {
  interface Window {
    freighter?: {
      isConnected(): Promise<boolean>;
      getPublicKey(): Promise<string>;
      signTransaction(xdr: string, opts: { network: string }): Promise<string>;
    };
  }
}

export async function getWallet(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.freighter) return null;
  const connected = await window.freighter.isConnected();
  if (!connected) return null;
  return window.freighter.getPublicKey();
}

export async function connectWallet(): Promise<string | null> {
  if (typeof window === 'undefined' || !window.freighter) {
    window.open('https://www.freighter.app/', '_blank');
    return null;
  }
  return window.freighter.getPublicKey();
}

export function shortAddress(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}
