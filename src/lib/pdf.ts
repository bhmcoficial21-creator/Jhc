import type { CircuitDef } from './types'

/** PDF de uma página (A4): desenho visto de cima, distâncias em metros, ordem dos cones e setup mínimo de 3x3 m. */
export async function downloadConeMap(c: CircuitDef, exerciseName: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210, M = 15
  doc.setFillColor(10, 10, 10); doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(198, 255, 0); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text(c.title, M, 18)
  doc.setFontSize(10); doc.setTextColor(255, 255, 255); doc.text('VARZEA PRO · mapa de cones', W - M, 18, { align: 'right' })

  // Área de desenho: quadrado de até 160 mm, escala uniforme (metros → mm)
  const box = 160, pad = 14
  const scale = Math.min((box - 2 * pad) / c.area[0], (box - 2 * pad) / c.area[1])
  const ox = (W - c.area[0] * scale) / 2, oy = 52
  doc.setDrawColor(120); doc.setLineDashPattern([2, 2], 0); doc.rect(ox, oy, c.area[0] * scale, c.area[1] * scale); doc.setLineDashPattern([], 0)
  doc.setTextColor(90); doc.setFontSize(10)
  doc.text(`Área mínima: ${c.area[0]} x ${c.area[1]} m (vista de cima)`, W / 2, oy - 6, { align: 'center' })
  const P = (x: number, y: number): [number, number] => [ox + x * scale, oy + (c.area[1] - y) * scale]   // y para cima = frente
  const by = new Map(c.cones.map((k) => [k.id, k]))

  // Trilha com setas e número da ordem
  doc.setDrawColor(40, 140, 0); doc.setLineWidth(0.8); doc.setTextColor(40, 140, 0); doc.setFontSize(9)
  for (let i = 0; i < c.path.length - 1; i++) {
    const a = by.get(c.path[i]), b = by.get(c.path[i + 1]); if (!a || !b) continue
    const [x1, y1] = P(a.x, a.y), [x2, y2] = P(b.x, b.y), len = Math.hypot(x2 - x1, y2 - y1) || 1
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, off = 3.2 * (i % 2 === 0 ? 1 : -1)
    const sx = x1 + ux * 5 - uy * off, sy = y1 + uy * 5 + ux * off, ex = x2 - ux * 5 - uy * off, ey = y2 - uy * 5 + ux * off
    doc.line(sx, sy, ex, ey)
    doc.setFillColor(40, 140, 0); doc.triangle(ex, ey, ex - ux * 3 - uy * 1.6, ey - uy * 3 + ux * 1.6, ex - ux * 3 + uy * 1.6, ey - uy * 3 - ux * 1.6, 'F')
    doc.text(String(i + 1), (sx + ex) / 2 - uy * 3 * Math.sign(off || 1), (sy + ey) / 2 + ux * 3 * Math.sign(off || 1), { align: 'center' })
  }
  // Cones
  c.cones.forEach((k) => {
    const [x, y] = P(k.x, k.y)
    doc.setFillColor(255, 138, 0); doc.setDrawColor(0); doc.setLineWidth(0.3); doc.triangle(x, y - 3.5, x - 3, y + 2.5, x + 3, y + 2.5, 'FD')
    doc.setTextColor(0); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text(k.label ?? k.id, x, y + 8, { align: 'center' })
  })
  // Distâncias
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(30)
  c.distances.forEach((d) => {
    const a = by.get(d.from), b = by.get(d.to); if (!a || !b) return
    const [x1, y1] = P(a.x, a.y), [x2, y2] = P(b.x, b.y)
    doc.setDrawColor(150); doc.setLineWidth(0.2); doc.setLineDashPattern([1, 1.5], 0); doc.line(x1, y1, x2, y2); doc.setLineDashPattern([], 0)
    doc.setFillColor(255, 255, 255); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
    doc.rect(mx - 9, my - 4, 18, 6.5, 'F'); doc.text(`${String(d.m).replace('.', ',')} m`, mx, my + 0.8, { align: 'center' })
  })

  let y = oy + c.area[1] * scale + 14
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(0); doc.text('Como fazer', M, y); y += 6
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.text(doc.splitTextToSize(c.notes, W - 2 * M), M, y); y += 14 + 5 * Math.floor(c.notes.length / 95)
  doc.setFont('helvetica', 'bold'); doc.text('Ordem dos cones:', M, y); doc.setFont('helvetica', 'normal')
  doc.text(c.path.join('  →  '), M + 38, y)
  doc.setFontSize(8); doc.setTextColor(110)
  doc.text(doc.splitTextToSize('Orientação geral de treino. Faça o aquecimento dinâmico antes. Não substitui orientação médica nem de profissional de educação física. Em caso de dor, pare e procure um profissional de saúde.', W - 2 * M), M, 282)
  doc.save(`mapa-${exerciseName.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-')}.pdf`)
}
