import type { Request } from 'express';

import type { ErrorCode } from './app-error.js';

type Locale = 'fr' | 'en';

const messages: Record<ErrorCode, Record<Locale, string>> = {
  BAD_REQUEST: {
    fr: 'Requete invalide.',
    en: 'Invalid request.',
  },
  UNAUTHORIZED: {
    fr: 'Authentification requise.',
    en: 'Authentication required.',
  },
  FORBIDDEN: {
    fr: 'Acces refuse.',
    en: 'Access denied.',
  },
  NOT_FOUND: {
    fr: 'Ressource introuvable.',
    en: 'Resource not found.',
  },
  CONFLICT: {
    fr: 'Conflit de donnees.',
    en: 'Data conflict.',
  },
  TOO_MANY_REQUESTS: {
    fr: 'Trop de requetes. Reessaye plus tard.',
    en: 'Too many requests. Please retry later.',
  },
  BAD_GATEWAY: {
    fr: 'Service externe indisponible temporairement.',
    en: 'External service temporarily unavailable.',
  },
  INTERNAL_SERVER_ERROR: {
    fr: 'Erreur interne du serveur.',
    en: 'Internal server error.',
  },
  INVALID_QUERY_PARAM: {
    fr: 'Parametre de requete invalide.',
    en: 'Invalid query parameter.',
  },
  INVALID_BODY: {
    fr: 'Corps de requete invalide.',
    en: 'Invalid request body.',
  },
  INVALID_EMAIL: {
    fr: 'Adresse email invalide.',
    en: 'Invalid email address.',
  },
  EMAIL_REQUIRED: {
    fr: 'Adresse email requise.',
    en: 'Email is required.',
  },
  INVALID_PASSWORD: {
    fr: 'Mot de passe invalide (8 caracteres minimum).',
    en: 'Invalid password (minimum 8 characters).',
  },
  INVALID_CREDENTIALS: {
    fr: 'Identifiants invalides.',
    en: 'Invalid credentials.',
  },
  EMAIL_ALREADY_USED: {
    fr: 'Cet email est deja utilise.',
    en: 'This email is already used.',
  },
  DAILY_GENERATION_QUOTA_EXCEEDED: {
    fr: 'Quota journalier de generation atteint.',
    en: 'Daily generation quota reached.',
  },
  TOO_MANY_GENERATION_REQUESTS: {
    fr: 'Trop de generations en peu de temps.',
    en: 'Too many generation requests in a short time.',
  },
  QUESTION_NOT_FOUND: {
    fr: 'Question introuvable.',
    en: 'Question not found.',
  },
  SUB_OBJECTIVE_NOT_FOUND: {
    fr: 'Sous-objectif introuvable.',
    en: 'Sub-objective not found.',
  },
  INVALID_CHOICE: {
    fr: 'Choix de reponse invalide.',
    en: 'Invalid answer choice.',
  },
  OPENAI_API_KEY_MISSING: {
    fr: 'Configuration OpenAI manquante.',
    en: 'Missing OpenAI configuration.',
  },
  OPENAI_EMPTY_RESPONSE: {
    fr: 'La generation a retourne une reponse vide.',
    en: 'Generation returned an empty response.',
  },
  OPENAI_INVALID_FORMAT: {
    fr: 'Format de generation invalide.',
    en: 'Invalid generation output format.',
  },
  OPENAI_API_FAILED: {
    fr: "L'API de generation est indisponible pour le moment.",
    en: 'Generation API is currently unavailable.',
  },
  ADMIN_INVALID_PAYLOAD: {
    fr: 'Payload admin invalide.',
    en: 'Invalid admin payload.',
  },
};

function resolveLocale(req: Request): Locale {
  const queryLang = typeof req.query?.lang === 'string' ? req.query.lang : '';
  if (queryLang === 'en' || queryLang === 'fr') {
    return queryLang;
  }

  const bodyLang =
    req.body && typeof req.body === 'object' && typeof (req.body as Record<string, unknown>).lang === 'string'
      ? ((req.body as Record<string, unknown>).lang as string)
      : '';
  if (bodyLang === 'en' || bodyLang === 'fr') {
    return bodyLang;
  }

  const header = req.headers['accept-language'];
  const raw = Array.isArray(header) ? header.join(',') : header ?? '';
  return raw.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

function localizeError(code: ErrorCode, locale: Locale): string {
  return messages[code][locale];
}

export { localizeError, resolveLocale };
