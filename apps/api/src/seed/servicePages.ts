import 'dotenv/config'
import { connectDB } from '../config/db'
import { ServiceCategory } from '../models/ServiceCategory'
import { Service } from '../models/Service'
import { ServicePage } from '../models/ServicePage'

async function seed() {
  await connectDB()

  // ── Add missing services ────────────────────────────────────────────────────
  const catCompliance = await ServiceCategory.findOne({ slug: 'compliance' })
  const catLicenses   = await ServiceCategory.findOne({ slug: 'licenses' })
  const catReg        = await ServiceCategory.findOne({ slug: 'company-registration' })

  if (!catCompliance || !catLicenses || !catReg) {
    console.error('Categories not found — run seed:services first.')
    process.exit(1)
  }

  await Service.findOneAndUpdate({ slug: 'gem-registration' }, {
    categoryId: catCompliance._id, name: 'GEM Registration', slug: 'gem-registration',
    shortDescription: 'Register on Government e-Marketplace to sell directly to government departments.',
    icon: 'shopping-bag', displayOrder: 5, isActive: true,
    metaTitle: 'GEM Registration Online | Conceptra Advisory',
    metaDescription: 'Register your business on GeM portal to access government procurement contracts with Conceptra.',
  }, { upsert: true, new: true })

  await Service.findOneAndUpdate({ slug: 'startup-india-registration' }, {
    categoryId: catLicenses._id, name: 'Startup India Registration', slug: 'startup-india-registration',
    shortDescription: 'Get DPIIT recognition and unlock tax benefits, funding & simplified compliance for your startup.',
    icon: 'rocket', displayOrder: 5, isActive: true,
    metaTitle: 'Startup India DPIIT Recognition | Conceptra Advisory',
    metaDescription: 'Get your startup recognised under DPIIT Startup India program for tax exemptions and funding access.',
  }, { upsert: true, new: true })

  await Service.findOneAndUpdate({ slug: 'isp-license-registration' }, {
    categoryId: catLicenses._id, name: 'ISP License Registration', slug: 'isp-license-registration',
    shortDescription: 'Obtain DoT licence to legally offer internet services across India.',
    icon: 'wifi', displayOrder: 6, isActive: true,
    metaTitle: 'ISP License Registration in India | Conceptra Advisory',
    metaDescription: 'Apply for Class A, B or C ISP licence from DoT with expert guidance from Conceptra Advisory.',
  }, { upsert: true, new: true })

  console.log('Missing services added.')

  // ── Helper ──────────────────────────────────────────────────────────────────
  async function upsertPage(slug: string, data: Record<string, unknown>) {
    const svc = await Service.findOne({ slug })
    if (!svc) { console.warn(`Service not found: ${slug}`); return }
    await ServicePage.findOneAndUpdate({ serviceId: svc._id }, { serviceId: svc._id, ...data }, { upsert: true, new: true })
    console.log(`✓ ${slug}`)
  }

  // ── Private Limited Company ─────────────────────────────────────────────────
  await upsertPage('private-limited-company', {
    heroTitle: 'Private Limited Company Registration in India',
    heroSubtitle: 'Register your Pvt Ltd company in 8–10 days with expert CA support. No hidden charges, 100% digital process.',
    heroCTAText: 'Start Registration',
    overviewText: `A Private Limited Company is one of the most popular and trusted ways to register a business in India. It creates a separate legal entity that can own property, enter contracts, and take loans independently of its founders.\n\nThe structure provides limited liability protection — your personal assets remain safe even if the company faces losses. It also makes it easier to attract investors, hire talent, and scale operations with clarity and compliance.\n\nWith Conceptra, the entire process — from DSC to Certificate of Incorporation — is handled end-to-end online within 8–10 working days.`,
    eligibilityText: `• Minimum 2 directors (at least one Indian resident for 182+ days)\n• Minimum 2 shareholders (max 200; can include NRIs and foreigners)\n• No minimum paid-up capital requirement\n• Valid registered address in India\n• NRI documents must be notarised/apostilled`,
    sections: [
      {
        type: 'STEPS', heading: 'Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Digital Signature Certificate (DSC)', body: 'Obtain DSC for all directors. All incorporation documents are signed digitally. Foreign nationals must provide notarised documents.', displayOrder: 1 },
          { type: 'STEP', title: 'Director Identification Number (DIN)', body: 'DIN is created through the SPICe+ form during incorporation, officially recognising you as a director.', displayOrder: 2 },
          { type: 'STEP', title: 'Name Approval (RUN / SPICe+ Part A)', body: 'Company name must be unique and non-similar to existing trademarks. Process takes 3–5 working days.', displayOrder: 3 },
          { type: 'STEP', title: 'Drafting MOA and AOA', body: 'Memorandum and Articles of Association define company objectives and internal governance rules.', displayOrder: 4 },
          { type: 'STEP', title: 'Filing SPICe+ Forms', body: 'Submit SPICe+, AGILE-PRO, e-MOA, and e-AOA with all required attachments to the MCA portal.', displayOrder: 5 },
          { type: 'STEP', title: 'Certificate of Incorporation', body: 'Government issues the Certificate along with CIN, PAN, and TAN within 3–7 working days.', displayOrder: 6 },
          { type: 'STEP', title: 'Bank Account Opening', body: 'Open a current account using the Certificate of Incorporation, PAN, and KYC documents.', displayOrder: 7 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Mandatory for all Indian directors and shareholders.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar / Address Proof', body: 'Bank statement or utility bill not older than 60 days.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Passport-size Photograph', body: 'Recent colour photograph of each director.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Specimen Signature', body: 'Scanned signature on white paper for each director.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Registered Office Proof', body: 'Utility bill + NOC from property owner if rented.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Passport (NRI/Foreign)', body: 'Notarised and apostilled passport copy for foreign directors.', displayOrder: 6 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Why Choose a Private Limited Company?', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Limited Liability Protection', body: 'Personal assets are safe. You are only responsible for the amount you invested.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Separate Legal Identity', body: 'The company can own property, sue, and be sued independently of its founders.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Easier Funding', body: 'Banks, VCs, and angel investors trust Pvt Ltd companies far more than unregistered firms.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Foreign Ownership', body: '100% FDI is allowed under the Automatic Route in most sectors.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Perpetual Succession', body: 'The company continues to exist even if ownership or management changes.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Global Recognition', body: 'Structure is recognised internationally, enabling cross-border partnerships and operations.', displayOrder: 6 },
        ],
      },
      {
        type: 'PRICING', heading: 'Pricing Plans', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'PRICING_CARD', title: 'Basic', body: 'Ideal for early-stage startups', displayOrder: 1, metadata: { price: '₹6,999', badge: null, includes: ['DSC for 2 directors', 'DIN for 2 directors', 'Name approval', 'MOA & AOA drafting', 'SPICe+ filing', 'Certificate of Incorporation'] } },
          { type: 'PRICING_CARD', title: 'Standard', body: 'Most popular for growing businesses', displayOrder: 2, metadata: { price: '₹9,999', badge: 'Most Popular', includes: ['Everything in Basic', 'GST registration', 'Bank account assistance', 'PAN & TAN registration', 'Startup India registration', 'First year ROC compliance'] } },
          { type: 'PRICING_CARD', title: 'Premium', body: 'Complete end-to-end incorporation', displayOrder: 3, metadata: { price: '₹14,999', badge: null, includes: ['Everything in Standard', 'Trademark search & filing', 'MSME registration', 'Shareholders agreement', 'Company seal & kit', 'Dedicated CA manager'] } },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 5, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'How long does Pvt Ltd registration take?', body: 'Generally 7–12 working days with clear documentation. NRI cases may take 14–21 days.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'Is there a minimum capital requirement?', body: "No fixed capital requirement. You can start your company with just ₹1 and increase it later.", displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Can an NRI register a private limited company?', body: 'Yes. NRIs can own 100% in most sectors. At least one director must be an Indian resident.', displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'Can the entire process be done online?', body: 'Yes. Everything is digital — from document submission to receiving the Certificate of Incorporation.', displayOrder: 4 },
          { type: 'FAQ_ITEM', title: 'Can I use my home address as registered office?', body: 'Yes, with an NOC from the property owner.', displayOrder: 5 },
        ],
      },
    ],
  })

  // ── LLP Registration ────────────────────────────────────────────────────────
  await upsertPage('llp-registration', {
    heroTitle: 'LLP Registration in India',
    heroSubtitle: 'Register your Limited Liability Partnership in 8–10 days. Flexible structure with lower compliance than a Pvt Ltd.',
    heroCTAText: 'Register Your LLP',
    overviewText: `A Limited Liability Partnership (LLP) combines the flexibility of a traditional partnership with the limited liability protection of a company. It is ideal for professionals, consultants, and service businesses who want legal recognition without the heavy compliance burden of a Private Limited Company.\n\nIn an LLP, each partner's liability is limited to their agreed contribution. Partners are not personally liable for the misconduct or negligence of other partners. The structure has no minimum capital requirement and lower annual compliance costs.`,
    eligibilityText: `• Minimum 2 designated partners required\n• At least one partner must be an Indian resident\n• No minimum capital contribution\n• Suitable for professionals, service firms, and family businesses\n• Foreign partners allowed under FEMA (automatic route for most sectors)`,
    sections: [
      {
        type: 'STEPS', heading: 'LLP Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Obtain Digital Signature Certificate (DSC)', body: 'All designated partners must obtain DSC for digital filing on the MCA portal.', displayOrder: 1 },
          { type: 'STEP', title: 'Apply for Designated Partner Identification Number (DPIN)', body: 'DPIN is the LLP equivalent of DIN — required for each designated partner.', displayOrder: 2 },
          { type: 'STEP', title: 'Name Reservation (RUN-LLP)', body: 'Submit 2 name options. The name must be unique and not resemble existing LLPs or trademarks.', displayOrder: 3 },
          { type: 'STEP', title: 'File FiLLiP Form', body: 'The Form for Incorporation of Limited Liability Partnership is filed with all partner and business details.', displayOrder: 4 },
          { type: 'STEP', title: 'Draft LLP Agreement', body: 'A mutual agreement defining profit sharing, responsibilities, and operational rules is filed within 30 days.', displayOrder: 5 },
          { type: 'STEP', title: 'Certificate of Incorporation', body: 'MCA issues the Certificate of Incorporation with LLPIN, PAN, and TAN within 5–7 working days.', displayOrder: 6 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Of all designated partners.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar / Address Proof', body: 'Utility bill or bank statement not older than 2 months.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Passport-size Photograph', body: 'Recent colour photograph of each partner.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Registered Office Proof', body: 'Electricity bill + NOC from property owner.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'LLP Agreement Draft', body: 'Mutual agreement among partners (filed within 30 days of incorporation).', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of LLP', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Limited Liability', body: "Partners' personal assets are protected. Liability is limited to their contribution amount.", displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Low Compliance', body: 'No mandatory board meetings, fewer ROC filings, and no audit required below ₹40 lakh turnover.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Flexible Profit Sharing', body: 'Partners decide profit-sharing ratios independently of capital contribution.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'No Minimum Capital', body: 'Start with any amount. There is no prescribed minimum contribution.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Separate Legal Entity', body: 'LLP can own assets, enter contracts, and sue/be sued in its own name.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Tax Efficient', body: 'LLPs are not subject to dividend distribution tax, making profit distribution more tax-efficient.', displayOrder: 6 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'What is the difference between LLP and Pvt Ltd?', body: 'LLP has lower compliance costs and no mandatory audit below a turnover threshold. Pvt Ltd is better for raising equity funding from investors.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'Can an LLP have foreign partners?', body: 'Yes. Foreign nationals and NRIs can be partners, subject to FEMA regulations. One designated partner must be Indian.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'How long does LLP registration take?', body: '8–10 working days with complete documentation.', displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'Is annual audit mandatory for LLP?', body: 'Audit is mandatory only if turnover exceeds ₹40 lakhs or contribution exceeds ₹25 lakhs.', displayOrder: 4 },
        ],
      },
    ],
  })

  // ── One Person Company ──────────────────────────────────────────────────────
  await upsertPage('one-person-company', {
    heroTitle: 'One Person Company (OPC) Registration in India',
    heroSubtitle: 'Run your company solo with full limited liability. Complete OPC registration in 10–20 working days.',
    heroCTAText: 'Register Your OPC',
    overviewText: `A One Person Company (OPC) is the perfect structure for solo entrepreneurs who want the benefits of a registered company — limited liability, separate legal identity, and professional credibility — without needing a co-founder or partner.\n\nIntroduced under the Companies Act 2013, OPC allows a single Indian citizen to own and control 100% of a company. It is ideal for freelancers, consultants, individual traders, and professionals who want to scale their business formally.`,
    eligibilityText: `• Only one shareholder (must be Indian citizen)\n• At least one director (can be same person as shareholder)\n• One mandatory Indian resident nominee (via Form INC-3)\n• NRIs eligible if Indian citizen with 120-day residency rule\n• OCI/PIO cardholders and foreign nationals are NOT eligible\n• FDI is not permitted in OPCs`,
    sections: [
      {
        type: 'STEPS', heading: 'OPC Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Obtain DSC', body: 'Digital Signature Certificate for the founder/director is required to sign all incorporation documents.', displayOrder: 1 },
          { type: 'STEP', title: 'Apply for DIN', body: 'Director Identification Number is obtained during the SPICe+ filing process.', displayOrder: 2 },
          { type: 'STEP', title: 'Name Approval', body: 'Submit 1–2 unique name options to MCA. Approved names are reserved for 20 days.', displayOrder: 3 },
          { type: 'STEP', title: 'Draft MOA & AOA', body: 'Memorandum and Articles of Association are prepared based on your business activities.', displayOrder: 4 },
          { type: 'STEP', title: 'Nominee Consent (INC-3)', body: 'A mandatory nominee provides written consent. The nominee takes over if the founder is incapacitated.', displayOrder: 5 },
          { type: 'STEP', title: 'File SPICe+ Form', body: 'All details are submitted through SPICe+ along with required documents and declarations.', displayOrder: 6 },
          { type: 'STEP', title: 'Certificate of Incorporation', body: 'MCA issues COI with CIN, PAN, and TAN. Open a current account using these documents.', displayOrder: 7 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Of the shareholder/director.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar Card', body: 'For identity and address verification.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Passport-size Photograph', body: 'Recent colour photograph of the founder.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Address Proof', body: 'Bank statement or utility bill (max 2 months old).', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Registered Office Proof', body: 'Electricity bill + NOC from property owner.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Nominee Documents', body: "Nominee's PAN, Aadhaar, and INC-3 consent form.", displayOrder: 6 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of OPC', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Single Ownership & Control', body: 'You own and control 100% of the company with no need for co-founders.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Limited Liability', body: 'Personal assets are fully protected. Only company assets are at risk.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Separate Legal Identity', body: 'The OPC can sign contracts, open accounts, and build vendor trust in its own name.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Higher Credibility', body: 'Clients and corporates trust OPCs more than sole proprietorships for projects and tenders.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Tax Benefits', body: 'OPCs enjoy tax advantages similar to private companies with deductions on business expenses.', displayOrder: 5 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Can an NRI start an OPC?', body: 'Yes, if they are Indian citizens meeting the 120-day residency rule. OCI holders and foreign nationals are not eligible.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'Is there a minimum capital for OPC?', body: 'No. You can start with as little as ₹1.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Can an OPC be converted to Pvt Ltd?', body: 'Yes, once turnover crosses ₹2 crore or paid-up capital exceeds ₹50 lakh, it must be converted.', displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'How long does registration take?', body: '10–20 working days including all MCA approvals.', displayOrder: 4 },
        ],
      },
    ],
  })

  // ── Section 8 Company ───────────────────────────────────────────────────────
  await upsertPage('section-8-company', {
    heroTitle: 'Section 8 Company Registration in India',
    heroSubtitle: 'Register your NGO or non-profit with the highest legal credibility. Eligible for 12A, 80G, and FCRA approvals.',
    heroCTAText: 'Register Your NGO',
    overviewText: `A Section 8 Company is a non-profit organisation registered under Section 8 of the Companies Act 2013. Unlike trusts or societies, it is governed by the MCA and has the highest legal credibility among NGO structures.\n\nThese companies are formed for charitable purposes — education, healthcare, rural development, environment protection, or social welfare. Profits cannot be distributed to members; every rupee is reinvested into the organisation's objectives.\n\nSection 8 companies can receive foreign donations (after FCRA approval), attract CSR funds from corporates, and claim tax exemptions under 12A and 80G.`,
    eligibilityText: `• Minimum 2 directors (at least one Indian resident)\n• No minimum capital requirement\n• Must have charitable objectives (education, social welfare, environment, etc.)\n• NRIs and foreign nationals eligible with notarised/apostilled documents\n• Must appoint an Indian resident director`,
    sections: [
      {
        type: 'STEPS', heading: 'Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Name Reservation', body: "Names must reflect charitable objectives using terms like 'Foundation', 'Forum', or 'Association'.", displayOrder: 1 },
          { type: 'STEP', title: 'Obtain DSC & DIN', body: 'All directors obtain DSC. DIN is applied through SPICe+. Foreign directors need apostilled documentation.', displayOrder: 2 },
          { type: 'STEP', title: 'Draft MOA & AOA', body: 'AOA includes governance rules, voting powers, and specific social objectives.', displayOrder: 3 },
          { type: 'STEP', title: 'Apply for Section 8 Licence (INC-12)', body: 'MCA reviews objectives, financial projections, and director affidavits before granting the licence.', displayOrder: 4 },
          { type: 'STEP', title: 'File SPICe+ Form', body: 'Final incorporation filing handles PAN, TAN issuance along with the Certificate of Incorporation.', displayOrder: 5 },
          { type: 'STEP', title: 'Post-incorporation Approvals', body: 'Apply for 12A (tax exemption), 80G (donor deduction), and FCRA (foreign contributions) as needed.', displayOrder: 6 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card & Aadhaar', body: 'For all directors.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Address Proof', body: 'Utility bill or bank statement (max 2 months old).', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Passport-size Photograph', body: 'For each director.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Registered Office Proof', body: 'Electricity bill + NOC from property owner.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Charitable Objectives Statement', body: 'Detailed description of social objectives and planned activities.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Financial Projections', body: 'Estimated income and expenditure for 3 years.', displayOrder: 6 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of Section 8 Company', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Highest Legal Credibility', body: 'Governed by MCA (Companies Act), more credible than trusts or societies registered under state laws.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Tax Exemptions', body: '12A registration exempts income from tax. 80G allows donors to claim tax deductions.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Limited Liability', body: 'Members are not personally liable for company obligations.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'CSR Funding Eligibility', body: 'Corporates prefer Section 8 companies for CSR grants due to their accountability and MCA oversight.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Foreign Donations (FCRA)', body: 'After 3 years and FCRA registration, Section 8 companies can receive international donations.', displayOrder: 5 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Can a Section 8 company generate revenue?', body: 'Yes, but all profits must be reinvested into charitable activities. No dividends can be paid to members.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'What is the minimum capital needed?', body: 'No minimum capital is required. Even ₹10,000 suffices.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'How long does registration take?', body: '12–20 working days including MCA licence approval.', displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'Can foreign nationals register a Section 8 company?', body: 'Yes, with notarised/apostilled documents. At least one Indian resident director is mandatory.', displayOrder: 4 },
        ],
      },
    ],
  })

  // ── Sole Proprietorship ─────────────────────────────────────────────────────
  await upsertPage('sole-proprietorship', {
    heroTitle: 'Sole Proprietorship Registration in India',
    heroSubtitle: 'The simplest business structure — register and start operations immediately with minimal compliance.',
    heroCTAText: 'Register Now',
    overviewText: `A Sole Proprietorship is the simplest and most common form of business in India. It is owned and operated by a single individual who has complete control over all decisions and retains all profits.\n\nWhile there is no formal registration process specifically for sole proprietorships, legal recognition is established through registrations such as GST, MSME (Udyam), Shop & Establishment, and a current bank account in the business name.\n\nIdeal for small traders, freelancers, home-based businesses, and local service providers who want to start quickly without complex compliance.`,
    eligibilityText: `• Any Indian citizen (18+ years)\n• No minimum capital requirement\n• No restriction on type of business activity\n• One owner only — cannot have partners or co-owners\n• NRIs may face restrictions on certain business activities`,
    sections: [
      {
        type: 'STEPS', heading: 'How to Register a Sole Proprietorship', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Choose a Business Name', body: 'Pick a unique business name. Check for trademark conflicts before finalising.', displayOrder: 1 },
          { type: 'STEP', title: 'GST Registration', body: 'Mandatory if turnover exceeds ₹40 lakhs (₹20 lakhs for services). Provides legal recognition to the business.', displayOrder: 2 },
          { type: 'STEP', title: 'MSME / Udyam Registration', body: 'Optional but highly recommended. Unlocks government schemes, priority lending, and subsidies.', displayOrder: 3 },
          { type: 'STEP', title: 'Shop & Establishment Licence', body: 'Required for physical commercial establishments. Issued by the local municipal body.', displayOrder: 4 },
          { type: 'STEP', title: 'Current Bank Account', body: 'Open a current account in the business name using GST certificate, Aadhaar, and PAN.', displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Of the proprietor (used as business PAN).', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar Card', body: 'For identity and address proof.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Business Address Proof', body: 'Utility bill or rental agreement for the business premises.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Passport-size Photograph', body: 'Recent colour photograph of the proprietor.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Bank Account Details', body: 'Cancelled cheque or passbook copy for bank account opening.', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of Sole Proprietorship', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Easy & Fast to Start', body: 'No formal registration process. Begin operations immediately with minimal paperwork.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Complete Control', body: 'You make all decisions without needing approval from partners, directors, or shareholders.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Low Compliance', body: 'Minimal regulatory filings compared to companies or LLPs. Just file your income tax return annually.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Retain All Profits', body: 'No profit sharing. All business income is yours after taxes.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Low Cost', body: 'Negligible registration costs. Only pay for GST or MSME registration fees (often free).', displayOrder: 5 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is registration compulsory for sole proprietorship?', body: 'No formal registration exists, but GST, MSME, or Shop & Establishment registration gives it legal recognition.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'Can I convert to a Pvt Ltd company later?', body: 'Yes. You can convert to a Private Limited Company as your business grows.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'What are the tax implications?', body: 'Business income is taxed as personal income of the proprietor under the Income Tax Act.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── Public Limited Company ──────────────────────────────────────────────────
  await upsertPage('public-limited-company', {
    heroTitle: 'Public Limited Company Registration in India',
    heroSubtitle: 'Raise capital from the public through share offerings. Ideal for large-scale enterprises seeking broad investor base.',
    heroCTAText: 'Start Registration',
    overviewText: `A Public Limited Company can offer its shares to the general public and is listed (or can be listed) on stock exchanges. It is governed by the Companies Act 2013 with stricter compliance requirements than a Private Limited Company.\n\nThis structure is ideal for businesses that plan to raise significant capital through public offerings, attract institutional investors, or eventually list on BSE or NSE. The company must have at least 3 directors and 7 shareholders, with no upper limit on shareholders.`,
    eligibilityText: `• Minimum 3 directors (at least one Indian resident)\n• Minimum 7 shareholders\n• No maximum limit on shareholders\n• Minimum paid-up capital of ₹5 lakhs\n• Registered address in India\n• Mandatory appointment of Company Secretary`,
    sections: [
      {
        type: 'STEPS', heading: 'Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Obtain DSC & DIN', body: 'All 3+ directors must have DSC and DIN before incorporation can begin.', displayOrder: 1 },
          { type: 'STEP', title: 'Name Reservation', body: 'Reserve a unique company name through MCA. The name must end with "Limited".', displayOrder: 2 },
          { type: 'STEP', title: 'Draft MOA & AOA', body: 'Memorandum and Articles of Association define company objectives and governance structure.', displayOrder: 3 },
          { type: 'STEP', title: 'File SPICe+ Form', body: 'Submit all incorporation details, documents, and declarations to the MCA portal.', displayOrder: 4 },
          { type: 'STEP', title: 'Certificate of Incorporation', body: 'MCA issues COI with CIN, PAN, and TAN within 7–10 working days.', displayOrder: 5 },
          { type: 'STEP', title: 'Post-Incorporation Compliance', body: 'Appoint Company Secretary, file prospectus, complete tax registrations, and prepare for listing if required.', displayOrder: 6 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN & Aadhaar', body: 'For all directors and shareholders.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Address Proof', body: 'Bank statement or utility bill not older than 2 months.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'MOA & AOA', body: 'Drafted Memorandum and Articles of Association.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Registered Office Proof', body: 'Utility bill + NOC from property owner.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Declaration of Compliance', body: 'Signed by company secretary or practicing CA.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Consent of Directors', body: 'Form DIR-2 consent from all proposed directors.', displayOrder: 6 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of Public Limited Company', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Access to Large Capital', body: 'Raise funds from the public through IPOs, FPOs, and rights issues.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Stock Exchange Listing', body: 'Shares can be listed on BSE/NSE, providing liquidity and investor confidence.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Limited Liability', body: "Shareholders' liability is limited to their shareholding value.", displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Perpetual Succession', body: 'Company continues to exist irrespective of changes in ownership or management.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Enhanced Brand Credibility', body: 'Public disclosure and regulatory oversight build strong brand reputation.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Employee ESOPs', body: 'Issue stock options to attract and retain top talent.', displayOrder: 6 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'What is the minimum capital for a Public Limited Company?', body: 'Minimum paid-up capital of ₹5 lakhs is required.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How many directors are needed?', body: 'Minimum 3 directors. At least one must be an Indian resident.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Is listing on a stock exchange mandatory?', body: 'No. A Public Limited Company can exist without being listed, but listing is an option.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── Shop & Establishment Registration ──────────────────────────────────────
  await upsertPage('shop-establishment-registration', {
    heroTitle: 'Shop & Establishment Registration',
    heroSubtitle: 'Mandatory compliance for all commercial establishments in India. Get registered quickly with expert support.',
    heroCTAText: 'Get Registered',
    overviewText: `The Shops and Establishments Act is a state-level legislation that regulates working conditions, employee rights, and operational rules for commercial establishments. Registration is mandatory for shops, offices, restaurants, hotels, theatres, and any business operating commercially.\n\nThe certificate must be displayed prominently at the place of business and is often required for opening a business bank account, obtaining other licences, and hiring employees.`,
    eligibilityText: `• All commercial establishments must register within 30 days of starting operations\n• Applicable to shops, offices, restaurants, hotels, warehouses, and more\n• Registration is state-specific — rules and fees vary by state\n• Applies to both employers and employees`,
    sections: [
      {
        type: 'STEPS', heading: 'Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Prepare Documentation', body: 'Gather identity proof, business address documents, and employee details.', displayOrder: 1 },
          { type: 'STEP', title: 'Download Application Form', body: 'Access the form from your state Labour Department website or visit the local office.', displayOrder: 2 },
          { type: 'STEP', title: 'Submit Application', body: 'File the completed form with required documents online or at the local Labour Office.', displayOrder: 3 },
          { type: 'STEP', title: 'Inspection (if required)', body: 'Authorities may conduct an inspection of the premises for certain categories of establishments.', displayOrder: 4 },
          { type: 'STEP', title: 'Pay Registration Fee', body: 'Fees vary by state and number of employees. Usually ₹500–₹3,000.', displayOrder: 5 },
          { type: 'STEP', title: 'Receive Certificate', body: 'Display the registration certificate prominently at your establishment.', displayOrder: 6 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Business Name & Address', body: 'Name, type, and nature of the commercial establishment.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Identity Proof', body: 'Aadhaar, PAN, or passport of the proprietor/partners/directors.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Business Premises Proof', body: 'Rental agreement or ownership documents for the commercial space.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Employee Details', body: 'Names, designations, and joining dates of all employees.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Partnership Deed / MOA', body: 'If the business is a partnership or company.', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Why Register?', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Legal Compliance', body: 'Avoid penalties, fines, and closure notices from labour authorities.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Business Legitimacy', body: 'The certificate establishes credibility with customers, vendors, and financial institutions.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Bank Account Requirement', body: 'Most banks require the S&E certificate to open a business current account.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Licence Gateway', body: 'Required for obtaining other licences like food licence, trade licence, and GST registration.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Employee Protection', body: 'Ensures compliance with working hour limits, leave policies, and employee welfare regulations.', displayOrder: 5 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is registration mandatory for all businesses?', body: 'Yes, for all commercial establishments operating within a state. Exemptions vary by state.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long is the registration valid?', body: 'Most states require annual renewal. Some states issue lifetime registrations.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'What is the penalty for non-registration?', body: 'Penalties vary by state — typically ₹1,000–₹5,000 plus potential business closure.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── GST Registration ────────────────────────────────────────────────────────
  await upsertPage('gst-registration', {
    heroTitle: 'GST Registration Online',
    heroSubtitle: 'Get your GSTIN in 3–7 working days. Trusted by 5,000+ businesses. No hidden charges, 100% online process.',
    heroCTAText: 'Get GST Registration',
    overviewText: `The Goods and Services Tax (GST) is a comprehensive indirect tax levied on the supply of goods and services in India. Launched on 1 July 2017, it unified fragmented tax systems by replacing VAT, service tax, excise duty, and other indirect taxes.\n\nA GSTIN (GST Identification Number) is a 15-digit PAN-based unique identification number allotted to every registered business. It is mandatory for businesses with annual turnover exceeding ₹40 lakhs (₹20 lakhs for special category states and service businesses).`,
    eligibilityText: `• Annual turnover exceeding ₹40 lakhs (goods) or ₹20 lakhs (services)\n• Any business making interstate supply of goods/services\n• E-commerce operators regardless of turnover\n• Businesses required to pay tax under reverse charge\n• Input service distributors and casual taxable persons`,
    sections: [
      {
        type: 'STEPS', heading: 'GST Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Determine Eligibility', body: 'Check if your business turnover or nature of supply requires mandatory GST registration.', displayOrder: 1 },
          { type: 'STEP', title: 'Gather Required Documents', body: 'Prepare all documentation including PAN, Aadhaar, business address proof, and bank details.', displayOrder: 2 },
          { type: 'STEP', title: 'Submit Online Application', body: 'File the application on gst.gov.in. Our team handles this end-to-end on your behalf.', displayOrder: 3 },
          { type: 'STEP', title: 'OTP Verification', body: 'Aadhaar-based OTP verification is done to authenticate the applicant identity.', displayOrder: 4 },
          { type: 'STEP', title: 'Tax Authority Verification', body: 'GST officer reviews the application and may raise queries within 3 working days.', displayOrder: 5 },
          { type: 'STEP', title: 'GSTIN Issuance', body: 'Your 15-digit GSTIN is issued. You can now file GST returns and claim input tax credit.', displayOrder: 6 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Of the business and its proprietor/partners/directors.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar Card', body: 'For Aadhaar-based OTP authentication.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Business Address Proof', body: 'Electricity bill, rent agreement, or property ownership documents.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Bank Account Details', body: 'Cancelled cheque or bank statement showing business name.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Business Constitution Proof', body: 'Partnership deed, MOA/AOA, or incorporation certificate.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Digital Signature', body: 'Required for companies and LLPs.', displayOrder: 6 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of GST Registration', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Input Tax Credit', body: 'Claim credit on GST paid on purchases, reducing your overall tax liability significantly.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Legal Compliance', body: 'A valid GSTIN demonstrates you operate within the law, building trust with customers and authorities.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Enhanced Credibility', body: 'Clients and suppliers prefer GST-registered vendors for B2B transactions.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'E-commerce Access', body: 'Mandatory for selling on Amazon, Flipkart, and other e-commerce platforms.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Unified Tax System', body: 'One registration covers all your business locations under a single national tax framework.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Competitive Advantage', body: 'GST-registered businesses can offer tax-inclusive pricing that qualifies for buyer input credit.', displayOrder: 6 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Who must register for GST?', body: 'Businesses with turnover over ₹40 lakhs, interstate suppliers, e-commerce operators, and certain specific categories.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long does GST registration take?', body: 'Typically 3–7 working days with complete documentation.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'What is the penalty for not registering?', body: 'Penalty of ₹10,000 or 10% of tax due (whichever is higher) plus interest on unpaid taxes.', displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'Can a business have multiple GSTINs?', body: 'Yes, one GSTIN per state. Businesses operating in multiple states need separate registrations.', displayOrder: 4 },
          { type: 'FAQ_ITEM', title: 'Is GST registration mandatory for online businesses?', body: 'Yes. E-commerce sellers must register for GST irrespective of turnover.', displayOrder: 5 },
        ],
      },
    ],
  })

  // ── PF Registration ─────────────────────────────────────────────────────────
  await upsertPage('pf-registration', {
    heroTitle: 'PF Registration for Employers',
    heroSubtitle: 'Mandatory EPFO registration for businesses with 20+ employees. Stay compliant and protect your workforce.',
    heroCTAText: 'Register for PF',
    overviewText: `Provident Fund (PF) registration under the Employees' Provident Fund Organisation (EPFO) is mandatory for all establishments with 20 or more employees. It is also voluntary for smaller businesses.\n\nPF is a retirement savings scheme where both employer and employee contribute 12% of the basic salary monthly. It provides financial security to employees after retirement, with partial withdrawal options for emergencies like medical needs, home purchase, and education.`,
    eligibilityText: `• Mandatory for establishments with 20+ employees\n• Voluntary for establishments with fewer than 20 employees\n• Applies to factories, companies, shops, and certain cooperative societies\n• International workers covered under Social Security Agreements are also eligible`,
    sections: [
      {
        type: 'STEPS', heading: 'PF Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Gather Employee & Business Details', body: "Collect employee names, dates of birth, PAN numbers, salaries, and the company's bank and registration details.", displayOrder: 1 },
          { type: 'STEP', title: 'Register on EPFO Portal', body: 'Create an account on the EPFO Employer Portal (epfindia.gov.in).', displayOrder: 2 },
          { type: 'STEP', title: 'Complete Online Form', body: "Enter establishment type, industry details, employee count, and owner's contact information.", displayOrder: 3 },
          { type: 'STEP', title: 'Upload Documents', body: 'Attach business registration proof, PAN, and bank account details.', displayOrder: 4 },
          { type: 'STEP', title: 'Receive PF Registration Number', body: 'EPFO issues a unique 22-digit PF registration number (Establishment Code) upon approval.', displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Business Registration Proof', body: 'Certificate of Incorporation, Partnership Deed, or GST certificate.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Of the establishment and proprietor/directors.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Bank Account Details', body: 'Account number and IFSC code for contribution payments.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Employee Details', body: 'Names, salaries, contact details, PAN, and dates of birth of all employees.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Address Proof', body: 'Utility bill or rental agreement for the establishment address.', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Retirement Security for Employees', body: 'Employees accumulate a corpus for post-retirement financial security.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Tax Deduction', body: "Employee PF contributions are deductible under Section 80C of the Income Tax Act.", displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Emergency Withdrawals', body: 'Partial withdrawals allowed for medical emergencies, home loan repayment, education, and marriage.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Life Insurance (EDLI)', body: "Employees covered under EPFO's Employee Deposit Linked Insurance scheme.", displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Better Employee Retention', body: "PF coverage improves employee satisfaction and reduces turnover for the employer.", displayOrder: 5 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'What is the PF contribution rate?', body: 'Both employer and employee contribute 12% of basic salary + dearness allowance each month.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'Is PF registration free?', body: 'Yes. There is no fee for registration. Administrative charges apply post-registration (0.5% of contributions).', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Can employees withdraw PF before retirement?', body: 'Yes, partial withdrawals are allowed for specific purposes. Full withdrawal is possible after retirement or 2 months of unemployment.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── DSC Registration ────────────────────────────────────────────────────────
  await upsertPage('dsc-registration', {
    heroTitle: 'Digital Signature Certificate (DSC)',
    heroSubtitle: 'Get your Class 2 or Class 3 DSC for MCA filings, income tax returns, GST, and e-tendering.',
    heroCTAText: 'Get Your DSC',
    overviewText: `A Digital Signature Certificate (DSC) is the electronic equivalent of a physical signature. It validates the identity of the sender and ensures the authenticity and integrity of digital documents.\n\nIn India, DSCs are regulated under the Information Technology Act, 2000. They are mandatory for company incorporation filings on MCA, income tax returns, GST portal submissions, and e-tendering on government portals.\n\nDSCs come in three classes: Class 1 (email verification), Class 2 (standard business filings), and Class 3 (high-security e-tendering and GST).`,
    eligibilityText: `• Any individual or organisation can obtain a DSC\n• Organisations require an authorised signatory to apply\n• Foreign nationals need notarised/apostilled documents\n• No minimum age requirement for applicants`,
    sections: [
      {
        type: 'STEPS', heading: 'DSC Application Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Choose DSC Type & Validity', body: 'Select Class 2 or Class 3 based on your requirement. Choose 1, 2, or 3-year validity.', displayOrder: 1 },
          { type: 'STEP', title: 'Select Certifying Authority', body: 'Choose a licensed CA from the Controller of Certifying Authorities list (eMudhra, TCS, NSDL, etc.).', displayOrder: 2 },
          { type: 'STEP', title: 'Submit Application & Documents', body: 'Complete the DSC form and upload PAN, Aadhaar, and photograph.', displayOrder: 3 },
          { type: 'STEP', title: 'Video KYC / Document Verification', body: 'Certifying authority verifies your identity through video KYC or physical document verification.', displayOrder: 4 },
          { type: 'STEP', title: 'DSC Issuance', body: 'DSC is issued as a USB token or downloadable file. Install the software and activate your certificate.', displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Primary identity document for all DSC applications.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar Card', body: 'For address verification and OTP-based authentication.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Passport-size Photograph', body: 'Recent colour photograph of the applicant.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Company Documents (for org DSC)', body: 'Certificate of Incorporation, MOA/AOA, and company PAN.', displayOrder: 4 },
        ],
      },
      {
        type: 'PRICING', heading: 'DSC Pricing', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'PRICING_CARD', title: 'Class 2 DSC', body: 'For standard MCA and income tax filings', displayOrder: 1, metadata: { price: '₹1,500', badge: null, includes: ['1-year validity', 'USB token', 'MCA filings', 'Income tax returns', 'GST returns'] } },
          { type: 'PRICING_CARD', title: 'Class 3 DSC', body: 'For e-tendering and high-security applications', displayOrder: 2, metadata: { price: '₹2,500', badge: 'Recommended', includes: ['2-year validity', 'Encrypted USB token', 'E-tendering', 'GST portal', 'All Class 2 uses'] } },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Which DSC class do I need for company registration?', body: 'Class 3 DSC is required for MCA company registration and GST filings.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'What is the validity of a DSC?', body: 'Usually 1 to 3 years. It must be renewed before expiry.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'How long does it take to get a DSC?', body: '1–3 working days with complete documentation.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── IEC Registration ────────────────────────────────────────────────────────
  await upsertPage('iec-registration', {
    heroTitle: 'Import Export Code (IEC) Registration',
    heroSubtitle: 'Get your 10-digit IEC from DGFT in 2–7 days. Mandatory for any business importing or exporting goods.',
    heroCTAText: 'Apply for IEC',
    overviewText: `An Import Export Code (IEC) is a 10-digit unique identifier issued by India's Directorate General of Foreign Trade (DGFT). It is the primary licence required for conducting international trade — importing goods into India or exporting goods out of India.\n\nIEC registration is a one-time process with lifetime validity. It does not require annual renewal and is linked to your PAN. Banks need IEC to process foreign trade transactions, and customs authorities use it to clear goods at ports.`,
    eligibilityText: `• Any individual, company, LLP, partnership firm, or trust\n• Must have a valid PAN card\n• Must have a current bank account\n• Businesses not eligible: defence, atomic energy, and government departments\n• No minimum turnover requirement`,
    sections: [
      {
        type: 'STEPS', heading: 'IEC Application Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Prepare Documents', body: 'Gather PAN, bank details, address proof, and business registration documents.', displayOrder: 1 },
          { type: 'STEP', title: 'Access DGFT Portal', body: 'Log in to the DGFT e-portal at dgft.gov.in and create an account.', displayOrder: 2 },
          { type: 'STEP', title: 'Fill IEC Application Form', body: 'Complete the online application with business name, address, PAN, and bank details accurately.', displayOrder: 3 },
          { type: 'STEP', title: 'Upload Documents', body: 'Attach all required scanned documents to the application.', displayOrder: 4 },
          { type: 'STEP', title: 'Pay Application Fee', body: 'Pay the government fee of ₹500 online through the DGFT portal.', displayOrder: 5 },
          { type: 'STEP', title: 'Receive IEC Code', body: 'Your unique 10-digit IEC is issued within 2–7 working days after verification.', displayOrder: 6 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Of the individual/business entity.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Aadhaar / Address Proof', body: 'For identity and business address verification.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Bank Account Details', body: 'Cancelled cheque with business name printed on it.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Business Registration Proof', body: 'Certificate of Incorporation, Partnership Deed, or MSME certificate.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'GST Certificate', body: 'If registered for GST.', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of IEC', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Legal Import/Export Authority', body: 'IEC is the legal authorisation to conduct international trade in India.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Government Scheme Access', body: 'Unlock export incentives under MEIS, RoSCTL, and other DGFT schemes.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Lifetime Validity', body: 'One-time registration with no renewal required as long as the PAN is valid.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Global Business Credibility', body: 'IEC enhances your reputation with international buyers and suppliers.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Bank Support', body: 'Banks require IEC to open Forex accounts and process foreign remittances.', displayOrder: 5 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is IEC mandatory for all exporters?', body: 'Yes. No person or entity can import or export without a valid IEC (with limited exceptions).', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'What is the government fee?', body: 'IEC application fee is ₹500. Modifications cost ₹200 each.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Does IEC need renewal?', body: 'No. IEC is valid for the lifetime of the entity. Annual updation on DGFT portal is required.', displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'Can one entity have multiple IECs?', body: 'No. Each PAN can have only one IEC.', displayOrder: 4 },
        ],
      },
    ],
  })

  // ── MSME Registration ───────────────────────────────────────────────────────
  await upsertPage('msme-registration', {
    heroTitle: 'MSME / Udyam Registration',
    heroSubtitle: 'Register your Micro, Small or Medium Enterprise on the Udyam portal. Unlock government subsidies, priority lending, and more.',
    heroCTAText: 'Register as MSME',
    overviewText: `MSME (Micro, Small and Medium Enterprises) registration, now called Udyam Registration, is a government scheme that provides legal recognition to small businesses and unlocks a wide range of government benefits.\n\nClassification is based on annual turnover and investment in plant and machinery: Micro (up to ₹1 crore investment, ₹5 crore turnover), Small (up to ₹10 crore, ₹50 crore), and Medium (up to ₹50 crore, ₹250 crore).\n\nRegistration is free on the Udyam portal and can be completed in under 30 minutes with Aadhaar.`,
    eligibilityText: `• Any manufacturing or service enterprise\n• Sole proprietorships, partnerships, LLPs, Pvt Ltd companies all eligible\n• No minimum turnover required for registration\n• Micro: Investment ≤ ₹1Cr, Turnover ≤ ₹5Cr\n• Small: Investment ≤ ₹10Cr, Turnover ≤ ₹50Cr\n• Medium: Investment ≤ ₹50Cr, Turnover ≤ ₹250Cr`,
    sections: [
      {
        type: 'STEPS', heading: 'Udyam Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Prepare Documents', body: 'Keep Aadhaar, PAN, business registration, and investment/turnover records ready.', displayOrder: 1 },
          { type: 'STEP', title: 'Visit Udyam Portal', body: 'Go to udyamregistration.gov.in and click "For New Entrepreneurs" to start.', displayOrder: 2 },
          { type: 'STEP', title: 'Aadhaar Verification', body: 'Enter your Aadhaar number and validate with OTP sent to your registered mobile.', displayOrder: 3 },
          { type: 'STEP', title: 'Complete Business Details', body: 'Enter business name, type, address, NIC code, investment, and turnover information.', displayOrder: 4 },
          { type: 'STEP', title: 'Submit & Receive Certificate', body: 'Submit the form. Your Udyam Registration Certificate is issued immediately.', displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Aadhaar Card', body: 'Mandatory for OTP-based verification on the Udyam portal.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'For business and proprietor/director.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Business Registration Proof', body: 'GST certificate, incorporation certificate, or partnership deed.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Bank Account Details', body: 'Account number and IFSC code.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Investment & Turnover Records', body: 'Balance sheets or ITR for accurate classification as Micro/Small/Medium.', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of MSME Registration', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Priority Bank Loans', body: 'Collateral-free loans up to ₹10 lakh under CGTMSE scheme with lower interest rates.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Government Subsidies', body: 'Capital investment subsidies, electricity tariff concessions, and ISO certification reimbursement.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Tax Benefits', body: 'Direct tax exemptions and reduced GST liability in several categories.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Government Procurement', body: 'Priority in government tenders and procurement under the Public Procurement Policy.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Payment Protection', body: 'Interest on delayed payments from buyers (MSMED Act protection).', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Export Promotion', body: 'Trade fair participation support and export promotion assistance from government.', displayOrder: 6 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is MSME registration free?', body: 'Yes. Udyam registration on the government portal is completely free.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'Is MSME registration mandatory?', body: 'No, it is voluntary. But it is highly recommended as it unlocks significant government benefits.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'How long does it take?', body: 'Registration is instant. Certificate is issued immediately after successful submission.', displayOrder: 3 },
          { type: 'FAQ_ITEM', title: 'Can a company with GST registration apply?', body: 'Yes. GST and MSME registrations are independent.', displayOrder: 4 },
        ],
      },
    ],
  })

  // ── FSSAI Registration ──────────────────────────────────────────────────────
  await upsertPage('fssai-registration', {
    heroTitle: 'FSSAI Food Licence & Registration',
    heroSubtitle: 'Mandatory for all food businesses in India. Get your FSSAI licence — Basic, State, or Central — with expert support.',
    heroCTAText: 'Apply for FSSAI Licence',
    overviewText: `The Food Safety and Standards Authority of India (FSSAI) operates under the Ministry of Health & Family Welfare and regulates food safety standards across India. All food business operators (FBOs) — including manufacturers, traders, restaurants, caterers, importers, and exporters — must obtain FSSAI registration or licence before starting operations.\n\nRegistration type depends on annual turnover: Basic (up to ₹12 lakhs), State Licence (₹12 lakhs to ₹20 crores), and Central Licence (above ₹20 crores or multi-state/import-export operations).`,
    eligibilityText: `• All Food Business Operators (FBOs) in India\n• Basic: Turnover up to ₹12 lakhs (small manufacturers, retailers)\n• State Licence: ₹12 lakhs to ₹20 crores (medium businesses, distributors)\n• Central Licence: Above ₹20 crores or multi-state/import-export operations\n• Home-based food businesses also require Basic registration`,
    sections: [
      {
        type: 'STEPS', heading: 'Application Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Determine Registration Type', body: 'Check your annual turnover to decide whether you need Basic, State, or Central licence.', displayOrder: 1 },
          { type: 'STEP', title: 'Prepare & Submit Application', body: 'Complete Form A (Basic) or Form B (State/Central) and submit online with required documents.', displayOrder: 2 },
          { type: 'STEP', title: 'Document Verification', body: 'FSSAI authorities review submitted documents and may request additional information.', displayOrder: 3 },
          { type: 'STEP', title: 'Premises Inspection', body: 'For State and Central licences, officials inspect your premises for safety compliance.', displayOrder: 4 },
          { type: 'STEP', title: 'Licence Issuance', body: 'A unique 14-digit FSSAI number is issued. Display it on all food packaging and marketing materials.', displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card & Aadhaar', body: 'Identity documents of proprietor/directors.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Business Address Proof', body: 'Rental agreement, property documents, or utility bill.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Shop & Establishment Certificate', body: 'If applicable to the business.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'List of Food Products', body: 'Complete list of food products to be manufactured or traded.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Equipment & Machinery List', body: 'For manufacturing units — State and Central licence.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Water Test Report', body: 'Laboratory analysis of water used in production (State/Central licence).', displayOrder: 6 },
        ],
      },
      {
        type: 'PRICING', heading: 'FSSAI Fees', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'PRICING_CARD', title: 'Basic Registration', body: 'Small food businesses & home-based operations', displayOrder: 1, metadata: { price: '₹100/year', badge: null, includes: ['Annual turnover up to ₹12 lakhs', 'Small manufacturers & retailers', 'Online submission via FoSCoS portal', 'Registration certificate in 7 days'] } },
          { type: 'PRICING_CARD', title: 'State Licence', body: 'Medium food businesses', displayOrder: 2, metadata: { price: '₹2,000–5,000/year', badge: null, includes: ['Turnover ₹12L to ₹20Cr', 'Distributors & medium manufacturers', 'Premises inspection required', 'Valid for 1–5 years'] } },
          { type: 'PRICING_CARD', title: 'Central Licence', body: 'Large & multi-state operations', displayOrder: 3, metadata: { price: '₹7,500/year', badge: null, includes: ['Turnover above ₹20 crores', 'Import/export businesses', 'Multi-state operations', 'Centralised oversight'] } },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is FSSAI registration mandatory for home-based food businesses?', body: 'Yes. Any person involved in food manufacturing, processing, or sale must have FSSAI registration, including home-based businesses.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long is FSSAI registration valid?', body: 'Valid for 1–5 years depending on the period selected during application. Renewal must be done before expiry.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'What is the penalty for operating without FSSAI?', body: 'Penalty of up to ₹5 lakhs for operating without a valid FSSAI licence.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── ISO Registration ────────────────────────────────────────────────────────
  await upsertPage('iso-registration', {
    heroTitle: 'ISO Certification in India',
    heroSubtitle: 'Get internationally recognised ISO certification to boost credibility, win more clients, and expand globally.',
    heroCTAText: 'Get ISO Certified',
    overviewText: `ISO (International Organization for Standardization) certification validates that your organisation follows internationally recognised standards for quality, safety, and efficiency. It is awarded by accredited third-party certification bodies after a thorough audit of your management systems.\n\nCommon standards include ISO 9001 (Quality Management), ISO 14001 (Environmental Management), ISO 27001 (Information Security), and ISO 45001 (Occupational Health & Safety). Certification signals reliability to customers, partners, and government bodies worldwide.`,
    eligibilityText: `• Any registered business entity can apply\n• No minimum turnover or employee count\n• Must have documented management systems in place\n• Applicable to manufacturing, IT, services, healthcare, and more\n• Organisation must operate for at least 3–6 months before certification audit`,
    sections: [
      {
        type: 'STEPS', heading: 'ISO Certification Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Select the Right ISO Standard', body: 'Identify which standard fits your industry — ISO 9001, 14001, 27001, or others.', displayOrder: 1 },
          { type: 'STEP', title: 'Choose an Accredited Certifying Body', body: 'Select a body accredited by QCI/NABCB (India) or other internationally recognised accreditation bodies.', displayOrder: 2 },
          { type: 'STEP', title: 'Gap Analysis', body: 'Compare current practices against ISO standard requirements. Identify gaps that need to be addressed.', displayOrder: 3 },
          { type: 'STEP', title: 'Document Management Systems', body: 'Create comprehensive documentation for all processes, policies, and procedures.', displayOrder: 4 },
          { type: 'STEP', title: 'Implement & Train Staff', body: 'Deploy the management system organisation-wide. Train employees on their roles and responsibilities.', displayOrder: 5 },
          { type: 'STEP', title: 'Stage 1 & Stage 2 Audit', body: 'Stage 1 reviews documentation. Stage 2 verifies that the system is implemented and effective.', displayOrder: 6 },
          { type: 'STEP', title: 'Certification Awarded', body: 'Certificate is issued after successful audit. Annual surveillance audits maintain the certification.', displayOrder: 7 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Business Registration Proof', body: 'Certificate of Incorporation or GST registration certificate.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'PAN Card & Aadhaar', body: 'Of the business and authorised signatory.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Management System Documentation', body: 'Quality manuals, SOPs, process flowcharts relevant to the ISO standard.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Scope of Certification', body: 'Written description of the activities and departments to be covered.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Organisational Chart', body: 'Employee structure and role descriptions.', displayOrder: 5 },
        ],
      },
      {
        type: 'PRICING', heading: 'ISO Certification Fees', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'PRICING_CARD', title: 'ISO 9001 (Quality)', body: 'Quality Management System', displayOrder: 1, metadata: { price: 'From ₹25,000', badge: null, includes: ['Gap analysis', 'Documentation support', 'Audit facilitation', 'Certificate (3 years)', 'Annual surveillance'] } },
          { type: 'PRICING_CARD', title: 'ISO 27001 (InfoSec)', body: 'Information Security Management', displayOrder: 2, metadata: { price: 'From ₹50,000', badge: 'Popular for IT', includes: ['ISMS documentation', 'Risk assessment', 'Security audit prep', 'Certificate (3 years)', 'Annual surveillance'] } },
          { type: 'PRICING_CARD', title: 'ISO 14001 (Environment)', body: 'Environmental Management System', displayOrder: 3, metadata: { price: 'From ₹30,000', badge: null, includes: ['EMS documentation', 'Legal compliance review', 'Environmental audit', 'Certificate (3 years)', 'Annual surveillance'] } },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is ISO certification mandatory?', body: 'No, it is voluntary. However, many government tenders and large corporates require ISO certification from vendors.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long is ISO certification valid?', body: 'ISO certificates are typically valid for 3 years with annual surveillance audits.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Can a startup get ISO certified?', body: 'Yes. Startups can get ISO certified provided they have documented processes and have been operational for at least 3 months.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── Startup India Registration ──────────────────────────────────────────────
  await upsertPage('startup-india-registration', {
    heroTitle: 'Startup India (DPIIT) Recognition',
    heroSubtitle: 'Get government recognition for your startup. Unlock 3-year tax holiday, funding access, and simplified compliance.',
    heroCTAText: 'Get DPIIT Recognition',
    overviewText: `Startup India is a flagship initiative launched by the Government of India in January 2016 to foster innovation and entrepreneurship. Recognition by the Department for Promotion of Industry and Internal Trade (DPIIT) is the gateway to a wide range of benefits.\n\nEligible startups get a 3-year income tax exemption, capital gains tax relief, simplified compliance, fast-track IPR processing, and access to government funding schemes through SIDBI and other investors.`,
    eligibilityText: `• Registered as Pvt Ltd Company, LLP, or Partnership Firm in India\n• Not older than 10 years from date of incorporation\n• Annual turnover less than ₹100 crore in any financial year\n• Working towards innovation, development, or improvement of products/services\n• Should not be formed by splitting or reconstruction of an existing business`,
    sections: [
      {
        type: 'STEPS', heading: 'Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Incorporate Your Business', body: 'First register as a Pvt Ltd company, LLP, or partnership firm.', displayOrder: 1 },
          { type: 'STEP', title: 'Register on Startup India Portal', body: 'Create an account on startupindia.gov.in and apply for DPIIT recognition.', displayOrder: 2 },
          { type: 'STEP', title: 'Submit Innovation Details', body: 'Describe your product/service innovation, target market, and business model.', displayOrder: 3 },
          { type: 'STEP', title: 'DPIIT Review', body: 'DPIIT reviews your application and issues recognition. No physical visit required.', displayOrder: 4 },
          { type: 'STEP', title: 'Claim Benefits', body: 'Apply for tax exemptions via CBDT, funding schemes via SIDBI, and IPR benefits via IP India.', displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Incorporation Certificate', body: 'Certificate of Incorporation from MCA.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Business PAN for identity verification.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Business Description', body: 'Detailed description of your innovative product/service.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Proof of Concept', body: 'Prototype, patent, or website showing the innovative nature of the business.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Director/Partner ID Proof', body: 'Aadhaar and PAN of founders.', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Startup India Benefits', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: '3-Year Tax Exemption', body: 'Income tax holiday for 3 consecutive years out of the first 10 years of operation.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Capital Gains Tax Relief', body: 'Exemption on capital gains from eligible investments by Section 54 GB eligible investors.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Reduced Angel Tax', body: 'DPIIT-recognised startups are exempt from Section 56(2)(viib) angel tax provisions.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Fast-Track IPR', body: '80% rebate on patent filing fees and fast-track patent examination for startups.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Government Funding Access', body: 'Eligible for SIDBI Fund of Funds, BIRAC grants, and Atal Innovation Mission support.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Self-Certification', body: 'Self-certify compliance under 9 labour and 3 environmental laws for 3–5 years.', displayOrder: 6 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Can any business get Startup India recognition?', body: 'No. The business must be innovative — not a simple reselling or routine business. It must aim to create or improve products/services.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long does recognition take?', body: 'Typically 2–7 working days after submitting the online application on the Startup India portal.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Do I need to be profitable to apply?', body: 'No. Even loss-making startups can apply as long as they meet the eligibility criteria.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── GEM Registration ────────────────────────────────────────────────────────
  await upsertPage('gem-registration', {
    heroTitle: 'GeM Registration — Sell to the Government',
    heroSubtitle: 'Register on Government e-Marketplace (GeM) and access ₹2+ lakh crore in government procurement annually.',
    heroCTAText: 'Register on GeM',
    overviewText: `Government e-Marketplace (GeM) is the official online procurement portal of the Government of India where government departments, ministries, PSUs, and state entities purchase goods and services from registered sellers.\n\nWith over ₹2 lakh crore in annual procurement, GeM provides businesses direct access to a massive buyer base — from stationery and IT products to construction materials and professional services. Registration is free and the portal handles everything from listing to payment.`,
    eligibilityText: `• Any registered Indian business (Pvt Ltd, LLP, proprietorship, MSMEs)\n• Must have a valid PAN and GST registration\n• Aadhaar-linked mobile number for OTP verification\n• Bank account in the name of the business\n• No minimum turnover requirement`,
    sections: [
      {
        type: 'STEPS', heading: 'GeM Registration Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Initial Consultation', body: 'Assess your product/service category and determine GeM listing strategy.', displayOrder: 1 },
          { type: 'STEP', title: 'Prepare Documents', body: 'Gather PAN, GST certificate, Aadhaar, bank details, and business registration proof.', displayOrder: 2 },
          { type: 'STEP', title: 'Register on GeM Portal', body: 'Create seller account on gem.gov.in with Aadhaar OTP and PAN verification.', displayOrder: 3 },
          { type: 'STEP', title: 'Complete Organisation Profile', body: 'Enter business details, bank account, and upload registration documents.', displayOrder: 4 },
          { type: 'STEP', title: 'List Products/Services', body: 'Add your products or services to the marketplace with detailed specifications and pricing.', displayOrder: 5 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'PAN Card', body: 'Of the business and proprietor/directors.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'GST Registration Certificate', body: 'Mandatory for GeM registration.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Aadhaar Card', body: 'Of the authorised signatory for OTP verification.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Bank Account Details', body: 'Current account in business name for receiving payments.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Business Registration Proof', body: 'Certificate of Incorporation, MSME certificate, or GST certificate.', displayOrder: 5 },
        ],
      },
      {
        type: 'BENEFITS', heading: 'Benefits of GeM Registration', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Massive Buyer Base', body: 'Access 10,000+ government organisations — central, state, and PSU buyers on a single platform.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'Transparent & Timely Payments', body: 'Payment within 10 days of delivery. No chasing buyers or delayed invoices.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Free Registration', body: 'No cost to register as a seller on the GeM portal.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'MSME Preference', body: 'MSMEs get purchase preference and price preference in government procurement.', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'No Physical Tender Process', body: 'Digital bids and purchases without complex tendering procedures for small orders.', displayOrder: 5 },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Is GeM registration mandatory for government suppliers?', body: 'Yes. All government purchases above ₹25,000 must be made through GeM from April 2021.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long does registration take?', body: '2–5 working days for complete seller activation with document verification.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'Can a startup sell on GeM?', body: 'Yes. DPIIT-recognised startups get additional benefits and are exempt from prior experience and turnover requirements.', displayOrder: 3 },
        ],
      },
    ],
  })

  // ── ISP License Registration ────────────────────────────────────────────────
  await upsertPage('isp-license-registration', {
    heroTitle: 'ISP License Registration in India',
    heroSubtitle: 'Get your Internet Service Provider licence from DoT to legally offer broadband, Wi-Fi, and satellite internet services.',
    heroCTAText: 'Apply for ISP Licence',
    overviewText: `An Internet Service Provider (ISP) Licence is a government authorisation from the Department of Telecommunications (DoT) enabling businesses to provide internet connectivity services to customers. With India's digital economy booming, ISP licensing opens opportunities in broadband, enterprise connectivity, Wi-Fi hotspots, and last-mile internet delivery.\n\nLicences are available in three categories: Class A (all-India), Class B (regional — telecom circle level), and Class C (district level). Each has different entry fee requirements and coverage areas.`,
    eligibilityText: `• Registered Indian company (Pvt Ltd or Ltd)\n• Must demonstrate technical and financial capability\n• Security clearance from Ministry of Home Affairs\n• Proper network infrastructure or plans for rollout\n• Minimum net worth requirements vary by licence class`,
    sections: [
      {
        type: 'STEPS', heading: 'ISP Licence Application Process', displayOrder: 1, isVisible: true,
        blocks: [
          { type: 'STEP', title: 'Choose Licence Category', body: 'Select Class A (pan-India), Class B (telecom circle/regional), or Class C (district-level).', displayOrder: 1 },
          { type: 'STEP', title: 'Prepare Application & Documents', body: 'Compile company registration, technical specifications, financial records, and security undertakings.', displayOrder: 2 },
          { type: 'STEP', title: 'Submit Online Application', body: 'File through the DoT e-licensing portal (saralsanchar.gov.in) with a non-refundable fee of ₹15,000.', displayOrder: 3 },
          { type: 'STEP', title: 'Submit Physical Copies', body: 'Send hard copies of all documents to DoT headquarters in New Delhi.', displayOrder: 4 },
          { type: 'STEP', title: 'Security Clearance', body: 'Ministry of Home Affairs conducts background verification of promoters and key personnel.', displayOrder: 5 },
          { type: 'STEP', title: 'Licence Granted', body: 'DoT issues the ISP licence. Pay entry fee and begin network rollout within specified timelines.', displayOrder: 6 },
        ],
      },
      {
        type: 'DOCUMENTS_REQUIRED', heading: 'Documents Required', displayOrder: 2, isVisible: true,
        blocks: [
          { type: 'LIST_ITEM', title: 'Certificate of Incorporation', body: 'Company must be a registered Pvt Ltd or Ltd company.', displayOrder: 1 },
          { type: 'LIST_ITEM', title: 'MOA & AOA', body: 'Including ISP/telecom as an authorised business activity.', displayOrder: 2 },
          { type: 'LIST_ITEM', title: 'Director & Shareholder Details', body: 'PAN, Aadhaar, and background information of all promoters.', displayOrder: 3 },
          { type: 'LIST_ITEM', title: 'Audited Financial Statements', body: 'Last 3 years of audited accounts (or projected if new company).', displayOrder: 4 },
          { type: 'LIST_ITEM', title: 'Technical Infrastructure Details', body: 'Network architecture, equipment details, and coverage plan.', displayOrder: 5 },
          { type: 'LIST_ITEM', title: 'Security Undertaking', body: 'Signed undertaking on compliance with lawful interception and security requirements.', displayOrder: 6 },
        ],
      },
      {
        type: 'PRICING', heading: 'ISP Licence Fees', displayOrder: 3, isVisible: true,
        blocks: [
          { type: 'PRICING_CARD', title: 'Class C (District)', body: 'District-level internet services', displayOrder: 1, metadata: { price: '₹15,000', badge: null, includes: ['Application fee', 'No entry fee', 'District coverage', 'Last-mile connectivity', '20-year licence validity'] } },
          { type: 'PRICING_CARD', title: 'Class B (Regional)', body: 'Telecom circle/state-level services', displayOrder: 2, metadata: { price: '₹2.15 lakhs', badge: 'Popular', includes: ['₹15,000 application fee', '₹2 lakh entry fee', 'State/circle coverage', 'Broadband services', '20-year licence validity'] } },
          { type: 'PRICING_CARD', title: 'Class A (Pan-India)', body: 'All-India internet services', displayOrder: 3, metadata: { price: '₹30.15 lakhs', badge: null, includes: ['₹15,000 application fee', '₹30 lakh entry fee', 'Pan-India coverage', 'National backbone eligible', '20-year licence validity'] } },
        ],
      },
      {
        type: 'FAQ', heading: 'Frequently Asked Questions', displayOrder: 4, isVisible: true,
        blocks: [
          { type: 'FAQ_ITEM', title: 'Can an individual apply for an ISP licence?', body: 'No. ISP licences are issued only to registered companies (Pvt Ltd or Ltd), not individuals.', displayOrder: 1 },
          { type: 'FAQ_ITEM', title: 'How long does the licence process take?', body: 'Typically 3–6 months including security clearance from Ministry of Home Affairs.', displayOrder: 2 },
          { type: 'FAQ_ITEM', title: 'What is the licence validity period?', body: 'ISP licences are issued for 20 years and can be renewed.', displayOrder: 3 },
        ],
      },
    ],
  })

  console.log('\n✅ All service pages seeded successfully!')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
