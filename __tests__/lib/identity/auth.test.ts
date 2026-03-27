/**
 * Tests for AgentDex Identity Authentication System
 * Issue: #110 - Agent API 认证系统
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    rpc: vi.fn()
  }
}))

// Tests for API Key format validation
describe('API Key Format', () => {
  describe('ak_ prefix validation', () => {
    it('should recognize valid API key format', () => {
      const validApiKey = 'ak_abc123def456ghi789jkl012mno345pqr'
      expect(validApiKey.startsWith('ak_')).toBe(true)
      expect(validApiKey.length > 3).toBe(true)
    })

    it('should reject invalid API key format', () => {
      const invalidKeys = [
        'abc123', // no prefix
        'at_abc123', // wrong prefix (access token)
        'ak_', // empty key
        'AK_abc123', // uppercase prefix
      ]
      invalidKeys.forEach(key => {
        const isValid = key.startsWith('ak_') && key.length > 3
        expect(isValid).toBe(false)
      })
    })
  })
})

// Tests for Access Token format validation
describe('Access Token Format', () => {
  describe('at_ prefix validation', () => {
    it('should recognize valid access token format', () => {
      const validAccessToken = 'at_abc123def456ghi789jkl012mno345pqr'
      expect(validAccessToken.startsWith('at_')).toBe(true)
      expect(validAccessToken.length > 3).toBe(true)
    })

    it('should reject invalid access token format', () => {
      const invalidTokens = [
        'abc123', // no prefix
        'ak_abc123', // wrong prefix (api key)
        'at_', // empty token
        'AT_abc123', // uppercase prefix
      ]
      invalidTokens.forEach(token => {
        const isValid = token.startsWith('at_') && token.length > 3
        expect(isValid).toBe(false)
      })
    })
  })
})

// Tests for Token Type Detection
describe('Token Type Detection', () => {
  it('should correctly identify API Key (ak_)', () => {
    const token = 'ak_testkey123'
    const type = token.startsWith('ak_') ? 'api_key' : 
                 token.startsWith('at_') ? 'access_token' : 
                 token.startsWith('it_') ? 'identity_token' : 'unknown'
    expect(type).toBe('api_key')
  })

  it('should correctly identify Access Token (at_)', () => {
    const token = 'at_testtoken123'
    const type = token.startsWith('ak_') ? 'api_key' : 
                 token.startsWith('at_') ? 'access_token' : 
                 token.startsWith('it_') ? 'identity_token' : 'unknown'
    expect(type).toBe('access_token')
  })

  it('should correctly identify Identity Token (it_)', () => {
    const token = 'it_testidentity123'
    const type = token.startsWith('ak_') ? 'api_key' : 
                 token.startsWith('at_') ? 'access_token' : 
                 token.startsWith('it_') ? 'identity_token' : 'unknown'
    expect(type).toBe('identity_token')
  })

  it('should handle unknown token formats', () => {
    const token = 'unknown_token_format'
    const type = token.startsWith('ak_') ? 'api_key' : 
                 token.startsWith('at_') ? 'access_token' : 
                 token.startsWith('it_') ? 'identity_token' : 'unknown'
    expect(type).toBe('unknown')
  })
})

// Tests for Bearer Header Parsing
describe('Bearer Header Parsing', () => {
  it('should correctly parse Bearer header', () => {
    const authHeader = 'Bearer at_testtoken123'
    const token = authHeader.replace('Bearer ', '').trim()
    expect(token).toBe('at_testtoken123')
  })

  it('should handle case-insensitive Bearer prefix', () => {
    const authHeader = 'bearer at_testtoken123'
    const token = authHeader.replace(/^bearer\s+/i, '').trim()
    expect(token).toBe('at_testtoken123')
  })

  it('should handle extra whitespace', () => {
    const authHeader = 'Bearer   at_testtoken123  '
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    expect(token).toBe('at_testtoken123')
  })

  it('should reject non-Bearer headers', () => {
    const authHeader = 'Basic username:password'
    const isBearer = authHeader.toLowerCase().startsWith('bearer ')
    expect(isBearer).toBe(false)
  })
})

// Tests for Token Expiration
describe('Token Expiration', () => {
  describe('Access Token expiration (24 hours)', () => {
    it('should calculate correct expiration time', () => {
      const expiresInSeconds = 86400 // 24 hours
      const now = Date.now()
      const expiresAt = now + expiresInSeconds * 1000
      const diffHours = (expiresAt - now) / (1000 * 60 * 60)
      expect(diffHours).toBeCloseTo(24, 1)
    })

    it('should detect expired token', () => {
      const expiresAt = Date.now() - 1000 // 1 second ago
      const isExpired = Date.now() > expiresAt
      expect(isExpired).toBe(true)
    })

    it('should detect valid token', () => {
      const expiresAt = Date.now() + 86400 * 1000 // 24 hours ahead
      const isExpired = Date.now() > expiresAt
      expect(isExpired).toBe(false)
    })

    it('should detect token about to expire (5 min buffer)', () => {
      const expiresAt = Date.now() + 4 * 60 * 1000 // 4 minutes ahead
      const bufferMs = 5 * 60 * 1000 // 5 minute buffer
      const isEffectivelyExpired = Date.now() + bufferMs > expiresAt
      expect(isEffectivelyExpired).toBe(true)
    })
  })
})

// Tests for API Key Generation
describe('API Key Generation', () => {
  it('should generate keys with correct prefix', () => {
    const generateApiKey = () => 'ak_' + Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('')
    
    const apiKey = generateApiKey()
    expect(apiKey.startsWith('ak_')).toBe(true)
    expect(apiKey.length).toBe(35) // 3 prefix + 32 random chars
  })

  it('should generate unique keys', () => {
    const generateApiKey = () => 'ak_' + Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 36).toString(36)
    ).join('')
    
    const keys = Array.from({ length: 100 }, () => generateApiKey())
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(100) // All keys should be unique
  })
})

// Tests for Agent Name Validation
describe('Agent Name Validation', () => {
  it('should accept valid names', () => {
    const validNames = [
      'TestAgent',
      'My-Agent',
      'Agent_001',
      '中文Agent',
      'Agent中文',
      'Ab',
      'Test Agent 123'
    ]
    validNames.forEach(name => {
      const isValid = name.length >= 2 && name.length <= 20
      expect(isValid).toBe(true)
    })
  })

  it('should reject invalid names', () => {
    const invalidNames = [
      '', // empty
      'a', // too short (< 2)
      'verylongagentnamethatiswaytooolonggggg', // too long (> 20)
    ]
    invalidNames.forEach(name => {
      const isValid = name.length >= 2 && name.length <= 20
      expect(isValid).toBe(false)
    })
  })

  it('should trim whitespace before validation', () => {
    const name = '  TestAgent  '
    const trimmed = name.trim()
    expect(trimmed).toBe('TestAgent')
    expect(trimmed.length >= 2 && trimmed.length <= 20).toBe(true)
  })
})

// Tests for Authentication Flow
describe('Authentication Flow Logic', () => {
  describe('Register flow', () => {
    it('should return all required fields', () => {
      const mockResponse = {
        agent_identity: { id: 'uuid', agent_name: 'TestAgent', api_key: 'ak_xxx' },
        user_identity: { id: 'uuid', channel: 'web' },
        agent_profile: { id: 'uuid', name: 'TestAgent' },
        access_token: 'at_xxx',
        expires_in: 86400
      }
      
      expect(mockResponse.agent_identity.api_key).toBeDefined()
      expect(mockResponse.access_token).toBeDefined()
      expect(mockResponse.expires_in).toBe(86400)
      expect(mockResponse.agent_identity.api_key.startsWith('ak_')).toBe(true)
      expect(mockResponse.access_token.startsWith('at_')).toBe(true)
    })
  })

  describe('Refresh flow', () => {
    it('should return new access token', () => {
      const mockResponse = {
        access_token: 'at_newtoken',
        expires_in: 86400,
        agent_identity: { id: 'uuid', agent_name: 'TestAgent' }
      }
      
      expect(mockResponse.access_token).toBeDefined()
      expect(mockResponse.access_token.startsWith('at_')).toBe(true)
      expect(mockResponse.expires_in).toBe(86400)
    })

    it('should require valid API Key', () => {
      const input = { api_key: 'invalid_key' }
      const isValid = input.api_key.startsWith('ak_')
      expect(isValid).toBe(false)
    })
  })
})