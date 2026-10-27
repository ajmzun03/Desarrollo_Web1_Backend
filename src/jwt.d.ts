import {JwtPayload} from 'jsonwebtoken'

export interface DecodedToken extends JwtPayload {
    id: string
    usuario?: string
    rol?: string
    correo_electronico?: string
    tipo?: string
    /** Presente solo en tokens temporales de 2FA; rechazados por authenticate */
    purpose?: string
    /** Id de la sesion MFA pendiente (solo en tokens temporales de 2FA) */
    sid?: string
}