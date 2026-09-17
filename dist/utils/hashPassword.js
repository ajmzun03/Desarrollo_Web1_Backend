import bcrypt from 'bcrypt';
import { SALT_ROUND } from '../config.js';
export async function hassPassword(password) {
    return await bcrypt.hash(password, SALT_ROUND);
}
export async function comparePassword({ input, hashedInput }) {
    return await bcrypt.compare(input, hashedInput);
}
//# sourceMappingURL=hashPassword.js.map