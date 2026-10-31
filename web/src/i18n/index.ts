import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ptBR from './locales/pt-BR.json'

export const LANGUAGES = { en: 'English', 'pt-BR': 'Português (Brasil)' } as const
export type Language = keyof typeof LANGUAGES

const STORAGE_KEY = 'sf.lang'

function detectLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'pt-BR') return stored
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, 'pt-BR': { translation: ptBR } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function setLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang)
  void i18n.changeLanguage(lang)
}

export default i18n
