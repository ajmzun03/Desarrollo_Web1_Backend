import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../config.js', () => ({ APP_NAME: 'COPAC', OTP_CANALES_AMBOS: false, OTP_EN_LOG: false }));
vi.mock('./sendSMS.js', () => ({ sendSMS: vi.fn() }));
vi.mock('./sendMail.js', () => ({ sendEmail: vi.fn() }));

import { enviarCodigo } from './notificarCodigo.service.js';
import { sendSMS } from './sendSMS.js';
import { sendEmail } from './sendMail.js';

const mockSMS = vi.mocked(sendSMS, true);
const mockEmail = vi.mocked(sendEmail, true);

describe('notificarCodigo.enviarCodigo', () => {
  beforeEach(() => vi.clearAllMocks());

  it('usa SMS cuando hay teléfono y el envío funciona', async () => {
    mockSMS.mockResolvedValueOnce(true);
    const canal = await enviarCodigo({ telefono: '55551234', correo: 'a@b.com' }, '123456', 'login');
    expect(canal).toBe('sms');
    expect(mockSMS).toHaveBeenCalledWith({ phoneNumber: '55551234', code: '123456' });
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it('hace fallback a correo cuando el SMS falla', async () => {
    mockSMS.mockResolvedValueOnce(false);
    mockEmail.mockResolvedValueOnce(true);
    const canal = await enviarCodigo({ telefono: '55551234', correo: 'a@b.com' }, '123456', 'login');
    expect(canal).toBe('email');
    expect(mockEmail).toHaveBeenCalledWith('a@b.com', expect.stringContaining('verificación'), expect.stringContaining('123456'));
  });

  it('usa correo directo cuando no hay teléfono', async () => {
    mockEmail.mockResolvedValueOnce(true);
    const canal = await enviarCodigo({ correo: 'a@b.com' }, '654321', 'reset');
    expect(canal).toBe('email');
    expect(mockSMS).not.toHaveBeenCalled();
    expect(mockEmail).toHaveBeenCalledWith('a@b.com', expect.stringContaining('recuperar'), expect.stringContaining('654321'));
  });

  it('devuelve null cuando ambos canales fallan', async () => {
    mockSMS.mockResolvedValueOnce(false);
    mockEmail.mockResolvedValueOnce(false);
    const canal = await enviarCodigo({ telefono: '55551234', correo: 'a@b.com' }, '123456', 'login');
    expect(canal).toBeNull();
  });

  it('usa asunto distinto para reset vs login', async () => {
    mockEmail.mockResolvedValueOnce(true);
    await enviarCodigo({ correo: 'a@b.com' }, '111111', 'reset');
    const asunto = mockEmail.mock.calls[0]![1];
    expect(asunto).toContain('recuperar la contraseña');
  });
});
