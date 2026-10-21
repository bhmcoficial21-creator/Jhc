import type { AppConfig } from '../lib/types'

export const DEFAULT_CONFIG: AppConfig = {
  phase_number: 1, phase_name: 'PREÇO DE LANÇAMENTO', monthly_price: 18.9, annual_price: 189.0,
  monthly_url: import.meta.env?.VITE_CHECKOUT_MONTHLY_URL ?? '', annual_url: import.meta.env?.VITE_CHECKOUT_ANNUAL_URL ?? '',
  manage_url: '', whatsapp: import.meta.env?.VITE_WHATSAPP ?? '', show_launch_badge: true, show_price_rise_notice: true,
}
export const PHASES = [{ n: 1, m: 18.9, a: 189 }, { n: 2, m: 24.9, a: 249 }, { n: 3, m: 29.9, a: 299 }]
