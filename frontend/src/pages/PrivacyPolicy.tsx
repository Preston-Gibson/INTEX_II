const SECTIONS = [
  {
    id: 'who-we-are',
    title: '1. Who We Are',
    content: `Lucera ("we," "us," or "our") is a registered 501(c)(3) non-profit organization providing sanctuary, education, and rehabilitation services to vulnerable children in Central America. Our registered address is available upon request.

For questions about this Privacy Policy or your personal data, contact our Data Protection Officer at: privacy@lucero.org`,
  },
  {
    id: 'data-we-collect',
    title: '2. Data We Collect',
    content: `We collect the following categories of personal data:

**From Donors:**
- Identity data: full name, username, or similar identifiers
- Contact data: email address, phone number, billing and mailing address
- Financial data: payment card details (processed securely via third-party payment processors; we do not store full card numbers)
- Transaction data: donation amounts, dates, and program designations
- Technical data: IP address, browser type, device information, cookies

**From Portal Users (Staff/Admin):**
- Identity and contact data as above
- Usage data: login timestamps, pages visited, actions performed within the portal

**We do not knowingly collect data from children under 13.** Our platform is intended for adult donors and authorized staff only.`,
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Data',
    content: `We use your personal data for the following purposes and on the following legal bases under GDPR Article 6:

| Purpose | Legal Basis |
|---|---|
| Processing donations and issuing tax receipts | Performance of contract |
| Sending impact reports and updates you requested | Legitimate interests / Consent |
| Complying with legal and financial obligations | Legal obligation |
| Preventing fraud and securing our platform | Legitimate interests |
| Improving our services through analytics | Legitimate interests |
| Sending marketing communications (optional) | Consent |

We will never sell, rent, or trade your personal data to third parties for their own marketing purposes.`,
  },
  {
    id: 'cookies',
    title: '4. Cookies & Tracking',
    content: `We only use strictly necessary cookies — those required for the platform to function securely. These include session authentication cookies that keep you logged in during your visit.

We do not use analytics cookies, advertising cookies, or any third-party tracking technologies. No cookie consent is required for strictly necessary cookies under GDPR Recital 47, but we notify you of their use as a matter of transparency.

You may disable cookies through your browser settings, but doing so will prevent you from logging into the platform.`,
  },
  {
    id: 'data-sharing',
    title: '5. Data Sharing & Third Parties',
    content: `We share your data only with trusted service providers who process it on our behalf under strict data processing agreements. These include:

- **Payment processors** (e.g., Stripe) for secure donation processing
- **Cloud infrastructure providers** for data hosting
- **Email service providers** for transactional and impact communications
- **Analytics providers** using anonymized, aggregated data only

All third-party processors are contractually bound to GDPR-compliant data protection standards. We do not transfer your data outside the EEA/UK without ensuring appropriate safeguards are in place (e.g., Standard Contractual Clauses).`,
  },
  {
    id: 'data-retention',
    title: '6. Data Retention',
    content: `We retain your personal data only as long as necessary for the purposes described in this policy:

- **Donation and financial records:** 7 years (legal and tax compliance obligation)
- **Account and profile data:** Duration of your account, plus 2 years after closure
- **Marketing preferences:** Until you withdraw consent
- **Technical/log data:** 12 months

When data is no longer required, we securely delete or anonymize it.`,
  },
  {
    id: 'your-rights',
    title: '7. Your Rights Under GDPR',
    content: `If you are located in the European Economic Area (EEA) or the United Kingdom, you have the following rights under the General Data Protection Regulation (GDPR) and UK GDPR:

- **Right of access:** Request a copy of the personal data we hold about you
- **Right to rectification:** Request correction of inaccurate or incomplete data
- **Right to erasure ("right to be forgotten"):** Request deletion of your data where there is no compelling reason for continued processing
- **Right to restrict processing:** Request that we limit how we use your data
- **Right to data portability:** Receive your data in a structured, machine-readable format
- **Right to object:** Object to processing based on legitimate interests or for direct marketing
- **Rights related to automated decision-making:** We do not use solely automated decision-making that produces significant effects on you

To exercise any of these rights, contact us at privacy@lucero.org. We will respond within 30 days. You also have the right to lodge a complaint with your local supervisory authority (e.g., the ICO in the UK, or your national data protection authority in the EU).`,
  },
  {
    id: 'security',
    title: '8. Data Security',
    content: `We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These include:

- TLS/SSL encryption for all data in transit
- Encrypted storage for sensitive data at rest
- Role-based access controls limiting data access to authorized personnel
- Regular security assessments and penetration testing
- Incident response procedures for data breaches

In the event of a data breach that poses a risk to your rights and freedoms, we will notify the relevant supervisory authority within 72 hours and affected individuals without undue delay, as required by GDPR Article 33–34.`,
  },
  {
    id: 'california',
    title: '9. California Residents (CCPA)',
    content: `If you are a California resident, the California Consumer Privacy Act (CCPA) grants you additional rights:

- The right to know what personal information we collect, use, disclose, and sell
- The right to delete your personal information
- The right to opt-out of the sale of personal information

**We do not sell personal information.** To exercise your CCPA rights, contact privacy@lucero.org or submit a request through our website.`,
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal obligations. We will notify you of significant changes by:

- Posting a prominent notice on our website
- Sending an email notification to registered users (for material changes)

The "Last Updated" date at the top of this page will always reflect the most recent revision. Your continued use of our platform after changes are posted constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    content: `For any privacy-related questions, requests, or complaints, please contact our Data Protection Officer:

**Email:** privacy@lucero.org
**Mailing Address:** Lucera — Data Protection Officer, [Address on request]

We aim to respond to all inquiries within 30 days. If you are not satisfied with our response, you have the right to escalate your complaint to your national data protection authority.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="bg-surface min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <span className="inline-block px-3 py-1 bg-tertiary-fixed text-on-surface text-[10px] font-bold uppercase tracking-widest rounded-full mb-4">
            Legal
          </span>
          <h1 className="font-manrope text-4xl font-extrabold text-primary mb-4 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-on-surface-variant text-sm leading-relaxed max-w-2xl mb-3">
            At Lucera, we are committed to protecting your personal data and respecting your privacy. This policy explains how we collect, use, and safeguard your information in accordance with the General Data Protection Regulation (GDPR), UK GDPR, and applicable U.S. privacy laws.
          </p>
          <p className="text-xs text-on-surface-variant">
            <span className="font-bold">Last Updated:</span> April 7, 2026 &nbsp;·&nbsp;
            <span className="font-bold">Effective Date:</span> April 7, 2026
          </p>
        </div>

        {/* Table of Contents */}
        <div className="bg-surface-container-low rounded-2xl p-6 mb-10">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Table of Contents</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTIONS.map(({ id, title }) => (
              <a
                key={id}
                href={`#${id}`}
                className="text-sm text-primary font-medium hover:underline flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                {title}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {SECTIONS.map(({ id, title, content }) => (
            <section key={id} id={id} className="scroll-mt-24">
              <h2 className="font-manrope text-xl font-bold text-primary mb-4">{title}</h2>
              <div className="bg-surface-container-low rounded-2xl p-6">
                {content.split('\n\n').map((block, i) => {
                  // Table rendering
                  if (block.includes('|---|')) {
                    const rows = block.trim().split('\n').filter(r => !r.match(/^\|[-|]+\|$/));
                    return (
                      <div key={i} className="overflow-x-auto mb-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-outline-variant/20">
                              {rows[0].split('|').filter(Boolean).map((cell, j) => (
                                <th key={j} className="text-left py-2 pr-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{cell.trim()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.slice(1).map((row, j) => (
                              <tr key={j} className="border-b border-outline-variant/10 last:border-0">
                                {row.split('|').filter(Boolean).map((cell, k) => (
                                  <td key={k} className="py-2.5 pr-6 text-sm text-on-surface align-top">{cell.trim()}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  // Bold inline formatting
                  const formatted = block.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j} className="font-bold text-on-surface">{part.slice(2, -2)}</strong>
                      : part
                  );

                  // Bullet-style lines (starting with -)
                  if (block.trim().startsWith('-')) {
                    return (
                      <ul key={i} className="space-y-1.5 mb-4">
                        {block.trim().split('\n').map((line, j) => (
                          <li key={j} className="flex gap-2 text-sm text-on-surface leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0"></span>
                            <span>{line.replace(/^- /, '').split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                              part.startsWith('**') && part.endsWith('**')
                                ? <strong key={k} className="font-bold text-on-surface">{part.slice(2, -2)}</strong>
                                : part
                            )}</span>
                          </li>
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p key={i} className="text-sm text-on-surface leading-relaxed mb-4 last:mb-0">
                      {formatted}
                    </p>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-12 aurora-gradient rounded-2xl p-8 text-center text-white">
          <span className="material-symbols-outlined text-[32px] mb-3 block" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
          <h3 className="font-manrope text-xl font-extrabold mb-2">Your privacy is our priority</h3>
          <p className="text-white/70 text-sm mb-5 max-w-md mx-auto">
            Questions about how we handle your data? Our Data Protection Officer is here to help.
          </p>
          <a
            href="mailto:privacy@lucero.org"
            className="inline-block bg-white text-primary font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Contact privacy@lucero.org
          </a>
        </div>
      </div>
    </div>
  );
}
