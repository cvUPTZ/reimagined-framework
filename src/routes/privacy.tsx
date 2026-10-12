import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      { title: 'Privacy Policy — QED Studio' },
      { name: 'description', content: 'Privacy Policy for QED Studio mathematical video editor and TikTok publishing integration.' },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
          <Shield className="text-primary" size={28} />
          <h1 className="text-3xl font-display font-bold tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Last updated: October 12, 2026 · Effective immediately
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
          <p>
            At QED Studio ("we", "us", or "our"), accessible via QED Studio, we take your privacy and the security of your data seriously. This Privacy Policy describes how we collect, use, store, and protect your information when you use our web platform and third-party publishing features.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
          <div className="space-y-3">
            <p>
              <strong>Account Information:</strong> When you register for a creator account, we collect your email address and authentication credentials.
            </p>
            <p>
              <strong>Project & Media Data:</strong> Mathematical diagrams, formulas, lesson scripts, timeline configurations, and imported audio files are stored locally in your browser and processed on your behalf during export.
            </p>
            <p>
              <strong>TikTok Authorization & Account Data:</strong> When you voluntarily connect your TikTok account, we access information authorized under the <code>user.info.basic</code> and <code>video.publish</code> scopes, including:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your TikTok public profile information (nickname, username, avatar).</li>
              <li>Your TikTok account publishing capabilities (allowed privacy levels, max video duration, comment/duet/stitch permissions).</li>
              <li>Encrypted OAuth access and refresh tokens.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
          <p className="mb-2">We use your information exclusively to provide and maintain the Service:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To manage your creator account and session state.</li>
            <li>To render, export, and encode mathematical videos according to your timeline settings.</li>
            <li>To upload and publish videos directly to your connected TikTok account upon your explicit consent and direction.</li>
            <li>To query live publishing progress and status from TikTok's API.</li>
          </ul>
          <p className="mt-3 font-medium text-foreground">
            We never sell, rent, or monetize your personal data, project content, or TikTok credentials to third parties or advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">4. TikTok API & Data Security</h2>
          <p className="mb-3">
            Our integration complies strictly with the TikTok Developer Terms of Service and Privacy Policy:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Credential Encryption:</strong> All OAuth tokens and secrets are encrypted at rest using industry-standard AES-256-GCM encryption before storage in our secure database.
            </li>
            <li>
              <strong>Scope Limitation:</strong> We request only the minimal scopes (<code>user.info.basic</code> and <code>video.publish</code>) necessary to perform direct video publishing.
            </li>
            <li>
              <strong>Isolated Processing:</strong> Temporary video chunks created during the upload flow are streamed securely via encrypted HTTPS connections and are automatically deleted once transmission to TikTok finishes.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">5. Third-Party Service Providers</h2>
          <p className="mb-2">We share information only with trusted infrastructure providers required to operate QED Studio:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Supabase:</strong> Encrypted user authentication and database persistence.</li>
            <li><strong>TikTok (ByteDance Ltd.):</strong> Video hosting and publishing through official TikTok APIs.</li>
            <li><strong>Lovable Connector Gateway:</strong> Secure OAuth token exchange and proxy services.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">6. User Rights & Data Deletion</h2>
          <p className="mb-3">
            You retain complete control over your data and third-party connections at all times:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Disconnecting TikTok:</strong> You can disconnect your TikTok account at any time by clicking "Disconnect" in the TikTok Publishing dialog or in Studio Settings. This immediately removes and revokes stored connection keys.
            </li>
            <li>
              <strong>Revoking TikTok Access:</strong> You can also revoke QED Studio's access at any time directly through the TikTok mobile application (under Settings & Privacy &rarr; Security & permissions &rarr; Apps and services).
            </li>
            <li>
              <strong>Account Deletion:</strong> You may request complete deletion of your creator account and associated data by emailing us.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">7. Children's Privacy</h2>
          <p>
            QED Studio is an educational video creator tool. We do not knowingly collect personal identifiable information from children under the age of 13. If you believe a child has provided us with personal information, please contact us for immediate removal.
          </p>
        </section>

        <section className="border-t border-border pt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact Us</h2>
          <p>
            For privacy inquiries, data deletion requests, or questions regarding this Privacy Policy, please contact our data protection team at{' '}
            <a href="mailto:privacy@qedstudio.dev" className="text-primary hover:underline">
              privacy@qedstudio.dev
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
