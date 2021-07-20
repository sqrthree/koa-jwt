import Koa from 'koa'

import { parseTokenWithoutVerify, verifyToken } from '@sqrtthree/wrapped-jwt'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type secretFn = (tokenPayload: any) => Promise<string>

interface JWTOptions {
  subject: string
  issuer?: string
  secret?: string | secretFn
  stateName?: string
}

export default function jwtMiddleware(options: JWTOptions): Koa.Middleware {
  return async function jwt(ctx: Koa.Context, next: Koa.Next): Promise<void> {
    if (!ctx.headers.authorization) {
      ctx.throw(401, 'The request is missing an authentication token')
    }

    const token = ctx.headers.authorization.substring('Bearer '.length)

    if (!token) {
      ctx.throw(401, 'The request is missing an authentication token', {
        code: 'BEARER_TOKEN_REQUIRED',
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let payload: Record<string, any> = {}

    try {
      payload = await parseTokenWithoutVerify(token)
    } catch (err) {
      ctx.throw(400, 'Cannot parse token payload from request header', {
        code: 'BEARER_TOKEN_INVALID',
      })
    }

    let secret: string | undefined

    if (options.secret) {
      const isFunction = typeof options.secret === 'function'

      if (isFunction) {
        secret = await (options.secret as secretFn)(payload)
      } else {
        secret = options.secret as string
      }
    }

    try {
      if (secret) {
        await verifyToken(token, options.subject, options.issuer, {
          secret,
        })
      } else {
        await verifyToken(token, options.subject, options.issuer)
      }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        ctx.throw(401, 'Your session has expired. Please login again', {
          code: 'TOKEN_EXPIRED',
        })
      }

      ctx.throw(401, 'Invalid token session. Please login again', {
        code: 'TOKEN_INVALID',
      })
    }

    const stateName = options.stateName || 'jwtPayload'

    ctx.state[stateName] = payload

    return next()
  }
}
