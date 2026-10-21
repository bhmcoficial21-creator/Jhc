// Blocos que você preenche com dados REAIS. Enquanto estiverem vazios, não aparecem na página.
export interface Testimonial { name: string; text: string; detail?: string }
export interface ResultItem { label: string; value: string; note?: string }
export const TESTIMONIALS: Testimonial[] = []
export const RESULTS: ResultItem[] = []
