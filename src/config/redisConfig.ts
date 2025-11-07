import Redis, { type RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

export const redisOptions: RedisOptions = redisConfig;

const redisConnection = new Redis(redisConfig);

export default redisConnection;
