import { Fragment, useId, useLayoutEffect, useSyncExternalStore, type ReactNode } from 'react';

/**
 * Renders content at the app root, above every screen and the tab bar —
 * without a native Modal. Android sizes a Modal's window differently from the
 * app on some phones, which cut the bottom off our sheets; drawn here, overlays
 * always get the app's real full-screen area.
 *
 * Mount <PortalHost /> once in the root layout; anything inside <Portal> shows up there.
 */
let entries: [string, ReactNode][] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function put(key: string, node: ReactNode) {
  const index = entries.findIndex(([k]) => k === key);
  entries = index === -1 ? [...entries, [key, node]] : entries.map((entry, i) => (i === index ? [key, node] : entry));
  emit();
}

function remove(key: string) {
  entries = entries.filter(([k]) => k !== key);
  emit();
}

export function PortalHost() {
  const current = useSyncExternalStore(subscribe, () => entries);
  return (
    <>
      {current.map(([key, node]) => (
        <Fragment key={key}>{node}</Fragment>
      ))}
    </>
  );
}

export function Portal({ children }: { children: ReactNode }) {
  const key = useId();
  // layout effects, so the overlay appears in the same frame as the screen update
  useLayoutEffect(() => {
    put(key, children);
  }, [key, children]);
  useLayoutEffect(() => () => remove(key), [key]);
  return null;
}
