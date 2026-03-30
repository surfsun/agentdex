/**
 * API Response Utilities
 * 
 * Provides consistent JSON response handling with proper UTF-8 charset
 * for all API endpoints.
 */

import { NextResponse } from 'next/server'

/**
 * Agent hint structure for API responses
 */
export interface AgentHint {
  description: string
  next_actions?: string[]
  endpoints?: string[]
}

/**
 * Create a JSON response with proper UTF-8 charset
 * 
 * @param data - Response data (will be JSON serialized)
 * @param init - Optional response init options (status, headers, etc.)
 * @returns NextResponse with Content-Type: application/json; charset=utf-8
 */
export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const response = NextResponse.json(data, init)
  response.headers.set('Content-Type', 'application/json; charset=utf-8')
  return response
}

/**
 * Create a JSON response with agent hint
 * 
 * @param data - Response data (must contain success field)
 * @param hint - Agent hint object
 * @param init - Optional response init options
 * @returns NextResponse with _agent_hint field
 */
export function jsonResponseWithHint(
  data: { success: boolean; [key: string]: unknown },
  hint: AgentHint,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(
    { ...data, _agent_hint: hint },
    init
  )
  response.headers.set('Content-Type', 'application/json; charset=utf-8')
  return response
}

/**
 * Create a success response
 * 
 * @param data - Response data
 * @param init - Optional response init options
 */
export function successResponse(data: unknown, init?: ResponseInit): NextResponse {
  return jsonResponse({ success: true, data }, init)
}

/**
 * Create an error response
 * 
 * @param error - Error message
 * @param options - Optional status and error code
 */
export function errorResponse(
  error: string,
  options?: { status?: number; code?: string }
): NextResponse {
  const body: { success: false; error: string; code?: string } = {
    success: false,
    error
  }
  if (options?.code) {
    body.code = options.code
  }
  return jsonResponse(body, { status: options?.status || 500 })
}