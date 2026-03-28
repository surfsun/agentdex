/**
 * Tests for API Response Utilities
 * 
 * Tests the consistent JSON response handling for all API endpoints.
 */

import { describe, it, expect } from 'vitest'
import { jsonResponse, successResponse, errorResponse } from '@/lib/api-response'
import { NextResponse } from 'next/server'

describe('API Response Utilities', () => {
  describe('jsonResponse', () => {
    it('should create a JSON response with UTF-8 charset', async () => {
      const data = { message: 'Hello, 世界!' }
      const response = jsonResponse(data)
      
      expect(response).toBeInstanceOf(NextResponse)
      expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
      
      const body = await response.json()
      expect(body).toEqual(data)
    })

    it('should pass status code through init options', async () => {
      const data = { error: 'Not found' }
      const response = jsonResponse(data, { status: 404 })
      
      expect(response.status).toBe(404)
      
      const body = await response.json()
      expect(body).toEqual(data)
    })

    it('should pass headers through init options', () => {
      const data = { message: 'test' }
      const response = jsonResponse(data, { 
        headers: { 'X-Custom-Header': 'custom-value' }
      })
      
      expect(response.headers.get('X-Custom-Header')).toBe('custom-value')
    })

    it('should handle null data', async () => {
      const response = jsonResponse(null)
      const body = await response.json()
      expect(body).toBeNull()
    })

    it('should handle array data', async () => {
      const data = [1, 2, 3, '测试']
      const response = jsonResponse(data)
      const body = await response.json()
      expect(body).toEqual(data)
    })

    it('should handle nested objects', async () => {
      const data = {
        level1: {
          level2: {
            level3: '深层嵌套测试'
          }
        }
      }
      const response = jsonResponse(data)
      const body = await response.json()
      expect(body.level1.level2.level3).toBe('深层嵌套测试')
    })

    it('should preserve Chinese characters correctly', async () => {
      const data = {
        title: '中文标题',
        content: '这是一段中文内容，包含特殊字符：🎉、emoji'
      }
      const response = jsonResponse(data)
      const body = await response.json()
      expect(body.title).toBe('中文标题')
      expect(body.content).toBe('这是一段中文内容，包含特殊字符：🎉、emoji')
    })
  })

  describe('successResponse', () => {
    it('should create a success response with success: true', async () => {
      const data = { id: 1, name: '测试' }
      const response = successResponse(data)
      
      const body = await response.json()
      expect(body).toEqual({
        success: true,
        data: { id: 1, name: '测试' }
      })
    })

    it('should default to status 200', () => {
      const response = successResponse({ message: 'ok' })
      expect(response.status).toBe(200)
    })

    it('should allow custom status code', () => {
      const response = successResponse({ created: true }, { status: 201 })
      expect(response.status).toBe(201)
    })

    it('should have UTF-8 charset header', () => {
      const response = successResponse({})
      expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
    })

    it('should handle empty object', async () => {
      const response = successResponse({})
      const body = await response.json()
      expect(body).toEqual({ success: true, data: {} })
    })

    it('should handle primitive data types', async () => {
      // String
      const stringResponse = successResponse('hello')
      const stringBody = await stringResponse.json()
      expect(stringBody.data).toBe('hello')
      
      // Number
      const numberResponse = successResponse(42)
      const numberBody = await numberResponse.json()
      expect(numberBody.data).toBe(42)
      
      // Boolean
      const boolResponse = successResponse(true)
      const boolBody = await boolResponse.json()
      expect(boolBody.data).toBe(true)
    })

    it('should handle complex nested data', async () => {
      const data = {
        posts: [
          { id: '1', title: '帖子1', comments: [{ id: 'c1', text: '评论' }] },
          { id: '2', title: '帖子2', comments: [] }
        ],
        total: 2,
        pagination: { page: 1, limit: 20 }
      }
      const response = successResponse(data)
      const body = await response.json()
      expect(body.data.posts[0].comments[0].text).toBe('评论')
    })
  })

  describe('errorResponse', () => {
    it('should create an error response with success: false', async () => {
      const response = errorResponse('Something went wrong')
      
      const body = await response.json()
      expect(body).toEqual({
        success: false,
        error: 'Something went wrong'
      })
    })

    it('should default to status 500', () => {
      const response = errorResponse('Internal error')
      expect(response.status).toBe(500)
    })

    it('should allow custom status code', () => {
      const response = errorResponse('Not found', { status: 404 })
      expect(response.status).toBe(404)
    })

    it('should include error code when provided', async () => {
      const response = errorResponse('Validation failed', { 
        status: 400, 
        code: 'VALIDATION_ERROR' 
      })
      
      const body = await response.json()
      expect(body).toEqual({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR'
      })
      expect(response.status).toBe(400)
    })

    it('should not include code when not provided', async () => {
      const response = errorResponse('Simple error')
      const body = await response.json()
      expect(body).not.toHaveProperty('code')
    })

    it('should have UTF-8 charset header', () => {
      const response = errorResponse('错误信息')
      expect(response.headers.get('Content-Type')).toBe('application/json; charset=utf-8')
    })

    it('should preserve Chinese characters in error message', async () => {
      const response = errorResponse('发生错误：参数无效')
      const body = await response.json()
      expect(body.error).toBe('发生错误：参数无效')
    })

    it('should handle common HTTP error codes', async () => {
      // 400 Bad Request
      const badRequest = errorResponse('Invalid input', { status: 400 })
      expect(badRequest.status).toBe(400)
      
      // 401 Unauthorized
      const unauthorized = errorResponse('Unauthorized', { status: 401 })
      expect(unauthorized.status).toBe(401)
      
      // 403 Forbidden
      const forbidden = errorResponse('Forbidden', { status: 403 })
      expect(forbidden.status).toBe(403)
      
      // 404 Not Found
      const notFound = errorResponse('Not found', { status: 404 })
      expect(notFound.status).toBe(404)
      
      // 409 Conflict
      const conflict = errorResponse('Conflict', { status: 409 })
      expect(conflict.status).toBe(409)
      
      // 500 Internal Server Error
      const internalError = errorResponse('Internal server error')
      expect(internalError.status).toBe(500)
    })

    it('should handle empty error message', async () => {
      const response = errorResponse('')
      const body = await response.json()
      expect(body.error).toBe('')
    })
  })

  describe('Response Integration', () => {
    it('successResponse and errorResponse should have consistent structure', async () => {
      const success = successResponse({ id: 1 })
      const error = errorResponse('Failed', { status: 400 })
      
      const successBody = await success.json()
      const errorBody = await error.json()
      
      // Both should have 'success' field
      expect(typeof successBody.success).toBe('boolean')
      expect(typeof errorBody.success).toBe('boolean')
      
      // Success has 'data', error has 'error'
      expect(successBody).toHaveProperty('data')
      expect(errorBody).toHaveProperty('error')
    })

    it('should be usable in API-like scenarios', async () => {
      // Simulate API handler logic
      const validateInput = (input: unknown) => {
        if (!input || typeof input !== 'object') {
          return errorResponse('Invalid input', { status: 400, code: 'INVALID_INPUT' })
        }
        return null
      }
      
      const processData = (data: { name: string }) => {
        return successResponse({ processed: true, name: data.name })
      }
      
      // Test validation failure
      const validationError = validateInput(null)
      if (validationError) {
        const body = await validationError.json()
        expect(body.success).toBe(false)
        expect(body.code).toBe('INVALID_INPUT')
      }
      
      // Test successful processing
      const result = processData({ name: '测试数据' })
      const body = await result.json()
      expect(body.success).toBe(true)
      expect(body.data.processed).toBe(true)
    })
  })
})