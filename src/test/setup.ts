import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 })
})
