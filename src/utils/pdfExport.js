import { jsPDF } from 'jspdf'

// Brand colors (RGB)
const BLACK = [0, 0, 0]
const WHITE = [255, 255, 255]
const MAGENTA = [224, 0, 240]
const GRAY = [160, 160, 160]
const LIGHT_GRAY = [100, 100, 100]
const GREEN = [48, 209, 88]
const RED = [255, 69, 58]
const DARK_BG = [18, 18, 18]
const CARD_BG = [28, 28, 30]

const PAGE_W = 210  // A4 mm
const PAGE_H = 297
const MARGIN = 20
const COL_W = PAGE_W - MARGIN * 2

function setColor(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function drawRect(doc, x, y, w, h, rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
  doc.rect(x, y, w, h, 'F')
}

function drawLine(doc, x1, y1, x2, y2, rgb, width = 0.3) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  doc.setLineWidth(width)
  doc.line(x1, y1, x2, y2)
}

function addPageBg(doc) {
  drawRect(doc, 0, 0, PAGE_W, PAGE_H, BLACK)
}

function addFooter(doc, pageNum, totalPages) {
  setColor(doc, LIGHT_GRAY)
  doc.setFontSize(7)
  doc.text(`Black Diamond Solar  |  Page ${pageNum} of ${totalPages}`, PAGE_W / 2, PAGE_H - 10, { align: 'center' })
}

// Wrap text to fit within maxWidth, returns array of lines
function wrapText(doc, text, maxWidth) {
  return doc.splitTextToSize(text, maxWidth)
}

export async function generateProposalPdf(state) {
  const { customer, rep, engineResults: er } = state
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── PAGE 1: Cover ──
  addPageBg(doc)

  // Magenta accent bar at top
  drawRect(doc, 0, 0, PAGE_W, 3, MAGENTA)

  // Company name
  let y = 60
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  setColor(doc, MAGENTA)
  doc.text('BLACK DIAMOND SOLAR', PAGE_W / 2, y, { align: 'center' })

  // Title
  y += 20
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  setColor(doc, WHITE)
  doc.text('Solar Proposal', PAGE_W / 2, y, { align: 'center' })

  // Customer name
  if (customer.firstName) {
    y += 16
    doc.setFontSize(18)
    doc.setFont('helvetica', 'normal')
    setColor(doc, GRAY)
    doc.text(`Prepared for ${customer.firstName} ${customer.lastName}`, PAGE_W / 2, y, { align: 'center' })
  }

  // Address
  if (customer.address || customer.suburb) {
    y += 10
    doc.setFontSize(11)
    setColor(doc, LIGHT_GRAY)
    const addr = [customer.address, customer.suburb, customer.state, customer.postcode].filter(Boolean).join(', ')
    doc.text(addr, PAGE_W / 2, y, { align: 'center' })
  }

  // Date
  y += 20
  doc.setFontSize(10)
  setColor(doc, LIGHT_GRAY)
  const dateStr = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  doc.text(dateStr, PAGE_W / 2, y, { align: 'center' })

  // Rep
  if (rep.name) {
    y += 8
    setColor(doc, GRAY)
    doc.text(`Your consultant: ${rep.name}`, PAGE_W / 2, y, { align: 'center' })
  }

  // Bottom accent
  drawLine(doc, MARGIN, PAGE_H - 40, PAGE_W - MARGIN, PAGE_H - 40, MAGENTA, 0.5)
  doc.setFontSize(8)
  setColor(doc, LIGHT_GRAY)
  doc.text('Bill-to-Zero Program', PAGE_W / 2, PAGE_H - 34, { align: 'center' })

  // ── PAGE 2: System Overview ──
  doc.addPage()
  addPageBg(doc)
  y = MARGIN + 5

  doc.setFontSize(8)
  setColor(doc, MAGENTA)
  doc.text('YOUR SYSTEM', MARGIN, y)
  y += 10

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  setColor(doc, WHITE)
  doc.text('System Overview', MARGIN, y)
  y += 4
  drawLine(doc, MARGIN, y, MARGIN + 40, y, MAGENTA, 1)
  y += 14

  if (er) {
    const sys = er.system

    // System summary cards
    const cards = [
      { label: 'Solar Array', value: `${sys.panels.totalKw} kW`, sub: `${sys.panels.panelCount} × ${sys.panels.wattage}W ${sys.panels.brand}` },
      { label: 'Battery Storage', value: `${sys.battery.usableCapacity} kWh`, sub: `${sys.battery.brand} ${sys.battery.model}` },
      { label: 'Coverage', value: `${sys.coverageRatio}%`, sub: 'of your energy needs' },
      { label: 'Daily Production', value: `${sys.dailyProduction} kWh`, sub: `${sys.panels.peakSunHours || '~4.5'} peak sun hours` },
    ]

    const cardW = (COL_W - 8) / 2
    const cardH = 32

    cards.forEach((card, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const cx = MARGIN + col * (cardW + 8)
      const cy = y + row * (cardH + 8)

      drawRect(doc, cx, cy, cardW, cardH, CARD_BG)
      doc.setFontSize(8)
      setColor(doc, GRAY)
      doc.text(card.label, cx + 6, cy + 9)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      setColor(doc, WHITE)
      doc.text(card.value, cx + 6, cy + 20)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      setColor(doc, LIGHT_GRAY)
      doc.text(card.sub, cx + 6, cy + 27)
    })

    y += (cardH + 8) * 2 + 12

    // Panel specs
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    setColor(doc, WHITE)
    doc.text('Solar Panels', MARGIN, y)
    y += 8

    const panelRows = [
      ['Model', `${sys.panels.brand} ${sys.panels.model} ${sys.panels.series || ''}`],
      ['Wattage', `${sys.panels.wattage}W per panel`],
      ['Panel Count', `${sys.panels.panelCount} panels`],
      ['Total Capacity', `${sys.panels.totalKw} kW`],
      ['Efficiency', `${sys.panels.efficiency}%`],
      ['Technology', `${sys.panels.technology} ${sys.panels.cellType || ''}`],
    ]

    panelRows.forEach(([label, value]) => {
      drawLine(doc, MARGIN, y + 1, PAGE_W - MARGIN, y + 1, [30, 30, 30])
      doc.setFontSize(9)
      setColor(doc, GRAY)
      doc.text(label, MARGIN + 2, y + 6)
      doc.setFont('helvetica', 'bold')
      setColor(doc, WHITE)
      doc.text(value, PAGE_W - MARGIN - 2, y + 6, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += 9
    })

    y += 10

    // Battery specs
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    setColor(doc, WHITE)
    doc.text('Battery & Storage', MARGIN, y)
    y += 8

    const battRows = [
      ['Model', `${sys.battery.brand} ${sys.battery.model}`],
      ['Total Capacity', `${sys.battery.totalCapacity} kWh`],
      ['Usable Capacity', `${sys.battery.usableCapacity} kWh`],
      ['Modules', `${sys.battery.modules} × ${sys.battery.capacityPerModule} kWh`],
      ['Hybrid Inverter', `${sys.battery.inverterSize} kW`],
      ['EV Charger', `${sys.battery.evChargerKw} kW`],
      ['Chemistry', sys.battery.chemistry],
      ['Cycle Life', sys.battery.cycles],
    ]

    battRows.forEach(([label, value]) => {
      drawLine(doc, MARGIN, y + 1, PAGE_W - MARGIN, y + 1, [30, 30, 30])
      doc.setFontSize(9)
      setColor(doc, GRAY)
      doc.text(label, MARGIN + 2, y + 6)
      doc.setFont('helvetica', 'bold')
      setColor(doc, WHITE)
      doc.text(String(value), PAGE_W - MARGIN - 2, y + 6, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += 9
    })
  }

  // ── PAGE 3: Financial Summary ──
  doc.addPage()
  addPageBg(doc)
  y = MARGIN + 5

  doc.setFontSize(8)
  setColor(doc, MAGENTA)
  doc.text('FINANCIALS', MARGIN, y)
  y += 10

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  setColor(doc, WHITE)
  doc.text('The Financial Picture', MARGIN, y)
  y += 4
  drawLine(doc, MARGIN, y, MARGIN + 40, y, MAGENTA, 1)
  y += 14

  if (er) {
    const a = er.assumptions

    // Price & savings headline
    drawRect(doc, MARGIN, y, COL_W, 40, CARD_BG)

    doc.setFontSize(10)
    setColor(doc, GRAY)
    doc.text('System Investment', MARGIN + 10, y + 12)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    setColor(doc, WHITE)
    doc.text(`$${a.financial.systemCost.toLocaleString()}`, MARGIN + 10, y + 28)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setColor(doc, LIGHT_GRAY)
    doc.text('inc. GST, after rebates', MARGIN + 10, y + 35)

    // Guaranteed bill
    doc.setFontSize(10)
    setColor(doc, GRAY)
    doc.text('Your Electricity Bill', PAGE_W / 2 + 10, y + 12)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    setColor(doc, GREEN)
    doc.text('$0', PAGE_W / 2 + 10, y + 28)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    setColor(doc, GREEN)
    doc.text('Guaranteed', PAGE_W / 2 + 10, y + 35)

    y += 52

    // Financial table
    const finRows = [
      ['Annual Usage', `${a.financial.annualUsage.toLocaleString()} kWh`],
      ['Electricity Rate', `$${a.tariff.rate.toFixed(2)}/kWh`],
      ['Daily Supply Charge', `$${a.tariff.supply.toFixed(2)}/day`],
      ['Feed-in Tariff', `$${a.tariff.fit.toFixed(2)}/kWh`],
      ['Escalation Rate', `${(a.tariff.escalation * 100).toFixed(1)}% per year`],
      ['Projection Period', `${a.financial.years} years`],
      ['System Coverage', `${a.guarantee.coverageRatio}% of usage`],
    ]

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    setColor(doc, WHITE)
    doc.text('Key Financials', MARGIN, y)
    y += 8

    finRows.forEach(([label, value]) => {
      drawLine(doc, MARGIN, y + 1, PAGE_W - MARGIN, y + 1, [30, 30, 30])
      doc.setFontSize(9)
      setColor(doc, GRAY)
      doc.text(label, MARGIN + 2, y + 6)
      doc.setFont('helvetica', 'bold')
      setColor(doc, WHITE)
      doc.text(value, PAGE_W - MARGIN - 2, y + 6, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      y += 9
    })

    y += 16

    // 20-year projection summary
    if (er.yearlyProjection && er.yearlyProjection.length > 0) {
      const proj = er.yearlyProjection
      const yr1 = proj[0]
      const yr20 = proj[proj.length - 1]

      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      setColor(doc, WHITE)
      doc.text('20-Year Projection', MARGIN, y)
      y += 10

      const projCards = [
        { label: 'Year 1 Savings', value: `$${yr1.savings?.toLocaleString() || '—'}`, color: GREEN },
        { label: '20-Year Savings', value: `$${yr20.cumulativeSavings?.toLocaleString() || '—'}`, color: GREEN },
        { label: 'Payback Period', value: `${er.payback?.years || '—'} years`, color: MAGENTA },
      ]

      const pCardW = (COL_W - 12) / 3
      projCards.forEach((card, i) => {
        const cx = MARGIN + i * (pCardW + 6)
        drawRect(doc, cx, y, pCardW, 28, CARD_BG)
        doc.setFontSize(8)
        setColor(doc, GRAY)
        doc.text(card.label, cx + 4, y + 9)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        setColor(doc, card.color)
        doc.text(card.value, cx + 4, y + 20)
        doc.setFont('helvetica', 'normal')
      })

      y += 40
    }

    // STC rebate info
    if (er.stcRebate > 0) {
      drawRect(doc, MARGIN, y, COL_W, 22, [30, 25, 10])
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      setColor(doc, [245, 166, 35])
      doc.text(`Government STC Rebate: $${er.stcRebate.toLocaleString()} already applied`, MARGIN + 8, y + 9)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      setColor(doc, GRAY)
      doc.text('This rebate reduces every January. Locking in now secures the maximum discount.', MARGIN + 8, y + 17)
    }
  }

  // ── PAGE 4: Guarantee & Next Steps ──
  doc.addPage()
  addPageBg(doc)
  y = MARGIN + 5

  doc.setFontSize(8)
  setColor(doc, MAGENTA)
  doc.text('GUARANTEE', MARGIN, y)
  y += 10

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  setColor(doc, WHITE)
  doc.text('Bill-to-Zero Guarantee', MARGIN, y)
  y += 4
  drawLine(doc, MARGIN, y, MARGIN + 40, y, GREEN, 1)
  y += 14

  // Guarantee box
  drawRect(doc, MARGIN, y, COL_W, 50, [15, 25, 18])
  drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, GREEN, 1.5)

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  setColor(doc, WHITE)
  doc.text('Your electricity bill is guaranteed $0', MARGIN + 10, y + 14)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRAY)
  const guaranteeText = wrapText(doc,
    'Your system is engineered to produce 150% of your energy needs. If for any reason the system doesn\'t zero your bill, Black Diamond Solar pays the remaining balance. No asterisks, no exceptions.',
    COL_W - 20
  )
  doc.text(guaranteeText, MARGIN + 10, y + 24)

  y += 60

  // Warranty summary
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  setColor(doc, WHITE)
  doc.text('Warranty Coverage', MARGIN, y)
  y += 8

  const warrantyRows = [
    ['Solar Panels — Product', '12 years', 'LONGi'],
    ['Solar Panels — Performance', '30 years', 'LONGi'],
    ['Battery Modules', '10 years', 'Sigenergy'],
    ['Energy Controller', '10 years', 'Sigenergy'],
    ['BDS Workmanship', '10 years', 'Black Diamond Solar'],
    ['Bill-to-Zero Guarantee', 'Lifetime', 'Black Diamond Solar'],
  ]

  // Table header
  drawRect(doc, MARGIN, y, COL_W, 8, CARD_BG)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  setColor(doc, GRAY)
  doc.text('Component', MARGIN + 4, y + 5.5)
  doc.text('Warranty', MARGIN + 90, y + 5.5)
  doc.text('Backed By', PAGE_W - MARGIN - 4, y + 5.5, { align: 'right' })
  y += 8

  warrantyRows.forEach(([comp, period, backer], i) => {
    const isLast = i === warrantyRows.length - 1
    if (isLast) {
      drawRect(doc, MARGIN, y, COL_W, 9, [15, 25, 18])
    }
    drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, [30, 30, 30])
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setColor(doc, isLast ? GREEN : WHITE)
    doc.text(comp, MARGIN + 4, y + 6)
    doc.setFont('helvetica', 'bold')
    doc.text(period, MARGIN + 90, y + 6)
    doc.setFont('helvetica', 'normal')
    setColor(doc, GRAY)
    doc.text(backer, PAGE_W - MARGIN - 4, y + 6, { align: 'right' })
    y += 9
  })

  y += 16

  // Next steps
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  setColor(doc, WHITE)
  doc.text('Next Steps', MARGIN, y)
  y += 10

  const steps = [
    { num: '1', title: 'Site Survey', desc: 'We visit your home to finalise the design' },
    { num: '2', title: 'Final Design', desc: 'Your system layout confirmed and approved' },
    { num: '3', title: 'Installation', desc: 'Typical install: 1–2 days, fully operational' },
  ]

  steps.forEach(step => {
    // Step number circle
    drawRect(doc, MARGIN, y - 4, 10, 10, CARD_BG)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    setColor(doc, MAGENTA)
    doc.text(step.num, MARGIN + 3.5, y + 3)

    doc.setFontSize(11)
    setColor(doc, WHITE)
    doc.text(step.title, MARGIN + 16, y + 2)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    setColor(doc, GRAY)
    doc.text(step.desc, MARGIN + 16, y + 9)
    y += 18
  })

  y += 8
  doc.setFontSize(8)
  setColor(doc, LIGHT_GRAY)
  doc.text('Most installations are completed within 4–6 weeks of approval.', MARGIN, y)

  // Contact info at bottom
  y = PAGE_H - 50
  drawLine(doc, MARGIN, y, PAGE_W - MARGIN, y, [30, 30, 30])
  y += 10
  if (rep.name) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    setColor(doc, WHITE)
    doc.text(`Your consultant: ${rep.name}`, MARGIN, y)
    y += 7
  }
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  setColor(doc, GRAY)
  doc.text('Black Diamond Solar  |  blackdiamondsolar.com.au', MARGIN, y)

  // Add page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  // Generate filename
  const name = customer.firstName
    ? `${customer.firstName}-${customer.lastName}-Solar-Proposal`.replace(/\s+/g, '-')
    : 'Solar-Proposal'

  doc.save(`${name}.pdf`)
}
