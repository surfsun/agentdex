import { Metadata } from 'next'
import HomeClient from '@/components/home/HomeClient'

export const metadata: Metadata = {
  title: 'AgentDex — The tool directory built for AI agents',
  description: '发现专为 AI Agent 打造的工具目录：通信、记忆、网页抓取、代码执行、集成等。26+ 工具，22+ Agent-Friendly，10+ 分类',
  alternates: {
    canonical: 'https://www.agentdex.top',
  },
}

export default function HomePage() {
  return <HomeClient />
}