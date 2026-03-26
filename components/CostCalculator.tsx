'use client'

import { useState, useMemo } from 'react'
import { PricingDetails, Locale } from '@/lib/tools'

interface CostCalculatorProps {
  toolName: string
  toolSlug: string
  pricing: string
  pricingDetails?: PricingDetails
  locale?: Locale
}

// Inner component with hooks at top level
function CostCalculatorInner({
  toolName,
  toolSlug,
  pricing,
  pricingDetails,
  locale = 'en'
}: CostCalculatorProps) {
  const [usageAmount, setUsageAmount] = useState<number>(100)
  const [selectedUnit, setSelectedUnit] = useState<string>(
    pricingDetails?.unit || 'requests'
  )

  const { model, currency, rate, tiers, free_tier, scenarios, cost_factors, notes, notes_zh } = pricingDetails!

  // Calculate cost based on model - hooks must be at top level
  const calculateCost = useMemo(() => {
    let cost = 0
    const totalUnits = usageAmount

    // Apply free tier deduction
    let billableUnits = totalUnits
    if (free_tier) {
      billableUnits = Math.max(0, totalUnits - free_tier.included)
    }

    switch (model) {
      case 'usage_based':
      case 'per_request':
      case 'token_based':
        cost = billableUnits * (rate || 0)
        break
      
      case 'tiered':
        if (tiers && tiers.length > 0) {
          let remaining = billableUnits
          for (const tier of tiers) {
            if (remaining <= 0) break
            const tierStart = tier.from
            const tierEnd = tier.to === null ? Infinity : tier.to
            const tierUnits = Math.min(remaining, tierEnd - tierStart)
            if (billableUnits > tierStart) {
              cost += tierUnits * tier.price
              remaining -= tierUnits
            }
          }
        }
        break
      
      case 'flat_rate':
        cost = rate || 0
        break
      
      case 'hybrid':
        cost = billableUnits * (rate || 0)
        break
    }

    return {
      totalUnits,
      billableUnits,
      freeUnits: totalUnits - billableUnits,
      cost,
      currency
    }
  }, [usageAmount, model, rate, tiers, free_tier, currency])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          💰 {locale === 'zh-CN' ? '成本计算器' : 'Cost Calculator'}
        </h3>
        <span className="text-sm bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full capitalize">
          {model.replace('_', ' ')}
        </span>
      </div>

      {/* Pre-calculated Scenarios */}
      {scenarios && scenarios.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {locale === 'zh-CN' ? '使用场景估算' : 'Usage Scenarios'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scenarios.map((scenario, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {locale === 'zh-CN' && scenario.label_zh ? scenario.label_zh : scenario.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {locale === 'zh-CN' && scenario.description_zh ? scenario.description_zh : scenario.description}
                </div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(scenario.monthly_cost)}
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                    /{locale === 'zh-CN' ? '月' : 'mo'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Calculator */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {locale === 'zh-CN' ? '自定义计算' : 'Custom Calculation'}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {locale === 'zh-CN' ? '使用量' : 'Usage Amount'}
            </label>
            <input
              type="number"
              value={usageAmount}
              onChange={(e) => setUsageAmount(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              min="0"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {locale === 'zh-CN' ? '单位' : 'Unit'}
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value={pricingDetails?.unit || 'requests'}>
                {pricingDetails?.unit || 'requests'}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {locale === 'zh-CN' ? '周期' : 'Period'}
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              defaultValue="month"
            >
              <option value="month">{locale === 'zh-CN' ? '每月' : 'Per Month'}</option>
              <option value="day">{locale === 'zh-CN' ? '每日' : 'Per Day'}</option>
            </select>
          </div>
        </div>

        {/* Cost Result */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-emerald-100 dark:border-emerald-900">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {locale === 'zh-CN' ? '总使用量' : 'Total Usage'}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(calculateCost.totalUnits)}
              </div>
            </div>
            {free_tier && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {locale === 'zh-CN' ? '免费额度' : 'Free Tier'}
                </div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  -{formatNumber(calculateCost.freeUnits)}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {locale === 'zh-CN' ? '计费数量' : 'Billable'}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(calculateCost.billableUnits)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {locale === 'zh-CN' ? '预估成本' : 'Estimated Cost'}
              </div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(calculateCost.cost)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Tier Info */}
      {free_tier && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <span>🎁</span>
            <span>
              {locale === 'zh-CN' 
                ? `免费套餐：每月 ${formatNumber(free_tier.included)} ${free_tier.unit}`
                : `Free tier: ${formatNumber(free_tier.included)} ${free_tier.unit}`}
            </span>
          </div>
        </div>
      )}

      {/* Pricing Notes */}
      {(notes || notes_zh) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          💡 {locale === 'zh-CN' && notes_zh ? notes_zh : notes}
        </div>
      )}

      {/* Cost Factors */}
      {cost_factors && cost_factors.length > 0 && (
        <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
          <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            {locale === 'zh-CN' ? '影响成本的因素' : 'Cost Factors'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {cost_factors.map((factor, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded"
              >
                {factor.name}: {factor.default_value} {factor.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* API Hint */}
      <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 {locale === 'zh-CN' ? '通过 API 获取定价数据：' : 'Get pricing via API:'}
          <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            curl https://www.agentdex.top/api/tools/{toolSlug}/pricing
          </code>
        </p>
      </div>
    </div>
  )
}

export default function CostCalculator({
  toolName,
  toolSlug,
  pricing,
  pricingDetails,
  locale = 'en'
}: CostCalculatorProps) {
  // If no detailed pricing, show simple message - this check is now at component boundary
  if (!pricingDetails) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          💰 {locale === 'zh-CN' ? '成本估算' : 'Cost Estimation'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {locale === 'zh-CN' 
            ? `${toolName} 采用 ${pricing} 定价模式。访问官网获取详细定价信息。`
            : `${toolName} uses a ${pricing} pricing model. Visit their website for detailed pricing.`}
        </p>
        <a
          href={`https://www.${toolSlug}.com/pricing`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-4 py-2 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-800 transition inline-block"
        >
          {locale === 'zh-CN' ? '查看官方定价 →' : 'View Official Pricing →'}
        </a>
      </div>
    )
  }

  return (
    <CostCalculatorInner
      toolName={toolName}
      toolSlug={toolSlug}
      pricing={pricing}
      pricingDetails={pricingDetails}
      locale={locale}
    />
  )
}