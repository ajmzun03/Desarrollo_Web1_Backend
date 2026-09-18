import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '../config.js';

export const stripe = new Stripe(STRIPE_SECRET_KEY);

/**
 * Mapeo de tarjetas de prueba de Stripe a sus test tokens.
 * Stripe bloquea el envío de datos crudos de tarjeta, por eso en test mode
 * usamos tokens (tok_visa, tok_mastercard, etc.) generados por Stripe.
 */
const tarjetasPrueba: Record<string, string> = {
  '4242424242424242': 'tok_visa',
  '4000056655665556': 'tok_visa_debit',
  '4000002760003182': 'tok_visa_credit',
  '5555555555554444': 'tok_mastercard',
  '5200828282828210': 'tok_mastercard_debit',
  '2223003122003222': 'tok_mastercard_credit',
  '5105105105105100': 'tok_mastercard',
  '378282246310005': 'tok_amex',
  '6011111111111117': 'tok_discover',
  '30569309025904': 'tok_diners',
  '6200000000000005': 'tok_unionpay',
};

export function testTokenParaTarjeta(number: string): string | undefined {
  return tarjetasPrueba[number.replace(/\s+/g, '')];
}