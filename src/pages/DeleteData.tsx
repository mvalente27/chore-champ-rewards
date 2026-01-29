import { ArrowLeft, Mail, Database, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DeleteData() {
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
          <h1 className="text-lg font-semibold">Delete My Data</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Request Data Deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You can request deletion of some or all of your data without deleting your entire 
              {appName} account. This gives you more control over your personal information.
            </p>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">How to Request Data Deletion</h3>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                <li>Send an email to <a href={`mailto:${contactEmail}?subject=Data Deletion Request - ${appName}`} className="text-primary underline font-medium">{contactEmail}</a></li>
                <li>Use the subject line: "Data Deletion Request - {appName}"</li>
                <li>Specify which data you want deleted (see options below)</li>
                <li>Include the email address associated with your account</li>
                <li>We will process your request within 30 days</li>
              </ol>
            </div>

            <Button asChild className="w-full">
              <a href={`mailto:${contactEmail}?subject=Data Deletion Request - ${appName}&body=Hello,%0A%0AI would like to request the deletion of the following data from my ${appName} account:%0A%0A[ ] Chore history%0A[ ] Quiz attempts and scores%0A[ ] Investment game data%0A[ ] Business game data%0A[ ] Badge progress%0A[ ] All of the above%0A%0AAccount email: [Enter your account email]%0A%0AThank you.`}>
                <Mail className="w-4 h-4 mr-2" />
                Send Data Deletion Request
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Data You Can Request to Delete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-foreground mb-2">Deletable data types:</h4>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Chore completion history</li>
                <li>Reward redemption history</li>
                <li>Quiz attempts and scores</li>
                <li>Stock market game investments</li>
                <li>Entrepreneur Quest business data</li>
                <li>Badge and achievement progress</li>
                <li>Child profile information (for parents)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Data required for account functionality:</h4>
              <p className="text-muted-foreground">
                Some data (like your email and basic account settings) is required to maintain your account. 
                To delete this data, you would need to request full account deletion.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Processing time:</h4>
              <p className="text-muted-foreground">
                Data deletion requests are processed within 30 days. You will receive a confirmation 
                email once your request has been completed.
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
