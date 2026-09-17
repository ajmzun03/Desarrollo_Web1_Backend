import bcrypt from 'bcrypt'
import { SALT_ROUND } from '../config.js'

export async function hassPassword(password: string) {
    return await bcrypt.hash(password, SALT_ROUND)
}

interface Props {
    input: string,
    hashedInput: string
}

export async function comparePassword({input, hashedInput}: Props): Promise<boolean> {
    return await bcrypt.compare(input, hashedInput)
}