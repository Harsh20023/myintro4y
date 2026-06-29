import 'dotenv/config'
import { connectDB } from '../config/db'
import { ServiceCategory } from '../models/ServiceCategory'
import { Service } from '../models/Service'
import { ServicePage } from '../models/ServicePage'

async function seed() {
  await connectDB()

  // ── Clear existing data ─────────────────────────────────────────────────────
  await ServicePage.deleteMany({})
  await Service.deleteMany({})
  await ServiceCategory.deleteMany({})
  console.log('Cleared existing services data.')

  // ── Categories ──────────────────────────────────────────────────────────────
  const [catReg, catCompliance, catLicenses] = await ServiceCategory.insertMany([
    { name: 'Company Registration', slug: 'company-registration', icon: 'building-2',   displayOrder: 1, isVisible: true },
    { name: 'Compliance',           slug: 'compliance',           icon: 'shield-check',  displayOrder: 2, isVisible: true },
    { name: 'Licenses',             slug: 'licenses',             icon: 'badge-check',   displayOrder: 3, isVisible: true },
  ])
  console.log('Categories seeded.')

  // ── Services ────────────────────────────────────────────────────────────────
  const services = await Service.insertMany([
    // Company Registration
    {
      categoryId: catReg._id, name: 'Private Limited Company', slug: 'private-limited-company',
      shortDescription: 'Most popular structure for startups & growing businesses with limited liability protection.',
      icon: 'building-2', displayOrder: 1, isActive: true,
      metaTitle: 'Private Limited Company Registration in India | Conceptra',
      metaDescription: 'Register your Private Limited Company online in India. Fast, expert-assisted, fully digital process with Conceptra Advisory.',
    },
    {
      categoryId: catReg._id, name: 'LLP Registration', slug: 'llp-registration',
      shortDescription: 'Flexible business structure combining benefits of a partnership and a company.',
      icon: 'handshake', displayOrder: 2, isActive: true,
      metaTitle: 'LLP Registration in India | Conceptra Advisory',
      metaDescription: 'Register a Limited Liability Partnership (LLP) in India quickly and easily with Conceptra.',
    },
    {
      categoryId: catReg._id, name: 'One Person Company (OPC)', slug: 'one-person-company',
      shortDescription: 'Run a company solo with full limited liability — ideal for solo entrepreneurs.',
      icon: 'user-circle', displayOrder: 3, isActive: true,
      metaTitle: 'One Person Company (OPC) Registration | Conceptra',
      metaDescription: 'Start your One Person Company (OPC) in India with expert CA support. Quick and fully online.',
    },
    {
      categoryId: catReg._id, name: 'Section 8 Company', slug: 'section-8-company',
      shortDescription: 'Register an NGO or non-profit company for charitable, social, or educational purposes.',
      icon: 'heart-handshake', displayOrder: 4, isActive: true,
      metaTitle: 'Section 8 Company (NGO) Registration | Conceptra',
      metaDescription: 'Register a Section 8 non-profit company in India. Experts assist with NGO incorporation end-to-end.',
    },
    {
      categoryId: catReg._id, name: 'Sole Proprietorship', slug: 'sole-proprietorship',
      shortDescription: 'The simplest business form — register and start operations immediately.',
      icon: 'user', displayOrder: 5, isActive: true,
      metaTitle: 'Sole Proprietorship Registration | Conceptra Advisory',
      metaDescription: 'Register your sole proprietorship firm in India quickly with Conceptra Advisory.',
    },
    {
      categoryId: catReg._id, name: 'Public Limited Company', slug: 'public-limited-company',
      shortDescription: 'Raise capital from the public — ideal for large-scale business operations.',
      icon: 'landmark', displayOrder: 6, isActive: true,
      metaTitle: 'Public Limited Company Registration | Conceptra',
      metaDescription: 'Register a Public Limited Company in India with expert CA guidance from Conceptra Advisory.',
    },
    // Compliance
    {
      categoryId: catCompliance._id, name: 'Shop & Establishment Registration', slug: 'shop-establishment-registration',
      shortDescription: 'Mandatory registration for all shops, offices, and commercial establishments.',
      icon: 'store', displayOrder: 1, isActive: true,
      metaTitle: 'Shop & Establishment Registration | Conceptra',
      metaDescription: 'Get your Shop & Establishment licence quickly with expert help from Conceptra Advisory.',
    },
    {
      categoryId: catCompliance._id, name: 'GST Registration', slug: 'gst-registration',
      shortDescription: 'Register for GST to legally collect tax and claim input tax credit.',
      icon: 'receipt', displayOrder: 2, isActive: true,
      metaTitle: 'GST Registration Online | Conceptra Advisory',
      metaDescription: 'Apply for GST registration online in India with Conceptra. Fast approval and expert filing.',
    },
    {
      categoryId: catCompliance._id, name: 'PF Registration', slug: 'pf-registration',
      shortDescription: 'Provident Fund registration mandatory for businesses with 20+ employees.',
      icon: 'piggy-bank', displayOrder: 3, isActive: true,
      metaTitle: 'PF Registration for Employers | Conceptra Advisory',
      metaDescription: "Get your EPFO PF registration done easily with Conceptra's expert team.",
    },
    {
      categoryId: catCompliance._id, name: 'DSC Registration', slug: 'dsc-registration',
      shortDescription: 'Digital Signature Certificate for signing MCA, GST, and income tax filings online.',
      icon: 'key-round', displayOrder: 4, isActive: true,
      metaTitle: 'Digital Signature Certificate (DSC) | Conceptra',
      metaDescription: 'Get your Class 3 DSC for MCA filings, GST, and income tax returns with Conceptra Advisory.',
    },
    // Licenses
    {
      categoryId: catLicenses._id, name: 'IEC Registration', slug: 'iec-registration',
      shortDescription: 'Import Export Code — mandatory for any business involved in import/export.',
      icon: 'globe', displayOrder: 1, isActive: true,
      metaTitle: 'IEC Registration (Import Export Code) | Conceptra',
      metaDescription: 'Apply for Import Export Code (IEC) online with Conceptra Advisory. Quick and hassle-free.',
    },
    {
      categoryId: catLicenses._id, name: 'MSME Registration', slug: 'msme-registration',
      shortDescription: 'Udyam registration for micro, small & medium enterprises — unlock government benefits.',
      icon: 'badge-check', displayOrder: 2, isActive: true,
      metaTitle: 'MSME / Udyam Registration | Conceptra Advisory',
      metaDescription: 'Register your business as MSME (Udyam) online and unlock priority lending, subsidies, and more.',
    },
    {
      categoryId: catLicenses._id, name: 'FSSAI Registration', slug: 'fssai-registration',
      shortDescription: 'Food Safety licence mandatory for all food businesses in India.',
      icon: 'utensils', displayOrder: 3, isActive: true,
      metaTitle: 'FSSAI Food Licence Registration | Conceptra',
      metaDescription: 'Apply for FSSAI food safety registration or licence quickly with Conceptra Advisory.',
    },
    {
      categoryId: catLicenses._id, name: 'ISO Registration', slug: 'iso-registration',
      shortDescription: 'Get internationally recognised ISO certification to boost credibility.',
      icon: 'award', displayOrder: 4, isActive: true,
      metaTitle: 'ISO Certification in India | Conceptra Advisory',
      metaDescription: "Get ISO 9001, ISO 14001 or other ISO certifications with Conceptra's expert support.",
    },
  ])
  console.log(`Services seeded: ${services.length}`)

  // ── Sample page content for Private Limited Company ─────────────────────────
  const pvtLtd = services.find(s => s.slug === 'private-limited-company')!

  await ServicePage.create({
    serviceId: pvtLtd._id,
    heroTitle:       'Register Your Private Limited Company Online',
    heroSubtitle:    'Fast, fully online, expert-assisted incorporation with automated PAN & TAN generation.',
    heroCTAText:     'Get Started',
    overviewText:    `A Private Limited Company (Pvt Ltd) is the most popular and recommended business structure for startups and growing businesses in India. It offers limited liability protection to its shareholders — meaning your personal assets are protected in case the business faces legal or financial issues.\n\nUnder the Companies Act 2013, a Private Limited Company requires a minimum of 2 directors and 2 shareholders (who can be the same people), with at least one director being an Indian resident. There is no minimum paid-up capital requirement.\n\nPvt Ltd companies enjoy easier access to venture capital, bank loans, and institutional funding compared to other business structures.`,
    eligibilityText: `• Minimum 2 directors (maximum 15)\n• At least one director must be an Indian resident\n• Minimum 2 shareholders (directors and shareholders can be the same)\n• All directors must have a valid DIN (Director Identification Number)\n• Directors must have a Digital Signature Certificate (DSC)\n• A valid Indian address for the registered office`,
    sections: [
      {
        type: 'STEPS', heading: 'How It Works', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Step 1: Obtain DSC',         body: 'All proposed directors must get a Digital Signature Certificate (Class 3). Required for signing all MCA forms electronically.',        icon: 'key-round',      displayOrder: 1 },
          { type: 'STEP', title: 'Step 2: Apply for DIN',       body: 'Director Identification Number is generated automatically during SPICe+ filing. No separate application needed for new companies.',   icon: 'id-card',        displayOrder: 2 },
          { type: 'STEP', title: 'Step 3: Name Approval',       body: 'Submit up to 2 proposed company names via SPICe+ Part A. Our team checks availability and trademark conflicts before submission.',    icon: 'search',         displayOrder: 3 },
          { type: 'STEP', title: 'Step 4: Draft MOA & AOA',     body: 'We prepare the Memorandum of Association and Articles of Association defining your company\'s objectives and internal rules.',        icon: 'file-text',      displayOrder: 4 },
          { type: 'STEP', title: 'Step 5: SPICe+ Part B Filing',body: 'Single integrated form for company incorporation, PAN, TAN, GSTIN, EPFO, and ESIC — all in one submission.',                         icon: 'upload-cloud',   displayOrder: 5 },
          { type: 'STEP', title: 'Step 6: ROC Review',          body: 'The Registrar of Companies reviews all documents. Our team responds to any queries raised by the ROC on your behalf.',              icon: 'shield-check',   displayOrder: 6 },
          { type: 'STEP', title: 'Step 7: Certificate Issued',  body: 'Receive your Certificate of Incorporation (CoI) with your unique CIN number. PAN and TAN are automatically issued.',                 icon: 'badge-check',    displayOrder: 7 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card',           body: 'PAN card of all proposed directors and shareholders.',                                  icon: 'credit-card',   displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar / Passport', body: 'Aadhaar card for Indian nationals or passport for foreign nationals.',                  icon: 'id-card',       displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Address Proof',      body: 'Bank statement or utility bill (not older than 2 months) of all directors.',            icon: 'map-pin',       displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Photograph',         body: 'Passport-sized photograph of all proposed directors.',                                  icon: 'image',         displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Registered Office',  body: 'Utility bill or NOC from owner + rent agreement for the registered office address.',    icon: 'building-2',    displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Email & Phone',      body: 'Individual email addresses and mobile numbers for each director.',                      icon: 'mail',          displayOrder: 6 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Why Private Limited Company?', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Limited Liability',         body: 'Shareholders are only liable up to the value of their shares — personal assets are fully protected.',    icon: 'shield',         displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Separate Legal Entity',     body: 'The company exists as a separate legal person, can own assets, sign contracts, and sue or be sued.',      icon: 'briefcase',      displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Easy Funding Access',       body: 'Venture capitalists and angel investors strongly prefer Pvt Ltd structure for equity investment.',         icon: 'trending-up',    displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Perpetual Succession',      body: 'The company continues to exist even if directors or shareholders change or leave.',                       icon: 'infinity',       displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Tax Benefits',              body: 'Eligible for startup tax exemption under Section 80-IAC. Lower effective tax rate via deductions.',        icon: 'percent',        displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Professional Credibility',  body: '"Pvt Ltd" tag adds significant credibility with clients, vendors, banks, and government bodies.',          icon: 'award',          displayOrder: 6 },
        ],
      },
      {
        type: 'PRICING', heading: 'Pricing', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'PRICING_CARD', title: 'Starter',    body: 'Basic incorporation with 2 directors. Includes DSC, name approval, MOA/AOA drafting, and CoI.',        displayOrder: 1, metadata: { price: '₹6,999', badge: null,          includes: ['2 DSC', 'Name Approval', 'MOA & AOA', 'Certificate of Incorporation', 'PAN & TAN'] } },
          { type: 'PRICING_CARD', title: 'Standard',   body: 'Everything in Starter plus GST registration and first-year compliance filing support.',                 displayOrder: 2, metadata: { price: '₹9,999', badge: 'Most Popular', includes: ['Everything in Starter', 'GST Registration', 'Commencement Certificate', '1 Year Compliance Support'] } },
          { type: 'PRICING_CARD', title: 'Premium',    body: 'Complete setup with MSME, trademark search, and 1 year of expert CA advisory for your business.',       displayOrder: 3, metadata: { price: '₹14,999', badge: null,         includes: ['Everything in Standard', 'MSME Registration', 'Trademark Search', '1 Year CA Advisory', 'Priority Support'] } },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 5, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'How long does Private Limited Company registration take?',      body: 'The entire process typically takes 7–10 working days, subject to ROC processing times and document readiness.',    displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'What is the minimum capital required?',                         body: 'There is no minimum paid-up capital requirement for a Private Limited Company under the Companies Act 2013.',     displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Can a foreigner be a director in an Indian Pvt Ltd?',          body: 'Yes. At least one director must be an Indian resident, but the remaining directors can be foreign nationals.',     displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'What is a Digital Signature Certificate (DSC)?',               body: 'DSC is an electronic signature required to sign MCA forms online. It is mandatory for all proposed directors.',   displayOrder: 4 },
          { type: 'FAQ_ITEM', title: 'Is GST registration mandatory after incorporation?',           body: 'GST registration is mandatory if annual turnover exceeds ₹20 lakhs (₹10 lakhs for North-East states).',           displayOrder: 5 },
          { type: 'FAQ_ITEM', title: 'What annual compliances does a Pvt Ltd company need to file?', body: 'Annual filings include AOC-4 (Financial Statements), MGT-7A (Annual Return), and Income Tax Return each year.', displayOrder: 6 },
        ],
      },
    ],
  })
  console.log('ServicePage seeded for: Private Limited Company')

  // ── Sample page content for GST Registration ────────────────────────────────
  const gstSvc = services.find(s => s.slug === 'gst-registration')!

  await ServicePage.create({
    serviceId: gstSvc._id,
    heroTitle:    'GST Registration Online — Fast & Hassle-Free',
    heroSubtitle: 'Get your GSTIN in 3–5 working days with expert CA support.',
    heroCTAText:  'Register for GST',
    overviewText: `Goods and Services Tax (GST) is a unified indirect tax levied on the supply of goods and services across India. Any business with an annual turnover exceeding ₹20 lakhs (₹10 lakhs for North-East and hill states) is required to register for GST.\n\nGST registration gives you a unique 15-digit GSTIN, allows you to collect GST from customers, and enables you to claim input tax credit on purchases — which can significantly reduce your overall tax liability.\n\nCertain categories of businesses such as e-commerce sellers, inter-state suppliers, and casual taxable persons must register regardless of turnover.`,
    eligibilityText: `• Businesses with annual turnover above ₹20 lakhs\n• Any business supplying goods/services across state borders\n• E-commerce operators and sellers on Amazon, Flipkart, etc.\n• Agents and input service distributors\n• Non-resident taxable persons`,
    sections: [
      {
        type: 'STEPS', heading: 'Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Step 1: Document Collection', body: 'Share your PAN, Aadhaar, business address proof, and bank details with our team.',            icon: 'file-text',    displayOrder: 1 },
          { type: 'STEP', title: 'Step 2: Form Filing',         body: 'We prepare and submit your GST REG-01 application on the GSTN portal on your behalf.',        icon: 'upload-cloud', displayOrder: 2 },
          { type: 'STEP', title: 'Step 3: ARN Generation',      body: 'You receive an Application Reference Number (ARN) within 24 hours of submission.',             icon: 'hash',         displayOrder: 3 },
          { type: 'STEP', title: 'Step 4: Verification',        body: 'GST officer reviews your application. We handle any queries or additional document requests.',  icon: 'search',       displayOrder: 4 },
          { type: 'STEP', title: 'Step 5: GSTIN Issued',        body: 'Your GST Identification Number (GSTIN) and GST certificate are issued within 3–7 working days.', icon: 'badge-check',  displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card',           body: 'PAN of the proprietor, partners, or company as applicable.',                         icon: 'credit-card', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar Card',       body: 'Aadhaar of the applicant for identity verification.',                                 icon: 'id-card',     displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Business Address',   body: 'Utility bill + rent agreement / NOC from owner for the principal place of business.', icon: 'map-pin',     displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Bank Details',       body: 'Cancelled cheque or bank statement showing account number and IFSC.',                 icon: 'landmark',    displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Photograph',         body: 'Passport-size photograph of the authorised signatory.',                               icon: 'image',       displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Business Documents', body: 'MOA/AOA for companies, partnership deed for firms, or registration certificate.',     icon: 'file-text',   displayOrder: 6 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is GST registration mandatory for all businesses?',        body: 'No. It is mandatory only if annual turnover exceeds ₹20 lakhs (goods) or ₹20 lakhs (services), or for specific categories.',   displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long does GST registration take?',                     body: 'Typically 3–7 working days after submission of all documents. Aadhaar-linked applications can be approved in 3 days.',          displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'What is the GST registration fee?',                        body: 'GST registration itself is free on the government portal. You only pay for our expert assistance and filing charges.',           displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'Can I have multiple GSTINs for different business units?', body: 'Yes. You can register separately for each state you operate in, and optionally for different business verticals in a state.',   displayOrder: 4 },
        ],
      },
    ],
  })
  console.log('ServicePage seeded for: GST Registration')

  console.log('\n✓ Services seed completed successfully.')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
