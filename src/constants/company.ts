/**
 * Company facts used by the static pages (Help & FAQs, Returns & refunds,
 * Terms & privacy, About). Everything a customer reads as a promise lives here,
 * so it can be checked and changed in one place.
 *
 * TO CONFIRM WITH CBS before release: the contact details (empty ones are simply
 * not shown), the legal name and address, and the policy numbers below — they
 * are drafts, chosen to match what the product page already promises
 * ("Dispatched in 24–48 hrs", "Easy returns on damaged items").
 */
export const COMPANY = {
  name: 'CBS Kitchenware',
  tagline: 'Designer for your kitchen',
  since: 1976,
  certification: 'ISO 9001:2015',

  /** Registered business name for the legal pages; falls back to `name`. */
  legalName: '',
  /** Registered office address (legal pages, About). */
  address: '',

  // contact — leave empty to hide the row
  supportEmail: '',
  supportPhone: '',
  /** WhatsApp number with country code, digits only, e.g. 919876543210. */
  whatsapp: '',
  supportHours: 'Monday to Saturday, 10 am – 6 pm',
  website: '',

  // policy (drafts — confirm)
  dispatchTime: '24–48 hours',
  /** How long after delivery a damaged / wrong item can be reported. */
  returnReportWindow: '48 hours',
  /** Refund time once a return is approved. */
  refundTime: '5–7 business days',

  /** Shown at the top of Terms & privacy; update whenever their text changes. */
  policiesUpdated: '9 October 2026',
};

export const companyLegalName = () => COMPANY.legalName || COMPANY.name;
