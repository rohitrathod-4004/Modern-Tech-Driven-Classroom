import Redis from 'ioredis';

// Create a robust connection, reusing connections when possible
let redisClient: Redis;
let redisConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(redisConnectionOptions);
    
    redisClient.on('error', (err) => {
      console.error('[Redis Error]', err);
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected to Redis');
    });
  }
  return redisClient;
};

// BullMQ needs its own connection instances for blocking operations
export const createBullMQConnection = (): Redis => {
  return new Redis(redisConnectionOptions);
};
