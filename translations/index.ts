import { es } from './es';
import { ca } from './ca';

export const translations = {
  es,
  ca,
};

export type TranslationKey = keyof typeof es;
