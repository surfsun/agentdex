import { Metadata } from 'next';
import EvalClient from './EvalClient';

export const metadata: Metadata = {
  title: 'AgentDex Eval — 测试你的 Agent',
  description: '评测你的 AI Agent 能力：工具调用、任务规划、信息获取、上下文记忆、异常处理、安全边界',
};

export default function EvalPage() {
  return <EvalClient />;
}