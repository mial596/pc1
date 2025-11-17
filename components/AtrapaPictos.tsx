import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameProps } from '../types';
import { soundService } from '../services/audioService';

// Game constants
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 50;
const ENEMY_WIDTH = 40;
const ENEMY_HEIGHT = 30;
const BULLET_WIDTH = 10;
const BULLET_HEIGHT = 10;
const PLAYER_SPEED = 8;
const BULLET_SPEED = 10;
const ENEMY_SPEED = 0.5;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 8;
const ENEMY_SPACING = 10;

// Game state interfaces
interface GameObject {
    x: number;
    y: number;
}
interface Player extends GameObject {}
interface Enemy extends GameObject {
    id: number;
}
interface Bullet extends GameObject {
    id: number;
}

const AtrapaPictos: React.FC<GameProps> = ({ unlockedImages, onGameEnd }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);

    const playerRef = useRef<Player>({ x: 370, y: 540 });
    const enemiesRef = useRef<Enemy[]>([]);
    const bulletsRef = useRef<Bullet[]>([]);
    const keysPressed = useRef<Record<string, boolean>>({});
    const enemyDirection = useRef<number>(1);
    const gameLoopRef = useRef<number | null>(null);

    // Sprites
    const playerSprite = useMemo(() => unlockedImages.length > 0 ? unlockedImages[Math.floor(Math.random() * unlockedImages.length)].url : 'https://i.postimg.cc/N0GhZgVV/Gemini-Generated-Image-vrmc6jvrmc6jvrmc.png', [unlockedImages]);
    const enemySprite = '🐭';
    const bulletSprite = '🧶';
    
    const [playerImage, setPlayerImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        const img = new Image();
        img.src = playerSprite;
        img.onload = () => setPlayerImage(img);
    }, [playerSprite]);

    const resetGame = useCallback(() => {
        setScore(0);
        setLives(3);
        playerRef.current = { x: (800 - PLAYER_WIDTH) / 2, y: 600 - PLAYER_HEIGHT - 10 };
        bulletsRef.current = [];
        
        const newEnemies: Enemy[] = [];
        for (let row = 0; row < ENEMY_ROWS; row++) {
            for (let col = 0; col < ENEMY_COLS; col++) {
                newEnemies.push({
                    id: row * ENEMY_COLS + col,
                    x: col * (ENEMY_WIDTH + ENEMY_SPACING) + 50,
                    y: row * (ENEMY_HEIGHT + ENEMY_SPACING) + 50,
                });
            }
        }
        enemiesRef.current = newEnemies;
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw Player
        if (playerImage) {
            ctx.drawImage(playerImage, playerRef.current.x, playerRef.current.y, PLAYER_WIDTH, PLAYER_HEIGHT);
        }

        // Draw Enemies
        ctx.font = '24px sans-serif';
        enemiesRef.current.forEach(enemy => {
            ctx.fillText(enemySprite, enemy.x, enemy.y + ENEMY_HEIGHT);
        });

        // Draw Bullets
        ctx.font = '18px sans-serif';
        bulletsRef.current.forEach(bullet => {
             ctx.fillText(bulletSprite, bullet.x, bullet.y);
        });
        
        // Draw UI
        ctx.fillStyle = 'white';
        ctx.font = '20px "Press Start 2P"';
        ctx.fillText(`Score: ${score}`, 10, 30);
        ctx.fillText(`Lives: ${'❤️'.repeat(lives)}`, ctx.canvas.width - 150, 30);

    }, [playerImage, score, lives]);

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Update player position
        if (keysPressed.current['ArrowLeft'] && playerRef.current.x > 0) {
            playerRef.current.x -= PLAYER_SPEED;
        }
        if (keysPressed.current['ArrowRight'] && playerRef.current.x < canvas.width - PLAYER_WIDTH) {
            playerRef.current.x += PLAYER_SPEED;
        }

        // Update bullets
        bulletsRef.current = bulletsRef.current
            .map(b => ({ ...b, y: b.y - BULLET_SPEED }))
            .filter(b => b.y > 0);
            
        // Update enemies
        let edgeReached = false;
        enemiesRef.current.forEach(enemy => {
            enemy.x += ENEMY_SPEED * enemyDirection.current;
            if (enemy.x <= 0 || enemy.x >= canvas.width - ENEMY_WIDTH) {
                edgeReached = true;
            }
        });

        if (edgeReached) {
            enemyDirection.current *= -1;
            enemiesRef.current.forEach(enemy => enemy.y += ENEMY_HEIGHT / 2);
        }

        // Collision detection
        const newEnemies = [...enemiesRef.current];
        const newBullets = [...bulletsRef.current];
        let scoreToAdd = 0;

        for (let i = newBullets.length - 1; i >= 0; i--) {
            for (let j = newEnemies.length - 1; j >= 0; j--) {
                const bullet = newBullets[i];
                const enemy = newEnemies[j];
                if (bullet.x < enemy.x + ENEMY_WIDTH &&
                    bullet.x + BULLET_WIDTH > enemy.x &&
                    bullet.y < enemy.y + ENEMY_HEIGHT &&
                    bullet.y + BULLET_HEIGHT > enemy.y) {
                    
                    soundService.play('mouseSqueak');
                    newBullets.splice(i, 1);
                    newEnemies.splice(j, 1);
                    scoreToAdd += 10;
                    break;
                }
            }
        }
        if(scoreToAdd > 0) setScore(s => s + scoreToAdd);
        enemiesRef.current = newEnemies;
        bulletsRef.current = newBullets;

        // Check for game over conditions
        let newLives = lives;
        enemiesRef.current.forEach(enemy => {
            if (enemy.y >= canvas.height - PLAYER_HEIGHT) {
                newLives = 0; // Instant game over if they reach the bottom
            }
        });
        
        if (newLives < lives) {
            soundService.play('simonError');
            setLives(newLives);
        }

        if (newLives <= 0 || enemiesRef.current.length === 0) {
            setGameState('finished');
            return;
        }

        draw(ctx);
        gameLoopRef.current = requestAnimationFrame(gameLoop);
    }, [draw, lives]);
    
    useEffect(() => {
        if (gameState === 'playing') {
            resetGame();
            gameLoopRef.current = requestAnimationFrame(gameLoop);
        } else {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        }
        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        };
    }, [gameState, gameLoop, resetGame]);

    useEffect(() => {
      if (gameState === 'finished') {
        const finalScore = score + (enemiesRef.current.length === 0 ? 500 : 0); // Bonus for clearing
        const coinsEarned = finalScore;
        const xpEarned = Math.floor(finalScore / 5);
        onGameEnd({ score: finalScore, coinsEarned, xpEarned });
      }
    }, [gameState, score, onGameEnd]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = true;
            if (e.key === ' ' && gameState === 'playing') {
                e.preventDefault();
                soundService.play('select');
                bulletsRef.current.push({
                    id: Date.now(),
                    x: playerRef.current.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
                    y: playerRef.current.y,
                });
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keysPressed.current[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [gameState]);

    if (gameState === 'ready') {
        return (
            <div className="flex flex-col items-center justify-center p-8">
                <h2 className="text-2xl font-bold font-cartoon">GATO-NAVES</h2>
                <p className="text-ink/80 my-4 text-center">¡Defiende el universo de la invasión de los ratones! <br/> Usa las flechas para moverte y la barra espaciadora para disparar.</p>
                <button onClick={() => setGameState('playing')} className="btn-themed btn-themed-primary">Empezar</button>
            </div>
        );
    }
    
    return (
      <div className="w-full max-w-4xl mx-auto p-2 bg-black border-4 border-primary">
          <canvas ref={canvasRef} width="800" height="600" className="w-full h-auto" />
      </div>
    );
};

export default AtrapaPictos;