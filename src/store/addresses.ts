import { useSyncExternalStore } from 'react';

import { errorMessage } from '@/api/client';
import { shop } from '@/services';
import type { Address, AddressInput } from '@/services/types';

/**
 * Saved addresses, shared by checkout and the address book so an edit in one
 * shows up in the other. `selectedId` is the checkout's delivery address; it
 * defaults to whichever the backend marks primary.
 */
type AddressState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: Address[];
  error: string | null;
  selectedId: string | null;
};

let state: AddressState = { status: 'idle', items: [], error: null, selectedId: null };
const listeners = new Set<() => void>();

function setState(patch: Partial<AddressState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function pickSelected(items: Address[], current: string | null) {
  if (current && items.some((a) => a.id === current)) return current;
  return (items.find((a) => a.isPrimary) ?? items[0])?.id ?? null;
}

async function load() {
  if (state.status !== 'ready') setState({ status: 'loading', error: null });
  try {
    const items = await shop.addresses.list();
    setState({ status: 'ready', items, error: null, selectedId: pickSelected(items, state.selectedId) });
  } catch (err) {
    if (state.status !== 'ready') setState({ status: 'error', error: errorMessage(err) });
    throw err;
  }
}

export const addressActions = {
  load,
  select(id: string) {
    setState({ selectedId: id });
  },
  async save(input: AddressInput, id?: string) {
    if (id) await shop.addresses.update(id, input);
    else await shop.addresses.create(input);
    await load();
    // a newly added address becomes the delivery address
    if (!id) {
      const added = state.items.find((a) => !a.isPrimary && a.line1 === input.line1 && a.pinCode === input.pinCode);
      if (added) setState({ selectedId: added.id });
    }
  },
  async remove(id: string) {
    const previous = state.items;
    setState({ items: previous.filter((a) => a.id !== id) });
    try {
      await shop.addresses.remove(id);
    } finally {
      await load().catch(() => setState({ items: previous }));
    }
  },
  async setPrimary(id: string) {
    setState({ items: state.items.map((a) => ({ ...a, isPrimary: a.id === id })), selectedId: id });
    try {
      await shop.addresses.setPrimary(id);
    } finally {
      await load().catch(() => {});
    }
  },
  reset() {
    setState({ status: 'idle', items: [], error: null, selectedId: null });
  },
};

export function useAddresses() {
  return useSyncExternalStore(subscribe, () => state);
}

export function formatAddress(a: Address) {
  return [a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.pinCode}`].filter((part) => part && part.trim()).join(', ');
}
