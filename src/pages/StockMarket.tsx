import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Stock {
  id: string;
  name: string;
  symbol: string;
  description: string;
  current_price: number;
  previous_price: number;
  emoji: string;
}

interface KidStock {
  id: string;
  stock_id: string;
  shares: number;
  total_invested: number;
}

export default function StockMarket() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [kidStocks, setKidStocks] = useState<KidStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [selling, setSelling] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Calculate age tier from birth_date
  const getAgeTier = (birthDate: string | null): string => {
    if (!birthDate) return 'explorer';
    const birth = new Date(birthDate);
    const age = new Date().getFullYear() - birth.getFullYear();
    if (age <= 8) return 'explorer';
    if (age <= 12) return 'builder';
    return 'achiever';
  };

  const ageTier = profile?.birth_date ? getAgeTier(profile.birth_date) : 'explorer';

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile, ageTier]);

  const fetchData = async () => {
    try {
      // Filter stocks by age tier - show current tier and below
      const tierOrder = ['explorer', 'builder', 'achiever'];
      const tierIndex = tierOrder.indexOf(ageTier);
      const allowedTiers = tierOrder.slice(0, tierIndex + 1);

      const [stocksRes, holdingsRes] = await Promise.all([
        supabase.from("stocks").select("*").in("age_tier", allowedTiers).order("name"),
        supabase.from("kid_stocks").select("*").eq("profile_id", profile!.id)
      ]);

      if (stocksRes.error) throw stocksRes.error;
      if (holdingsRes.error) throw holdingsRes.error;

      setStocks(stocksRes.data || []);
      setKidStocks(holdingsRes.data || []);
    } catch (error) {
      console.error("Error fetching stocks:", error);
      toast({ title: "Error loading stocks", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const simulatePriceChanges = async () => {
    try {
      const { error } = await supabase.rpc("update_stock_prices");
      if (error) throw error;
      await fetchData();
      toast({ title: "📊 Market Updated!", description: "Stock prices have changed!" });
    } catch (error) {
      console.error("Error updating prices:", error);
      toast({ title: "Error updating prices", variant: "destructive" });
    }
  };

  const buyStock = async (stock: Stock) => {
    if (!profile) return;
    
    const price = Math.round(stock.current_price);
    if (profile.total_earnings < price) {
      toast({ title: "Not enough coins!", description: `You need ${price} coins to buy 1 share.`, variant: "destructive" });
      return;
    }

    setBuying(stock.id);
    try {
      // Deduct coins from profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ total_earnings: profile.total_earnings - price })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Check if already owns this stock
      const existing = kidStocks.find(ks => ks.stock_id === stock.id);
      
      if (existing) {
        const { error } = await supabase
          .from("kid_stocks")
          .update({ 
            shares: existing.shares + 1, 
            total_invested: existing.total_invested + price,
            updated_at: new Date().toISOString()
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("kid_stocks")
          .insert({ 
            profile_id: profile.id, 
            stock_id: stock.id, 
            shares: 1, 
            total_invested: price 
          });
        if (error) throw error;
      }

      toast({ title: "🎉 Stock Purchased!", description: `You bought 1 share of ${stock.symbol}!` });
      await fetchData();
      await refreshProfile();
    } catch (error) {
      console.error("Error buying stock:", error);
      toast({ title: "Error buying stock", variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  const sellStock = async (stock: Stock) => {
    if (!profile) return;
    
    const holding = kidStocks.find(ks => ks.stock_id === stock.id);
    if (!holding || holding.shares < 1) {
      toast({ title: "No shares to sell!", variant: "destructive" });
      return;
    }

    setSelling(stock.id);
    const price = Math.round(stock.current_price);
    
    try {
      // Add coins to profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ total_earnings: profile.total_earnings + price })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update or delete holding
      if (holding.shares === 1) {
        const { error } = await supabase
          .from("kid_stocks")
          .delete()
          .eq("id", holding.id);
        if (error) throw error;
      } else {
        const avgPrice = holding.total_invested / holding.shares;
        const { error } = await supabase
          .from("kid_stocks")
          .update({ 
            shares: holding.shares - 1,
            total_invested: holding.total_invested - avgPrice,
            updated_at: new Date().toISOString()
          })
          .eq("id", holding.id);
        if (error) throw error;
      }

      toast({ title: "💰 Stock Sold!", description: `You sold 1 share of ${stock.symbol} for ${price} coins!` });
      await fetchData();
      await refreshProfile();
    } catch (error) {
      console.error("Error selling stock:", error);
      toast({ title: "Error selling stock", variant: "destructive" });
    } finally {
      setSelling(null);
    }
  };

  const getPriceChange = (stock: Stock) => {
    const change = stock.current_price - stock.previous_price;
    const percentChange = ((change / stock.previous_price) * 100).toFixed(1);
    return { change, percentChange };
  };

  const getPortfolioValue = () => {
    return kidStocks.reduce((total, holding) => {
      const stock = stocks.find(s => s.id === holding.stock_id);
      return total + (stock ? stock.current_price * holding.shares : 0);
    }, 0);
  };

  const getTotalInvested = () => {
    return kidStocks.reduce((total, holding) => total + holding.total_invested, 0);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const portfolioValue = getPortfolioValue();
  const totalInvested = getTotalInvested();
  const portfolioGain = portfolioValue - totalInvested;

  return (
    <div className="min-h-screen bg-background pb-20">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">📈 Stock Market</h1>
            <p className="text-sm opacity-90">
              {ageTier === 'explorer' ? 'Fun companies to invest in!' : 
               ageTier === 'builder' ? 'Invest your coins and watch them grow!' : 
               'Build your investment portfolio!'}
            </p>
          </div>
          <span className="ml-auto text-xs bg-white/20 px-2 py-1 rounded-full capitalize">
            {ageTier === 'explorer' ? '🌟 Explorer' : ageTier === 'builder' ? '🔨 Builder' : '🚀 Achiever'}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-xs opacity-80">Balance</p>
            <p className="font-bold">{Math.round(profile?.total_earnings || 0)} 🪙</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2">
            <p className="text-xs opacity-80">Portfolio</p>
            <p className="font-bold">{Math.round(portfolioValue)} 🪙</p>
          </div>
          <div className={`bg-white/20 rounded-lg p-2 ${portfolioGain >= 0 ? 'text-green-200' : 'text-red-200'}`}>
            <p className="text-xs opacity-80">Gain/Loss</p>
            <p className="font-bold">{portfolioGain >= 0 ? '+' : ''}{Math.round(portfolioGain)} 🪙</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Available Stocks</h2>
          <Button variant="outline" size="sm" onClick={simulatePriceChanges}>
            <RefreshCw className="h-4 w-4 mr-1" /> Update Prices
          </Button>
        </div>

        <div className="space-y-3">
          {stocks.map(stock => {
            const { change, percentChange } = getPriceChange(stock);
            const holding = kidStocks.find(ks => ks.stock_id === stock.id);
            const sharesOwned = holding?.shares || 0;
            
            return (
              <Card key={stock.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{stock.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{stock.symbol}</span>
                          <span className="text-sm text-muted-foreground">{stock.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{stock.description}</p>
                        {sharesOwned > 0 && (
                          <p className="text-xs text-primary font-medium mt-1">
                            You own: {sharesOwned} share{sharesOwned > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg">{Math.round(stock.current_price)} 🪙</p>
                      <div className={`flex items-center justify-end gap-1 text-sm ${
                        change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'
                      }`}>
                        {change > 0 ? <TrendingUp className="h-3 w-3" /> : 
                         change < 0 ? <TrendingDown className="h-3 w-3" /> : 
                         <Minus className="h-3 w-3" />}
                        <span>{change >= 0 ? '+' : ''}{percentChange}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => buyStock(stock)}
                      disabled={buying === stock.id || (profile?.total_earnings || 0) < stock.current_price}
                    >
                      {buying === stock.id ? "Buying..." : "Buy"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1"
                      onClick={() => sellStock(stock)}
                      disabled={selling === stock.id || sharesOwned < 1}
                    >
                      {selling === stock.id ? "Selling..." : "Sell"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              💡 Investment Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>Buy low, sell high!</strong> Watch for price drops.</p>
            <p>• <strong>Diversify!</strong> Don't put all coins in one stock.</p>
            <p>• <strong>Be patient!</strong> Good investments take time.</p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
