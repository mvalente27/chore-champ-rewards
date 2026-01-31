import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface EndlessRunnerGameProps {
  onGameEnd: (score: number) => void;
  onCancel: () => void;
}

interface Obstacle {
  id: number;
  lane: number;
  y: number;
  type: 'rock' | 'tree' | 'hole';
}

interface Coin {
  id: number;
  lane: number;
  y: number;
}

const LANES = [0, 1, 2];
const LANE_WIDTH = 33.33;

export function EndlessRunnerGame({ onGameEnd, onCancel }: EndlessRunnerGameProps) {
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [collectibles, setCollectibles] = useState<Coin[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [isJumping, setIsJumping] = useState(false);
  const obstacleIdRef = useRef(0);
  const coinIdRef = useRef(0);

  // Handle keyboard controls
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setPlayerLane(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setPlayerLane(prev => Math.min(2, prev + 1));
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  const jump = useCallback(() => {
    if (isJumping) return;
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  }, [isJumping]);

  // Handle swipe controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 30) {
        setPlayerLane(prev => Math.min(2, prev + 1));
      } else if (deltaX < -30) {
        setPlayerLane(prev => Math.max(0, prev - 1));
      }
    } else if (deltaY < -30) {
      jump();
    }
    
    touchStartRef.current = null;
  };

  // Spawn obstacles and coins
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(() => {
      // Spawn obstacle
      if (Math.random() < 0.6) {
        const types: Array<'rock' | 'tree' | 'hole'> = ['rock', 'tree', 'hole'];
        setObstacles(prev => [...prev, {
          id: obstacleIdRef.current++,
          lane: LANES[Math.floor(Math.random() * LANES.length)],
          y: -10,
          type: types[Math.floor(Math.random() * types.length)]
        }]);
      }

      // Spawn coin
      if (Math.random() < 0.4) {
        setCollectibles(prev => [...prev, {
          id: coinIdRef.current++,
          lane: LANES[Math.floor(Math.random() * LANES.length)],
          y: -10
        }]);
      }
    }, 800);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver]);

  // Increase speed over time
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const speedInterval = setInterval(() => {
      setSpeed(prev => Math.min(8, prev + 0.2));
    }, 5000);

    return () => clearInterval(speedInterval);
  }, [gameStarted, gameOver]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // Add distance score
      setScore(prev => prev + 1);

      // Move obstacles
      setObstacles(prev => {
        const updated = prev.map(o => ({ ...o, y: o.y + speed }));
        
        // Check collision
        updated.forEach(obstacle => {
          if (
            obstacle.lane === playerLane &&
            obstacle.y >= 75 && obstacle.y <= 90 &&
            !isJumping
          ) {
            setGameOver(true);
          }
        });

        return updated.filter(o => o.y < 110);
      });

      // Move coins
      setCollectibles(prev => {
        let updated = prev.map(c => ({ ...c, y: c.y + speed }));
        
        // Collect coins
        updated = updated.filter(coin => {
          if (
            coin.lane === playerLane &&
            coin.y >= 70 && coin.y <= 95
          ) {
            setCoins(c => c + 1);
            setScore(s => s + 50);
            return false;
          }
          return coin.y < 110;
        });

        return updated;
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver, speed, playerLane, isJumping]);

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-6xl">🏃</div>
        <h2 className="text-2xl font-bold text-foreground">Endless Runner</h2>
        <p className="text-center text-muted-foreground max-w-xs">
          Swipe left/right to change lanes. Swipe up to jump over obstacles. Collect coins for bonus points!
        </p>
        <div className="text-sm text-muted-foreground">
          <p>🪨 Obstacles | 🪙 Coins = +50 pts</p>
        </div>
        <Button onClick={() => setGameStarted(true)} size="lg">
          Start Game
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Back
        </Button>
      </div>
    );
  }

  if (gameOver) {
    const finalScore = score + (coins * 20);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-6xl">🎮</div>
        <h2 className="text-2xl font-bold text-foreground">Game Over!</h2>
        <div className="text-4xl font-bold text-primary">{finalScore} pts</div>
        <p className="text-muted-foreground">
          Distance: {score}m | Coins: {coins}
        </p>
        <p className="text-muted-foreground">
          {finalScore >= 1000 ? '🏆 Gold!' : finalScore >= 500 ? '🥈 Silver!' : finalScore >= 100 ? '🥉 Bronze!' : 'Keep practicing!'}
        </p>
        <Button onClick={() => onGameEnd(finalScore)} size="lg">
          Claim Reward
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full overflow-hidden touch-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background - road */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-700 via-green-600 to-green-700">
        {/* Road */}
        <div className="absolute inset-x-[10%] top-0 bottom-0 bg-gray-700">
          {/* Lane dividers */}
          <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-yellow-400/50" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 20px, #fbbf24 20px, #fbbf24 40px)' }} />
          <div className="absolute left-2/3 top-0 bottom-0 w-1 bg-yellow-400/50" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 20px, #fbbf24 20px, #fbbf24 40px)' }} />
        </div>
      </div>

      {/* HUD */}
      <div className="absolute top-2 left-2 right-2 flex justify-between text-white z-10">
        <div className="text-xl font-bold">📏 {score}m</div>
        <div className="text-xl font-bold">🪙 {coins}</div>
      </div>

      {/* Obstacles */}
      {obstacles.map(obstacle => (
        <div
          key={obstacle.id}
          className="absolute text-3xl transition-all"
          style={{
            left: `${10 + (obstacle.lane * LANE_WIDTH) + LANE_WIDTH / 2}%`,
            top: `${obstacle.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {obstacle.type === 'rock' ? '🪨' : obstacle.type === 'tree' ? '🌲' : '🕳️'}
        </div>
      ))}

      {/* Coins */}
      {collectibles.map(coin => (
        <div
          key={coin.id}
          className="absolute text-2xl animate-pulse"
          style={{
            left: `${10 + (coin.lane * LANE_WIDTH) + LANE_WIDTH / 2}%`,
            top: `${coin.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          🪙
        </div>
      ))}

      {/* Player */}
      <div
        className={`absolute text-4xl transition-all duration-150 ${isJumping ? 'scale-125' : ''}`}
        style={{
          left: `${10 + (playerLane * LANE_WIDTH) + LANE_WIDTH / 2}%`,
          top: isJumping ? '70%' : '85%',
          transform: 'translate(-50%, -50%)',
          transition: 'top 0.25s ease-out, left 0.15s ease-out'
        }}
      >
        🏃
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-sm">
        ← Swipe → to change lanes | ↑ Swipe up to jump
      </div>
    </div>
  );
}
