import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface Match3GameProps {
  onGameEnd: (score: number) => void;
  onCancel: () => void;
}

const GEMS = ['💎', '🔮', '💰', '⭐', '🌟', '💫'];
const GRID_SIZE = 6;
const GAME_DURATION = 60;

type Grid = string[][];

function createGrid(): Grid {
  const grid: Grid = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    grid.push([]);
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i].push(GEMS[Math.floor(Math.random() * GEMS.length)]);
    }
  }
  // Remove initial matches
  return removeMatches(grid).grid;
}

function removeMatches(grid: Grid): { grid: Grid; matchCount: number } {
  let matchCount = 0;
  const newGrid = grid.map(row => [...row]);
  
  // Check horizontal matches
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE - 2; j++) {
      if (newGrid[i][j] && newGrid[i][j] === newGrid[i][j + 1] && newGrid[i][j] === newGrid[i][j + 2]) {
        matchCount++;
        newGrid[i][j] = '';
        newGrid[i][j + 1] = '';
        newGrid[i][j + 2] = '';
      }
    }
  }
  
  // Check vertical matches
  for (let i = 0; i < GRID_SIZE - 2; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (newGrid[i][j] && newGrid[i][j] === newGrid[i + 1][j] && newGrid[i][j] === newGrid[i + 2][j]) {
        matchCount++;
        newGrid[i][j] = '';
        newGrid[i + 1][j] = '';
        newGrid[i + 2][j] = '';
      }
    }
  }
  
  return { grid: newGrid, matchCount };
}

function dropGems(grid: Grid): Grid {
  const newGrid = grid.map(row => [...row]);
  
  for (let j = 0; j < GRID_SIZE; j++) {
    let writePos = GRID_SIZE - 1;
    for (let i = GRID_SIZE - 1; i >= 0; i--) {
      if (newGrid[i][j]) {
        newGrid[writePos][j] = newGrid[i][j];
        if (writePos !== i) {
          newGrid[i][j] = '';
        }
        writePos--;
      }
    }
    // Fill empty spaces
    for (let i = writePos; i >= 0; i--) {
      newGrid[i][j] = GEMS[Math.floor(Math.random() * GEMS.length)];
    }
  }
  
  return newGrid;
}

function swapGems(grid: Grid, r1: number, c1: number, r2: number, c2: number): Grid {
  const newGrid = grid.map(row => [...row]);
  const temp = newGrid[r1][c1];
  newGrid[r1][c1] = newGrid[r2][c2];
  newGrid[r2][c2] = temp;
  return newGrid;
}

function hasMatches(grid: Grid): boolean {
  const { matchCount } = removeMatches(grid);
  return matchCount > 0;
}

export function Match3Game({ onGameEnd, onCancel }: Match3GameProps) {
  const [grid, setGrid] = useState<Grid>(() => createGrid());
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [combo, setCombo] = useState(0);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Process matches
  const processMatches = useCallback((currentGrid: Grid, currentCombo: number = 0) => {
    const { grid: clearedGrid, matchCount } = removeMatches(currentGrid);
    
    if (matchCount > 0) {
      const comboMultiplier = 1 + (currentCombo * 0.5);
      const points = Math.floor(matchCount * 10 * comboMultiplier);
      setScore(prev => prev + points);
      setCombo(currentCombo + 1);
      
      // Wait, drop, then check again
      setTimeout(() => {
        const droppedGrid = dropGems(clearedGrid);
        setGrid(droppedGrid);
        
        setTimeout(() => {
          processMatches(droppedGrid, currentCombo + 1);
        }, 200);
      }, 200);
    } else {
      setCombo(0);
    }
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (gameOver) return;

    if (!selected) {
      setSelected({ row, col });
    } else {
      // Check if adjacent
      const isAdjacent = 
        (Math.abs(selected.row - row) === 1 && selected.col === col) ||
        (Math.abs(selected.col - col) === 1 && selected.row === row);
      
      if (isAdjacent) {
        const newGrid = swapGems(grid, selected.row, selected.col, row, col);
        
        if (hasMatches(newGrid)) {
          setGrid(newGrid);
          processMatches(newGrid);
        } else {
          // Invalid swap - swap back visually
          setGrid(newGrid);
          setTimeout(() => {
            setGrid(swapGems(newGrid, selected.row, selected.col, row, col));
          }, 200);
        }
      }
      setSelected(null);
    }
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-6xl">💎</div>
        <h2 className="text-2xl font-bold text-foreground">Gem Match</h2>
        <p className="text-center text-muted-foreground max-w-xs">
          Swap adjacent gems to match 3 or more in a row. Chain combos for bonus points!
        </p>
        <div className="text-sm text-muted-foreground">
          <p>⏱️ 60 seconds | 🔥 Combos = More points!</p>
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
        <h2 className="text-2xl font-bold text-foreground">Time's Up!</h2>
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
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900 via-indigo-900 to-purple-900 p-4">
      {/* HUD */}
      <div className="flex justify-between items-center mb-4 text-white">
        <div className="text-xl font-bold">🪙 {score}</div>
        {combo > 1 && (
          <div className="text-lg font-bold text-yellow-400 animate-pulse">
            🔥 x{combo} Combo!
          </div>
        )}
        <div className="text-xl font-bold">⏱️ {timeLeft}s</div>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="grid gap-1 p-2 bg-black/20 rounded-xl"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            aspectRatio: '1'
          }}
        >
          {grid.map((row, i) =>
            row.map((gem, j) => (
              <button
                key={`${i}-${j}`}
                onClick={() => handleCellClick(i, j)}
                className={`
                  w-12 h-12 text-2xl rounded-lg transition-all duration-200
                  ${selected?.row === i && selected?.col === j 
                    ? 'bg-yellow-400/50 scale-110 ring-2 ring-yellow-400' 
                    : 'bg-white/10 hover:bg-white/20'}
                  ${gem === '' ? 'opacity-0' : 'opacity-100'}
                `}
              >
                {gem}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="text-center text-white/50 text-sm mt-4">
        Tap a gem, then tap an adjacent gem to swap
      </div>
    </div>
  );
}
