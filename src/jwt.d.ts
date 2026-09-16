import {JwtPayload} from 'jsonwebtoken'

export interface DecodedToken extends JwtPayload {
    id: string
    usuario?: string
    rol?: string
}