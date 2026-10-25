import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config.js', () => ({ APP_NAME: 'COPAC', OTP_CANALES_AMBOS: false, OTP_EN_LOG: true }));
vi.mock('./sendSMS.js', () => ({ sendSMS: vi.fn() }));
vi.mock('./sendMail.js', () => ({ sendEmail: vi.fn() }));
const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }));
vi.mock('../config/logger.js', () => ({ default: logger }));

import { enviarCodigo } from './notificarCodigo.service.js';
import { sendSMS } from './sendSMS.js';
import { sendEmail } from './sendMail.js';

const destino = { telefono: '58493915', correo: 'a@b.com' };

describe('enviarCodigo con OTP_MOSTRAR_EN_LOG (solo desarrollo)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('escribe el código en el log y no falla el login aunque SMS y correo fallen', async () => {
    vi.mocked(sendSMS).mockResolvedValueOnce(false);
    vi.mocked(sendEmail).mockResolvedValueOnce(false);
    expect(await enviarCodigo(destino, '654321', 'login')).toBe('log');
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ codigo: '654321' }), expect.stringContaining('solo desarrollo'));
  });

  it('si un canal real funciona, devuelve ese canal (y también deja el código en el log)', async () => {
    vi.mocked(sendSMS).mockResolvedValueOnce(true);
    expect(await enviarCodigo(destino, '111111', 'reset')).toBe('sms');
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ codigo: '111111' }), expect.any(String));
  });
});
