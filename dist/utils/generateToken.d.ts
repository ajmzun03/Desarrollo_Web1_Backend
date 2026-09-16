import type { DecodedToken } from '../jwt.js';
export declare function generarToken(userData: Record<string, any> | string, time?: string): string | undefined;
/**
 * Verifies a JWT token and returns its decoded payload.
 * Throws TokenExpiredError or JsonWebTokenError if the token is invalid.
 * Returns null if no token or no SECRET_KEY is provided.
 */
export declare function getInfoToToken(token: string): DecodedToken | null;
//# sourceMappingURL=generateToken.d.ts.map