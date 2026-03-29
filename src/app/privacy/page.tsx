import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-950/70 border-b border-slate-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-200">Privacy Policy</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 pb-24">
        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none space-y-6">
          <p className="text-sm text-slate-400">Last updated: March 10, 2026</p>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">1. Information We Collect</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Account information:</strong> When you sign up, we collect your name, email address, and profile picture via our authentication provider (Clerk).</p>
            <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Uploaded images:</strong> Images you upload are sent to our AI provider for caption generation. We do not store your uploaded images after processing.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Generated content:</strong> We store your caption generation history (summaries and generated captions) to provide the history feature.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Payment information:</strong> Payment processing is handled entirely by Stripe. We do not store your credit card details.</p>
            <p className="text-sm text-slate-600 dark:text-slate-400"><strong>Usage data:</strong> We collect anonymous analytics data (page views, feature usage) to improve the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">2. How We Use Your Information</h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li>To provide and maintain the Service.</li>
              <li>To process payments and manage your credit balance.</li>
              <li>To provide caption generation history.</li>
              <li>To improve the Service and user experience.</li>
              <li>To communicate important updates about the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">3. Third-Party Services</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">We use the following third-party services:</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li><strong>Clerk</strong> — Authentication and user management.</li>
              <li><strong>Stripe</strong> — Payment processing.</li>
              <li><strong>Anthropic (Claude)</strong> — AI caption generation. Images are processed per Anthropic&apos;s usage policies.</li>
              <li><strong>Vercel</strong> — Hosting and analytics.</li>
              <li><strong>Sentry</strong> — Error monitoring (no personal data collected).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">4. Data Retention</h2>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li>Uploaded images are not stored after caption generation.</li>
              <li>Caption history is retained until you delete it or close your account.</li>
              <li>Account data is retained as long as your account is active.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">5. Your Rights</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">You have the right to:</p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5 space-y-1">
              <li>Access your personal data.</li>
              <li>Delete your caption history at any time.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Export your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">6. Security</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We implement industry-standard security measures including encrypted connections (HTTPS), secure authentication, and rate limiting to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">7. Children&apos;s Privacy</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The Service is not intended for users under 13 years of age. We do not knowingly collect data from children.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">8. Changes to This Policy</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We may update this Privacy Policy at any time. We will notify you of significant changes via email or in-app notification.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">9. Contact</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Privacy questions? Contact us at privacy@captioncraft.app.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
