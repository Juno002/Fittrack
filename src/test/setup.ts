import '@testing-library/jest-dom/vitest';
import { createElement, forwardRef, Fragment, type ReactNode } from 'react';
import { vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

const MOTION_PROPS = new Set([
  'animate',
  'exit',
  'initial',
  'layout',
  'layoutId',
  'transition',
  'variants',
  'whileDrag',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap',
]);

function sanitizeMotionProps(props: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !MOTION_PROPS.has(key)));
}

vi.mock('motion/react', () => {
  const motion = new Proxy(
    {},
    {
      get: (_, tag: string) =>
        forwardRef<HTMLElement | SVGElement, Record<string, unknown>>(({ children, ...props }, ref) =>
          createElement(tag, { ...sanitizeMotionProps(props), ref }, children),
        ),
    },
  );

  return {
    AnimatePresence: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children),
    motion,
  };
});
