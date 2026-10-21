import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config.js', () => ({ APP_NAME: 'COPAC', OTP_CANALES_AMBOS: true, OTP_EN_LOG: false }));
vi.mock('./sendSMS.js', () => ({ sendSMS: vi.fn() }));
vi.mock('./sendMail.js', () => ({ sendEmail: vi.fn() }));
vi.mock('../config/logger.js', () => ({ default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { enviarCodigo } from './notificarCodigo.service.js';
import { sendSMS } from './sendSMS.js';
import { sendEmail } from './sendMail.js';

const mockSMS = vi.mocked(sendSMS, true);
const mockEmail = vi.mocked(sendEmail, true);
const destino = { telefono: '58493915', correo: 'a@b.com' };

describe('enviarCodigo con OTP_ENVIAR_AMBOS=true', () => {
  beforeEach(() => vi.resetAllMocks());

  it('envía por SMS y por correo a la vez y devuelve "ambos"', async () => {
    mockSMS.mockResolvedValueOnce(true);
    mockEmail.mockResolvedValueOnce(true);
    expect(await enviarCodigo(destino, '123456', 'login')).toBe('ambos');
    expect(mockSMS).toHaveBeenCalledOnce();
    expect(mockEmail).toHaveBeenCalledOnce();
  });

  it('si el SMS falla pero el correo sale, devuelve "email"', async () => {
    mockSMS.mockResolvedValueOnce(false);
    mockEmail.mockResolvedValueOnce(true);
    expect(await enviarCodigo(destino, '123456', 'login')).toBe('email');
  });

  it('si el correo falla pero el SMS sale, devuelve "sms"', async () => {
    mockSMS.mockResolvedValueOnce(true);
    mockEmail.mockResolvedValueOnce(false);
    expect(await enviarCodigo(destino, '123456', 'reset')).toBe('sms');
  });

  it('si ambos fallan devuelve null', async () => {
    mockSMS.mockResolvedValueOnce(false);
    mockEmail.mockResolvedValueOnce(false);
    expect(await enviarCodigo(destino, '123456', 'login')).toBeNull();
  });

  it('sin correo usa solo el SMS (flujo normal)', async () => {
    mockSMS.mockResolvedValueOnce(true);
    expect(await enviarCodigo({ telefono: '58493915', correo: null }, '123456', 'login')).toBe('sms');
    expect(mockEmail).not.toHaveBeenCalled();
  });
});
