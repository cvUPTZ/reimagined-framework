import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, ShieldCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      { title: 'Terms of Service — QED Studio' },
      { name: 'description', content: 'Terms of Service for QED Studio mathematical video editor and publishing platform.' },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 lg:px-16 max-w-4xl mx-auto font-sans">
      <div className="mb-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} />
            Back to QED Studio
          </Button>
        </Link>
      </div>

      <header className="border-b border-border pb-6 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="text-primary" size={28} />
          <h1 className="text-3xl font-display font-bold tracking-tight">Terms of Service</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Last updated: October 12, 2026 · Effective immediately
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing or using QED Studio ("the Service"), provided by QED Studio ("we", "us", or "our"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Description of the Service</h2>
          <p>
            QED Studio is a web-based educational visual mathematics video creation and publishing platform. The platform enables creators to design animated mathematics diagrams, structure curriculum scenes, record narrations, render MP4/WebM videos, and optionally distribute videos directly to connected platforms including TikTok.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. Creator Accounts & Security</h2>
          <p>
            To use certain features, including TikTok publishing, you may be required to register a creator account. You are responsible for safeguarding your login credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. Intellectual Property & User Content</h2>
          <p className="mb-3">
            <strong>Your Ownership:</strong> You retain full ownership and intellectual property rights to all mathematical lessons, diagrams, formulas, scripts, audio tracks, and finished videos created using QED Studio.
          </p>
          <p>
            <strong>License to Operate:</strong> By uploading audio or publishing video content through third-party integrations (such as TikTok), you grant QED Studio only the necessary permissions required to process, encode, and transmit your content to the target platform on your explicit behalf.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Third-Party Integrations & TikTok Developer API</h2>
          <p className="mb-3">
            QED Studio provides an optional direct publishing integration with TikTok using the official TikTok Content Posting API and Login Kit. By connecting your TikTok account:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You agree to comply with TikTok's Terms of Service and Community Guidelines.</li>
            <li>You confirm you hold all necessary rights, licenses, and permissions for the video, audio, and visual elements uploaded.</li>
            <li>You can disconnect your TikTok account at any time within QED Studio settings or directly via your TikTok app permissions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. Acceptable Use Policy</h2>
          <p className="mb-2">You agree not to use QED Studio to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Violate any applicable laws, regulations, or third-party rights.</li>
            <li>Publish abusive, defamatory, harassing, deceptive, or infringing content.</li>
            <li>Attempt to reverse-engineer, disrupt, or compromise the security of our infrastructure or third-party APIs.</li>
            <li>Automate bulk spamming or unauthorized distribution.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">7. Disclaimers & Limitation of Liability</h2>
          <p>
            The Service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied. In no event shall QED Studio be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">8. Changes to Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of QED Studio following any posted changes constitutes your acceptance of the revised Terms.
          </p>
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact Information</h2>
          <p>
            If you have any questions regarding these Terms of Service, please reach out to us at{' '}
            <a href="mailto:support@qedstudio.dev" className="text-primary hover:underline">
              support@qedstudio.dev
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
