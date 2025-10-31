import React from 'react';
import { Game } from './types';
import { BrainIcon, PuzzleIcon, GamepadIcon } from './hooks/Icons';
import MemoGatos from './components/MemoGatos';
import Rompecatgramas from './components/Rompecatgramas';
import AtrapaPictos from './components/AtrapaPictos';


export const GAMES: Game[] = [
  {
    id: 'memogatos',
    name: 'MemoGatos',
    category: 'Asociación y memoria',
    description: 'Clásico juego de memoria visual con pictogramas de gatos.',
    component: MemoGatos,
    minImagesRequired: 8,
    // FIX: Use React.createElement instead of JSX in a .ts file
    icon: React.createElement(BrainIcon, { className: "w-12 h-12" })
  },
  {
    id: 'rompecatgramas',
    name: 'Rompecatgramas',
    category: 'Aprendizaje y lógica',
    description: 'Puzzles formados por trozos de un pictograma de gato.',
    component: Rompecatgramas,
    minImagesRequired: 1,
    // FIX: Use React.createElement instead of JSX in a .ts file
    icon: React.createElement(PuzzleIcon, { className: "w-12 h-12" })
  },
  {
    id: 'atrapa-pictos',
    name: 'Atrapa Pictos',
    category: 'Mini-juegos más dinámicos',
    description: 'Atrapa los gatos que caen y evita los ratones.',
    component: AtrapaPictos,
    minImagesRequired: 5,
    // FIX: Use React.createElement instead of JSX in a .ts file
    icon: React.createElement(GamepadIcon, { className: "w-12 h-12" })
  },
];