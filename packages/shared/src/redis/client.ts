import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(host = 'redis', port = 6379): Redis {
  if (redis) return redis;
  redis = new Redis({ host, port, retryStrategy: (times) => Math.min(times * 50, 2000) });
  redis.on('connect', () => console.log('[Redis] Connected'));
  redis.on('error', (err) => console.error('[Redis] Error:', err));
  return redis;
}

export async function cacheGet(key: string): Promise<string | null> {
  return getRedis().get(key);
}

export async function cacheSet(key: string, value: string, ttl = 60): Promise<void> {
  await getRedis().set(key, value, 'EX', ttl);
}
