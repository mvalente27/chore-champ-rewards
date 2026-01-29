import { ArrowLeft, Mail, Trash2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeleteAccount() {
  const navigate = useNavigate();
  const appName = "ChoreQuest";
  const contactEmail = "michael.valente1@gmail.com";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Delete Account</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              Request Account Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you would like to delete your {appName} account and all associated data, 
              please follow the steps below.
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">How to Request Deletion</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Send an email to <a href={`mailto:${contactEmail}?subject=Account Deletion Request - ${appName}`} className="text-primary underline font-medium">{contactEmail}</a></li>
                <li>Use the subject line: "Account Deletion Request - {appName}"</li>
                <li>Include the email address associated with your account</li>
                <li>We will process your request within 30 days</li>
              </ol>
            </div>

            <Button asChild className="w-full">
              <a href={`mailto:${contactEmail}?subject=Account Deletion Request - ${appName}&body=Hello,%0A%0AI would like to request the deletion of my ${appName} account.%0A%0AAccount email: [Enter your account email]%0A%0AThank you.`}>
                <Mail className="w-4 h-4 mr-2" />
                Send Deletion Request
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              What Gets Deleted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Data that will be permanently deleted:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Your account information (email, name)</li>
                <li>All child profiles in your household</li>
                <li>Chore history and completion records</li>
                <li>Reward redemption history</li>
                <li>Quiz attempts and scores</li>
                <li>Investment and business game data</li>
                <li>Badge and achievement progress</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Retention period:</h4>
              <p className="text-muted-foreground">
                Your data will be permanently deleted within 30 days of your request being processed. 
                Some anonymized, aggregated data may be retained for analytics purposes.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Questions? Contact us at <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a></p>
        </div>
      </main>
    </div>
  );
}
