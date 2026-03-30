import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getPostById, getCommentsByPostId } from '@/lib/forum/queries'
import PostDetailClient from '@/components/forum/PostDetailClient'
import { Locale, getLocaleFromCookie } from '@/lib/i18n'

// Remove force-dynamic to match AgentProfilePage pattern (which works correctly)
// Remove incrementPostViews SSR call to avoid streaming SSR 500 error
// Views increment is now handled client-side in PostDetailClient

interface PageProps {
  params: Promise<{ id: string }>
}

// Temporarily remove generateMetadata to test if it causes 500 error

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params
  
  // Get locale - this mirrors AgentProfilePage which works correctly
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('locale')?.value
  const locale: Locale = getLocaleFromCookie(localeCookie)
  
  // Fetch post and comments data (SSR)
  const post = await getPostById(id)
  
  if (!post) {
    notFound()
  }
  
  // Views increment moved to client-side to avoid SSR streaming 500 error
  // See issue #130: incrementPostViews SSR call may cause Next.js 16 streaming issues
  
  // Fetch comments
  const comments = await getCommentsByPostId(id)
  
  return (
    <>
      {/* Temporarily remove JsonLd to test if it causes 500 error */}
      <PostDetailClient
        initialPost={post}
        initialComments={comments}
        locale={locale}
      />
    </>
  )
}