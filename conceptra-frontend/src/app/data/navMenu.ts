export type NavColumn = { heading: string; items: string[] };
export type NavDropdown = { label: string; columns: NavColumn[] };

export const NAV_DROPDOWNS: NavDropdown[] = [
  {
    label: 'Registrations',
    columns: [
      {
        heading: 'Company Registration',
        items: [
          'Company Registration In India',
          'Private Limited Company',
          'LLP Registration',
          'One Person Company (OPC)',
          'Section 8 Company',
          'Sole Proprietorship',
          'Public Limited Company',
          'Liaison Office',
          'Project Office',
          'Branch Office',
        ],
      },
      {
        heading: 'Compliance',
        items: [
          'Shop & Establishment Registration',
          'Vendor Reconciliation',
          'Due Diligence',
          'GEM Registration',
          'LEI Registration',
          'PF Registration',
          'DSC Registration',
          'Legal Metrology Registration',
        ],
      },
      {
        heading: 'Licenses',
        items: [
          'IEC Registration',
          'MSME Registration',
          'Startup India Registration',
          'GST Registration',
          'FSSAI Registration',
          'ISO Registration',
          'ISP License Registration',
        ],
      },
    ],
  },
  {
    label: 'Outsourcing',
    columns: [
      {
        heading: 'Outsourcing',
        items: [
          'Accounting & Bookkeeping Outsourcing',
          'Accounts Payable Service',
          'Accounts Receivable Services',
          'Virtual CFO Services',
          'Zoho Books Accounting',
          'QuickBooks Accounting',
          'Xero Accounting Services',
          'SOX Compliance',
          'Payroll Outsourcing Service',
        ],
      },
    ],
  },
  {
    label: 'Advisory',
    columns: [
      {
        heading: 'Advisory',
        items: [
          'Risk Management & Compliance',
          'Policy & Process Standardization',
          'Internal Financial Control',
          'ICFR Setup Services',
          'SOP Drafting & Process',
          'Audit System & Risk Assessment',
        ],
      },
      {
        heading: 'Tax Filing',
        items: [
          'TDS Return Filing Online',
          'GST Returns Filing Online',
          'Income Tax Returns',
        ],
      },
      {
        heading: 'Valuation',
        items: ['Business Valuation', 'CCPS & OCPS Valuation'],
      },
      {
        heading: 'Strategy & Research',
        items: ['Market Research', 'Market Feasibility Study'],
      },
    ],
  },
  {
    label: 'Other',
    columns: [
      {
        heading: 'Other',
        items: ['Calculate Quote', 'Name Check', 'Contact Us', 'About Us', 'Blogs', 'Resources'],
      },
    ],
  },
];
