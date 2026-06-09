
import type { InvoiceData } from './invoice'
import { calcClassicItem, calcClassicTotals, amountInWords, validateInvoiceNumber, INDIAN_STATES, computeRetailEffectiveRate } from './invoice'
import QRCode from 'qrcode'

export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
  const { default: jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const totals = calcClassicTotals(data.items)

  const W            = 210
  const M            = 7
  const contentWidth = W - M * 2   // 196 mm

  const hasCGST = data.items.some(i => i.gstType === 'cgst_sgst')
  const hasIGST = data.items.some(i => i.gstType === 'igst')
  const hasCess = data.items.some(i => i.cessRate > 0)

  const cleanStr = (val: any): string => {
    if (val === undefined || val === null) return ''
    return String(val).replace(/[^\x20-\x7E]/g, '').trim()
  }

  const forcePdfCurrency = (numValue: number): string => {
    const symbolMap: Record<string, string> = { INR: 'Rs.', USD: '$', EUR: 'E', GBP: 'p' }
    const prefix = symbolMap[data.currency] || 'Rs.'
    return `${prefix} ${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const baseTableConfig = {
    margin: { left: M, right: M },
    theme: 'grid' as const,
    styles: {
      font:        'helvetica',
      fontSize:    7,
      textColor:   [30, 41, 59]  as [number, number, number],
      lineWidth:   0.3,
      lineColor:   [15, 23, 42]  as [number, number, number],
      cellPadding: 2,
    },
  }

  // ── HEADER ────────────────────────────────────────────────────────────────
  autoTable(doc, {
    ...baseTableConfig,
    startY: M,
    body: [[data.isProforma ? 'PROFORMA INVOICE' : 'TAX INVOICE']],
    columnStyles: { 0: { cellWidth: contentWidth } },
    styles: {
      ...baseTableConfig.styles,
      fontSize:   9,
      fontStyle:  'bold',
      halign:     'center',
      fillColor:  [248, 250, 252] as [number, number, number],
      textColor:  [15, 23, 42]   as [number, number, number],
    },
  })

  // ── BLOCK 1: SELLER & INVOICE META ────────────────────────────────────────
  const sellerLines = [
    'SELLER',
    cleanStr(data.sellerName || 'Your Business Name'),
    cleanStr(data.sellerAddress || 'Seller Address Location'),
    data.sellerLandmark ? `Landmark: ${cleanStr(data.sellerLandmark)}` : '',
    data.sellerGST      ? `GSTIN: ${cleanStr(data.sellerGST)}`         : '',
    data.sellerPAN      ? `PAN: ${cleanStr(data.sellerPAN)}`           : '',
  ].filter(Boolean).join('\n')

  const formattedPOS  = INDIAN_STATES.find(s => s.value === data.placeOfSupply)?.label || data.placeOfSupply || 'Haryana'
  const isInvNumValid = validateInvoiceNumber(data.invoiceNumber)
  const invMarker     = isInvNumValid ? '' : ' (!)'

  const invoiceMetaLines = [
    'INVOICE DETAILS',
    `Invoice No  : ${cleanStr(data.invoiceNumber || '—')}${invMarker}`,
    `Date        : ${data.invoiceDate}`,
    `Due Date    : ${data.dueDate}`,
    `Place of Sup: ${cleanStr(formattedPOS)}`,
  ].join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [[sellerLines, invoiceMetaLines]],
    columnStyles: {
      0: { cellWidth: contentWidth / 2, valign: 'top' },
      1: { cellWidth: contentWidth / 2, valign: 'top' },
    },
  })

  // Overlay logo on top-left of seller cell if provided
  if (data.sellerLogo) {
    try {
      const logoY      = (doc as any).lastAutoTable.startY + 2
      const logoH      = 14
      const logoW      = 20
      doc.addImage(data.sellerLogo, logoY + 5, logoY, logoW, logoH)
    } catch (_) { /* ignore if image format unsupported */ }
  }

  // ── BLOCK 2: BILL TO / SHIP TO ────────────────────────────────────────────
  const billToLines = [
    'BILL TO',
    cleanStr(data.buyerName    || 'Client Business Name'),
    cleanStr(data.buyerAddress || 'Client Billing Address'),
    data.buyerLandmark ? `Landmark: ${cleanStr(data.buyerLandmark)}` : '',
    data.buyerGST      ? `GSTIN: ${cleanStr(data.buyerGST)}`         : '',
    data.buyerPAN      ? `PAN: ${cleanStr(data.buyerPAN)}`           : '',
  ].filter(Boolean).join('\n')

  const shipToLines = [
    'SHIP TO',
    cleanStr(data.shipToName    || data.buyerName    || 'Same as Billing'),
    cleanStr(data.shipToAddress || data.buyerAddress || 'Same as Delivery Location'),
    data.shipToLandmark ? `Landmark: ${cleanStr(data.shipToLandmark)}` : '',
    `GSTIN: ${cleanStr(data.shipToGST || data.buyerGST || '—')}`,
  ].filter(Boolean).join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [[billToLines, shipToLines]],
    columnStyles: {
      0: { cellWidth: contentWidth / 2, valign: 'top' },
      1: { cellWidth: contentWidth / 2, valign: 'top' },
    },
  })

  // ── BLOCK 3: LINE ITEMS TABLE ─────────────────────────────────────────────
  // Columns: S.No. | Item Name | HSN Code | Qty | MRP | Rate | Disc% | CD% | GST% | [Cess%] | GST Amt | Amount
  const itemsHead = [[
    'S.No.',
    'Item Name',
    'HSN Code',
    'Qty',
    'MRP',
    'Rate',
    'Disc %',
    'CD %',
    'GST%',
    ...(hasCess ? ['Cess %'] : []),
    'GST Amt',
    'Amount',
  ]]

  const itemsBody = data.items.map((item, idx) => {
    const c             = calcClassicItem(item)
    const effectiveRate = computeRetailEffectiveRate(item.mrp, item.discRate, item.cdRate)
    return [
      String(idx + 1),
      cleanStr(item.description || '—'),
      cleanStr(item.hsn         || '—'),
      String(item.quantity),
      forcePdfCurrency(item.mrp),
      forcePdfCurrency(effectiveRate),
      `${item.discRate.toFixed(2)}%`,
      `${item.cdRate.toFixed(2)}%`,
      `${item.gstRate}%`,
      ...(hasCess ? [`${item.cessRate}%`] : []),
      forcePdfCurrency(c.gstAmt),
      forcePdfCurrency(c.subtotal),
    ]
  })

  // Totals row
  const totalQty    = data.items.reduce((s, i) => s + i.quantity, 0)
  const totalsRow   = [
    '',
    'Totals',
    '',
    `${totalQty} Units`,
    '',
    '',
    totals.totalDisc.toFixed(2),
    totals.totalCD.toFixed(2),
    '',
    ...(hasCess ? [''] : []),
    forcePdfCurrency(totals.totalGST),
    forcePdfCurrency(totals.subtotal),
  ]

  // Dynamic column widths
  // Fixed cols: S.No.(8) | HSN(18) | Qty(14) | MRP(22) | Rate(22) | Disc%(14) | CD%(14) | GST%(12) | [Cess%(12)] | GSTAmt(22) | Amount(24)
  // Item Name gets the remainder
  const fixedWidth  = 8 + 18 + 14 + 22 + 22 + 14 + 14 + 12 + (hasCess ? 12 : 0) + 22 + 24
  const nameWidth   = contentWidth - fixedWidth

  let colIdx = 0
  const colStyles: Record<number, any> = {
    [colIdx++]: { cellWidth: 8,         halign: 'center' },   // S.No.
    [colIdx++]: { cellWidth: nameWidth,  halign: 'left'   },   // Item Name
    [colIdx++]: { cellWidth: 18,         halign: 'center' },   // HSN
    [colIdx++]: { cellWidth: 14,         halign: 'center' },   // Qty
    [colIdx++]: { cellWidth: 22,         halign: 'right'  },   // MRP
    [colIdx++]: { cellWidth: 22,         halign: 'right'  },   // Rate
    [colIdx++]: { cellWidth: 14,         halign: 'right'  },   // Disc%
    [colIdx++]: { cellWidth: 14,         halign: 'right'  },   // CD%
    [colIdx++]: { cellWidth: 12,         halign: 'right'  },   // GST%
  }
  if (hasCess) colStyles[colIdx++] = { cellWidth: 12, halign: 'right' }   // Cess%
  colStyles[colIdx++] = { cellWidth: 22, halign: 'right' }                 // GST Amt
  colStyles[colIdx++] = { cellWidth: 24, halign: 'right', fontStyle: 'bold' as const } // Amount

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    head:   itemsHead,
    body:   [...itemsBody, totalsRow],
    headStyles: {
      fillColor:  [248, 250, 252] as [number, number, number],
      textColor:  [15, 23, 42]   as [number, number, number],
      fontStyle:  'bold',
      fontSize:   7,
      halign:     'center',
      lineWidth:  0.3,
      lineColor:  [15, 23, 42]   as [number, number, number],
    },
    bodyStyles: {
      ...baseTableConfig.styles,
      fontSize:  7.5,
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number],
    },
    // Bold + light fill on totals row (last body row)
    didParseCell(hookData) {
      if (hookData.section === 'body' && hookData.row.index === itemsBody.length) {
        hookData.cell.styles.fontStyle  = 'bold'
        hookData.cell.styles.fillColor  = [248, 250, 252] as [number, number, number]
      }
    },
    columnStyles: colStyles,
  })

  // ── BLOCK 4: FINANCIAL SUMMARY ────────────────────────────────────────────
  const taxWordsLabel       = `Tax Amount In Words:\n${amountInWords(totals.totalGST + totals.totalCess, data.currency)}`
  const grandTotalWordsLabel = `Grand Total In Words:\n${amountInWords(totals.grandTotal, data.currency)}`

  const summaryLeftText = [taxWordsLabel, '', grandTotalWordsLabel].join('\n')

  const summaryRightRows = [
    `Subtotal (Taxable):  ${forcePdfCurrency(totals.subtotal)}`,
    ...(totals.totalDisc > 0 ? [`Trade Discount:  - ${forcePdfCurrency(totals.totalDisc)}`] : []),
    ...(totals.totalCD   > 0 ? [`Cash Discount:   - ${forcePdfCurrency(totals.totalCD)}`]   : []),
    ...(hasCGST ? [
      `CGST:  ${forcePdfCurrency(totals.totalCGST)}`,
      `SGST:  ${forcePdfCurrency(totals.totalSGST)}`,
    ] : []),
    ...(hasIGST ? [`IGST:  ${forcePdfCurrency(totals.totalIGST)}`] : []),
    ...(totals.totalCess > 0 ? [`Total Cess:  ${forcePdfCurrency(totals.totalCess)}`] : []),
    `Gross Amount:  ${forcePdfCurrency(totals.grandTotal)}`,
    `Net Amount (Rounded Off):  ${forcePdfCurrency(Math.round(totals.grandTotal))}`,
  ].join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [[summaryLeftText, summaryRightRows]],
    columnStyles: {
      0: { cellWidth: contentWidth * 0.55, valign: 'top', fontSize: 7.5 },
      1: { cellWidth: contentWidth * 0.45, valign: 'top', halign: 'right', fontStyle: 'bold' },
    },
  })

  // ── BLOCK 5: GST BREAKUP MATRIX ───────────────────────────────────────────
  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [['GST BREAKUP MATRIX']],
    columnStyles: { 0: { cellWidth: contentWidth } },
    styles: {
      ...baseTableConfig.styles,
      fontSize:  7.5,
      fontStyle: 'bold',
      textColor: [100, 116, 139] as [number, number, number],
      fillColor: [248, 250, 252] as [number, number, number],
      lineWidth: 0.3,
      lineColor: [15, 23, 42]   as [number, number, number],
    },
  })

  const gstHead = [[
    'HSN/SAC',
    'Taxable Value',
    ...(hasCGST ? ['CGST Amt', 'SGST Amt'] : []),
    ...(hasIGST ? ['IGST Amt']              : []),
    ...(hasCess ? ['Cess Amt']              : []),
    'Total Tax',
  ]]

  const gstBody = totals.hsnBreakup.map(r => [
    cleanStr(r.hsn),
    forcePdfCurrency(r.taxableValue),
    ...(hasCGST ? [forcePdfCurrency(r.cgstAmount), forcePdfCurrency(r.sgstAmount)] : []),
    ...(hasIGST ? [forcePdfCurrency(r.igstAmount)]                                 : []),
    ...(hasCess ? [forcePdfCurrency(r.cessAmount)]                                 : []),
    forcePdfCurrency(r.totalTax),
  ])

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    head:   gstHead,
    body:   gstBody,
    headStyles: {
      fillColor:  [241, 245, 249] as [number, number, number],
      textColor:  [51, 65, 85]   as [number, number, number],
      fontStyle:  'bold',
      fontSize:   7,
      lineWidth:  0.3,
      lineColor:  [15, 23, 42]   as [number, number, number],
      halign:     'right',
    },
    bodyStyles: {
      ...baseTableConfig.styles,
      fontSize:  7.5,
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number],
      halign:    'right',
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
    },
  })

  // ── BLOCK 6: BANK DETAILS & DECLARATION ───────────────────────────────────
  let upiQrDataUrl: string | null = null
  if (data.upiId) {
    try {
      const upiString = `upi://pay?pa=${encodeURIComponent(data.upiId)}&pn=${encodeURIComponent(cleanStr(data.sellerName || ''))}&am=${totals.grandTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(cleanStr(data.invoiceNumber || 'Invoice'))}`
      upiQrDataUrl = await QRCode.toDataURL(upiString, { width: 96, margin: 1 })
    } catch (_) {}
  }

  const bankDetailsText = [
    'BANK DETAILS',
    data.bankName          ? cleanStr(data.bankName)                          : '',
    data.bankAccountNumber ? `A/C: ${cleanStr(data.bankAccountNumber)}`       : '',
    data.bankIfsc          ? `IFSC: ${cleanStr(data.bankIfsc)}`               : '',
    data.bankBranch        ? `Branch: ${cleanStr(data.bankBranch)}`           : '',
    data.upiId             ? `UPI: ${cleanStr(data.upiId)}`                   : '',
    upiQrDataUrl           ? '\n\n\n\n\n'                                     : '',
  ].filter(Boolean).join('\n')

  const termsText = [
    'DECLARATION',
    cleanStr(data.termsAndConditions || 'We declare that the above particulars are true and correct.'),
    ...(data.jurisdictionCity ? [`\nSUBJECT TO ${cleanStr(data.jurisdictionCity).toUpperCase()} JURISDICTION`] : []),
  ].join('\n')

  const qrSize = 24
  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [[bankDetailsText, termsText]],
    columnStyles: {
      0: { cellWidth: contentWidth / 2, valign: 'top' },
      1: { cellWidth: contentWidth / 2, valign: 'top' },
    },
    didDrawCell(hookData) {
      if (upiQrDataUrl && hookData.section === 'body' && hookData.column.index === 0) {
        const x = hookData.cell.x + hookData.cell.width - qrSize - 2
        const y = hookData.cell.y + 2
        try { doc.addImage(upiQrDataUrl, 'PNG', x, y, qrSize, qrSize) } catch (_) {}
      }
    },
  })

  // ── BLOCK 7: SIGNATURE ────────────────────────────────────────────────────
  const signatureText = [
    `For ${cleanStr(data.sellerName || 'Your Business Name')}`,
    '\n\n',
    'Authorised Signatory',
  ].join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [[signatureText]],
    columnStyles: { 0: { cellWidth: contentWidth } },
    styles: {
      ...baseTableConfig.styles,
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number],
      valign:    'middle',
      halign:    'right',
    },
  })

  // ── PAGE FOOTER ───────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  const pageH      = doc.internal.pageSize.height

  for (let idx = 1; idx <= totalPages; idx++) {
    doc.setPage(idx)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(`Page ${idx} of ${totalPages}`, W - M, pageH - 6, { align: 'right' })
    doc.text('Generated via LedgerHQ System Engine', M, pageH - 6)
  }

  const safeFilename = (data.invoiceNumber || 'Invoice').replace(/[^a-zA-Z0-9-_]/g, '_')
  doc.save(`${safeFilename}.pdf`)
}