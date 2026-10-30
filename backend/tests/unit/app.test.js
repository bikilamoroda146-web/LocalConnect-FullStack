import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../../src/app.js'
import { testConfig, fakePrismaUp, fakePrismaDown, fakePrismaHanging } from '../helpers/testConfig.js'

const appWith = (prisma, cfg = testConfig()) => createApp({ config: cfg, prisma })

describe('GET /api/v1/health', () => {
  it('returns 200 and database "up" when PostgreSQL answers', async () => {
    const res = await request(appWith(fakePrismaUp)).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ status: 'ok', database: 'up' })
    expect(new Date(res.body.data.timestamp).toString()).not.toBe('Invalid Date')
    expect(res.headers['cache-control']).toBe('no-store')
  })

  it('returns 503 and database "down" without leaking error details', async () => {
    const res = await request(appWith(fakePrismaDown)).get('/api/v1/health')
    expect(res.status).toBe(503)
    expect(res.body.data).toMatchObject({ status: 'degraded', database: 'down' })
    const text = JSON.stringify(res.body)
    expect(text).not.toContain('secret-host')
    expect(text).not.toContain('hunter2')
  })

  it('does not hang when the database never answers', async () => {
    const started = Date.now()
    const res = await request(appWith(fakePrismaHanging)).get('/api/v1/health')
    expect(res.status).toBe(503)
    expect(Date.now() - started).toBeLessThan(4000)
  })
})

describe('error handling', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(appWith(fakePrismaUp)).get('/api/v1/nope')
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'The requested resource was not found.' } })
  })

  it('returns 400 INVALID_JSON for a malformed JSON body', async () => {
    const res = await request(appWith(fakePrismaUp)).post('/api/v1/health').set('Content-Type', 'application/json').send('{"broken":')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_JSON')
  })

  it('returns 413 for a body over the size limit', async () => {
    const big = JSON.stringify({ x: 'a'.repeat(200 * 1024) })
    const res = await request(appWith(fakePrismaUp)).post('/api/v1/health').set('Content-Type', 'application/json').send(big)
    expect(res.status).toBe(413)
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE')
  })

  it('hides internal error details from clients', async () => {
    // A tiny app with a route that crashes, using the real error handler.
    const express = (await import('express')).default
    const { errorHandler } = await import('../../src/middleware/errorHandler.js')
    const tiny = express()
    tiny.get('/boom', () => {
      throw new Error('database password is hunter2')
    })
    tiny.use(errorHandler({ isProduction: true }))
    const res = await request(tiny).get('/boom')
    expect(res.status).toBe(500)
    expect(res.body.error.code).toBe('INTERNAL_ERROR')
    expect(JSON.stringify(res.body)).not.toContain('hunter2')
  })
})

describe('security headers and CORS', () => {
  it('sets security headers and hides the framework', async () => {
    const res = await request(appWith(fakePrismaUp)).get('/api/v1/health')
    expect(res.headers['x-powered-by']).toBeUndefined()
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('allows a configured frontend origin and allows credentials', async () => {
    const res = await request(appWith(fakePrismaUp)).get('/api/v1/health').set('Origin', 'http://localhost:5173')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
    expect(res.headers['access-control-allow-credentials']).toBe('true')
  })

  it('does not grant CORS access to other origins', async () => {
    const res = await request(appWith(fakePrismaUp)).get('/api/v1/health').set('Origin', 'http://evil.example')
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('answers a CORS preflight for an allowed origin', async () => {
    const res = await request(appWith(fakePrismaUp))
      .options('/api/v1/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
    expect(res.status).toBe(204)
    expect(res.headers['access-control-allow-methods']).toContain('POST')
  })
})
