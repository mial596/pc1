import React, { useState, useEffect, useMemo } from 'react';
import { GameProps } from '../types';
import { soundService } from '../services/audioService';
import { CatSilhouetteIcon } from '../hooks/Icons';

interface Card {
  id: number;
  imageId: string;
  url: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const PAIR_COUNT = 8;
const GAME_DURATION = 120;
const REWARD_PER_PAIR = 25;

const MemoGatos: React.FC<GameProps> = ({ unlockedImages, onGameEnd }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [pairsFound, setPairsFound] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [score, setScore] = useState(0);

  const gameImages = useMemo(() => {
    return unlockedImages.sort(() => 0.5 - Math.random()).slice(0, PAIR_COUNT);
  }, [unlockedImages]);

  useEffect(() => {
    const gameCards = [...gameImages, ...gameImages]
      .sort(() => 0.5 - Math.random())
      .map((image, index) => ({
        id: index,
        imageId: String(image.id),
        url: image.url,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(gameCards);
  }, [gameImages]);

  useEffect(() => {
    if (timeLeft <= 0 || pairsFound === PAIR_COUNT) {
        const coins = score * REWARD_PER_PAIR;
        const xp = score * 10;
        if (score > 0 && pairsFound < PAIR_COUNT) soundService.play('gameOver');
        if (pairsFound === PAIR_COUNT) soundService.play('reward');
        onGameEnd({score, coinsEarned: coins, xpEarned: xp});
        return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, pairsFound, onGameEnd, score]);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.imageId === secondCard.imageId) {
        soundService.play('catMeow');
        setCards(prevCards =>
          prevCards.map(card =>
            card.imageId === firstCard.imageId ? { ...card, isMatched: true, isFlipped: true } : card
          )
        );
        setPairsFound(prev => prev + 1);
        setScore(prev => prev + 1);
        setFlippedIndices([]);
        setIsChecking(false);
      } else {
        setTimeout(() => {
          setCards(prevCards =>
            prevCards.map((card, index) =>
              index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  }, [flippedIndices, cards]);

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }
    soundService.play('select');
    setCards(prevCards =>
      prevCards.map((card, i) =>
        i === index ? { ...card, isFlipped: true } : card
      )
    );
    setFlippedIndices(prev => [...prev, index]);
  };
  
  const gridTemplateColumns = `repeat(4, minmax(0, 1fr))`;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-surface-darker rounded-lg shadow-lg border-2 border-ink/20">
        <div className="flex justify-between items-center mb-4 text-ink font-bold">
            <div className="text-xl">Pares: {pairsFound} / {PAIR_COUNT}</div>
            <div className="text-xl">Tiempo: {timeLeft}s</div>
        </div>
        <div className="grid gap-2 md:gap-4" style={{ gridTemplateColumns }}>
            {cards.map((card, index) => (
                <div key={card.id} className="aspect-square perspective cursor-pointer" onClick={() => handleCardClick(index)}>
                    <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${card.isFlipped || card.isMatched ? 'rotate-y-180' : ''}`}>
                        {/* Card Back */}
                        <div className="absolute w-full h-full backface-hidden bg-secondary rounded-lg flex items-center justify-center shadow-md border-2 border-ink/30 p-2">
                            <CatSilhouetteIcon className="w-full h-full text-paper/70" />
                        </div>
                        {/* Card Front */}
                        <div className={`absolute w-full h-full backface-hidden rotate-y-180 bg-paper rounded-lg overflow-hidden shadow-md border-4 transition-all ${card.isMatched ? 'border-green-400 memory-card-matched' : 'border-ink/50'}`}>
                           <img src={card.url} alt="Gato" className="w-full h-full object-cover" />
                           {card.isMatched && <div className="absolute inset-0 bg-green-500/30"></div>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default MemoGatos;
