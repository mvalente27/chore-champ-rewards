import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';

type AgeTier = 'explorer' | 'builder' | 'achiever' | null;

interface SpaceShooterGameProps {
  onGameEnd: (score: number) => void;
  onCancel: () => void;
  ageTier?: AgeTier;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  type: 'basic' | 'fast' | 'big';
}

// Difficulty settings based on age tier
const getDifficultySettings = (ageTier: AgeTier) => {
  switch (ageTier) {
    case 'explorer': // 5-8 years: Easier
      return {
        spawnInterval: 1500,      // Slower spawn
        enemySpeed: { basic: 0.8, fast: 1.2, big: 0.5 },
        lives: 5,
        gameDuration: 45000,      // Shorter game
        enemyTypes: ['basic', 'basic', 'basic', 'basic', 'big'] as const
      };
    case 'achiever': // 13-18 years: Harder
      return {
        spawnInterval: 600,       // Fast spawn
        enemySpeed: { basic: 1.8, fast: 3, big: 1.2 },
        lives: 2,
        gameDuration: 90000,      // Longer game
        enemyTypes: ['basic', 'fast', 'fast', 'big', 'fast'] as const
      };
    default: // builder (9-12) or unknown: Medium
      return {
        spawnInterval: 1000,
        enemySpeed: { basic: 1.2, fast: 2, big: 0.8 },
        lives: 3,
        gameDuration: 60000,
        enemyTypes: ['basic', 'basic', 'basic', 'fast', 'big'] as const
      };
  }
};

export function SpaceShooterGame({ onGameEnd, onCancel, ageTier }: SpaceShooterGameProps) {
  const difficulty = getDifficultySettings(ageTier);
  
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(50);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(difficulty.lives);
  const [gameStarted, setGameStarted] = useState(false);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const bulletIdRef = useRef(0);
  const enemyIdRef = useRef(0);
  const lastShotRef = useRef(0);

  // Handle keyboard controls
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setPlayerX(prev => Math.max(5, prev - 5));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setPlayerX(prev => Math.min(95, prev + 5));
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        shoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  // Handle touch controls
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gameAreaRef.current || gameOver) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const touchX = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    setPlayerX(Math.max(5, Math.min(95, touchX)));
  }, [gameOver]);

  const handleTouchStart = useCallback(() => {
    shoot();
  }, []);

  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotRef.current < 200) return; // Rate limit
    lastShotRef.current = now;

    setBullets(prev => [...prev, {
      id: bulletIdRef.current++,
      x: playerX,
      y: 85
    }]);
  }, [playerX]);

  // Spawn enemies
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(() => {
      const types = difficulty.enemyTypes;
      const type = types[Math.floor(Math.random() * types.length)];
      
      setEnemies(prev => [...prev, {
        id: enemyIdRef.current++,
        x: 10 + Math.random() * 80,
        y: -5,
        type
      }]);
    }, difficulty.spawnInterval);

    return () => clearInterval(spawnInterval);
  }, [gameStarted, gameOver, difficulty.spawnInterval, difficulty.enemyTypes]);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = setInterval(() => {
      // Move bullets
      setBullets(prev => prev
        .map(b => ({ ...b, y: b.y - 5 }))
        .filter(b => b.y > -5)
      );

      // Move enemies
      setEnemies(prev => {
        const updated = prev.map(e => ({
          ...e,
          y: e.y + difficulty.enemySpeed[e.type]
        }));

        // Check for enemies reaching bottom
        const reachedBottom = updated.filter(e => e.y >= 90);
        if (reachedBottom.length > 0) {
          setLives(l => {
            const newLives = l - reachedBottom.length;
            if (newLives <= 0) {
              setGameOver(true);
            }
            return Math.max(0, newLives);
          });
        }

        return updated.filter(e => e.y < 90);
      });

      // Check collisions
      setBullets(prevBullets => {
        let remainingBullets = [...prevBullets];
        
        setEnemies(prevEnemies => {
          return prevEnemies.filter(enemy => {
            const hitBullet = remainingBullets.find(bullet => {
              const hitRadius = enemy.type === 'big' ? 8 : 5;
              return Math.abs(bullet.x - enemy.x) < hitRadius && 
                     Math.abs(bullet.y - enemy.y) < hitRadius;
            });

            if (hitBullet) {
              remainingBullets = remainingBullets.filter(b => b.id !== hitBullet.id);
              const points = enemy.type === 'big' ? 30 : enemy.type === 'fast' ? 20 : 10;
              setScore(s => s + points);
              return false;
            }
            return true;
          });
        });

        return remainingBullets;
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameStarted, gameOver]);

  // Auto-end game after game duration
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timeout = setTimeout(() => {
      setGameOver(true);
    }, difficulty.gameDuration);

    return () => clearTimeout(timeout);
  }, [gameStarted, gameOver, difficulty.gameDuration]);

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-6xl">🚀</div>
        <h2 className="text-2xl font-bold text-foreground">Space Shooter</h2>
        <p className="text-center text-muted-foreground max-w-xs">
          Use arrow keys or touch to move. Tap or press Space to shoot! Destroy aliens before they reach the bottom.
        </p>
        <div className="text-sm text-muted-foreground">
          <p>👾 Basic: 10 pts | ⚡ Fast: 20 pts | 👹 Big: 30 pts</p>
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
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-6xl">🎮</div>
        <h2 className="text-2xl font-bold text-foreground">Game Over!</h2>
        <div className="text-4xl font-bold text-primary">{score} pts</div>
        <p className="text-muted-foreground">
          {score >= 1000 ? '🏆 Gold!' : score >= 500 ? '🥈 Silver!' : score >= 100 ? '🥉 Bronze!' : 'Keep practicing!'}
        </p>
        <Button onClick={() => onGameEnd(score)} size="lg">
          Claim Reward
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={gameAreaRef}
      className="relative w-full h-full bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 overflow-hidden touch-none"
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    >
      {/* HUD */}
      <div className="absolute top-2 left-2 right-2 flex justify-between text-white z-10">
        <div className="flex gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <span key={i} className="text-xl">❤️</span>
          ))}
        </div>
        <div className="text-xl font-bold">🪙 {score}</div>
      </div>

      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-50"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `twinkle ${1 + Math.random() * 2}s infinite`
            }}
          />
        ))}
      </div>

      {/* Enemies */}
      {enemies.map(enemy => (
        <div
          key={enemy.id}
          className="absolute transition-all duration-50"
          style={{
            left: `${enemy.x}%`,
            top: `${enemy.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: enemy.type === 'big' ? '2.5rem' : '1.5rem'
          }}
        >
          {enemy.type === 'big' ? '👹' : enemy.type === 'fast' ? '⚡' : '👾'}
        </div>
      ))}

      {/* Bullets */}
      {bullets.map(bullet => (
        <div
          key={bullet.id}
          className="absolute w-1 h-3 bg-yellow-400 rounded-full"
          style={{
            left: `${bullet.x}%`,
            top: `${bullet.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 10px #fbbf24'
          }}
        />
      ))}

      {/* Player */}
      <div
        className="absolute text-4xl transition-all duration-75"
        style={{
          left: `${playerX}%`,
          top: '90%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        🚀
      </div>

      {/* Touch hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-sm">
        Touch & drag to move • Tap to shoot
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
