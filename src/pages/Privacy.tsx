import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  const navigate = useNavigate();
  const lastUpdated = "January 29, 2025";
  const appName = "ChoreQuest";
  const developerName = "ChoreQuest";
  const contactEmail = "michael.valente1@gmail.com";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Last Updated: {lastUpdated}</p>
          <p className="text-muted-foreground">
            {appName} is committed to protecting the privacy of children who use our app. 
            This Privacy Policy explains how we collect, use, and protect information in compliance 
            with the Children's Online Privacy Protection Act (COPPA) and Google Play's Families Policy.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
          <div className="space-y-4 text-muted-foreground">
            <div>
              <h3 className="font-medium text-foreground">Information Provided by Parents</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Parent email address (for account creation and authentication)</li>
                <li>Child's first name or nickname (chosen by parent)</li>
                <li>Child's birth date (to provide age-appropriate content)</li>
                <li>Household information (to connect family members)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-foreground">Information Collected Automatically</h3>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>App usage data (chores completed, rewards earned)</li>
                <li>Device identifiers for app functionality</li>
                <li>Crash logs and performance data</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. How We Use Information</h2>
          <p className="text-muted-foreground">We use the information we collect to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Provide and improve the {appName} experience</li>
            <li>Track chore completion and reward progress</li>
            <li>Display age-appropriate quizzes and educational content</li>
            <li>Enable family collaboration features</li>
            <li>Send important account notifications to parents</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Advertising</h2>
          <p className="text-muted-foreground">
            {appName} may display rewarded video advertisements through Google AdMob. These ads are:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li><strong>Optional</strong> – Children choose whether to watch ads to earn bonus coins</li>
            <li><strong>Age-appropriate</strong> – We use Google's child-directed ad settings</li>
            <li><strong>Privacy-focused</strong> – We enable child-directed treatment (TFCD) flags</li>
            <li><strong>Limited tracking</strong> – Personalized advertising is disabled for child users</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            We do not serve behavioral or interest-based advertising to children.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
          <p className="text-muted-foreground">
            We do not sell, trade, or share children's personal information with third parties except:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>With service providers who help operate our app (e.g., hosting, analytics)</li>
            <li>When required by law or to protect safety</li>
            <li>With parental consent for specific features</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Parental Rights</h2>
          <p className="text-muted-foreground">Parents have the right to:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Review their child's personal information</li>
            <li>Request deletion of their child's data</li>
            <li>Refuse further collection of their child's information</li>
            <li>Update or correct their child's information</li>
          </ul>
          <p className="text-muted-foreground mt-2">
            To exercise these rights, please contact us at <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">6. Data Security</h2>
          <p className="text-muted-foreground">
            We implement appropriate security measures to protect personal information, including:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Encryption of data in transit and at rest</li>
            <li>Secure authentication systems</li>
            <li>Regular security assessments</li>
            <li>Limited access to personal data</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">7. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain personal information only as long as necessary to provide our services. 
            When an account is deleted, we remove associated personal information within 30 days, 
            except where retention is required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify parents of 
            material changes via email or in-app notification before they take effect.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">9. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy or our privacy practices, please contact us:
          </p>
          <div className="bg-muted/30 rounded-lg p-4 space-y-1">
            <p className="font-medium text-foreground">{developerName}</p>
            <p className="text-muted-foreground">Email: <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a></p>
          </div>
        </section>

        <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
