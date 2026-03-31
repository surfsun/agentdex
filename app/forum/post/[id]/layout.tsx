'use client'

// CSR layout to avoid SSR 500 errors in Next.js 16
// Metadata is handled by the page component via document.title

export default function PostDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}