import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameProps } from '../types';
import { soundService } from '../services/audioService';

type Insect = {
    id: string;
    emoji: string;
    name: string;
};

const INSECTS: Insect[] = [
    { id: 'ladybug', emoji: '🐞', name: 'Mariquita' },
    { id: 'ant', emoji: '🐜', name: 'Hormiga' },
    { id: 'butterfly', emoji: '🦋', name: 'Mariposa' },
    { id: 'snail', emoji: '🐌', name: 'Caracol' },
    { id: 'bee', emoji: '🐝', name: 'Abeja' },
    { id: 'spider', emoji: '🕷️', name: 'Araña' },
    { id: 'cricket', emoji: '🦗', name: 'Grillo' },
    { id: 'caterpillar', emoji: '🐛', name: 'Oruga' },
];

const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

const Bichopedia: React.FC<GameProps> = ({ onGameEnd }) => {
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [roundInsects, setRoundInsects] = useState<Insect[]>([]);
    const [shuffledInsects, setShuffledInsects] = useState<Insect[]>([]);
    const [selectedInsect, setSelectedInsect] = useState<Insect | null>(null);
    const [correctlyPlaced, setCorrectlyPlaced] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

    const insectsForLevel = useMemo(() => Math.min(2 + level, INSECTS.length), [level]);

    const setupRound = useCallback(() => {
        const selected = shuffleArray(INSECTS).slice(0, insectsForLevel);
        setRoundInsects(shuffleArray(selected));
        setShuffledInsects(shuffleArray(selected));
        setSelectedInsect(null);
        setCorrectlyPlaced([]);
        setFeedback(null);
    }, [insectsForLevel]);

    useEffect(() => {
        if (gameState === 'playing') {
            setupRound();
        }
    }, [gameState, level, setupRound]);

    const handleSelectInsect = (insect: Insect) => {
        if (correctlyPlaced.includes(insect.id)) return;
        soundService.play('select');
        setSelectedInsect(insect);
    };

    const handlePlaceSilhouette = (silhouetteInsect: Insect) => {
        if (!selectedInsect || correctlyPlaced.includes(silhouetteInsect.id)) return;

        if (selectedInsect.id === silhouetteInsect.id) {
            soundService.play('reward');
            setScore(s => s + 10);
            setCorrectlyPlaced(prev => [...prev, silhouetteInsect.id]);
            setSelectedInsect(null);
            setFeedback('correct');
        } else {
            soundService.play('error');
            setFeedback('incorrect');
        }
        setTimeout(() => setFeedback(null), 500);
    };

    useEffect(() => {
        if (correctlyPlaced.length > 0 && correctlyPlaced.length === insectsForLevel) {
            setTimeout(() => {
                if (level < 5) {
                    setLevel(l => l + 1);
                } else {
                    setGameState('finished');
                    onGameEnd({ score, coinsEarned: score, xpEarned: Math.floor(score / 2) });
                }
            }, 1000);
        }
    }, [correctlyPlaced, insectsForLevel, level, onGameEnd, score]);
    
    if (gameState === 'ready') {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-bold font-cartoon mb-4">Bichopedia</h2>
                <p className="mb-6">¡Ayuda a clasificar los bichos! Arrastra cada insecto a su silueta correcta.</p>
                <button onClick={() => setGameState('playing')} className="btn-themed btn-themed-primary">Empezar a Coleccionar</button>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-2xl mx-auto p-4 text-center">
            <h2 className="text-xl font-bold mb-2">Nivel {level} - Puntuación: {score}</h2>
            
            {/* Silhouettes */}
            <div className={`grid gap-4 mb-8 p-4 bg-surface-darker rounded-lg border-2 border-ink/30 ${feedback === 'incorrect' ? 'animate-head-shake border-accent' : ''}`} style={{gridTemplateColumns: `repeat(${insectsForLevel}, 1fr)`}}>
                {roundInsects.map(insect => (
                    <div 
                        key={insect.id} 
                        onClick={() => handlePlaceSilhouette(insect)}
                        className={`aspect-square rounded-lg flex items-center justify-center transition-all duration-300 ${correctlyPlaced.includes(insect.id) ? 'bg-green-200' : 'bg-paper cursor-pointer'}`}
                    >
                        <span className={`text-5xl transition-all duration-300 ${correctlyPlaced.includes(insect.id) ? 'opacity-100' : 'opacity-20'}`} style={{filter: correctlyPlaced.includes(insect.id) ? 'none' : 'grayscale(100%) brightness(0%)'}}>
                            {insect.emoji}
                        </span>
                    </div>
                ))}
            </div>

            {/* Selectable Insects */}
            <h3 className="font-bold mb-4">Selecciona un Bicho</h3>
            <div className="flex justify-center items-center gap-4 flex-wrap">
                {shuffledInsects.map(insect => (
                    <button 
                        key={insect.id}
                        onClick={() => handleSelectInsect(insect)}
                        disabled={correctlyPlaced.includes(insect.id)}
                        className={`text-6xl p-2 rounded-lg transition-all duration-200 ${selectedInsect?.id === insect.id ? 'bg-secondary scale-110' : 'hover:bg-surface-darker'} ${correctlyPlaced.includes(insect.id) ? 'opacity-20' : ''}`}
                    >
                        {insect.emoji}
                    </button>
                ))}
            </div>

            {correctlyPlaced.length === insectsForLevel && (
                <p className="font-bold text-primary mt-6 text-xl animate-popIn">¡Ronda Completada!</p>
            )}
        </div>
    );
};

export default Bichopedia;