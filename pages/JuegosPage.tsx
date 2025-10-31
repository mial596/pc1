import React, { useState, useMemo } from 'react';
import { Game, GameProps, CatImage } from '../types';
import { GAMES } from '../gameData';
import { ArrowLeftIcon, LockIcon } from '../hooks/Icons';

interface JuegosPageProps {
    unlockedImages: CatImage[];
    onGameEnd: (results: { score: number; coinsEarned: number; xpEarned: number }) => void;
}

const GameResultScreen: React.FC<{
    score: number;
    coins: number;
    xp: number;
    onPlayAgain: () => void;
    onExit: () => void;
}> = ({ score, coins, xp, onPlayAgain, onExit }) => (
    <div className="flex flex-col items-center justify-center p-8 bg-surface rounded-lg shadow-lg">
        <h2 className="text-3xl font-black text-primary font-spooky">¡Juego Terminado!</h2>
        <p className="text-xl my-4 text-ink/80">
            Tu puntuación fue: <span className="font-bold text-white">{score}</span>
        </p>
        <div className="flex justify-center items-center gap-6 my-4 bg-surface-darker p-3 rounded-xl border-2 border-ink/20">
            <p className="font-bold text-lg text-yellow-400">+{coins} Monedas</p>
            <p className="font-bold text-lg text-sky-400">+{xp} XP</p>
        </div>
        <div className="flex gap-4 mt-4">
            <button onClick={onPlayAgain} className="btn-themed btn-themed-secondary">Jugar de Nuevo</button>
            <button onClick={onExit} className="btn-themed btn-themed-primary">Salir</button>
        </div>
    </div>
);


const JuegosPage: React.FC<JuegosPageProps> = ({ unlockedImages, onGameEnd }) => {
    const [activeGame, setActiveGame] = useState<Game | null>(null);
    const [lastGameResult, setLastGameResult] = useState<{score: number, coins: number, xp: number} | null>(null);

    const handleGameEnd = (results: { score: number; coinsEarned: number; xpEarned: number }) => {
        setLastGameResult({ score: results.score, coins: results.coinsEarned, xp: results.xpEarned });
        onGameEnd(results);
    };
    
    const handlePlayAgain = () => {
        setLastGameResult(null);
        // The activeGame state remains, so the game component re-renders with a new key
    }

    const handleExit = () => {
        setLastGameResult(null);
        setActiveGame(null);
    }

    const groupedGames = useMemo(() => {
        return GAMES.reduce((acc, game) => {
            if (!acc[game.category]) {
                acc[game.category] = [];
            }
            acc[game.category].push(game);
            return acc;
        }, {} as Record<string, Game[]>);
    }, []);

    if (activeGame) {
        if (lastGameResult) {
            return (
                 <div className="container mx-auto p-4 flex justify-center items-center">
                    <GameResultScreen {...lastGameResult} onPlayAgain={handlePlayAgain} onExit={handleExit}/>
                </div>
            )
        }
        const GameComponent = activeGame.component;
        return (
            <div>
                <button onClick={() => setActiveGame(null)} className="flex items-center gap-2 font-bold mb-4 text-ink/70 hover:text-primary container mx-auto px-4 sm:px-6">
                    <ArrowLeftIcon className="w-5 h-5"/>
                    Volver a la Sala de Juegos
                </button>
                <GameComponent
                    key={Date.now()} // Force re-mount to reset game state on "Play Again"
                    unlockedImages={unlockedImages}
                    onGameEnd={handleGameEnd}
                />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto p-4 sm:p-6">
            <header className="text-center mb-10">
                <h1 className="text-4xl font-black text-ink font-spooky">Sala de Juegos</h1>
                <p className="text-lg text-ink/70 mt-2">¡Gana monedas y XP para ampliar tu colección de gatos!</p>
            </header>
            
            <div className="space-y-12">
                {Object.entries(groupedGames).map(([category, games]) => (
                    <section key={category}>
                        <h2 className="text-2xl font-bold text-primary mb-4 border-b-2 border-primary/20 pb-2">{category}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {games.map(game => {
                                const isLocked = game.minImagesRequired && unlockedImages.length < game.minImagesRequired;
                                return (
                                    <button 
                                        key={game.id}
                                        onClick={() => setActiveGame(game)}
                                        disabled={isLocked}
                                        className="game-select-card card-themed p-6 text-center disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed disabled:hover:border-ink/20 disabled:hover:shadow-none"
                                    >
                                        <div className="text-primary mx-auto mb-4">{game.icon}</div>
                                        <h3 className="text-2xl font-bold font-spooky">{game.name}</h3>
                                        <p className="text-ink/70">{game.description}</p>
                                        {isLocked && (
                                            <div className="flex items-center justify-center gap-2 mt-3 text-accent font-semibold text-sm bg-accent/20 p-2 rounded-md">
                                                <LockIcon className="w-4 h-4"/>
                                                <span>Necesitas {game.minImagesRequired} gatos</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default JuegosPage;
