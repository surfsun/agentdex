import PostDetailPage from '@/components/forum/PostDetailPage'

// 完全静态渲染，客户端 CSR 获取数据
// 避免 Next.js 16 streaming SSR 500 错误

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <PostDetailPage postId={id} />
}