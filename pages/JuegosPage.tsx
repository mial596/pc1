import React, { useState, useMemo } from 'react';
import { Game, GameProps, CatImage } from '../types';
import { GAMES } from '../gameData';
import { useLanguage } from '../contexts/LanguageContext';
// Fix: Import TranslationKey to cast dynamic keys for the translation function.
import { TranslationKey } from '../translations';

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


const GameResultScreen: React.FC<{
    score: number;
    coins: number;
    xp: number;
    onPlayAgain: () => void;
    onExit: () => void;
}> = ({ score, coins, xp, onPlayAgain, onExit }) => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center p-8 card-themed text-center animate-popIn relative overflow-hidden">
            <Confetti />
            <div className="relative z-10">
                <h2 className="text-3xl font-black text-primary font-cartoon">{t('gameFinished')}</h2>
                <p className="text-xl my-4 text-ink/80">
                    {t('yourScoreWas')} <span className="font-bold text-ink">{score}</span>
                </p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 my-4 bg-surface-darker p-4 rounded-xl border-2 border-ink/20">
                    <p className="font-bold text-lg text-secondary">✨ +{coins} {t('coins')}</p>
                    <p className="font-bold text-lg text-primary">⭐ +{xp} XP</p>
                </div>
                <div className="flex gap-4 mt-4">
                    <button onClick={onPlayAgain} className="btn-themed btn-themed-secondary">{t('playAgain')}</button>
                    <button onClick={onExit} className="btn-themed btn-themed-primary">{t('exit')}</button>
                </div>
            </div>
        </div>
    );
};


interface JuegosPageProps extends GameProps {}

const JuegosPage: React.FC<JuegosPageProps> = ({ unlockedImages, onGameEnd }) => {
    const { t } = useLanguage();
    const [activeGame, setActiveGame] = useState<Game | null>(null);
    const [lastGameResult, setLastGameResult] = useState<{score: number, coins: number, xp: number} | null>(null);

    const handleGameEnd = (results: { score: number; coinsEarned: number; xpEarned: number }) => {
        setLastGameResult({ score: results.score, coins: results.coinsEarned, xp: results.xpEarned });
        onGameEnd(results);
    };
    
    const handlePlayAgain = () => {
        setLastGameResult(null);
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
                    <span>⬅️</span>
                    {t('backToGameRoom')}
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
                <h1 className="text-4xl font-black text-ink font-cartoon">{t('gameRoomTitle')}</h1>
                <p className="text-lg text-ink/70 mt-2">{t('gameRoomSubtitle')}</p>
            </header>
            
            <div className="space-y-12">
                {Object.keys(groupedGames).map((category) => (
                    <section key={category}>
                        {/* Fix: Cast category to TranslationKey for the t function. */}
                        <h2 className="text-2xl font-bold text-primary mb-4 border-b-2 border-primary/20 pb-2">{t(category as TranslationKey)}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedGames[category].map(game => {
                                const isLocked = game.minImagesRequired && unlockedImages.length < game.minImagesRequired;
                                return (
                                    <button 
                                        key={game.id}
                                        onClick={() => setActiveGame(game)}
                                        disabled={isLocked}
                                        className="card-themed p-6 text-center disabled:opacity-50 disabled:!transform-none disabled:cursor-not-allowed disabled:hover:shadow-[8px_8px_0_var(--c-ink)]"
                                    >
                                        <div className="text-primary mx-auto mb-4">{game.icon}</div>
                                        {/* Fix: Cast game.id to TranslationKey for the t function. */}
                                        <h3 className="text-2xl font-bold font-cartoon">{t(game.id as TranslationKey)}</h3>
                                        {/* Fix: Cast template literal to TranslationKey for the t function. */}
                                        <p className="text-ink/70">{t(`${game.id}Description` as TranslationKey)}</p>
                                        {isLocked && (
                                            <div className="flex items-center justify-center gap-2 mt-3 text-accent font-semibold text-sm bg-accent/20 p-2 rounded-md">
                                                <span>🔒</span>
                                                <span>{t('requiresCats', { count: game.minImagesRequired })}</span>
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