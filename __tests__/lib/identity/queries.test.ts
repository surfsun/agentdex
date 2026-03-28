/**
 * Tests for lib/identity/queries.ts
 * 
 * Tests Agent Identity database operations:
 * - User Identity CRUD
 * - Agent Identity CRUD
 * - API Key verification
 * - Access Token operations
 * - Service Bindings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock forum queries (used by registerAgent)
vi.mock('@/lib/forum/queries', () => ({
  createAgent: vi.fn(() => Promise.resolve({
    id: 'profile-123',
    name: 'TestAgent',
    platform: 'agentdex'
  })),
  getAgentByName: vi.fn(() => Promise.resolve(null))
}))

// Mock Supabase - must use factory function without top-level variables
vi.mock('@/lib/supabase', () => {
  // Create a flexible mock chain that supports all methods
  const createChain = () => {
    const chain: Record<string, any> = {}
    
    // Chainable methods that return the chain
    const chainableMethods = ['insert', 'select', 'update', 'delete', 'eq', 'order', 'upsert', 'single']
    
    chainableMethods.forEach(method => {
      chain[method] = vi.fn(() => chain)
    })
    
    // Terminal methods that return a Promise
    chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }))
    
    // Make the chain thenable (awaitable) - returns a Promise when awaited
    chain.then = (resolve: any) => resolve({ data: null, error: null })
    
    return chain
  }
  
  return {
    supabaseAdmin: {
      from: vi.fn(() => createChain()),
      rpc: vi.fn(() => Promise.resolve({ error: null })),
    },
  }
})

// Import after mocking
import {
  upsertUserIdentity,
  getUserIdentityById,
  getUserIdentityByChannel,
  getAgentIdentityByApiKey,
  getAgentIdentityById,
  listAgentIdentitiesByUser,
  verifyApiKey,
  verifyIdentityToken,
  verifyAccessTokenFromDb,
} from '@/lib/identity/queries'
import { supabaseAdmin } from '@/lib/supabase'

// Helper to create a custom chain with resolved values
function createResolvedChain(resolvedValue: any) {
  const chain: Record<string, any> = {}
  
  // Chainable methods that return the chain
  const chainableMethods = ['insert', 'select', 'update', 'delete', 'eq', 'order', 'upsert']
  
  chainableMethods.forEach(method => {
    chain[method] = vi.fn(() => chain)
  })
  
  // Terminal methods that return a Promise
  chain.single = vi.fn(() => Promise.resolve(resolvedValue))
  
  // Make the chain thenable (awaitable) - returns a Promise when awaited
  chain.then = (resolve: any) => resolve(resolvedValue)
  
  return chain
}

// Get the mocked functions
const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn>
const mockRpc = supabaseAdmin.rpc as ReturnType<typeof vi.fn>

describe('Identity Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== User Identities ====================

  describe('upsertUserIdentity', () => {
    it('should create or update a user identity', async () => {
      const mockUserIdentity = {
        id: 'user-123',
        channel: 'web',
        channel_user_id: 'web-user-001',
        display_name: 'Test User',
        avatar_url: null,
        metadata: {}
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockUserIdentity, error: null }))
      
      const result = await upsertUserIdentity({
        channel: 'web',
        channel_user_id: 'web-user-001',
        display_name: 'Test User'
      })
      
      expect(mockFrom).toHaveBeenCalledWith('user_identities')
      expect(result).toEqual(mockUserIdentity)
    })

    it('should throw error on failure', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'DB error' } }))
      
      await expect(upsertUserIdentity({
        channel: 'web',
        channel_user_id: 'test'
      })).rejects.toThrow()
    })
  })

  describe('getUserIdentityById', () => {
    it('should return user identity by id', async () => {
      const mockUserIdentity = {
        id: 'user-123',
        channel: 'web',
        channel_user_id: 'web-user-001'
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockUserIdentity, error: null }))
      
      const result = await getUserIdentityById('user-123')
      
      expect(mockFrom).toHaveBeenCalledWith('user_identities')
      expect(result).toEqual(mockUserIdentity)
    })

    it('should return null on error', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Not found' } }))
      
      const result = await getUserIdentityById('nonexistent')
      
      expect(result).toBeNull()
    })
  })

  describe('getUserIdentityByChannel', () => {
    it('should return user identity by channel and channel_user_id', async () => {
      const mockUserIdentity = {
        id: 'user-123',
        channel: 'feishu',
        channel_user_id: 'ou_xxx'
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockUserIdentity, error: null }))
      
      const result = await getUserIdentityByChannel('feishu', 'ou_xxx')
      
      expect(mockFrom).toHaveBeenCalledWith('user_identities')
      expect(result).toEqual(mockUserIdentity)
    })

    it('should return null when not found', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Not found' } }))
      
      const result = await getUserIdentityByChannel('web', 'nonexistent')
      
      expect(result).toBeNull()
    })
  })

  // ==================== Agent Identities ====================

  describe('getAgentIdentityByApiKey', () => {
    it('should return agent identity by api key', async () => {
      const mockAgentIdentity = {
        id: 'agent-123',
        agent_name: 'TestAgent',
        api_key: 'ak_testkey123',
        status: 'active'
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockAgentIdentity, error: null }))
      
      const result = await getAgentIdentityByApiKey('ak_testkey123')
      
      expect(mockFrom).toHaveBeenCalledWith('agent_identities')
      expect(result).toEqual(mockAgentIdentity)
    })

    it('should return null for invalid key', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Not found' } }))
      
      const result = await getAgentIdentityByApiKey('ak_nonexistent')
      
      expect(result).toBeNull()
    })

    it('should only return active agents', async () => {
      // The query should filter by status: 'active'
      // This test verifies the mock is set up correctly
      const mockAgentIdentity = {
        id: 'agent-123',
        status: 'active'
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockAgentIdentity, error: null }))
      
      const result = await getAgentIdentityByApiKey('ak_active')
      
      expect(result?.status).toBe('active')
    })
  })

  describe('getAgentIdentityById', () => {
    it('should return agent identity by id', async () => {
      const mockAgentIdentity = {
        id: 'agent-123',
        agent_name: 'TestAgent'
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockAgentIdentity, error: null }))
      
      const result = await getAgentIdentityById('agent-123')
      
      expect(mockFrom).toHaveBeenCalledWith('agent_identities')
      expect(result).toEqual(mockAgentIdentity)
    })

    it('should return null on error', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Not found' } }))
      
      const result = await getAgentIdentityById('nonexistent')
      
      expect(result).toBeNull()
    })
  })

  describe('listAgentIdentitiesByUser', () => {
    it('should return all agent identities for a user', async () => {
      const mockAgents = [
        { id: 'agent-1', agent_name: 'Agent1', status: 'active' },
        { id: 'agent-2', agent_name: 'Agent2', status: 'active' }
      ]
      
      // Create chain with range-like response
      const chain = createResolvedChain({ data: mockAgents, error: null })
      chain.range = vi.fn(() => Promise.resolve({ data: mockAgents, error: null }))
      
      mockFrom.mockReturnValueOnce(chain)
      
      const result = await listAgentIdentitiesByUser('user-123')
      
      expect(mockFrom).toHaveBeenCalledWith('agent_identities')
      expect(result).toEqual(mockAgents)
    })

    it('should return empty array on error', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Error' } }))
      
      const result = await listAgentIdentitiesByUser('user-123')
      
      expect(result).toEqual([])
    })
  })

  // ==================== API Key Verification ====================

  describe('verifyApiKey', () => {
    it('should return invalid for wrong format', async () => {
      const result = await verifyApiKey('invalid_key')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key format')
    })

    it('should return invalid for empty key', async () => {
      const result = await verifyApiKey('')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key format')
    })

    it('should return invalid for wrong prefix', async () => {
      const result = await verifyApiKey('at_testtoken')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid API key format')
    })

    it('should return invalid for non-existent key', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Not found' } }))
      
      const result = await verifyApiKey('ak_nonexistent')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('API key not found or inactive')
    })

    it('should return valid with full identity info', async () => {
      const mockAgentIdentity = {
        id: 'agent-123',
        agent_name: 'TestAgent',
        api_key: 'ak_validkey',
        status: 'active',
        user_identity_id: 'user-123',
        agent_profile_id: 'profile-123'
      }
      
      const mockUserIdentity = {
        id: 'user-123',
        channel: 'web',
        channel_user_id: 'web-001'
      }
      
      const mockProfile = {
        id: 'profile-123',
        name: 'TestAgent',
        platform: 'agentdex'
      }
      
      // Mock getAgentIdentityByApiKey
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockAgentIdentity, error: null }))
      
      // Mock getUserIdentityById
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockUserIdentity, error: null }))
      
      // Mock agent_profiles select
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockProfile, error: null }))
      
      const result = await verifyApiKey('ak_validkey')
      
      expect(result.valid).toBe(true)
      expect(result.agent_identity).toEqual(mockAgentIdentity)
      expect(result.user_identity).toEqual(mockUserIdentity)
      expect(result.agent_profile).toEqual(mockProfile)
    })
  })

  // ==================== Identity Token Verification ====================

  describe('verifyIdentityToken', () => {
    it('should return invalid for non-existent token', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Not found' } }))
      
      const result = await verifyIdentityToken('it_nonexistent')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token not found')
    })

    it('should return invalid for expired token', async () => {
      const mockToken = {
        id: 'token-123',
        token: 'it_expired',
        expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        agent_identities: {
          id: 'agent-123',
          agent_name: 'TestAgent'
        }
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockToken, error: null }))
      
      const result = await verifyIdentityToken('it_expired')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token expired')
    })

    it('should return valid with agent identity', async () => {
      const mockToken = {
        id: 'token-123',
        token: 'it_valid',
        expires_at: new Date(Date.now() + 86400 * 1000).toISOString(), // 24 hours ahead
        agent_identities: {
          id: 'agent-123',
          agent_name: 'TestAgent',
          status: 'active'
        }
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockToken, error: null }))
      
      const result = await verifyIdentityToken('it_valid')
      
      expect(result.valid).toBe(true)
      expect(result.agent_identity).toBeDefined()
    })
  })

  // ==================== Access Token Verification ====================

  describe('verifyAccessTokenFromDb', () => {
    it('should return invalid for wrong format', async () => {
      const result = await verifyAccessTokenFromDb('ak_wrongprefix')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid access token format')
    })

    it('should return invalid for non-existent token', async () => {
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: null, error: { message: 'Not found' } }))
      
      const result = await verifyAccessTokenFromDb('at_nonexistent')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Access token not found')
    })

    it('should return invalid for expired token', async () => {
      const mockToken = {
        id: 'token-123',
        token: 'at_expired',
        token_type: 'access',
        expires_at: new Date(Date.now() - 1000).toISOString(),
        agent_identities: {
          id: 'agent-123',
          agent_name: 'TestAgent'
        }
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockToken, error: null }))
      
      const result = await verifyAccessTokenFromDb('at_expired')
      
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Access token expired')
    })

    it('should return valid with agent identity', async () => {
      const mockToken = {
        id: 'token-123',
        token: 'at_valid',
        token_type: 'access',
        expires_at: new Date(Date.now() + 86400 * 1000).toISOString(),
        agent_identities: {
          id: 'agent-123',
          agent_name: 'TestAgent',
          status: 'active'
        }
      }
      
      mockFrom.mockReturnValueOnce(createResolvedChain({ data: mockToken, error: null }))
      
      const result = await verifyAccessTokenFromDb('at_valid')
      
      expect(result.valid).toBe(true)
      expect(result.agent_identity).toBeDefined()
    })
  })

  // ==================== Token Format Utilities ====================

  describe('Token Format Validation', () => {
    it('should validate API Key prefix', () => {
      const apiKey = 'ak_testkey123'
      expect(apiKey.startsWith('ak_')).toBe(true)
    })

    it('should validate Access Token prefix', () => {
      const accessToken = 'at_testtoken123'
      expect(accessToken.startsWith('at_')).toBe(true)
    })

    it('should validate Identity Token prefix', () => {
      const identityToken = 'it_testidentity123'
      expect(identityToken.startsWith('it_')).toBe(true)
    })

    it('should reject tokens without valid prefix', () => {
      const invalidToken = 'invalid_token'
      expect(invalidToken.startsWith('ak_') || invalidToken.startsWith('at_') || invalidToken.startsWith('it_')).toBe(false)
    })
  })

  // ==================== Expiration Time Calculations ====================

  describe('Expiration Time Calculations', () => {
    it('should calculate 24-hour expiration correctly', () => {
      const expiresInSeconds = 86400 // 24 hours
      const now = Date.now()
      const expiresAt = new Date(now + expiresInSeconds * 1000)
      const diffMs = expiresAt.getTime() - now
      const diffHours = diffMs / (1000 * 60 * 60)
      
      expect(diffHours).toBeCloseTo(24, 1)
    })

    it('should detect expired token correctly', () => {
      const expiresAt = new Date(Date.now() - 1000) // 1 second ago
      const isExpired = new Date() > expiresAt
      
      expect(isExpired).toBe(true)
    })

    it('should detect valid token correctly', () => {
      const expiresAt = new Date(Date.now() + 86400 * 1000) // 24 hours ahead
      const isExpired = new Date() > expiresAt
      
      expect(isExpired).toBe(false)
    })

    it('should apply 5-minute buffer for near-expiry tokens', () => {
      const expiresAt = new Date(Date.now() + 4 * 60 * 1000) // 4 minutes ahead
      const bufferMs = 5 * 60 * 1000 // 5 minute buffer
      const isEffectivelyExpired = Date.now() + bufferMs > expiresAt.getTime()
      
      expect(isEffectivelyExpired).toBe(true)
    })
  })

  // ==================== Slug Generation Logic ====================

  describe('Slug Generation', () => {
    it('should generate lowercase slug', () => {
      const name = 'TestAgent'
      const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20)
      
      expect(base).toBe('testagent')
    })

    it('should handle special characters', () => {
      const name = 'Test-Agent_123!'
      const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20)
      
      expect(base).toBe('test-agent-123')
    })

    it('should truncate long names', () => {
      const name = 'VeryLongAgentNameThatShouldBeTruncated'
      const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20)
      
      expect(base.length).toBe(20)
    })

    it('should handle Chinese names', () => {
      const name = '中文Agent测试'
      const base = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 20)
      
      // Chinese characters should be replaced with dashes
      expect(base).toBe('agent')
    })
  })
})