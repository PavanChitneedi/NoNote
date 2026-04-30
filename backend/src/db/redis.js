import Redis from "ioredis";

const redis = new Redis({
  host:     process.env.REDIS_HOST || "localhost",
  port:     parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

redis.on("error", (err) => console.error("[redis] error:", err.message));
redis.on("connect", () => console.log("[redis] connected"));

export const PREFIXES = {
  refreshToken:  "rt:",
  rateLimit:     "rl:",
  userSession:   "us:",
  mapCache:      "mc:",
};

// Factory for additional clients (needed for pub/sub — subscribed clients can't send commands)
export function createClient() {
  return new Redis({
    host:     process.env.REDIS_HOST || "localhost",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
  });
}

export default redis;
