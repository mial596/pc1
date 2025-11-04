import React, { useState, useEffect, useMemo } from 'react';
import { GameProps, CatImage } from '../types';
import { soundService } from '../services/audioService';
import { SpinnerIcon } from '../hooks/Icons';

const GRID_SIZE = 3; // 3x3 grid
const REWARD = 300;

function shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

interface Piece {
  id: number;
  correctIndex: number;
  bgPosition: string;
}

const Confetti: React.FC = () => (
    <div className="confetti-container">
        {Array.from({ length: 50 }).map((_, i) => (
            <div
                key={i}
                className="confetti-piece"
                style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    backgroundColor: ['var(--c-primary)', 'var(--c-secondary)', 'var(--c-accent)'][Math.floor(Math.random() * 3)],
                }}
            />
        ))}
    </div>
);


const Rompecatgramas: React.FC<GameProps> = ({ unlockedImages, onGameEnd }) => {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const puzzleImage: CatImage | null = useMemo(() => {
    if (unlockedImages.length === 0) return null;
    return unlockedImages[Math.floor(Math.random() * unlockedImages.length)];
  }, [unlockedImages]);

  useEffect(() => {
    if (!puzzleImage) return;

    const initialPieces: Piece[] = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const row = Math.floor(i / GRID_SIZE);
      const col = i % GRID_SIZE;
      initialPieces.push({
        id: i,
        correctIndex: i,
        bgPosition: `${(col * 100) / (GRID_SIZE - 1)}% ${(row * 100) / (GRID_SIZE - 1)}%`,
      });
    }

    // Ensure shuffled array is not the correct one
    let shuffled;
    do {
       shuffled = shuffleArray(initialPieces);
    } while (shuffled.every((p, i) => p.id === i));

    setPieces(shuffled);
  }, [puzzleImage]);
  
  const checkCompletion = (currentPieces: Piece[]) => {
      const isSolved = currentPieces.every((p, i) => p.correctIndex === i);
      if(isSolved) {
          setIsComplete(true);
          soundService.play('reward');
          setTimeout(() => {
              onGameEnd({ score: 1, coinsEarned: REWARD, xpEarned: 50 });
          }, 2500);
      }
  };

  const handlePieceClick = (clickedIndex: number) => {
    if (isComplete) return;

    if (selectedPiece === null) {
      soundService.play('select');
      setSelectedPiece(clickedIndex);
    } else {
      if (selectedPiece !== clickedIndex) {
        soundService.play('select');
        const newPieces = [...pieces];
        [newPieces[selectedPiece], newPieces[clickedIndex]] = [newPieces[clickedIndex], newPieces[selectedPiece]];
        setPieces(newPieces);
        checkCompletion(newPieces);
      }
      setSelectedPiece(null);
    }
  };
  
  if (!puzzleImage) {
    return <div className="text-center p-8"><SpinnerIcon className="w-8 h-8 animate-spin mx-auto"/> Cargando puzzle...</div>
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Reconstruye la imagen</h2>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full max-w-sm aspect-square">
            <div className={`puzzle-grid aspect-square w-full`} style={{gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`}}>
                {pieces.map((piece, index) => (
                    <div
                        key={piece.id}
                        onClick={() => handlePieceClick(index)}
                        className={`puzzle-piece aspect-square ${selectedPiece === index ? 'selected' : ''}`}
                        style={{
                            backgroundImage: `url(${puzzleImage.url})`,
                            backgroundPosition: piece.bgPosition,
                            border: '1px solid #111',
                            opacity: isComplete ? 0 : 1,
                            transition: 'opacity 0.5s ease-in-out'
                        }}
                    />
                ))}
            </div>
            {isComplete && (
                <div className="absolute inset-0 animate-popIn">
                    <Confetti />
                    <img src={puzzleImage.url} alt="Completed Puzzle" className="w-full h-full object-cover rounded-lg border-4 border-green-400" />
                </div>
            )}
        </div>
        <div className="w-40 h-40 rounded-md overflow-hidden border-2 border-primary shadow-lg">
             <img src={puzzleImage.url} alt="Puzzle reference" className="w-full h-full object-cover"/>
        </div>
      </div>
       {isComplete && <p className="mt-4 text-2xl font-bold text-green-400 animate-popIn">¡Completado!</p>}
    </div>
  );
};

export default Rompecatgramas;