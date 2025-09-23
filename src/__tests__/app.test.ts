import app from '@/index'

describe('FitRecipes Backend App', () => {
  it('should return welcome message on root endpoint', async () => {
    const res = await app.request('/')
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.message).toBe('Welcome to FitRecipes Backend API')
    expect(data.version).toBe('1.0.0')
  })

  it('should return health status', async () => {
    const res = await app.request('/api/health')
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('FitRecipes Backend API is running')
    expect(data.version).toBe('1.0.0')
  })

  it('should return 404 for unknown endpoints', async () => {
    const res = await app.request('/unknown-endpoint')
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Not Found')
  })
})