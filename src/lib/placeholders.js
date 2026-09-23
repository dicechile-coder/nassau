// Fills {preferred_name}, {country}, … in exercise texts with the student's own details.

const NATIONALITIES = {
  'argentina': 'Argentinian', 'aruba': 'Aruban', 'bolivia': 'Bolivian', 'bonaire': 'Bonairean', 'brazil': 'Brazilian',
  'chile': 'Chilean', 'colombia': 'Colombian', 'costa rica': 'Costa Rican', 'cuba': 'Cuban', 'curacao': 'Curaçaoan',
  'curaçao': 'Curaçaoan', 'dominican republic': 'Dominican', 'ecuador': 'Ecuadorian', 'el salvador': 'Salvadoran',
  'guatemala': 'Guatemalan', 'haiti': 'Haitian', 'honduras': 'Honduran', 'jamaica': 'Jamaican', 'mexico': 'Mexican',
  'netherlands': 'Dutch', 'the netherlands': 'Dutch', 'nicaragua': 'Nicaraguan', 'panama': 'Panamanian',
  'paraguay': 'Paraguayan', 'peru': 'Peruvian', 'puerto rico': 'Puerto Rican', 'sint maarten': 'Sint Maartener',
  'spain': 'Spanish', 'suriname': 'Surinamese', 'trinidad and tobago': 'Trinidadian', 'united states': 'American',
  'usa': 'American', 'uruguay': 'Uruguayan', 'venezuela': 'Venezuelan',
}

export const COUNTRIES = [
  'Argentina', 'Aruba', 'Bolivia', 'Bonaire', 'Brazil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Curaçao',
  'Dominican Republic', 'Ecuador', 'El Salvador', 'Guatemala', 'Haiti', 'Honduras', 'Jamaica', 'Mexico',
  'Netherlands', 'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Puerto Rico', 'Sint Maarten', 'Spain', 'Suriname',
  'Trinidad and Tobago', 'United States', 'Uruguay', 'Venezuela',
]

export function suggestedNationality(country) {
  return NATIONALITIES[(country || '').trim().toLowerCase()] || ''
}

export function fill(text, profile) {
  if (!text) return text
  const p = profile || {}
  const values = {
    preferred_name: p.preferred_name || p.full_name?.split(' ')[0] || 'friend',
    country: p.country || 'your country',
    nationality: p.nationality || suggestedNationality(p.country) || '…',
    suggested_nationality: suggestedNationality(p.country) || '…',
    name_spelling: p.name_spelling || (p.preferred_name || '').toUpperCase().split('').join('-'),
    badge_name: (p.name_spelling || p.preferred_name || '').replaceAll('-', '').toUpperCase() || 'YOUR NAME',
  }
  return String(text).replace(/\{(\w+)\}/g, (m, key) => (key in values ? values[key] : m))
}

export function shuffled(list, seed = '') {
  // Stable shuffle, never returning the original order when that can be avoided.
  const arr = [...list]
  let h = 0
  for (const ch of seed + arr.join('|')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  for (let i = arr.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  if (arr.length > 1 && arr.every((v, i) => v === list[i])) arr.push(arr.shift())
  return arr
}
