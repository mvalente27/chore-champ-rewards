import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface MemoryMatchGameProps {
  onGameEnd: (score: number) => void;
  onCancel: () => void;
}

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🚀', '🌟', '🎮', '🎯', '🏆', '💎', '🔥', '⚡'];

function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function createCards(): Card[] {
  const pairs = [...EMOJIS, ...EMOJIS];
  return shuffleArray(pairs).map((emoji, index) => ({
    id: index,
    emoji,
    isFlipped: false,
    isMatched: false
  }));
}

export function MemoryMatchGame({ onGameEnd, onCancel }: MemoryMatchGameProps) {
  const [cards, setCards] = useState<Card[]>(() => createCards());
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Timer
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  // Check for game completion
  useEffect(() => {
    if (matches === EMOJIS.length) {
      setGameOver(true);
    }
  }, [matches]);

  const handleCardClick = useCallback((id: number) => {
    if (isChecking) return;
    if (flippedCards.length >= 2) return;
    if (cards[id].isFlipped || cards[id].isMatched) return;

    const newCards = [...cards];
    newCards[id].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      setIsChecking(true);

      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second
              ? { ...card, isMatched: true }
              : card
          ));
          setMatches(prev => prev + 1);
          setFlippedCards([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first || card.id === second
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [cards, flippedCards, isChecking]);

  const calculateScore = () => {
    // Base score: faster time and fewer moves = higher score
    const timeBonus = Math.max(0, 120 - timeElapsed) * 5;
    const movesPenalty = moves * 2;
    const matchBonus = matches * 100;
    return Math.max(0, matchBonus + timeBonus - movesPenalty);
  };

  if (!gameStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-6xl">🧠</div>
        <h2 className="text-2xl font-bold text-foreground">Memory Match</h2>
        <p className="text-center text-muted-foreground max-w-xs">
          Flip cards to find matching pairs. Complete the board as fast as possible with the fewest moves!
        </p>
        <div className="text-sm text-muted-foreground">
          <p>⏱️ Faster = More points | 🎯 Fewer moves = Higher score</p>
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
    const score = calculateScore();
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-foreground">You Did It!</h2>
        <div className="text-4xl font-bold text-primary">{score} pts</div>
        <div className="text-muted-foreground text-center">
          <p>Time: {timeElapsed}s | Moves: {moves}</p>
        </div>
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
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 p-4">
      {/* HUD */}
      <div className="flex justify-between items-center mb-4 text-white">
        <div className="text-lg font-bold">⏱️ {timeElapsed}s</div>
        <div className="text-lg font-bold">🎯 Moves: {moves}</div>
        <div className="text-lg font-bold">✅ {matches}/{EMOJIS.length}</div>
      </div>

      {/* Card grid */}
      <div className="flex-1 flex items-center justify-center">
        <div className="grid grid-cols-4 gap-2 p-2">
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.isFlipped || card.isMatched || isChecking}
              className={`
                w-16 h-16 rounded-xl text-3xl flex items-center justify-center
                transition-all duration-300 transform
                ${card.isFlipped || card.isMatched 
                  ? 'bg-white rotate-0' 
                  : 'bg-gradient-to-br from-primary to-secondary rotate-0 hover:scale-105'}
                ${card.isMatched ? 'opacity-50 scale-95' : ''}
                ${!card.isFlipped && !card.isMatched ? 'cursor-pointer' : ''}
              `}
              style={{
                transformStyle: 'preserve-3d',
                perspective: '1000px'
              }}
            >
              {card.isFlipped || card.isMatched ? (
                <span className="animate-in fade-in duration-200">{card.emoji}</span>
              ) : (
                <span className="text-white/80">?</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-white/50 text-sm mt-4">
        Tap cards to flip and find matching pairs
      </div>
    </div>
  );
}
