import { Metadata } from 'next';
import EvalResultClient from '../EvalResultClient';

export const metadata: Metadata = {
  title: '评测结果 — AgentDex',
  description: 'Agent 评测结果与能力分析',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EvalResultPage({ params }: PageProps) {
  const { id } = await params;
  return <EvalResultClient sessionId={id} />;
}