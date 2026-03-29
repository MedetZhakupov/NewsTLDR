import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">Terms of Service</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-sm text-slate-400">Last updated: March 10, 2026</p>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">1. Acceptance of Terms</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              By accessing or using CaptionCraft (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">2. Description of Service</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              CaptionCraft is an AI-powered tool that generates social media captions from uploaded images. The Service operates on a credit-based system where users purchase credits to generate captions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">3. User Accounts</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You must create an account to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">4. Credits and Payments</h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li>Credits are purchased via Stripe and are non-refundable.</li>
              <li>Each caption generation consumes 1 credit.</li>
              <li>Credits do not expire.</li>
              <li>New accounts receive 3 free credits.</li>
              <li>Prices are in USD and may change with notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">5. Acceptable Use</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">You agree not to:</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li>Upload illegal, harmful, or infringing content.</li>
              <li>Attempt to circumvent rate limits or abuse the Service.</li>
              <li>Use the Service to generate spam or misleading content.</li>
              <li>Reverse-engineer or scrape the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">6. Intellectual Property</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You retain ownership of images you upload. Generated captions are licensed to you for unrestricted use. CaptionCraft retains no rights to your content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">7. Disclaimers</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The Service is provided &quot;as is&quot; without warranties of any kind. AI-generated captions may not always be accurate or appropriate. You are responsible for reviewing and editing captions before posting.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">8. Limitation of Liability</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              CaptionCraft shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service. Total liability is limited to the amount you paid in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">9. Changes to Terms</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">10. Contact</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Questions about these Terms? Contact us at support@captioncraft.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
