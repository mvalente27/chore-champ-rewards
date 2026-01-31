import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Loader2, Gamepad2, Trophy, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SpaceShooterGame, Match3Game, EndlessRunnerGame, MemoryMatchGame } from '@/components/games';
import { fireConfetti } from '@/lib/confetti';

type GameType = 'space_shooter' | 'match3' | 'endless_runner' | 'memory_match';

interface GameInfo {
  type: GameType;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

const GAMES: Record<GameType, GameInfo> = {
  space_shooter: {
    type: 'space_shooter',
    name: 'Space Shooter',
    emoji: '🚀',
    description: 'Destroy aliens before they reach Earth!',
    color: 'from-purple-500 to-blue-500'
  },
  match3: {
    type: 'match3',
    name: 'Gem Match',
    emoji: '💎',
    description: 'Match 3 gems to score points!',
    color: 'from-pink-500 to-purple-500'
  },
  endless_runner: {
    type: 'endless_runner',
    name: 'Endless Runner',
    emoji: '🏃',
    description: 'Run as far as you can!',
    color: 'from-green-500 to-emerald-500'
  },
  memory_match: {
    type: 'memory_match',
    name: 'Memory Match',
    emoji: '🧠',
    description: 'Find all the matching pairs!',
    color: 'from-blue-500 to-cyan-500'
  }
};

const MiniGames = () => {
  const [activeTab, setActiveTab] = useState('games');
  const [isLoading, setIsLoading] = useState(true);
  const [remainingPlays, setRemainingPlays] = useState(5);
  const [todaysGame, setTodaysGame] = useState<GameType>('space_shooter');
  const [isPlaying, setIsPlaying] = useState(false);
  const [todaysScores, setTodaysScores] = useState<number[]>([]);

  const { user, profile, isParent, isLoading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Calculate age tier from profile birth_date
  const getAgeTier = (): 'explorer' | 'builder' | 'achiever' | null => {
    if (!profile?.birth_date) return null;
    const birthDate = new Date(profile.birth_date);
    const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age >= 5 && age <= 8) return 'explorer';
    if (age >= 9 && age <= 12) return 'builder';
    if (age >= 13 && age <= 18) return 'achiever';
    if (age < 5) return 'explorer';
    return 'achiever';
  };

  const ageTier = getAgeTier();

  // Redirect if not authenticated or if parent
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (!authLoading && profile && isParent) {
      navigate('/');
    }
  }, [user, profile, isParent, authLoading, navigate]);

  // Fetch game status
  useEffect(() => {
    if (profile?.id) {
      fetchGameStatus();
    }
  }, [profile?.id]);

  const fetchGameStatus = async () => {
    if (!profile?.id) return;
    setIsLoading(true);

    try {
      // Get today's game type
      const { data: gameTypeData, error: gameTypeError } = await supabase
        .rpc('get_daily_game_type');

      if (gameTypeError) throw gameTypeError;
      setTodaysGame(gameTypeData as GameType);

      // Get remaining plays
      const { data: playsData, error: playsError } = await supabase
        .rpc('get_remaining_game_plays', { p_profile_id: profile.id });

      if (playsError) throw playsError;
      setRemainingPlays(playsData);

      // Get today's scores
      const today = new Date().toISOString().split('T')[0];
      const { data: scoresData, error: scoresError } = await supabase
        .from('game_plays')
        .select('score, coins_earned')
        .eq('profile_id', profile.id)
        .gte('played_at', today)
        .order('played_at', { ascending: false });

      if (scoresError) throw scoresError;
      setTodaysScores(scoresData?.map(s => s.score) || []);
    } catch (err) {
      console.error('Error fetching game status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGameEnd = async (score: number) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('record_game_play', {
          p_profile_id: profile.id,
          p_game_type: todaysGame,
          p_score: score
        });

      if (error) throw error;

      const result = data[0];
      
      // Celebrate!
      fireConfetti();

      if (result.daily_bonus_earned) {
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold">🎉 Daily Bonus Earned!</span>
            <span>+{result.coins_earned} Quest Coins (includes +25 bonus!)</span>
          </div>
        );
      } else {
        const tierMessage = score >= 1000 ? '🏆 Gold Tier!' : score >= 500 ? '🥈 Silver Tier!' : score >= 100 ? '🥉 Bronze Tier!' : '';
        toast.success(`+${result.coins_earned} Quest Coins earned! ${tierMessage}`);
      }

      setRemainingPlays(result.remaining_plays);
      setTodaysScores(prev => [score, ...prev]);
      setIsPlaying(false);
      
      // Refresh profile to update coin balance in Header and elsewhere
      await refreshProfile();
    } catch (err: any) {
      console.error('Error recording game play:', err);
      if (err.message?.includes('No remaining plays')) {
        toast.error("No plays left today! Come back tomorrow.");
      } else {
        toast.error('Failed to record game. Try again!');
      }
      setIsPlaying(false);
    }
  };

  const startGame = () => {
    if (remainingPlays <= 0) {
      toast.error("No plays left today! Come back tomorrow for a new game.");
      return;
    }
    setIsPlaying(true);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isParent) {
    return null;
  }

  // Render active game
  if (isPlaying) {
    const GameComponent = {
      space_shooter: SpaceShooterGame,
      match3: Match3Game,
      endless_runner: EndlessRunnerGame,
      memory_match: MemoryMatchGame
    }[todaysGame];

    return (
      <div className="h-screen w-full">
        <GameComponent 
          onGameEnd={handleGameEnd}
          onCancel={() => setIsPlaying(false)}
          ageTier={ageTier}
        />
      </div>
    );
  }

  const gameInfo = GAMES[todaysGame];
  const bestScore = todaysScores.length > 0 ? Math.max(...todaysScores) : 0;
  const difficultyLabel = ageTier === 'explorer' ? '🌟 Easy' : ageTier === 'achiever' ? '🔥 Hard' : '⚡ Medium';

  return (
    <div className="min-h-screen bg-background pb-24">
      <Header 
        userName={profile?.name || ''} 
        userAvatar={profile?.avatar_url || '👧'} 
        totalCoins={profile?.total_earnings}
        profileId={profile?.id}
      />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Today's Game Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Daily Mini Game</h1>
          <p className="text-muted-foreground mt-1">A new game every day!</p>
          <span className="inline-block mt-2 text-sm px-3 py-1 bg-primary/10 rounded-full text-primary font-medium">
            Difficulty: {difficultyLabel}
          </span>
        </div>

        {/* Today's Game Card */}
        <div className={`bg-gradient-to-br ${gameInfo.color} rounded-2xl p-6 text-white shadow-lg`}>
          <div className="text-center">
            <span className="text-6xl block mb-3">{gameInfo.emoji}</span>
            <h2 className="text-2xl font-bold">{gameInfo.name}</h2>
            <p className="text-white/80 mt-1">{gameInfo.description}</p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                <span className="text-2xl font-bold">{remainingPlays}</span>
              </div>
              <p className="text-sm text-white/80">Plays Left</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5" />
                <span className="text-2xl font-bold">{bestScore}</span>
              </div>
              <p className="text-sm text-white/80">Best Today</p>
            </div>
          </div>

          <Button 
            onClick={startGame}
            disabled={remainingPlays <= 0}
            className="w-full mt-6 bg-white text-gray-900 hover:bg-white/90 font-bold text-lg py-6"
          >
            {remainingPlays > 0 ? (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Play Now!
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 mr-2" />
                Come Back Tomorrow
              </>
            )}
          </Button>
        </div>

        {/* Rewards Info */}
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">🪙 Coin Rewards</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">🏆 Gold (1000+ pts)</span>
              <span className="font-bold text-primary">+25 coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">🥈 Silver (500+ pts)</span>
              <span className="font-bold text-primary">+15 coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">🥉 Bronze (100+ pts)</span>
              <span className="font-bold text-primary">+10 coins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">✅ Participation</span>
              <span className="font-bold text-primary">+5 coins</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">🎉 Daily Bonus (5 plays)</span>
              <span className="font-bold text-yellow-500">+25 bonus!</span>
            </div>
          </div>
        </div>

        {/* Today's Scores */}
        {todaysScores.length > 0 && (
          <div className="bg-card border rounded-xl p-4">
            <h3 className="font-semibold text-foreground mb-3">📊 Today's Scores</h3>
            <div className="flex flex-wrap gap-2">
              {todaysScores.map((score, i) => (
                <div 
                  key={i}
                  className="bg-muted px-3 py-1 rounded-full text-sm font-medium"
                >
                  {score >= 1000 ? '🏆' : score >= 500 ? '🥈' : score >= 100 ? '🥉' : '✅'} {score} pts
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Games Preview */}
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-foreground mb-3">🎮 Rotating Games</h3>
          <p className="text-sm text-muted-foreground mb-3">
            A different game appears each day!
          </p>
          <div className="grid grid-cols-4 gap-2">
            {Object.values(GAMES).map(game => (
              <div 
                key={game.type}
                className={`text-center p-2 rounded-lg ${game.type === todaysGame ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50'}`}
              >
                <span className="text-2xl block">{game.emoji}</span>
                <span className="text-xs text-muted-foreground">{game.type === todaysGame ? 'Today!' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MiniGames;
