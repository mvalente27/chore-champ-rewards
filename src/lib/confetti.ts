import confetti from 'canvas-confetti';

// Basic celebration confetti burst
export function fireConfetti() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#8B5CF6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'],
  });
}

// Big celebration for major achievements (rewards, milestones)
export function fireBigConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#8B5CF6', '#22c55e', '#f59e0b'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#ec4899', '#06b6d4', '#8B5CF6'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

// Coin shower effect for earnings
export function fireCoinShower() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.3 },
    colors: ['#f59e0b', '#fbbf24', '#fcd34d'], // Gold colors
    shapes: ['circle'],
    scalar: 1.2,
  });
}
