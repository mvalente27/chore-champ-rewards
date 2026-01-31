import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, ArrowLeft, Brain, TrendingUp, Target, Trophy, Coins, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SmartAvatar } from '@/components/avatar';

interface KidAnalytics {
  profile: {
    id: string;
    name: string;
    avatar_url: string | null;
    total_earnings: number;
    level: number;
    xp: number;
  };
  stats: {
    choresCompleted: number;
    quizCorrect: number;
    quizTotal: number;
    earningsThisWeek: number;
    earningsThisMonth: number;
    streakDays: number;
    badgesUnlocked: number;
    financialIQ: number;
  };
}

const ParentAnalytics = () => {
  const [kidsAnalytics, setKidsAnalytics] = useState<KidAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedKid, setSelectedKid] = useState<string | null>(null);

  const { user, profile, isParent, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && profile && !isParent) {
      navigate('/');
    }
  }, [user, profile, isParent, authLoading, navigate]);

  useEffect(() => {
    if (profile && isParent) {
      fetchKidsAnalytics();
    }
  }, [profile, isParent]);

  const fetchKidsAnalytics = async () => {
    if (!profile?.household_id) return;
    setIsLoading(true);

    try {
      // Fetch all kids in household
      const { data: kids, error: kidsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('household_id', profile.household_id)
        .eq('type', 'kid');

      if (kidsError) throw kidsError;

      // Fetch analytics for each kid
      const analyticsPromises = (kids || []).map(async (kid) => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [choresRes, quizRes, earningsWeekRes, earningsMonthRes, badgesRes] = await Promise.all([
          // Chores completed
          supabase
            .from('earnings')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', kid.id)
            .eq('status', 'approved'),
          // Quiz attempts
          supabase
            .from('quiz_attempts')
            .select('is_correct')
            .eq('profile_id', kid.id),
          // Earnings this week
          supabase
            .from('earnings')
            .select('amount')
            .eq('profile_id', kid.id)
            .eq('status', 'approved')
            .gte('approved_at', weekAgo.toISOString()),
          // Earnings this month
          supabase
            .from('earnings')
            .select('amount')
            .eq('profile_id', kid.id)
            .eq('status', 'approved')
            .gte('approved_at', monthAgo.toISOString()),
          // Badges
          supabase
            .from('kid_badges')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', kid.id),
        ]);

        const quizAttempts = quizRes.data || [];
        const quizCorrect = quizAttempts.filter(q => q.is_correct).length;
        const quizTotal = quizAttempts.length;

        const earningsWeek = (earningsWeekRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);
        const earningsMonth = (earningsMonthRes.data || []).reduce((sum, e) => sum + Number(e.amount), 0);

        // Calculate Financial IQ Score (0-100)
        const quizScore = quizTotal > 0 ? (quizCorrect / quizTotal) * 30 : 0;
        const levelScore = Math.min(kid.level * 5, 25);
        const consistencyScore = Math.min((choresRes.count || 0) * 2, 25);
        const savingsScore = Math.min(kid.total_earnings / 10, 20);
        const financialIQ = Math.round(quizScore + levelScore + consistencyScore + savingsScore);

        return {
          profile: {
            id: kid.id,
            name: kid.name,
            avatar_url: kid.avatar_url,
            total_earnings: kid.total_earnings,
            level: kid.level,
            xp: kid.xp,
          },
          stats: {
            choresCompleted: choresRes.count || 0,
            quizCorrect,
            quizTotal,
            earningsThisWeek: earningsWeek,
            earningsThisMonth: earningsMonth,
            streakDays: 0, // Would need streak calculation
            badgesUnlocked: badgesRes.count || 0,
            financialIQ,
          },
        };
      });

      const analytics = await Promise.all(analyticsPromises);
      setKidsAnalytics(analytics);
      
      if (analytics.length > 0 && !selectedKid) {
        setSelectedKid(analytics[0].profile.id);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedKidData = kidsAnalytics.find(k => k.profile.id === selectedKid);

  const getIQLabel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: 'Financial Genius', color: 'text-green-500' };
    if (score >= 60) return { label: 'Money Smart', color: 'text-blue-500' };
    if (score >= 40) return { label: 'Growing Saver', color: 'text-yellow-500' };
    return { label: 'Just Starting', color: 'text-muted-foreground' };
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isParent) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || ''} 
        userAvatar={profile?.avatar_url || '📊'} 
        totalCoins={profile?.total_earnings}
        profileId={profile?.id}
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div>
          <h1 className="text-2xl font-bold text-foreground">Kids Analytics</h1>
          <p className="text-muted-foreground">Track your kids' financial learning progress</p>
        </div>

        {/* Kid Selector */}
        {kidsAnalytics.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {kidsAnalytics.map((kid) => (
              <button
                key={kid.profile.id}
                onClick={() => setSelectedKid(kid.profile.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedKid === kid.profile.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <SmartAvatar avatarData={kid.profile.avatar_url} size={24} />
                <span className="font-medium">{kid.profile.name}</span>
              </button>
            ))}
          </div>
        )}

        {selectedKidData ? (
          <>
            {/* Financial IQ Score */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Financial IQ Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {selectedKidData.stats.financialIQ}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className={`text-lg font-semibold ${getIQLabel(selectedKidData.stats.financialIQ).color}`}>
                      {getIQLabel(selectedKidData.stats.financialIQ).label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on quiz performance, level, consistency, and savings
                    </p>
                    <Progress 
                      value={selectedKidData.stats.financialIQ} 
                      className="h-2 mt-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-4 h-4" />
                    <span className="text-xs">Chores Done</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {selectedKidData.stats.choresCompleted}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Brain className="w-4 h-4" />
                    <span className="text-xs">Quiz Accuracy</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {selectedKidData.stats.quizTotal > 0 
                      ? Math.round((selectedKidData.stats.quizCorrect / selectedKidData.stats.quizTotal) * 100)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedKidData.stats.quizCorrect}/{selectedKidData.stats.quizTotal} correct
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Coins className="w-4 h-4" />
                    <span className="text-xs">This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    🪙 {selectedKidData.stats.earningsThisWeek}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    🪙 {selectedKidData.stats.earningsThisMonth}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Progress Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SmartAvatar avatarData={selectedKidData.profile.avatar_url} size={28} />
                    <span className="font-medium">{selectedKidData.profile.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">Level {selectedKidData.profile.level}</p>
                    <p className="text-xs text-muted-foreground">{selectedKidData.profile.xp} XP</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-lg font-bold text-foreground">
                      🪙 {selectedKidData.profile.total_earnings}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Coins</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-lg font-bold text-foreground">
                      🏅 {selectedKidData.stats.badgesUnlocked}
                    </p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-lg font-bold text-foreground">
                      📚 {selectedKidData.stats.quizTotal}
                    </p>
                    <p className="text-xs text-muted-foreground">Quizzes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips for Parents */}
            <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground mb-2">💡 Parent Tip</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedKidData.stats.financialIQ < 40
                    ? "Encourage more quiz participation to boost financial literacy!"
                    : selectedKidData.stats.financialIQ < 70
                    ? "Great progress! Consider adding more challenging chores to level up."
                    : "Amazing work! Your child is developing excellent money habits."}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No kids in your household yet.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
              Add a Kid
            </Button>
          </div>
        )}
      </main>
      
      <BottomNav activeTab="home" onTabChange={() => {}} />
    </div>
  );
};

export default ParentAnalytics;
