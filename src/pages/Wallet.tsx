import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wallet as WalletIcon, ArrowUpRight, Send, Users } from 'lucide-react';
import { toast } from 'sonner';
import { TransferToKidModal } from '@/components/TransferToKidModal';

interface WalletData {
  id: string;
  balance: number;
  stripe_customer_id: string | null;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
  recipient_profile_id: string | null;
}

interface KidProfile {
  id: string;
  name: string;
  total_earnings: number;
}

export default function Wallet() {
  const { user, profile, isLoading: authLoading, isParent } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    // Handle success/cancel from Stripe
    if (searchParams.get('success') === 'true') {
      const amount = searchParams.get('amount');
      toast.success(`Successfully added $${amount} to your wallet!`);
      // Clear the URL params
      navigate('/wallet', { replace: true });
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Payment was canceled');
      navigate('/wallet', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile && isParent) {
      fetchWalletData();
      fetchKids();
    }
  }, [profile, isParent]);

  const fetchWalletData = async () => {
    if (!profile) return;
    
    try {
      // Fetch wallet
      const { data: walletData, error: walletError } = await supabase
        .from('parent_wallets')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (walletError) throw walletError;
      
      if (walletData) {
        setWallet(walletData);
        
        // Fetch transactions
        const { data: txData, error: txError } = await supabase
          .from('wallet_transactions')
          .select('*')
          .eq('wallet_id', walletData.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (txError) throw txError;
        setTransactions(txData || []);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchKids = async () => {
    if (!profile) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, total_earnings')
      .eq('household_id', profile.household_id)
      .eq('type', 'kid');

    if (!error && data) {
      setKids(data);
    }
  };

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error('Please enter a valid amount (minimum $1)');
      return;
    }

    setIsAddingFunds(true);
    try {
      const { data, error } = await supabase.functions.invoke('add-wallet-funds', {
        body: { amount },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to start payment process');
    } finally {
      setIsAddingFunds(false);
    }
  };

  const handleTransferComplete = () => {
    fetchWalletData();
    fetchKids();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isParent) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-md mx-auto px-4 py-6 pb-24">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                The wallet is only available for parents.
              </p>
            </CardContent>
          </Card>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-md mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/80">
              Wallet Balance
            </CardDescription>
            <CardTitle className="text-4xl font-bold flex items-center gap-2">
              <WalletIcon className="h-8 w-8" />
              ${wallet?.balance?.toFixed(2) || '0.00'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary-foreground/70">
              Add funds to send money to your kids
            </p>
          </CardContent>
        </Card>

        {/* Add Funds */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              Add Funds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleAddFunds}
              disabled={isAddingFunds || !addAmount}
            >
              {isAddingFunds ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Funds with Card
            </Button>
          </CardContent>
        </Card>

        {/* Send to Kids */}
        {kids.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send to Kids
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsTransferModalOpen(true)}
                disabled={!wallet || wallet.balance <= 0}
              >
                <Users className="h-4 w-4 mr-2" />
                Transfer Funds to Kid
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {tx.type === 'load' ? 'Added Funds' : 
                         tx.type === 'transfer_out' ? 'Sent to Kid' : 
                         'Chore Payout'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`font-semibold ${
                      tx.type === 'load' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'load' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNav />

      <TransferToKidModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        kids={kids}
        maxAmount={wallet?.balance || 0}
        onTransferComplete={handleTransferComplete}
      />
    </div>
  );
}
