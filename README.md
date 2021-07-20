# koa-jwt

A jwt middleware for Koa

## Install

```bash
npm install @sqrtthree/koa-jwt
```

## Usage

```ts
import * as Koa from 'koa'
import { jwtMiddleware } from '@sqrtthree/koa-jwt'

const app = new Koa()

app.use(
  jwtMiddleware({
    subject: 'identity_authentication',
  })
)
```

## Options

### subject: `string`

Target subject of jwt.

### issuer: `?string`

Target issuer of jwt.

### secret: `?string | (tokenPayload) => Promise<string>`

A string or function containing either the secret for HMAC algorithms.

### stateName: `?string`

Attribute name extended to `ctx.state`, the value is jwt payload. It will be `jwtPayload` by default.

---

> [sqrtthree.com](https://sqrtthree.com/) &nbsp;&middot;&nbsp;
> GitHub [@sqrthree](https://github.com/sqrthree) &nbsp;&middot;&nbsp;
> Twitter [@sqrtthree](https://twitter.com/sqrtthree)
