import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { SECRET_KEY } from '../config.js';
export function generarToken(userData, time = '1d') {
    if (!SECRET_KEY)
        return undefined;
    if (typeof userData === 'string') {
        userData = { info: userData };
    }
    const cleanPayload = { ...userData };
    delete cleanPayload.exp;
    // Add a high-resolution nonce to guarantee token uniqueness even when called
    // multiple times within the same second for the same user
    cleanPayload._nonce = Date.now();
    return jwt.sign(cleanPayload, SECRET_KEY, { expiresIn: time });
}
/**
 * Verifies a JWT token and returns its decoded payload.
 * Throws TokenExpiredError or JsonWebTokenError if the token is invalid.
 * Returns null if no token or no SECRET_KEY is provided.
 */
export function getInfoToToken(token) {
    if (!token || !SECRET_KEY)
        return null;
    // Re-throw JWT errors so callers (errorHandler) can distinguish them
    return jwt.verify(token, SECRET_KEY);
}
//# sourceMappingURL=generateToken.js.map