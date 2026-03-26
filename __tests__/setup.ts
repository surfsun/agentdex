import '@testing-library/jest-dom'

// Mock Next.js modules
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: () => Promise.resolve({
    get: () => ({ value: 'en' }),
  }),
}))