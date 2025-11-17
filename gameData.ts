import React from 'react';
import { Game } from './types';
import MemoGatos from './components/MemoGatos';
import Rompecatgramas from './components/Rompecatgramas';
import AtrapaPictos from './components/AtrapaPictos';
import PescaGato from './components/PescaGato';
import Bichopedia from './components/Bichopedia';

export const GAMES: Game[] = [
  {
    id: 'pescagato',
    name: 'Pesca-Gato',
    category: 'Juegos Relajantes',
    description: 'Relájate y pesca algunas criaturas marinas para ganar monedas.',
    component: PescaGato,
    icon: React.createElement('span', { className: 'text-5xl' }, '🎣')
  },
  {
    id: 'bichopedia',
    name: 'Bichopedia',
    category: 'Juegos Relajantes',
    description: 'Ayuda al gato entomólogo a encontrar la silueta correcta para cada bicho.',
    component: Bichopedia,
    icon: React.createElement('span', { className: 'text-5xl' }, '🦋')
  },
  {
    id: 'memogatos',
    name: 'MemoGatos',
    category: 'Asociación y memoria',
    description: 'Clásico juego de memoria visual con pictogramas de gatos.',
    component: MemoGatos,
    minImagesRequired: 8,
    icon: React.createElement('span', { className: 'text-5xl' }, '🧠')
  },
  {
    id: 'rompecatgramas',
    name: 'Rompecatgramas',
    category: 'Aprendizaje y lógica',
    description: 'Puzzles formados por trozos de un pictograma de gato.',
    component: Rompecatgramas,
    minImagesRequired: 1,
    icon: React.createElement('span', { className: 'text-5xl' }, '🧩')
  },
  {
    id: 'gato-naves',
    name: 'Gato-Naves',
    category: 'Mini-juegos más dinámicos',
    description: '¡Defiende la galaxia de los ratones espaciales en este arcade clásico!',
    component: AtrapaPictos,
    minImagesRequired: 1,
    icon: React.createElement('span', { className: 'text-5xl' }, '🚀')
  },
];