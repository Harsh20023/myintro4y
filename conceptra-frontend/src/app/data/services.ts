export type ServiceTab = {
  id: string;
  label: string;
  description: string;
  subItems: string[];
  cta: string;
};

export const SERVICE_TABS: ServiceTab[] = [
  {
    id: 'company-formation',
    label: 'Company Formation',
    description:
      'From sole proprietorships to private limited companies, Conceptra handles every aspect of business incorporation across India — ensuring you start on the right legal and structural footing.',
    subItems: [
      'Private Limited Company',
      'One Person Company (OPC)',
      'LLP Registration',
      'Section 8 / Non-Profit',
      'Partnership Firm',
      'Public Limited Company',
    ],
    cta: 'Incorporate Now',
  },
  {
    id: 'taxation',
    label: 'Taxation',
    description:
      'Complete direct and indirect tax management — from ITR filing to GST registration, advisory, and monthly/quarterly returns. We ensure full compliance with statutory deadlines.',
    subItems: [
      'Income Tax Return (ITR)',
      'GST Registration & Returns',
      'TDS / TCS Compliance',
      'Advance Tax Management',
      'Tax Planning & Advisory',
      'International Taxation',
    ],
    cta: 'Get Tax Help',
  },
  {
    id: 'payroll',
    label: 'Payroll',
    description:
      'End-to-end payroll management including salary structuring, PF/ESI compliance, payslip generation, and statutory deductions — so your team stays paid and compliant.',
    subItems: [
      'Salary Structuring',
      'PF & ESI Filing',
      'Payslip Generation',
      'TDS on Salary',
      'Leave & Attendance',
      'Full & Final Settlement',
    ],
    cta: 'Manage Payroll',
  },
  {
    id: 'audit',
    label: 'Audit & Assurance',
    description:
      'Statutory, internal, and tax audits conducted by experienced Chartered Accountants — ensuring accuracy, regulatory adherence, and shareholder confidence.',
    subItems: [
      'Statutory Audit',
      'Internal Audit',
      'Tax Audit (44AB)',
      'Stock & Fixed Asset Audit',
      'Due Diligence',
      'Financial Reporting',
    ],
    cta: 'Schedule Audit',
  },
  {
    id: 'outsourcing',
    label: 'Outsourcing',
    description:
      'Outsource your accounting and financial data management to Conceptra and significantly reduce operational costs while gaining access to expert-level financial insights.',
    subItems: [
      'Bookkeeping & Accounting',
      'Accounts Payable / Receivable',
      'Bank Reconciliation',
      'Management Reports (MIS)',
      'Virtual Accounting Teams',
      'Tally / Zoho / QuickBooks',
    ],
    cta: 'Outsource Now',
  },
  {
    id: 'advisory',
    label: 'Advisory',
    description:
      'Strategic advisory for growing businesses — from Virtual CFO services to transfer pricing, business restructuring, and cross-border entity setup.',
    subItems: [
      'Virtual CFO Services',
      'Business Restructuring',
      'Transfer Pricing',
      'FEMA & RBI Compliance',
      'Startup Funding Advisory',
      'Mergers & Acquisitions',
    ],
    cta: 'Talk to Advisor',
  },
];
