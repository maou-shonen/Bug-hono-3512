import { Hono } from "hono"
import { createMiddleware } from "hono/factory"
import { Redis } from "ioredis"

const redisUrls = {
  default: "redis://127.0.0.1:6379",
  test1: "redis://127.0.0.1:16379",
  test2: "redis://127.0.0.1:26380",
}

type RedisKey = keyof typeof redisUrls

const clients = new Map<RedisKey, Redis>()

const useRedis = <ContextKey extends string = "redis">(
  redisKey: RedisKey,
  contextKey?: ContextKey,
) => {
  type Env = {
    Variables: {
      [key in ContextKey]: Redis
    }
  }

  contextKey ??= "redis" as ContextKey

  return createMiddleware<Env>(async (c, next) => {
    if (!clients.has(redisKey)) {
      const redisUrl = redisUrls[redisKey]
      clients.set(redisKey, new Redis(redisUrl))
    }

    const redis = clients.get(redisKey)!
    c.set(contextKey, redis)

    await next()
  })
}

const app = new Hono()
  .get("/", useRedis("default"), async (c) => {
    const redis = c.get("redis") // redis://127.0.0.1:6379
    return c.text("")
  })
  .get("/foo", useRedis("test1"), async (c) => {
    const redis = c.get("redis") // redis://127.0.0.1:16379
    return c.text("")
  })
  .get(
    "/multi",
    useRedis("test1", "redis1"),
    useRedis("test2", "redis2"),
    async (c) => {
      const redis1 = c.get("redis1") // redis://127.0.0.1:16380
      const redis2 = c.get("redis2") // redis://127.0.0.1:26380
      return c.text("")
    },
  )

export default app
