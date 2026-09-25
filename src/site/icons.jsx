// Small stroke icons for the public website (no emoji, no icon font).
const S = ({ size = 24, color = 'currentColor', width = 2, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>{children}</svg>
)

export const IconCheck = (p) => <S width={2.4} {...p}><path d="M20 6L9 17l-5-5" /></S>
export const IconArrow = (p) => <S width={2.4} {...p}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></S>
export const IconTarget = (p) => <S {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></S>
export const IconCap = (p) => <S {...p}><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></S>
export const IconShield = (p) => <S {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></S>
export const IconMail = (p) => <S {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></S>
export const IconChat = (p) => <S {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></S>
export const IconPin = (p) => <S {...p}><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></S>
export const IconPlay = ({ size = 20, color = '#1B3A5F' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
)
export const IconMenu = (p) => <S {...p}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></S>
export const IconClose = (p) => <S {...p}><path d="M6 6l12 12" /><path d="M18 6L6 18" /></S>
