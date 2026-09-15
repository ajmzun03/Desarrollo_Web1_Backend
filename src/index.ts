import express from "express";
import cookieParser from 'cookie-parser'
import type { Request, Response } from "express";
import rateLimit from "express-rate-limit"
import { corsMiddleware } from "./middleware/cors.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  legacyHeaders: false,
  message: {message: 'Demasiadas request, Por favor intenta más tarde.'}
})

const PORT = process.env.PORT ?? 3000;
app.use(limiter)
app.use(cookieParser())
app.use(corsMiddleware())
app.use(express.json());
app.disable('x-powered-by')

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});