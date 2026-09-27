export const LOCALE_COOKIE = 'northstar-locale'
export const DEFAULT_LOCALE = 'en'

export const LOCALES = [
  { code: 'en', name: 'English', english: 'English' },
  { code: 'es', name: 'Español', english: 'Spanish' },
  { code: 'zh-CN', name: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: '繁體中文', english: 'Chinese (Traditional)' },
  { code: 'hi', name: 'हिन्दी', english: 'Hindi' },
  { code: 'ar', name: 'العربية', english: 'Arabic', rtl: true },
  { code: 'pt-BR', name: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
  { code: 'pt-PT', name: 'Português (Portugal)', english: 'Portuguese (Portugal)' },
  { code: 'fr', name: 'Français', english: 'French' },
  { code: 'de', name: 'Deutsch', english: 'German' },
  { code: 'ru', name: 'Русский', english: 'Russian' },
  { code: 'ja', name: '日本語', english: 'Japanese' },
  { code: 'ko', name: '한국어', english: 'Korean' },
  { code: 'it', name: 'Italiano', english: 'Italian' },
  { code: 'tr', name: 'Türkçe', english: 'Turkish' },
  { code: 'vi', name: 'Tiếng Việt', english: 'Vietnamese' },
  { code: 'id', name: 'Bahasa Indonesia', english: 'Indonesian' },
  { code: 'ms', name: 'Bahasa Melayu', english: 'Malay' },
  { code: 'fil', name: 'Filipino', english: 'Filipino' },
  { code: 'th', name: 'ไทย', english: 'Thai' },
  { code: 'bn', name: 'বাংলা', english: 'Bengali' },
  { code: 'ur', name: 'اردو', english: 'Urdu', rtl: true },
  { code: 'fa', name: 'فارسی', english: 'Persian', rtl: true },
  { code: 'he', name: 'עברית', english: 'Hebrew', rtl: true },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', english: 'Punjabi' },
  { code: 'gu', name: 'ગુજરાતી', english: 'Gujarati' },
  { code: 'mr', name: 'मराठी', english: 'Marathi' },
  { code: 'ta', name: 'தமிழ்', english: 'Tamil' },
  { code: 'te', name: 'తెలుగు', english: 'Telugu' },
  { code: 'kn', name: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'ml', name: 'മലയാളം', english: 'Malayalam' },
  { code: 'ne', name: 'नेपाली', english: 'Nepali' },
  { code: 'si', name: 'සිංහල', english: 'Sinhala' },
  { code: 'pl', name: 'Polski', english: 'Polish' },
  { code: 'uk', name: 'Українська', english: 'Ukrainian' },
  { code: 'nl', name: 'Nederlands', english: 'Dutch' },
  { code: 'sv', name: 'Svenska', english: 'Swedish' },
  { code: 'no', name: 'Norsk', english: 'Norwegian' },
  { code: 'da', name: 'Dansk', english: 'Danish' },
  { code: 'fi', name: 'Suomi', english: 'Finnish' },
  { code: 'el', name: 'Ελληνικά', english: 'Greek' },
  { code: 'cs', name: 'Čeština', english: 'Czech' },
  { code: 'sk', name: 'Slovenčina', english: 'Slovak' },
  { code: 'hu', name: 'Magyar', english: 'Hungarian' },
  { code: 'ro', name: 'Română', english: 'Romanian' },
  { code: 'bg', name: 'Български', english: 'Bulgarian' },
  { code: 'sr', name: 'Српски', english: 'Serbian' },
  { code: 'hr', name: 'Hrvatski', english: 'Croatian' },
  { code: 'sl', name: 'Slovenščina', english: 'Slovenian' },
  { code: 'lt', name: 'Lietuvių', english: 'Lithuanian' },
  { code: 'lv', name: 'Latviešu', english: 'Latvian' },
  { code: 'et', name: 'Eesti', english: 'Estonian' },
  { code: 'ca', name: 'Català', english: 'Catalan' },
  { code: 'sw', name: 'Kiswahili', english: 'Swahili' },
  { code: 'am', name: 'አማርኛ', english: 'Amharic' },
  { code: 'yo', name: 'Yorùbá', english: 'Yoruba' },
  { code: 'ha', name: 'Hausa', english: 'Hausa' },
  { code: 'ig', name: 'Igbo', english: 'Igbo' },
  { code: 'zu', name: 'isiZulu', english: 'Zulu' },
  { code: 'af', name: 'Afrikaans', english: 'Afrikaans' },
  { code: 'so', name: 'Soomaali', english: 'Somali' },
  { code: 'ht', name: 'Kreyòl ayisyen', english: 'Haitian Creole' },
  { code: 'km', name: 'ខ្មែរ', english: 'Khmer' },
  { code: 'my', name: 'မြန်မာ', english: 'Burmese' },
  { code: 'lo', name: 'ລາວ', english: 'Lao' },
  { code: 'mn', name: 'Монгол', english: 'Mongolian' },
  { code: 'kk', name: 'Қазақ', english: 'Kazakh' },
  { code: 'uz', name: 'Oʻzbek', english: 'Uzbek' },
  { code: 'az', name: 'Azərbaycan', english: 'Azerbaijani' },
  { code: 'hy', name: 'Հայերեն', english: 'Armenian' },
  { code: 'ka', name: 'ქართული', english: 'Georgian' },
] as const satisfies ReadonlyArray<{ code: string; name: string; english: string; rtl?: boolean }>

export type LocaleCode = (typeof LOCALES)[number]['code']

const byCode = new Map<string, (typeof LOCALES)[number]>(LOCALES.map((l) => [l.code.toLowerCase(), l]))

export function findLocale(code: string | null | undefined) {
  return code ? byCode.get(code.toLowerCase()) : undefined
}

export function isRtl(code: string) {
  const locale = findLocale(code)
  return Boolean(locale && 'rtl' in locale && locale.rtl)
}

/** Maps a browser tag like "pt", "zh-HK" or "es-MX" onto the closest supported locale. */
export function matchLocale(tag: string): LocaleCode | undefined {
  const exact = findLocale(tag)
  if (exact) return exact.code
  const [base, region = ''] = tag.toLowerCase().split('-')
  if (base === 'zh') return ['tw', 'hk', 'mo', 'hant'].includes(region) ? 'zh-TW' : 'zh-CN'
  if (base === 'pt') return region === 'pt' ? 'pt-PT' : 'pt-BR'
  if (base === 'nb' || base === 'nn') return 'no'
  if (base === 'tl') return 'fil'
  if (base === 'iw') return 'he'
  return findLocale(base)?.code
}
