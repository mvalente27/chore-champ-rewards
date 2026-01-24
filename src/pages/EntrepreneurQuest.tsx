import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BottomNav } from "@/components/BottomNav";
import { ArrowLeft, Lock, Coins, TrendingUp, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Business {
  id: string;
  name: string;
  description: string;
  emoji: string;
  base_cost: number;
  base_income: number;
  unlock_level: number;
  category: string;
}

interface KidBusiness {
  id: string;
  business_id: string;
  level: number;
  total_earned: number;
  last_collected_at: string;
}

export default function EntrepreneurQuest() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [ownedBusinesses, setOwnedBusinesses] = useState<KidBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [collecting, setCollecting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const [businessRes, ownedRes] = await Promise.all([
        supabase.from("businesses").select("*").order("unlock_level").order("base_cost"),
        supabase.from("kid_businesses").select("*").eq("profile_id", profile!.id)
      ]);

      if (businessRes.error) throw businessRes.error;
      if (ownedRes.error) throw ownedRes.error;

      setBusinesses(businessRes.data || []);
      setOwnedBusinesses(ownedRes.data || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      toast({ title: "Error loading businesses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getPlayerLevel = () => {
    // Level up based on total businesses owned and their levels
    const totalBusinessLevels = ownedBusinesses.reduce((sum, b) => sum + b.level, 0);
    return Math.max(1, Math.floor(totalBusinessLevels / 2) + 1);
  };

  const getBusinessCost = (business: Business, currentLevel: number = 0) => {
    // Cost increases with level
    return Math.round(business.base_cost * Math.pow(1.5, currentLevel));
  };

  const getBusinessIncome = (business: Business, level: number) => {
    // Income increases with level
    return Math.round(business.base_income * level);
  };

  const getPendingIncome = (kidBusiness: KidBusiness, business: Business) => {
    const lastCollected = new Date(kidBusiness.last_collected_at);
    const now = new Date();
    const hoursPassed = (now.getTime() - lastCollected.getTime()) / (1000 * 60 * 60);
    // Earn income per hour, cap at 24 hours
    const cappedHours = Math.min(hoursPassed, 24);
    const incomePerHour = getBusinessIncome(business, kidBusiness.level) / 24;
    return Math.floor(cappedHours * incomePerHour);
  };

  const buyBusiness = async (business: Business) => {
    if (!profile) return;
    
    const owned = ownedBusinesses.find(ob => ob.business_id === business.id);
    const cost = getBusinessCost(business, owned?.level || 0);
    
    if (profile.total_earnings < cost) {
      toast({ title: "Not enough coins!", description: `You need ${cost} coins.`, variant: "destructive" });
      return;
    }

    const playerLevel = getPlayerLevel();
    if (business.unlock_level > playerLevel) {
      toast({ title: "Business locked!", description: `Reach level ${business.unlock_level} to unlock.`, variant: "destructive" });
      return;
    }

    setBuying(business.id);
    try {
      // Deduct coins
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ total_earnings: profile.total_earnings - cost })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      if (owned) {
        // Upgrade existing business
        const { error } = await supabase
          .from("kid_businesses")
          .update({ level: owned.level + 1 })
          .eq("id", owned.id);
        if (error) throw error;
        toast({ title: "🎉 Business Upgraded!", description: `${business.name} is now level ${owned.level + 1}!` });
      } else {
        // Buy new business
        const { error } = await supabase
          .from("kid_businesses")
          .insert({ 
            profile_id: profile.id, 
            business_id: business.id,
            level: 1,
            last_collected_at: new Date().toISOString()
          });
        if (error) throw error;
        toast({ title: "🏪 Business Purchased!", description: `You now own ${business.name}!` });
      }

      await fetchData();
      await refreshProfile();
    } catch (error) {
      console.error("Error buying business:", error);
      toast({ title: "Error purchasing business", variant: "destructive" });
    } finally {
      setBuying(null);
    }
  };

  const collectIncome = async (kidBusiness: KidBusiness, business: Business) => {
    if (!profile) return;
    
    const income = getPendingIncome(kidBusiness, business);
    if (income < 1) {
      toast({ title: "No coins to collect yet!", description: "Check back in a bit." });
      return;
    }

    setCollecting(kidBusiness.id);
    try {
      // Add coins to profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ total_earnings: profile.total_earnings + income })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      // Update last collected and total earned
      const { error } = await supabase
        .from("kid_businesses")
        .update({ 
          last_collected_at: new Date().toISOString(),
          total_earned: kidBusiness.total_earned + income
        })
        .eq("id", kidBusiness.id);

      if (error) throw error;

      toast({ title: "💰 Income Collected!", description: `You earned ${income} coins from ${business.name}!` });
      await fetchData();
      await refreshProfile();
    } catch (error) {
      console.error("Error collecting income:", error);
      toast({ title: "Error collecting income", variant: "destructive" });
    } finally {
      setCollecting(null);
    }
  };

  const getTotalPendingIncome = () => {
    return ownedBusinesses.reduce((total, ob) => {
      const business = businesses.find(b => b.id === ob.business_id);
      return total + (business ? getPendingIncome(ob, business) : 0);
    }, 0);
  };

  const getDailyIncome = () => {
    return ownedBusinesses.reduce((total, ob) => {
      const business = businesses.find(b => b.id === ob.business_id);
      return total + (business ? getBusinessIncome(business, ob.level) : 0);
    }, 0);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'starter': return 'bg-green-100 text-green-800';
      case 'service': return 'bg-blue-100 text-blue-800';
      case 'retail': return 'bg-purple-100 text-purple-800';
      case 'food': return 'bg-orange-100 text-orange-800';
      case 'entertainment': return 'bg-pink-100 text-pink-800';
      case 'tech': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const playerLevel = getPlayerLevel();
  const dailyIncome = getDailyIncome();
  const pendingIncome = getTotalPendingIncome();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-white hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">🏪 Entrepreneur Quest</h1>
            <p className="text-sm opacity-90">Build your business empire!</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="h-4 w-4" />
              <span className="text-sm opacity-80">Level</span>
            </div>
            <p className="font-bold text-2xl">{playerLevel}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <p className="text-sm opacity-80">Balance</p>
            <p className="font-bold text-xl">{Math.round(profile?.total_earnings || 0)} 🪙</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-xs opacity-80">Daily Income</p>
            <p className="font-semibold">{dailyIncome} 🪙/day</p>
          </div>
          <div className="bg-white/20 rounded-lg p-2 text-center">
            <p className="text-xs opacity-80">Ready to Collect</p>
            <p className="font-semibold text-yellow-200">{pendingIncome} 🪙</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Owned Businesses */}
        {ownedBusinesses.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Your Businesses
            </h2>
            <div className="space-y-3 mb-6">
              {ownedBusinesses.map(owned => {
                const business = businesses.find(b => b.id === owned.business_id);
                if (!business) return null;
                
                const income = getPendingIncome(owned, business);
                const dailyMax = getBusinessIncome(business, owned.level);
                const progress = Math.min((income / dailyMax) * 100, 100);
                
                return (
                  <Card key={owned.id} className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{business.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{business.name}</span>
                              <Badge variant="secondary" className="text-xs">Lv.{owned.level}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Earns {dailyMax} 🪙/day
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Ready:</p>
                          <p className="font-bold text-primary">{income} 🪙</p>
                        </div>
                      </div>
                      
                      <Progress value={progress} className="h-2 mb-3" />
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => collectIncome(owned, business)}
                          disabled={collecting === owned.id || income < 1}
                        >
                          <Coins className="h-4 w-4 mr-1" />
                          {collecting === owned.id ? "Collecting..." : "Collect"}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                          onClick={() => buyBusiness(business)}
                          disabled={buying === business.id || (profile?.total_earnings || 0) < getBusinessCost(business, owned.level)}
                        >
                          Upgrade ({getBusinessCost(business, owned.level)} 🪙)
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Available Businesses */}
        <h2 className="text-lg font-semibold mb-3">Business Opportunities</h2>
        <div className="space-y-3">
          {businesses.filter(b => !ownedBusinesses.find(ob => ob.business_id === b.id)).map(business => {
            const isLocked = business.unlock_level > playerLevel;
            const cost = getBusinessCost(business, 0);
            const canAfford = (profile?.total_earnings || 0) >= cost;
            
            return (
              <Card key={business.id} className={isLocked ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{isLocked ? "🔒" : business.emoji}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{business.name}</span>
                          <Badge className={getCategoryColor(business.category)}>
                            {business.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{business.description}</p>
                        <p className="text-xs text-primary mt-1">
                          Earns {business.base_income} 🪙/day
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">{cost} 🪙</p>
                      {isLocked && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Lv.{business.unlock_level}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => buyBusiness(business)}
                    disabled={buying === business.id || isLocked || !canAfford}
                  >
                    {isLocked ? `Unlock at Level ${business.unlock_level}` : 
                     !canAfford ? "Not enough coins" :
                     buying === business.id ? "Buying..." : "Buy Business"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              💡 Business Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>• <strong>Start small!</strong> Lemonade stands are great first businesses.</p>
            <p>• <strong>Collect often!</strong> Don't let coins sit uncollected.</p>
            <p>• <strong>Upgrade!</strong> Higher levels mean more income.</p>
            <p>• <strong>Level up!</strong> Buy more businesses to unlock better ones.</p>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
