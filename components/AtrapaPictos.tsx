import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameProps, CatImage } from '../types';
import { soundService } from '../services/audioService';

interface FallingItem {
  id: number;
  x: number; // percentage
  y: number; // pixels
  type: 'cat' | 'mouse';
  content: string; // url or emoji
}

const GAME_DURATION = 30; // seconds
const CATCHER_WIDTH = 100; // pixels
const ITEM_SPAWN_RATE = 500; // ms

const AtrapaPictos: React.FC<GameProps> = ({ unlockedImages, onGameEnd }) => {
  const [items, setItems] = useState<FallingItem[]>([]);
  const [catcherX, setCatcherX] = useState(50); // percentage
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  // FIX: Initialize useRef with null to satisfy TypeScript's requirement for an initial value.
  const requestRef = useRef<number | null>(null);
  // FIX: Initialize useRef with null to satisfy TypeScript's requirement for an initial value.
  const lastTimeRef = useRef<number | null>(null);
  const lastSpawnRef = useRef<number>(0);

  const gameLoop = useCallback((time: number) => {
    // FIX: Check for null instead of undefined due to initialization change.
    if (lastTimeRef.current === null) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    const deltaTime = time - lastTimeRef.current;
    
    // Spawn new items
    if (time - lastSpawnRef.current > ITEM_SPAWN_RATE) {
        lastSpawnRef.current = time;
        const type = Math.random() > 0.25 ? 'cat' : 'mouse';
        const content = type === 'cat' && unlockedImages.length > 0
            ? unlockedImages[Math.floor(Math.random() * unlockedImages.length)].url
            : '🐭';
        
        const newItem: FallingItem = {
            id: Date.now() + Math.random(),
            x: Math.random() * 90 + 5,
            y: -40,
            type,
            content
        };
        setItems(prev => [...prev, newItem]);
    }
    
    const gameAreaHeight = gameAreaRef.current?.clientHeight || 600;
    const catcherPixelX = (catcherX / 100) * (gameAreaRef.current?.clientWidth || 0);

    // Move and check items
    setItems(prevItems => prevItems.map(item => ({...item, y: item.y + (deltaTime * 0.2)}))
      .filter(item => {
        // Check for catch
        if (item.y > gameAreaHeight - 60 && item.y < gameAreaHeight - 20) {
            const itemPixelX = (item.x / 100) * (gameAreaRef.current?.clientWidth || 0);
            if (Math.abs(itemPixelX - catcherPixelX) < CATCHER_WIDTH / 2) {
                if(item.type === 'cat') {
                    setScore(s => s + 10);
                    soundService.play('catMeow');
                } else {
                    setScore(s => Math.max(0, s - 20));
                    soundService.play('mouseSqueak');
                }
                return false; // remove item
            }
        }
        return item.y < gameAreaHeight; // remove if off-screen
    }));

    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [catcherX, unlockedImages]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
      const timer = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timer);
            setGameState('finished');
          }
          return t - 1;
        });
      }, 1000);
      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        clearInterval(timer);
      };
    }
  }, [gameState, gameLoop]);

  useEffect(() => {
    if (gameState === 'finished') {
        const coinsEarned = score;
        const xpEarned = Math.floor(score / 5);
        onGameEnd({ score, coinsEarned, xpEarned });
    }
  }, [gameState, score, onGameEnd]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameAreaRef.current) {
        const rect = gameAreaRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        setCatcherX(x);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (gameState === 'ready') {
    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h2 className="text-2xl font-bold">Atrapa los Gatos</h2>
            <p className="text-ink/80 my-4">Mueve el ratón para controlar la cesta. ¡Atrapa los gatos y evita los ratones!</p>
            <button onClick={() => setGameState('playing')} className="btn-themed btn-themed-primary">Empezar</button>
        </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-surface rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4 text-ink font-bold">
        <div className="text-2xl">Puntuación: {score}</div>
        <div className="text-2xl">Tiempo: {timeLeft}s</div>
      </div>
      <div ref={gameAreaRef} className="catcher-game-area w-full h-[600px] relative overflow-hidden rounded-md border-2 border-ink/20">
        {items.map(item => (
          <div key={item.id} className="falling-item" style={{ left: `${item.x}%`, top: `${item.y}px` }}>
            {item.type === 'cat' 
                ? <img src={item.content} alt="cat" className="w-12 h-12 object-cover rounded-md" /> 
                : <span>{item.content}</span>
            }
          </div>
        ))}
        <div
          className="absolute bottom-5 w-[100px] h-[50px] bg-secondary rounded-lg text-4xl flex items-center justify-center"
          style={{ left: `${catcherX}%`, transform: 'translateX(-50%)' }}
        >
          🧺
        </div>
      </div>
    </div>
  );
};

export default AtrapaPictos;