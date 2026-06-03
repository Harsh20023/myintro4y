// import type { InvoiceData } from './invoice'
// import { calcItem, calcTotals, formatCurrency, amountInWords } from './invoice'

// export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
//   // Dynamic import — only loads when user clicks download
//   const { default: jsPDF } = await import('jspdf')
//   const { default: autoTable } = await import('jspdf-autotable')

//   const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
//   const totals = calcTotals(data.items)
//   const W = 210 // A4 width mm
//   const margin = 14

//   // ── Header ──────────────────────────────────────────────────────────────
//   doc.setFillColor(13, 148, 136) // brand-600
//   doc.rect(0, 0, W, 38, 'F')

//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(20)
//   doc.setTextColor(255, 255, 255)
//   doc.text('TAX INVOICE', margin, 16)

//   doc.setFontSize(9)
//   doc.setFont('helvetica', 'normal')
//   doc.text(data.sellerName || 'Your Business Name', margin, 24)
//   doc.text(data.sellerAddress || '', margin, 29, { maxWidth: 80 })

//   // Invoice number + date (right side)
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(10)
//   doc.text(data.invoiceNumber, W - margin, 16, { align: 'right' })
//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(8)
//   doc.text(`Date: ${data.invoiceDate}`, W - margin, 22, { align: 'right' })
//   doc.text(`Due:  ${data.dueDate}`,     W - margin, 27, { align: 'right' })

//   // ── Seller / Buyer blocks ─────────────────────────────────────────────
//   let y = 46
//   doc.setTextColor(30, 30, 30)

//   // Seller block
//   doc.setFillColor(248, 247, 244)
//   doc.roundedRect(margin, y, 85, 40, 2, 2, 'F')
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(7)
//   doc.setTextColor(100, 100, 100)
//   doc.text('FROM', margin + 4, y + 6)
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(9)
//   doc.setTextColor(30, 30, 30)
//   doc.text(data.sellerName || '—', margin + 4, y + 13)
//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(8)
//   if (data.sellerGST)   doc.text(`GSTIN: ${data.sellerGST}`,   margin + 4, y + 20)
//   if (data.sellerPhone) doc.text(`Ph: ${data.sellerPhone}`,     margin + 4, y + 26)
//   if (data.sellerEmail) doc.text(data.sellerEmail,               margin + 4, y + 32)

//   // Buyer block
//   doc.setFillColor(248, 247, 244)
//   doc.roundedRect(W - margin - 85, y, 85, 40, 2, 2, 'F')
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(7)
//   doc.setTextColor(100, 100, 100)
//   doc.text('BILL TO', W - margin - 81, y + 6)
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(9)
//   doc.setTextColor(30, 30, 30)
//   doc.text(data.buyerName || '—', W - margin - 81, y + 13)
//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(8)
//   if (data.buyerGST) doc.text(`GSTIN: ${data.buyerGST}`, W - margin - 81, y + 20)
//   const buyerAddrLines = doc.splitTextToSize(data.buyerAddress, 76)
//   doc.text(buyerAddrLines.slice(0, 2), W - margin - 81, y + 26)

//   // ── Items table ───────────────────────────────────────────────────────
//   y += 48

//   const hasIGST  = data.items.some(i => i.gstType === 'igst')
//   const hasCGST  = data.items.some(i => i.gstType === 'cgst_sgst')

//   const head: string[][] = [[
//     '#', 'Description', 'Qty', 'Rate', 'Taxable',
//     ...(hasCGST ? ['CGST', 'SGST'] : []),
//     ...(hasIGST ? ['IGST'] : []),
//     'Total',
//   ]]

//   const body = data.items.map((item, idx) => {
//     const c = calcItem(item)
//     return [
//       String(idx + 1),
//       item.description || '—',
//       String(item.quantity),
//       formatCurrency(item.rate, data.currency),
//       formatCurrency(c.subtotal, data.currency),
//       ...(hasCGST ? [
//         `${formatCurrency(c.cgst, data.currency)}\n(${item.gstRate / 2}%)`,
//         `${formatCurrency(c.sgst, data.currency)}\n(${item.gstRate / 2}%)`,
//       ] : []),
//       ...(hasIGST ? [
//         `${formatCurrency(c.igst, data.currency)}\n(${item.gstRate}%)`,
//       ] : []),
//       formatCurrency(c.total, data.currency),
//     ]
//   })

//   autoTable(doc, {
//     startY: y,
//     head,
//     body,
//     theme: 'plain',
//     headStyles: {
//       fillColor: [241, 240, 237],
//       textColor: [80, 80, 80],
//       fontStyle: 'bold',
//       fontSize: 7.5,
//     },
//     bodyStyles:  { fontSize: 8, textColor: [30, 30, 30] },
//     columnStyles: {
//       0: { cellWidth: 8,  halign: 'center' },
//       1: { cellWidth: 'auto' },
//     },
//     alternateRowStyles: { fillColor: [252, 252, 250] },
//     margin: { left: margin, right: margin },
//   })

//   // ── Totals ────────────────────────────────────────────────────────────
//   const finalY = (doc as any).lastAutoTable.finalY + 6
//   const colX = W - margin - 70

//   const rows: [string, string][] = [
//     ['Subtotal',  formatCurrency(totals.subtotal,  data.currency)],
//     ...(hasCGST ? [
//       ['CGST', formatCurrency(totals.totalCGST, data.currency)] as [string, string],
//       ['SGST', formatCurrency(totals.totalSGST, data.currency)] as [string, string],
//     ] : []),
//     ...(hasIGST ? [
//       ['IGST', formatCurrency(totals.totalIGST, data.currency)] as [string, string],
//     ] : []),
//     ['Total GST', formatCurrency(totals.totalGST, data.currency)],
//   ]

//   let ry = finalY
//   doc.setFontSize(8.5)
//   rows.forEach(([label, value]) => {
//     doc.setFont('helvetica', 'normal')
//     doc.setTextColor(90, 90, 90)
//     doc.text(label, colX, ry)
//     doc.setTextColor(30, 30, 30)
//     doc.text(value, W - margin, ry, { align: 'right' })
//     ry += 6
//   })

//   // Grand total highlight
//   doc.setFillColor(13, 148, 136)
//   doc.roundedRect(colX - 4, ry - 1, W - margin - colX + 8, 9, 1.5, 1.5, 'F')
//   doc.setFont('helvetica', 'bold')
//   doc.setFontSize(9.5)
//   doc.setTextColor(255, 255, 255)
//   doc.text('GRAND TOTAL', colX, ry + 5.5)
//   doc.text(formatCurrency(totals.grandTotal, data.currency), W - margin - 2, ry + 5.5, { align: 'right' })

//   // Amount in words
//   ry += 16
//   doc.setFont('helvetica', 'italic')
//   doc.setFontSize(7.5)
//   doc.setTextColor(100, 100, 100)
//   doc.text(amountInWords(totals.grandTotal), margin, ry, { maxWidth: 120 })

//   // ── Notes + T&C ───────────────────────────────────────────────────────
//   ry += 12
//   if (data.notes) {
//     doc.setFont('helvetica', 'bold')
//     doc.setFontSize(8)
//     doc.setTextColor(60, 60, 60)
//     doc.text('Notes:', margin, ry)
//     doc.setFont('helvetica', 'normal')
//     doc.text(data.notes, margin + 14, ry, { maxWidth: 120 })
//     ry += 10
//   }

//   if (data.termsAndConditions) {
//     doc.setFont('helvetica', 'bold')
//     doc.setFontSize(8)
//     doc.text('Terms & Conditions:', margin, ry)
//     doc.setFont('helvetica', 'normal')
//     doc.setTextColor(100, 100, 100)
//     doc.text(data.termsAndConditions, margin + 32, ry, { maxWidth: 120 })
//   }

//   // ── Footer ─────────────────────────────────────────────────────────────
//   const pageH = doc.internal.pageSize.height
//   doc.setFillColor(248, 247, 244)
//   doc.rect(0, pageH - 10, W, 10, 'F')
//   doc.setFont('helvetica', 'normal')
//   doc.setFontSize(7)
//   doc.setTextColor(150, 150, 150)
//   doc.text('Generated by LedgerHQ · LedgerHQ.in', W / 2, pageH - 4, { align: 'center' })

//   doc.save(`${data.invoiceNumber}.pdf`)
// }

// import type { InvoiceData } from './invoice'
// import { calcItem, calcTotals, amountInWords } from './invoice'

// export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
//   const { default: jsPDF } = await import('jspdf')
//   const { default: autoTable } = await import('jspdf-autotable')

//   const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
//   const totals = calcTotals(data.items)
  
//   const W = 210
//   const M = 12 
//   const contentWidth = W - (M * 2)

//   // Derive tax types directly from the items array to prevent undefined errors
//   const hasCGST = data.items.some(item => item.gstType === 'cgst_sgst')
//   const hasIGST = data.items.some(item => item.gstType === 'igst')

//   const cleanStr = (val: any): string => {
//     if (val === undefined || val === null) return ''
//     return String(val).replace(/[^\x20-\x7E]/g, '').trim()
//   }

//   const forcePdfCurrency = (numValue: number): string => {
//     return `Rs. ${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
//   }

//   const baseTableConfig = {
//     margin: { left: M, right: M },
//     theme: 'grid' as const,
//     styles: {
//       font: 'helvetica',
//       fontSize: 8,
//       textColor: [30, 41, 59], 
//       lineWidth: 0.3,
//       // lineColor: [15, 23, 42], 
//       lineColor: [15, 23, 42] as [number, number, number],
//       cellPadding: 2.5
//     }
//   }

//   // ── HEADER BLOCK ─────────────────────────────────────────────────────
//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: M,
//     body: [[ 'TAX INVOICE' ]],
//     styles: {
//       ...baseTableConfig.styles,
//       fontSize: 10,
//       fontStyle: 'bold',
//       halign: 'center',
//       fillColor: [248, 250, 252], 
//       textColor: [15, 23, 42]
//     }
//   })

//   // ── BLOCK 1: SELLER & INVOICE METADATA ───────────────────────────────
//   const sellerDetailsLines = [
//     'SELLER',
//     data.sellerName || 'Your Business Name',
//     data.sellerAddress || 'Seller Address Location',
//     data.sellerGST ? `GSTIN: ${data.sellerGST}` : ''
//   ].filter(Boolean)

//   const invoiceMetaLines = [
//     'INVOICE DETAILS',
//     `Invoice No  : ${data.invoiceNumber || '—'}`,
//     `Date        : ${data.invoiceDate}`,
//     `Due Date    : ${data.dueDate}`,
//     `Place       : ${data.placeOfSupply || 'Haryana'}`
//   ]

//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     body: [[ sellerDetailsLines, invoiceMetaLines ]],
//     columnStyles: {
//       0: { cellWidth: contentWidth / 2, valign: 'top' },
//       1: { cellWidth: contentWidth / 2, valign: 'top' }
//     },
//     didParseCell: (dataCell) => {
//       if (dataCell.section === 'body') {
//         dataCell.cell.text = dataCell.cell.raw as string[]
//       }
//     }
//   })

//   // ── BLOCK 2: BILL TO / SHIP TO ───────────────────────────────────────
//   const billToLines = [
//     'BILL TO',
//     data.buyerName || 'Client Business Name',
//     data.buyerAddress || 'Client Billing Address',
//     data.buyerGST ? `GSTIN: ${data.buyerGST}` : ''
//   ].filter(Boolean)

//   const shipToLines = [
//     'SHIP TO',
//     data.shipToName || data.buyerName || 'Same as Billing',
//     data.shipToAddress || data.buyerAddress || 'Same as Delivery Location',
//     data.shipToGST || (data.buyerGST ? `GSTIN: ${data.shipToGST || data.buyerGST}` : '')
//   ].filter(Boolean)

//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     body: [[ billToLines, shipToLines ]],
//     columnStyles: {
//       0: { cellWidth: contentWidth / 2, valign: 'top' },
//       1: { cellWidth: contentWidth / 2, valign: 'top' }
//     },
//     didParseCell: (dataCell) => {
//       if (dataCell.section === 'body') {
//         dataCell.cell.text = dataCell.cell.raw as string[]
//       }
//     }
//   })

//   // ── BLOCK 3: LINE ITEMS TABLE ────────────────────────────────────────
//   const itemsHead = [['Sr#', 'Description of Goods', 'HSN', 'Qty', 'Rate', 'Amount']]
//   const itemsBody = data.items.map((item, idx) => {
//     const c = calcItem(item)
//     return [
//       String(idx + 1),
//       cleanStr(item.description || '—'),
//       cleanStr(item.hsn || '—'),
//       String(item.quantity),
//       forcePdfCurrency(item.rate),
//       forcePdfCurrency(c.subtotal)
//     ]
//   })

//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     head: itemsHead,
//     body: itemsBody,
//     headStyles: {
//       fillColor: [248, 250, 252], 
//       textColor: [15, 23, 42],
//       fontStyle: 'bold',
//       fontSize: 8,
//       halign: 'left',
//       lineWidth: 0.3,
//       lineColor: [15, 23, 42]
//     },
//     bodyStyles: {
//       ...baseTableConfig.styles,
//       fontSize: 8,
//       lineWidth: 0.3,
//       lineColor: [15, 23, 42]
//     },
//     columnStyles: {
//       0: { cellWidth: 10, halign: 'center' },
//       1: { cellWidth: 'auto', halign: 'left' },
//       2: { cellWidth: 18, halign: 'center' },
//       3: { cellWidth: 12, halign: 'center' },
//       4: { cellWidth: 26, halign: 'right' },
//       5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
//     }
//   })

//   // ── BLOCK 4: TOTAL FINANCIALS SUMMARY ───────────────────────────────
//   const summaryLeftText = [
//     'AMOUNT CHARGEABLE (IN WORDS)',
//     `Rupees ${amountInWords(totals.grandTotal)}`
//   ]

//   const summaryRightRows = [
//     `Subtotal:  ${forcePdfCurrency(totals.subtotal)}`,
//     ...(hasCGST ? [
//       `CGST Summary:  ${forcePdfCurrency(totals.totalCGST)}`,
//       `SGST Summary:  ${forcePdfCurrency(totals.totalSGST)}`
//     ] : []),
//     ...(hasIGST ? [`IGST Summary:  ${forcePdfCurrency(totals.totalIGST)}`] : []),
//     `TOTAL:  ${forcePdfCurrency(totals.grandTotal)}`
//   ]

//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     body: [[ summaryLeftText, summaryRightRows ]],
//     columnStyles: {
//       0: { cellWidth: contentWidth / 2, valign: 'top' },
//       1: { cellWidth: contentWidth / 2, valign: 'top', halign: 'right' }
//     },
//     didParseCell: (dataCell) => {
//       if (dataCell.section === 'body') {
//         dataCell.cell.text = dataCell.cell.raw as string[]
//       }
//     }
//   })

//   // ── BLOCK 5: GST BREAKUP TABLE ───────────────────────────────────────
//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     body: [[ 'GST BREAKUP MATRIX' ]],
//     styles: {
//       ...baseTableConfig.styles,
//       fontSize: 7.5,
//       fontStyle: 'bold',
//       textColor: [100, 116, 139], 
//       fillColor: [248, 250, 252],
//       lineWidth: 0.3,
//       lineColor: [15, 23, 42]
//     }
//   })

//   const gstHead = [['HSN/SAC', 'Taxable Value', ...(hasCGST ? ['CGST Amt', 'SGST Amt'] : []), ...(hasIGST ? ['IGST Amt'] : []), 'Total Tax']]
//   const gstBody = totals.hsnBreakup.map(r => [
//     cleanStr(r.hsn),
//     forcePdfCurrency(r.taxableValue),
//     ...(hasCGST ? [forcePdfCurrency(r.cgstAmount), forcePdfCurrency(r.sgstAmount)] : []),
//     ...(hasIGST ? [forcePdfCurrency(r.igstAmount)] : []),
//     forcePdfCurrency(r.totalTax)
//   ])

//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     head: gstHead,
//     body: gstBody,
//     headStyles: {
//       fillColor: [241, 245, 249], 
//       textColor: [51, 65, 85],
//       fontStyle: 'bold',
//       fontSize: 7.5,
//       lineWidth: 0.3,
//       // lineColor: [15, 23, 42],
//       lineColor: [15, 23, 42] as [number, number, number],
//       halign: 'right'
//     },
//     bodyStyles: {
//       ...baseTableConfig.styles,
//       fontSize: 7.5,
//       lineWidth: 0.3,
//       // lineColor: [15, 23, 42],
//       lineColor: [15, 23, 42] as [number, number, number],
//       halign: 'right'
//     },
//     columnStyles: { 
//       0: { halign: 'center', fontStyle: 'bold' } 
//     }
//   })

//   // ── BLOCK 6: BANK DETAILS & DECLARATIONS ─────────────────────────────
//   const bankDetailsText = [
//     'BANK DETAILS',
//     'Punjab National Bank',
//     `A/C: 12381131001919`,
//     `IFSC: PUNB0517010`
//   ]

//   const termsDeclarationText = [
//     'DECLARATION',
//     cleanStr(data.termsAndConditions || 'We declare that the above particulars are true and correct.')
//   ]

//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     body: [[ bankDetailsText, termsDeclarationText ]],
//     columnStyles: {
//       0: { cellWidth: contentWidth / 2, valign: 'top' },
//       1: { cellWidth: contentWidth / 2, valign: 'top' }
//     },
//     didParseCell: (dataCell) => {
//       if (dataCell.section === 'body') {
//         dataCell.cell.text = dataCell.cell.raw as string[]
//       }
//     }
//   })

//   // ── BLOCK 7: SIGNATURE SIGN-OFF ──────────────────────────────────────
//   const signatureText = [
//     `For ${cleanStr(data.sellerName || 'Your Business Name')}`,
//     '\n\n', 
//     'Authorised Signatory'
//   ]

//   autoTable(doc, {
//     ...baseTableConfig,
//     startY: (doc as any).lastAutoTable.finalY,
//     body: [[ signatureText ]],
//     styles: {
//       ...baseTableConfig.styles,
//       lineWidth: 0.3,
//       // lineColor: [15, 23, 42],
//       lineColor: [15, 23, 42] as [number, number, number],
//       valign: 'middle',
//       halign: 'right'
//     },
//     didParseCell: (dataCell) => {
//       if (dataCell.section === 'body') {
//         dataCell.cell.text = dataCell.cell.raw as string[]
//       }
//     }
//   })

//   // ── GLOBAL DYNAMIC PAGE FOOTER ENGINE ────────────────────────────────
//   const totalPages = (doc as any).internal.getNumberOfPages()
//   const pageH = doc.internal.pageSize.height
  
//   for (let idx = 1; idx <= totalPages; idx++) {
//     doc.setPage(idx)
//     doc.setFont('helvetica', 'normal')
//     doc.setFontSize(7.5)
//     doc.setTextColor(148, 163, 184)
//     doc.text(`Page ${idx} of ${totalPages}`, W - M, pageH - 6, { align: 'right' })
//     doc.text('Generated via LedgerHQ System Engine', M, pageH - 6)
//   }

//   doc.save(`${data.invoiceNumber || 'Invoice'}.pdf`)
// }

import type { InvoiceData } from './invoice'
import { calcItem, calcTotals, amountInWords } from './invoice'

export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const totals = calcTotals(data.items)
  
  const W = 210
  const M = 12 
  const contentWidth = W - (M * 2)

  const hasCGST = data.items.some(item => item.gstType === 'cgst_sgst')
  const hasIGST = data.items.some(item => item.gstType === 'igst')

  // Strips characters that break default PDF standard font rendering
  const cleanStr = (val: any): string => {
    if (val === undefined || val === null) return ''
    return String(val).replace(/[^\x20-\x7E]/g, '').trim()
  }

  // Fallback string substitution for clean currency text layout
  const forcePdfCurrency = (numValue: number): string => {
    return `Rs. ${numValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const baseTableConfig = {
    margin: { left: M, right: M },
    theme: 'grid' as const,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: [30, 41, 59] as [number, number, number], 
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number],
      cellPadding: 2.5
    }
  }

  // ── HEADER BLOCK ─────────────────────────────────────────────────────
  autoTable(doc, {
    ...baseTableConfig,
    startY: M,
    body: [[ 'TAX INVOICE' ]],
    styles: {
      ...baseTableConfig.styles,
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center',
      fillColor: [248, 250, 252] as [number, number, number], 
      textColor: [15, 23, 42] as [number, number, number]
    }
  })

  // ── BLOCK 1: SELLER & INVOICE METADATA ───────────────────────────────
  const sellerDetailsLines = [
    'SELLER',
    data.sellerName || 'Your Business Name',
    data.sellerAddress || 'Seller Address Location',
    data.sellerGST ? `GSTIN: ${data.sellerGST}` : ''
  ].filter(Boolean).join('\n') // Joined with linebreaks to comply with jspdf-autotable string expectations

  const invoiceMetaLines = [
    'INVOICE DETAILS',
    `Invoice No  : ${data.invoiceNumber || '—'}`,
    `Date        : ${data.invoiceDate}`,
    `Due Date    : ${data.dueDate}`,
    `Place       : ${data.placeOfSupply || 'Haryana'}`
  ].join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body: [[ sellerDetailsLines, invoiceMetaLines ]],
    columnStyles: {
      0: { cellWidth: contentWidth / 2, valign: 'top' },
      1: { cellWidth: contentWidth / 2, valign: 'top' }
    }
  })

  // ── BLOCK 2: BILL TO / SHIP TO ───────────────────────────────────────
  const billToLines = [
    'BILL TO',
    data.buyerName || 'Client Business Name',
    data.buyerAddress || 'Client Billing Address',
    data.buyerGST ? `GSTIN: ${data.buyerGST}` : ''
  ].filter(Boolean).join('\n')

  const shipToLines = [
    'SHIP TO',
    data.shipToName || data.buyerName || 'Same as Billing',
    data.shipToAddress || data.buyerAddress || 'Same as Delivery Location',
    data.shipToGST || (data.buyerGST ? `GSTIN: ${data.shipToGST || data.buyerGST}` : '')
  ].filter(Boolean).join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body: [[ billToLines, shipToLines ]],
    columnStyles: {
      0: { cellWidth: contentWidth / 2, valign: 'top' },
      1: { cellWidth: contentWidth / 2, valign: 'top' }
    }
  })

  // ── BLOCK 3: LINE ITEMS TABLE ────────────────────────────────────────
  const itemsHead = [['Sr#', 'Description of Goods', 'HSN', 'Qty', 'Rate', 'Amount']]
  const itemsBody = data.items.map((item, idx) => {
    const c = calcItem(item)
    return [
      String(idx + 1),
      cleanStr(item.description || '—'),
      cleanStr(item.hsn || '—'),
      String(item.quantity),
      forcePdfCurrency(item.rate),
      forcePdfCurrency(c.subtotal)
    ]
  })

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    head: itemsHead,
    body: itemsBody,
    headStyles: {
      fillColor: [248, 250, 252] as [number, number, number], 
      textColor: [15, 23, 42] as [number, number, number],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number]
    },
    bodyStyles: {
      ...baseTableConfig.styles,
      fontSize: 8,
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number]
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto', halign: 'left' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
    }
  })

  // ── BLOCK 4: TOTAL FINANCIALS SUMMARY ───────────────────────────────
  const summaryLeftText = [
    'AMOUNT CHARGEABLE (IN WORDS)',
    `Rupees ${amountInWords(totals.grandTotal)}`
  ].join('\n')

  const summaryRightRows = [
    `Subtotal:  ${forcePdfCurrency(totals.subtotal)}`,
    ...(hasCGST ? [
      `CGST Summary:  ${forcePdfCurrency(totals.totalCGST)}`,
      `SGST Summary:  ${forcePdfCurrency(totals.totalSGST)}`
    ] : []),
    ...(hasIGST ? [`IGST Summary:  ${forcePdfCurrency(totals.totalIGST)}`] : []),
    `TOTAL:  ${forcePdfCurrency(totals.grandTotal)}`
  ].join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body: [[ summaryLeftText, summaryRightRows ]],
    columnStyles: {
      0: { cellWidth: contentWidth / 2, valign: 'top' },
      1: { cellWidth: contentWidth / 2, valign: 'top', halign: 'right' }
    }
  })

  // ── BLOCK 5: GST BREAKUP TABLE ───────────────────────────────────────
  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body: [[ 'GST BREAKUP MATRIX' ]],
    styles: {
      ...baseTableConfig.styles,
      fontSize: 7.5,
      fontStyle: 'bold',
      textColor: [100, 116, 139] as [number, number, number], 
      fillColor: [248, 250, 252] as [number, number, number],
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number]
    }
  })

  const gstHead = [['HSN/SAC', 'Taxable Value', ...(hasCGST ? ['CGST Amt', 'SGST Amt'] : []), ...(hasIGST ? ['IGST Amt'] : []), 'Total Tax']]
  const gstBody = totals.hsnBreakup.map(r => [
    cleanStr(r.hsn),
    forcePdfCurrency(r.taxableValue),
    ...(hasCGST ? [forcePdfCurrency(r.cgstAmount), forcePdfCurrency(r.sgstAmount)] : []),
    ...(hasIGST ? [forcePdfCurrency(r.igstAmount)] : []),
    forcePdfCurrency(r.totalTax)
  ])

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    head: gstHead,
    body: gstBody,
    headStyles: {
      fillColor: [241, 245, 249] as [number, number, number], 
      textColor: [51, 65, 85] as [number, number, number],
      fontStyle: 'bold',
      fontSize: 7.5,
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number],
      halign: 'right'
    },
    bodyStyles: {
      ...baseTableConfig.styles,
      fontSize: 7.5,
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number],
      halign: 'right'
    },
    columnStyles: { 
      0: { halign: 'center', fontStyle: 'bold' } 
    }
  })

  // ── BLOCK 6: BANK DETAILS & DECLARATIONS ─────────────────────────────
  const bankDetailsText = [
    'BANK DETAILS',
    'Punjab National Bank',
    `A/C: 12381131001919`,
    `IFSC: PUNB0517010`
  ].join('\n')

  const termsDeclarationText = [
    'DECLARATION',
    cleanStr(data.termsAndConditions || 'We declare that the above particulars are true and correct.')
  ].join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body: [[ bankDetailsText, termsDeclarationText ]],
    columnStyles: {
      0: { cellWidth: contentWidth / 2, valign: 'top' },
      1: { cellWidth: contentWidth / 2, valign: 'top' }
    }
  })

  // ── BLOCK 7: SIGNATURE SIGN-OFF ──────────────────────────────────────
  const signatureText = [
    `For ${cleanStr(data.sellerName || 'Your Business Name')}`,
    '\n\n', 
    'Authorised Signatory'
  ].join('\n')

  autoTable(doc, {
    ...baseTableConfig,
    startY: (doc as any).lastAutoTable.finalY,
    body: [[ signatureText ]],
    styles: {
      ...baseTableConfig.styles,
      lineWidth: 0.3,
      lineColor: [15, 23, 42] as [number, number, number],
      valign: 'middle',
      halign: 'right'
    }
  })

  // ── GLOBAL DYNAMIC PAGE FOOTER ENGINE ────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  const pageH = doc.internal.pageSize.height
  
  for (let idx = 1; idx <= totalPages; idx++) {
    doc.setPage(idx)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text(`Page ${idx} of ${totalPages}`, W - M, pageH - 6, { align: 'right' })
    doc.text('Generated via LedgerHQ System Engine', M, pageH - 6)
  }

  doc.save(`${data.invoiceNumber || 'Invoice'}.pdf`)
}