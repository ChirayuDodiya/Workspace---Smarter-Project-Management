import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Automatically clean up DOM rendering after each test to keep tests isolated
afterEach(() => {
  cleanup();
});

// Mock ResizeObserver globally for jsdom environment compatibility
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
