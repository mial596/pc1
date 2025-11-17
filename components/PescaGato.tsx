import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameProps } from '../types';
import { soundService } from '../services/audioService';

type Fish = {
    id: number;
    name: string;
    emoji: string;
    value: number;
    speed: number;
    size: number;
};

const FISH_TYPES: Fish[] = [
    { id: 1, name: 'Pez Común', emoji: '🐟', value: 10, speed: 2, size: 40 },
    { id: 2, name: 'Pez Tropical', emoji: '🐠', value: 25, speed: 3, size: 35 },
    { id: 3, name: 'Pulpo', emoji: '🐙', value: 50, speed: 1.5, size: 50 },
    { id: 4, name: 'Calamar', emoji: '🦑', value: 100, speed: 4, size: 60 },
    { id: 5, name: 'Bota Vieja', emoji: '👢', value: -15, speed: 1, size: 45 },
];

const GAME_DURATION = 60; // 60 seconds

const PescaGato: React.FC<GameProps> = ({ onGameEnd }) => {
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [score, setScore] = useState(0);
    const [fishes, setFishes] = useState<(Fish & { x: number; y: number; direction: number })[]>([]);
    const gameAreaRef = useRef<HTMLDivElement>(null);
    const gameLoopRef = useRef<number | null>(null);

    const generateFish = useCallback(() => {
        const type = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
        const direction = Math.random() > 0.5 ? 1 : -1;
        const y = Math.random() * (gameAreaRef.current!.clientHeight - 100) + 50;
        const x = direction === 1 ? -type.size : gameAreaRef.current!.clientWidth;
        return { ...type, x, y, direction, id: Date.now() + Math.random() };
    }, []);

    const startGame = () => {
        setScore(0);
        setTimeLeft(GAME_DURATION);
        setFishes([generateFish()]);
        setGameState('playing');
    };

    const gameLoop = useCallback(() => {
        setFishes(prevFishes => {
            let newFishes = prevFishes.map(fish => ({
                ...fish,
                x: fish.x + fish.speed * fish.direction,
            })).filter(fish => fish.x > -fish.size && fish.x < gameAreaRef.current!.clientWidth);

            if (Math.random() < 0.02 && newFishes.length < 5) {
                newFishes.push(generateFish());
            }
            return newFishes;
        });
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [generateFish]);

    useEffect(() => {
        if (gameState === 'playing') {
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        };
    }, [gameState, gameLoop]);
    
    useEffect(() => {
        if (gameState === 'playing' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft <= 0 && gameState === 'playing') {
            setGameState('finished');
            onGameEnd({ score: score, coinsEarned: score, xpEarned: Math.floor(score / 5) });
        }
    }, [timeLeft, gameState, score, onGameEnd]);

    const handleCatch = (fish: Fish) => {
        if (fish.value > 0) {
            soundService.play('reward');
        } else {
            soundService.play('error');
        }
        setScore(s => s + fish.value);
        setFishes(f => f.filter(f_ => f_.id !== fish.id));
    };

    if (gameState === 'ready') {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold font-cartoon mb-4">Pesca-Gato</h2>
                <p className="mb-6">¡Toca los peces para atraparlos! Cuidado con la basura.</p>
                <button onClick={startGame} className="btn-themed btn-themed-primary">Empezar a Pescar</button>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-2xl mx-auto p-4">
            <div className="flex justify-between items-center mb-4 font-bold text-lg">
                <span>Puntuación: {score}</span>
                <span>Tiempo: {timeLeft}</span>
            </div>
            <div
                ref={gameAreaRef}
                className="relative w-full h-96 bg-blue-200 border-4 border-ink rounded-lg overflow-hidden cursor-pointer"
            >
                {fishes.map(fish => (
                    <div
                        key={fish.id}
                        onClick={() => handleCatch(fish)}
                        className="absolute text-center transition-all duration-100"
                        style={{
                            left: `${fish.x}px`,
                            top: `${fish.y}px`,
                            fontSize: `${fish.size}px`,
                            transform: `scaleX(${fish.direction})`,
                        }}
                    >
                        {fish.emoji}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PescaGato;