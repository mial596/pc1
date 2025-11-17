// services/imageGenerator.ts
import { CatImage } from '../types';
import { LOGO_URL } from '../constants';

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350; // 4:5 aspect ratio for Instagram
const PADDING = 60;

// Helper to preload an image
const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Important for external images
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

// Helper to draw rounded text
const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = 'center') => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
};

export const generateShareableImage = async (images: CatImage[], t: (key: string) => string): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    // --- Background ---
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#fdfaf0');
    gradient.addColorStop(1, '#fdeedc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // --- Title ---
    drawText(ctx, t('newCatsUnlocked'), CANVAS_WIDTH / 2, PADDING + 60, "bold 72px 'Nunito', sans-serif", "#3d352e");

    // --- Image Grid ---
    const gridTop = PADDING + 150;
    const gridWidth = CANVAS_WIDTH - PADDING * 2;
    const gridHeight = CANVAS_HEIGHT - gridTop - (PADDING + 100);
    const numImages = images.length;

    let cols = 2;
    let rows = Math.ceil(numImages / 2);
    if (numImages <= 2) { cols = numImages; rows = 1; }
    if (numImages === 3) { cols = 3; rows = 1; }
    if (numImages >= 5) { rows = Math.ceil(numImages/cols); }

    const itemWidth = gridWidth / cols;
    const itemHeight = gridHeight / rows;
    const imageSize = Math.min(itemWidth, itemHeight) * 0.8;
    const imagePadding = Math.min(itemWidth, itemHeight) * 0.1;

    const preloadedImages = await Promise.all(images.map(img => loadImage(img.url)));

    preloadedImages.forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = PADDING + col * itemWidth + (itemWidth - imageSize) / 2;
        const y = gridTop + row * itemHeight + (itemHeight - imageSize) / 2;
        
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = 'white';
        ctx.fillRect(x, y, imageSize, imageSize);
        ctx.drawImage(img, x, y, imageSize, imageSize);
        ctx.strokeStyle = '#3d352e';
        ctx.lineWidth = 8;
        ctx.strokeRect(x, y, imageSize, imageSize);
        ctx.restore();
    });

    // --- Footer ---
    const logo = await loadImage(LOGO_URL);
    const logoSize = 80;
    const logoY = CANVAS_HEIGHT - PADDING - logoSize / 2;
    ctx.drawImage(logo, PADDING, logoY - logoSize / 2, logoSize, logoSize);
    drawText(ctx, "PictoCat!", PADDING + logoSize + 20, logoY + 15, "bold 60px 'Luckiest Guy', cursive", "#3d352e", "left");
    
    return canvas.toDataURL('image/png');
};