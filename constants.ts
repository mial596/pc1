import { Phrase } from './types';

export const INITIAL_COINS = 500;
export const ENVELOPE_COST = 100;
export const IMAGES_PER_ENVELOPE = 3;

export const LOGO_URL = "https://i.postimg.cc/N0GhZgVV/Gemini-Generated-Image-vrmc6jvrmc6jvrmc.png";
// A friendly cat face for when no image is selected
export const DEFAULT_PIC_URL = "https://i.postimg.cc/RVKENgL2/default-cat.png";

export const INITIAL_PHRASES: Phrase[] = [
  { id: 'yes', text: 'Sí', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false, folderId: null },
  { id: 'no', text: 'No', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false, folderId: null },
  { id: 'happy', text: 'Me siento feliz', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false, folderId: null },
  { id: 'sad', text: 'Me siento triste', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false, folderId: null },
  { id: 'help', text: 'Necesito ayuda', selectedImageId: null, isCustom: false, visibility: 'private', isArchived: false, folderId: null }
];