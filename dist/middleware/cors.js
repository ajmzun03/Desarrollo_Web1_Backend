import cors from 'cors';
import { ACCEPTED_ORIGINS } from "../utils/origins.js";
export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) => cors({
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        if (acceptedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
});
//# sourceMappingURL=cors.js.map