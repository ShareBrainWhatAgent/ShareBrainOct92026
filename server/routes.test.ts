import request from 'supertest'
import express from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./googleAuth', () => ({
  setupAuth: async () => {},
  isAuthenticated: (req: any, res: any, next: any) => {
    if (req.user) return next()
    res.status(401).json({ message: 'Unauthorized' })
  }
}))

vi.mock('./storage', async () => {
  const actual = await vi.importActual<typeof import('./storage')>('./storage')
  return {
    ...actual,
    storage: new actual.MemStorage()
  }
})

import { storage } from './storage'

import { registerRoutes } from './routes'

let app: express.Express

async function setupApp(authenticated = true) {
  const app = express()
  app.use(express.json())
  if (authenticated) {
    app.use((req, _res, next) => {
      (req as any).user = { id: 'user-1', claims: { sub: 'user-1' } }
      next()
    })
  }
  await registerRoutes(app)
  return app
}

beforeEach(async () => {
  app = await setupApp(true)
})

describe('POST /api/agents', () => {
  it('created agent belongs to logged-in user and appears in list', async () => {
    const createRes = await request(app)
      .post('/api/agents')
      .send({ name: 'Agent A', description: 'desc', category: 'General', model: 'gpt-4o' })
      .expect(201)

    expect(createRes.body.userId).toBe('user-1')

    const listRes = await request(app).get('/api/agents').expect(200)
    const ids = listRes.body.map((a: any) => a.id)
    expect(ids).toContain(createRes.body.id)
  })

  it('stores isPersonal flag when creating and updating', async () => {
    const createRes = await request(app)
      .post('/api/agents')
      .send({ name: 'Personal', description: 'p', category: 'General', model: 'gpt-4o', isPersonal: true })
      .expect(201)

    expect(createRes.body.isPersonal).toBe(true)

    let agent = await request(app).get(`/api/agents/${createRes.body.id}`).expect(200)
    expect(agent.body.isPersonal).toBe(true)

    await request(app)
      .put(`/api/agents/${createRes.body.id}`)
      .send({ isPersonal: false })
      .expect(200)

  agent = await request(app).get(`/api/agents/${createRes.body.id}`).expect(200)
  expect(agent.body.isPersonal).toBe(false)
  })
})

describe('GET /api/agents', () => {
  it('returns 401 when unauthenticated', async () => {
    const unauthApp = await setupApp(false)
    await request(unauthApp)
      .get('/api/agents')
      .expect(401)
  })
})

describe('POST /api/chat', () => {
  it('returns system prompt when message is "instructions"', async () => {
    const createRes = await request(app)
      .post('/api/agents')
      .send({
        name: 'Test Agent',
        description: 'desc',
        category: 'General',
        model: 'gpt-4o',
        systemPrompt: 'Here are the instructions.'
      })
      .expect(201)

    const chatRes = await request(app)
      .post('/api/chat')
      .send({ agentId: createRes.body.id, message: 'instructions' })
      .expect(200)

    expect(chatRes.body.message.role).toBe('assistant')
    expect(chatRes.body.message.content).toBe('Here are the instructions.')
  })

  it('returns 401 when unauthenticated', async () => {
    const unauthApp = await setupApp(false)
    await request(unauthApp)
      .post('/api/chat')
      .send({ message: 'hi' })
      .expect(401)
  })
})

describe('POST /api/chat error handling', () => {
  it('returns schema missing error when personal memory table is absent', async () => {
    const agentRes = await request(app)
      .post('/api/agents')
      .send({ name: 'Personal', description: 'd', category: 'General', model: 'gpt-4o', isPersonal: true })
      .expect(201)

    const spy = vi
      .spyOn(storage, 'createPersonalMemory')
      .mockRejectedValue({ code: '42P01' })

    const res = await request(app)
      .post('/api/chat')
      .send({ agentId: agentRes.body.id, message: 'remember that my name is John' })
      .expect(500)

    expect(res.body).toEqual({ message: 'Database schema missing: run migrations' })

    spy.mockRestore()
  })
})

describe('POST /api/contacts/agents', () => {
  it('stores userId from authenticated user', async () => {
    const agentRes = await request(app)
      .post('/api/agents')
      .send({ name: 'Agent B', description: 'd', category: 'General', model: 'gpt-4o' })
      .expect(201)

    const contactRes = await request(app)
      .post('/api/contacts/agents')
      .send({ agentId: agentRes.body.id })
      .expect(201)

    expect(contactRes.body.userId).toBe('user-1')
  })

  it('returns 401 when unauthenticated', async () => {
    const agentRes = await request(app)
      .post('/api/agents')
      .send({ name: 'Agent C', description: 'd', category: 'General', model: 'gpt-4o' })
      .expect(201)

    const unauthApp = await setupApp(false)
    await request(unauthApp)
      .post('/api/contacts/agents')
      .send({ agentId: agentRes.body.id })
      .expect(401)
  })
})

