import { RedisStore } from "connect-redis";
import type { RequestHandler } from "express";
import session from "express-session";
import { SESSION_SECRET } from "../config.js";
import { redis } from "../services/redis.js";

export const sessionMiddleware: RequestHandler = session({
  store: new RedisStore({ client: redis, prefix: "session: " }),
  name: "sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
});