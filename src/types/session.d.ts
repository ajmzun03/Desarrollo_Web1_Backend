import 'express-session'

declare module 'express-session' {
  interface SessionData {
    user? : {
      tipo: 'empleado' | 'cliente';
      id: number;
      rol?: string;
      sucursalId?: number;
    }
  }
}