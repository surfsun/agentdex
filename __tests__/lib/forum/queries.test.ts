/**
 * Tests for lib/forum/queries.ts
 * 
 * Tests core forum database operations:
 * - Agent Profile CRUD
 * - Post CRUD
 * - Comment CRUD
 * - Like operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase - must use factory function without top-level variables
vi.mock('@/lib/supabase', () => {
  // Type for the mock chain
  interface MockChain {
    insert: () => MockChain
    select: () => MockChain
    update: () => MockChain
    delete: () => MockChain
    eq: () => MockChain
    ilike: () => MockChain
    contains: () => MockChain
    order: () => MockChain
    upsert: () => MockChain
    single: () => Promise<{ data: null; error: null }>
    maybeSingle: () => Promise<{ data: null; error: null }>
    range: () => Promise<{ data: never[]; error: null; count: 0 }>
    then: (resolve: (value: { data: never[]; error: null }) => void) => void
  }

  // Create a flexible mock chain that supports all methods
  const createChain = (): MockChain => {
    const chain = {} as MockChain
    
    // Chainable methods that return the chain
    const chainableMethods = ['insert', 'select', 'update', 'delete', 'eq', 'ilike', 'contains', 'order', 'upsert'] as const
    
    chainableMethods.forEach(method => {
      chain[method] = vi.fn(() => chain)
    })
    
    // Terminal methods that return a Promise
    chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }))
    chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))
    chain.range = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
    
    // Make the chain thenable (awaitable) - returns a Promise when awaited
    chain.then = (resolve: (value: { data: never[]; error: null }) => void) => resolve({ data: [], error: null })
    
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
  createAgent,
  getAgentById,
  getAgentByName,
  listAgents,
  createPost,
  getPostById,
  listPosts,
  forkPost,
  createComment,
  getCommentsByPostId,
  buildCommentTree,
  likeTarget,
} from '@/lib/forum/queries'
import { supabaseAdmin } from '@/lib/supabase'

// Type for resolved chain values
interface ResolvedValue {
  data: unknown
  error: { message: string } | null
  count?: number
}

// Type for the resolved mock chain
interface ResolvedMockChain {
  insert: () => ResolvedMockChain
  select: () => ResolvedMockChain
  update: () => ResolvedMockChain
  delete: () => ResolvedMockChain
  eq: () => ResolvedMockChain
  ilike: () => ResolvedMockChain
  contains: () => ResolvedMockChain
  order: () => ResolvedMockChain
  upsert: () => ResolvedMockChain
  single: () => Promise<ResolvedValue>
  maybeSingle: () => Promise<ResolvedValue>
  range: () => Promise<ResolvedValue>
  then: (resolve: (value: ResolvedValue) => void) => void
}

// Helper to create a custom chain with resolved values
function createResolvedChain(resolvedValue: ResolvedValue, terminalMethod: 'single' | 'maybeSingle' | 'range' = 'single'): ResolvedMockChain {
  const chain = {} as ResolvedMockChain
  
  // Chainable methods that return the chain
  const chainableMethods = ['insert', 'select', 'update', 'delete', 'eq', 'ilike', 'contains', 'order', 'upsert'] as const
  
  chainableMethods.forEach(method => {
    chain[method] = vi.fn(() => chain)
  })
  
  // Terminal methods that return a Promise
  chain.single = vi.fn(() => Promise.resolve(resolvedValue))
  chain.maybeSingle = vi.fn(() => Promise.resolve(resolvedValue))
  chain.range = vi.fn(() => Promise.resolve(resolvedValue))
  
  // Make the chain thenable (awaitable) - returns a Promise when awaited
  chain.then = (resolve: (value: ResolvedValue) => void) => resolve(resolvedValue)
  
  return chain
}

// Get the mocked functions
const mockFrom = supabaseAdmin.from as ReturnType<typeof vi.fn<[], ResolvedMockChain>>
const mockRpc = supabaseAdmin.rpc as ReturnType<typeof vi.fn>

describe('Forum Queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== Agent Profiles ====================

  describe('createAgent', () => {
    it('should create an agent profile', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'TestAgent',
        platform: 'agentdex',
        expertise: ['coding'],
        personality: 'friendly',
        avatar_url: null,
        posts_count: 0,
        comments_count: 0,
        created_at: '2026-03-27T10:00:00Z',
        updated_at: '2026-03-27T10:00:00Z',
      }

      const chain = createResolvedChain({ data: mockAgent, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await createAgent({
        name: 'TestAgent',
        platform: 'agentdex',
        expertise: ['coding'],
        personality: 'friendly',
      })

      expect(result).toEqual(mockAgent)
      expect(mockFrom).toHaveBeenCalledWith('agent_profiles')
    })

    it('should throw error on failure', async () => {
      const chain = createResolvedChain({ data: null, error: { message: 'Duplicate name' } })
      mockFrom.mockReturnValue(chain)

      await expect(createAgent({
        name: 'TestAgent',
        platform: 'agentdex',
      })).rejects.toMatchObject({ message: 'Duplicate name' })
    })
  })

  describe('getAgentById', () => {
    it('should return agent when found', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'TestAgent',
        platform: 'agentdex',
      }

      const chain = createResolvedChain({ data: mockAgent, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getAgentById('agent-123')
      expect(result).toEqual(mockAgent)
    })

    it('should return null when not found', async () => {
      const chain = createResolvedChain({ data: null, error: { message: 'Not found' } })
      mockFrom.mockReturnValue(chain)

      const result = await getAgentById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getAgentByName', () => {
    it('should return agent by name and platform', async () => {
      const mockAgent = {
        id: 'agent-123',
        name: 'TestAgent',
        platform: 'agentdex',
      }

      const chain = createResolvedChain({ data: mockAgent, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getAgentByName('TestAgent', 'agentdex')
      expect(result).toEqual(mockAgent)
    })
  })

  describe('listAgents', () => {
    it('should list agents with pagination', async () => {
      const mockAgents = [
        { id: 'agent-1', name: 'Agent1' },
        { id: 'agent-2', name: 'Agent2' },
      ]

      const chain = createResolvedChain({ data: mockAgents, error: null, count: 2 })
      mockFrom.mockReturnValue(chain)

      const result = await listAgents({ page: 1, limit: 20 })
      expect(result.agents).toEqual(mockAgents)
      expect(result.total).toBe(2)
    })

    it('should filter by platform', async () => {
      const chain = createResolvedChain({ data: [], error: null, count: 0 })
      mockFrom.mockReturnValue(chain)

      await listAgents({ platform: 'agentdex' })
      // eq should have been called
      expect(chain.eq).toHaveBeenCalled()
    })
  })

  // ==================== Posts ====================

  describe('createPost', () => {
    it('should create a normal post', async () => {
      const mockPost = {
        id: 'post-123',
        author_id: 'agent-123',
        title: 'Test Post',
        content: 'Test content',
        tags: ['test'],
        likes_count: 0,
        comments_count: 0,
        views_count: 0,
        status: 'published',
        post_type: 'normal',
        created_at: '2026-03-27T10:00:00Z',
      }

      const chain = createResolvedChain({ data: mockPost, error: null })
      mockFrom.mockReturnValue(chain)
      mockRpc.mockResolvedValue({ error: null })

      const result = await createPost('agent-123', {
        title: 'Test Post',
        content: 'Test content',
        tags: ['test'],
      })

      expect(result.title).toBe('Test Post')
    })

    it('should create a structured post with prompt_bundle', async () => {
      const mockPost = {
        id: 'post-123',
        author_id: 'agent-123',
        title: 'Structured Post',
        content: 'Summary',
        tags: ['prompt'],
        post_type: 'structured',
        prompt_bundle: {
          model: 'gpt-4',
          system_prompt: 'You are helpful',
          user_prompts: ['Hello'],
          tools: ['web_search'],
        },
        run_snapshot: {
          input_example: 'test input',
          expected_output: 'expected',
          actual_output: 'actual',
          evaluation_notes: 'notes',
        },
      }

      const chain = createResolvedChain({ data: mockPost, error: null })
      mockFrom.mockReturnValue(chain)
      mockRpc.mockResolvedValue({ error: null })

      const result = await createPost('agent-123', {
        title: 'Structured Post',
        content: 'Summary',
        tags: ['prompt'],
        post_type: 'structured',
        prompt_bundle: {
          model: 'gpt-4',
          system_prompt: 'You are helpful',
          user_prompts: ['Hello'],
          tools: ['web_search'],
        },
        run_snapshot: {
          input_example: 'test input',
          expected_output: 'expected',
          actual_output: 'actual',
          evaluation_notes: 'notes',
        },
      })

      expect(result.post_type).toBe('structured')
    })

    it('should fallback to base insert if schema mismatch', async () => {
      // First call fails with schema error
      const errorChain = createResolvedChain({
        data: null,
        error: { message: 'Could not find the post_type column' }
      })

      // Second call succeeds
      const successChain = createResolvedChain({
        data: { id: 'post-123', title: 'Test', content: 'Content' },
        error: null
      })

      mockFrom
        .mockReturnValueOnce(errorChain)
        .mockReturnValueOnce(successChain)
      mockRpc.mockResolvedValue({ error: null })

      const result = await createPost('agent-123', {
        title: 'Test',
        content: 'Content',
        post_type: 'structured', // Will be ignored in fallback
      })

      expect(result.id).toBe('post-123')
    })
  })

  describe('getPostById', () => {
    it('should return post with author', async () => {
      const mockPost = {
        id: 'post-123',
        title: 'Test Post',
        author: { id: 'agent-123', name: 'TestAgent' },
      }

      const chain = createResolvedChain({ data: mockPost, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getPostById('post-123')
      expect(result?.title).toBe('Test Post')
      expect(result?.author?.name).toBe('TestAgent')
    })
  })

  describe('listPosts', () => {
    it('should list posts sorted by hot', async () => {
      const mockPosts = [
        { id: 'post-1', title: 'Hot Post', likes_count: 100 },
        { id: 'post-2', title: 'New Post', likes_count: 10 },
      ]

      const chain = createResolvedChain({ data: mockPosts, error: null, count: 2 })
      mockFrom.mockReturnValue(chain)

      const result = await listPosts({ sort: 'hot' })
      expect(result.posts).toEqual(mockPosts)
    })

    it('should filter by tag', async () => {
      const chain = createResolvedChain({ data: [], error: null, count: 0 })
      mockFrom.mockReturnValue(chain)

      await listPosts({ tag: '技术讨论' })
      expect(chain.contains).toHaveBeenCalledWith('tags', ['技术讨论'])
    })
  })

  describe('forkPost', () => {
    it('should fork a structured post', async () => {
      const originalPost = {
        id: 'original-123',
        title: 'Original',
        content: 'Original content',
        tags: ['test'],
        post_type: 'structured',
        prompt_bundle: { model: 'gpt-4', system_prompt: 'test' },
        run_snapshot: { input_example: 'test' },
        fork_count: 0,
      }

      const forkedPost = {
        id: 'fork-123',
        title: 'Forked',
        content: 'Original content',
        forked_from: 'original-123',
      }

      // getPostById chain
      const getChain = createResolvedChain({ data: originalPost, error: null })
      
      // insert chain
      const insertChain = createResolvedChain({ data: forkedPost, error: null })
      
      // update chain
      const updateChain = createResolvedChain({ error: null })

      mockFrom
        .mockReturnValueOnce(getChain)
        .mockReturnValueOnce(insertChain)
        .mockReturnValueOnce(updateChain)
        .mockReturnValueOnce(updateChain) // For updateAgentStats
      
      mockRpc.mockResolvedValue({ error: null })

      const result = await forkPost('agent-new', 'original-123', {
        title: 'Forked',
      })

      expect(result.forked_from).toBe('original-123')
    })

    it('should throw if original post not found', async () => {
      const chain = createResolvedChain({ data: null, error: { message: 'Not found' } })
      mockFrom.mockReturnValue(chain)

      await expect(forkPost('agent-new', 'nonexistent')).rejects.toThrow('Original post not found')
    })
  })

  // ==================== Comments ====================

  describe('createComment', () => {
    it('should create a comment and update counts', async () => {
      const mockComment = {
        id: 'comment-123',
        post_id: 'post-123',
        author_id: 'agent-123',
        parent_id: null,
        content: 'Test comment',
      }

      const chain = createResolvedChain({ data: mockComment, error: null })
      mockFrom.mockReturnValue(chain)
      mockRpc.mockResolvedValue({ error: null })

      const result = await createComment('post-123', 'agent-123', {
        content: 'Test comment',
      })

      expect(result.content).toBe('Test comment')
    })

    it('should create nested comment with parent_id', async () => {
      const mockComment = {
        id: 'comment-123',
        post_id: 'post-123',
        author_id: 'agent-123',
        parent_id: 'comment-parent',
        content: 'Nested reply',
      }

      const chain = createResolvedChain({ data: mockComment, error: null })
      mockFrom.mockReturnValue(chain)
      mockRpc.mockResolvedValue({ error: null })

      const result = await createComment('post-123', 'agent-123', {
        content: 'Nested reply',
        parent_id: 'comment-parent',
      })

      expect(result.parent_id).toBe('comment-parent')
    })
  })

  describe('getCommentsByPostId', () => {
    it('should return comments sorted chronologically', async () => {
      const mockComments = [
        { id: 'c1', content: 'First', created_at: '2026-03-27T10:00:00Z' },
        { id: 'c2', content: 'Second', created_at: '2026-03-27T10:01:00Z' },
      ]

      // This function uses await on the chain directly (no .single or .range)
      const chain = createResolvedChain({ data: mockComments, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getCommentsByPostId('post-123')
      expect(result).toEqual(mockComments)
    })
  })

  describe('buildCommentTree', () => {
    it('should build flat list into tree', () => {
      const flatComments = [
        { id: 'c1', parent_id: null, content: 'Root 1' },
        { id: 'c2', parent_id: 'c1', content: 'Reply to Root 1' },
        { id: 'c3', parent_id: 'c1', content: 'Another reply' },
        { id: 'c4', parent_id: null, content: 'Root 2' },
      ]

      const tree = buildCommentTree(flatComments)

      expect(tree.length).toBe(2) // Two root comments
      expect(tree[0].replies?.length).toBe(2) // Root 1 has two replies
      expect(tree[1].replies?.length).toBe(0) // Root 2 has no replies
    })

    it('should handle deeply nested comments', () => {
      const flatComments = [
        { id: 'c1', parent_id: null, content: 'Root' },
        { id: 'c2', parent_id: 'c1', content: 'Level 1' },
        { id: 'c3', parent_id: 'c2', content: 'Level 2' },
      ]

      const tree = buildCommentTree(flatComments)

      expect(tree.length).toBe(1)
      expect(tree[0].replies?.[0]?.replies?.[0]?.content).toBe('Level 2')
    })

    it('should handle empty list', () => {
      const tree = buildCommentTree([])
      expect(tree).toEqual([])
    })
  })

  // ==================== Likes ====================

  describe('likeTarget', () => {
    it('should like a post', async () => {
      // First call: check existing (no existing)
      const checkChain = createResolvedChain({ data: null, error: { message: 'Not found' } })

      // Second call: insert like
      const insertChain = createResolvedChain({ error: null })

      mockFrom
        .mockReturnValueOnce(checkChain)
        .mockReturnValueOnce(insertChain)

      mockRpc.mockResolvedValue({ error: null })

      const result = await likeTarget('agent-123', 'post', 'post-123')
      expect(result).toBe(true) // Liked
    })

    it('should unlike if already liked', async () => {
      // First call: check existing (exists)
      const checkChain = createResolvedChain({ data: { id: 'like-123' }, error: null })

      // Second call: delete like
      const deleteChain = createResolvedChain({ error: null })

      mockFrom
        .mockReturnValueOnce(checkChain)
        .mockReturnValueOnce(deleteChain)

      mockRpc.mockResolvedValue({ error: null })

      const result = await likeTarget('agent-123', 'post', 'post-123')
      expect(result).toBe(false) // Unliked
    })
  })
})