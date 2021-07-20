const http = require('http')
const Koa = require('koa')
const test = require('ava')
const listen = require('test-listen')
const got = require('got')

const { jwtMiddleware } = require('../dist/index')

const app = new Koa()

app.use(
  jwtMiddleware({
    subject: 'identity_authentication',
    secret: 'secret',
  })
)

app.use((ctx) => {
  ctx.body = ctx.state.jwtPayload
})

test.before(async (t) => {
  t.context.server = http.createServer(app.callback())
  t.context.prefixUrl = await listen(t.context.server)
})

test.after.always((t) => {
  t.context.server.close()
})

test('should return 401 without bearer authorization header', async (t) => {
  try {
    await got(t.context.prefixUrl)
  } catch (err) {
    t.is(err.response.statusCode, 401)
    t.is(err.response.body, 'The request is missing an authentication token')
  }
})

test('should return 401 without authorization header', async (t) => {
  try {
    await got(t.context.prefixUrl, {
      headers: {
        Authorization: 'token',
      },
    })
  } catch (err) {
    t.is(err.response.statusCode, 401)
    t.is(err.response.body, 'The request is missing an authentication token')
  }
})

test('should return 401 with expired jwt', async (t) => {
  try {
    await got(t.context.prefixUrl, {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7fSwiaWF0IjoxNjI2NzgyODExLCJleHAiOjE2MjY3MTAzOTksImlzcyI6Imp3dCIsInN1YiI6ImlkZW50aXR5X2F1dGhlbnRpY2F0aW9uIn0.eQimwxHO5ZzCQHrT2_38ryJpUU0bzyQpkEqsdjMcpJ4',
      },
    })
  } catch (err) {
    t.is(err.response.statusCode, 401)
    t.is(err.response.body, 'Your session has expired. Please login again')
  }
})

test('should return 401 with invalid jwt payload', async (t) => {
  try {
    await got(t.context.prefixUrl, {
      headers: {
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
    })
  } catch (err) {
    t.is(err.response.statusCode, 401)
    t.is(err.response.body, 'Invalid token session. Please login again')
  }
})

test('should return 200 with valid jwt', async (t) => {
  const response = await got(t.context.prefixUrl, {
    headers: {
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7ImEiOjF9LCJpYXQiOjE2MjY3ODMxNDAsImV4cCI6MTk0MjE1Njc5OSwiaXNzIjoiand0Iiwic3ViIjoiaWRlbnRpdHlfYXV0aGVudGljYXRpb24ifQ.KyoRI_IcFKQ-nfV2Q684OLAD0jh06X5n-aOoEhG77fQ',
    },
    json: true,
  })

  t.is(response.statusCode, 200)
  t.is(response.body.a, 1)
})

test('should return 200 with promised secret', async (t) => {
  const app = new Koa()

  app.use(
    jwtMiddleware({
      subject: 'identity_authentication',
      secret: () => Promise.resolve('secret'),
    })
  )

  app.use((ctx) => {
    ctx.body = ctx.state.jwtPayload
  })

  const server = http.createServer(app.callback())
  const prefixUrl = await listen(server)

  const response = await got(prefixUrl, {
    headers: {
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7ImEiOjF9LCJpYXQiOjE2MjY3ODMxNDAsImV4cCI6MTk0MjE1Njc5OSwiaXNzIjoiand0Iiwic3ViIjoiaWRlbnRpdHlfYXV0aGVudGljYXRpb24ifQ.KyoRI_IcFKQ-nfV2Q684OLAD0jh06X5n-aOoEhG77fQ',
    },
    json: true,
  })

  t.is(response.statusCode, 200)
  t.is(response.body.a, 1)

  server.close()
})

test('should return 200 with default secret', async (t) => {
  const app = new Koa()

  app.use(
    jwtMiddleware({
      subject: 'identity_authentication',
    })
  )

  app.use((ctx) => {
    ctx.body = ctx.state.jwtPayload
  })

  const server = http.createServer(app.callback())
  const prefixUrl = await listen(server)

  const response = await got(prefixUrl, {
    headers: {
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjp7ImEiOjF9LCJpYXQiOjE2MjY3ODQwOTQsImV4cCI6MTk0MjE1Njc5OSwiaXNzIjoiand0Iiwic3ViIjoiaWRlbnRpdHlfYXV0aGVudGljYXRpb24ifQ.FR9GOJ-c4CKA-etACo0SnGBq6j6A6WNkFEAzV8Ld4Is',
    },
    json: true,
  })

  t.is(response.statusCode, 200)
  t.is(response.body.a, 1)
})
