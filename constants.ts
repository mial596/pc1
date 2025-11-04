import { Phrase } from './types';

export const INITIAL_COINS = 500;
export const ENVELOPE_COST = 100;
export const IMAGES_PER_ENVELOPE = 3;

export const LOGO_URL = "https://i.postimg.cc/851B2CDZ/unnamed.jpg";
// A friendly cat face for when no image is selected
export const DEFAULT_PIC_URL = "https://i.postimg.cc/RVKENgL2/default-cat.png";

// FIX: Add missing properties 'visibility' and 'isArchived' to each Phrase object to conform to the type definition.
export const INITIAL_PHRASES: Phrase[] = [
  { id: 'yes', text: 'Sí', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'no', text: 'No', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'happy', text: 'Me siento feliz', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'sad', text: 'Me siento triste', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false },
  { id: 'help', text: 'Necesito ayuda', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false }
];