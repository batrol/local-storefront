import { LANGUAGES, setLanguage, type Language } from '@/i18n'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  return (
    <select
      aria-label={t('common.language')}
      value={i18n.language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
    >
      {Object.entries(LANGUAGES).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  )
}
