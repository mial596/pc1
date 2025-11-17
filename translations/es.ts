export const es = {
  // General
  loadingCats: 'Cargando tus gatos...',
  errorLoadData: 'Error al cargar tus datos. Por favor, refresca la página.',
  errorSaveChanges: 'Error al guardar los cambios.',
  errorProfileLoad: 'El perfil de usuario no se pudo cargar.',
  coins: 'monedas',
  
  // Auth
  authMessage: 'Un comunicador visual divertido donde coleccionas gatos y juegas para desbloquear más.',
  authButton: '¡Empezar a Jugar!',
  authDisclaimer: 'Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.',

  // Header & Nav
  navHome: 'Tablero',
  navAlbum: 'Álbum',
  navShop: 'Tienda',
  navGames: 'Juegos',
  navCommunity: 'Amigos',
  editProfile: 'Editar Perfil',
  redeemCode: 'Canjear Código',
  history: 'Historial',
  logout: 'Cerrar Sesión',

  // Home Page
  myDashboard: 'Mi Tablero',
  manageFolders: 'Gestionar Carpetas',
  createNewPhrase: 'Crear Nueva Frase',
  main: 'Principal',
  archived: 'Archivadas',
  emptyFolder: 'Esta carpeta está vacía.',
  emptyFolderHint: '¡Añade algunas frases o desarchívalas!',
  unarchive: 'Desarchivar',
  archive: 'Archivar',
  
  // Phrase Card
  speakPhrase: 'Decir frase: {{phraseText}}',
  changeImageFor: 'Cambiar imagen para {{phraseText}}',

  // Album Page
  albumTitle: 'Álbum de Gatos',
  albumSubtitle: '¡Aquí está tu colección de amigos felinos!',
  collectionProgress: 'Progreso de Colección',
  albumEmpty: 'El álbum está vacío.',
  albumEmptyHint: '¡Compra sobres en la tienda para empezar tu colección!',

  // Shop Page
  shopTitle: 'Tienda Miau-rabilia',
  shopSubtitle: '¡Gasta tus monedas para ampliar tu colección!',
  featured: 'Destacados',
  envelopes: 'Sobres',
  catPass: 'Pase Gatuno',
  roulette: 'Ruleta',
  expired: 'Expirado',
  owned: '¡Adquirido!',
  bronze: 'Sobre de Bronce',
  bronzeDescription: 'Una selección básica de gatos comunes.',
  silver: 'Sobre de Plata',
  silverDescription: 'Mayor probabilidad de encontrar gatos raros.',
  gold: 'Sobre de Oro',
  goldDescription: '¡Garantiza al menos un gato raro o épico!',
  containsCats: 'Contiene {{count}} gatos',
  completed: '¡Completado!',
  remainingToUnlock: 'Quedan {{count}} por desbloquear',

  // Games Page
  gameRoomTitle: 'Sala de Juegos',
  gameRoomSubtitle: '¡Gana monedas y XP para ampliar tu colección de gatos!',
  'Asociación y memoria': 'Asociación y memoria',
  'Creatividad y expresión': 'Creatividad y expresión',
  'Sonidos y reconocimiento': 'Sonidos y reconocimiento',
  'Aprendizaje y lógica': 'Aprendizaje y lógica',
  'Mini-juegos más dinámicos': 'Mini-juegos más dinámicos',
  'Juegos Relajantes': 'Juegos Relajantes',
  requiresCats: 'Necesitas {{count}} gatos',
  gameFinished: '¡Juego Terminado!',
  yourScoreWas: 'Tu puntuación fue:',
  playAgain: 'Jugar de Nuevo',
  exit: 'Salir',
  backToGameRoom: 'Volver a la Sala de Juegos',
  
  // Game Names & Descriptions
  pescagato: 'Pesca-Gato',
  pescagatoDescription: 'Relájate y pesca algunas criaturas marinas para ganar monedas.',
  bichopedia: 'Bichopedia',
  bichopediaDescription: 'Ayuda al gato entomólogo a encontrar la silueta correcta para cada bicho.',
  memogatos: 'MemoGatos',
  memogatosDescription: 'Clásico juego de memoria visual con pictogramas de gatos.',
  rompecatgramas: 'Rompecatgramas',
  rompecatgramasDescription: 'Puzzles formados por trozos de un pictograma de gato.',
  'gato-naves': 'Gato-Naves',
  'gato-navesDescription': '¡Defiende la galaxia de los ratones espaciales en este arcade clásico!',

  // Special Abilities & Bonuses
  notEnoughCoins: '¡No tienes suficientes monedas!',
  errorPurchase: 'Error al realizar la compra.',
  notEnoughFishTokens: '¡No tienes suficientes Fichas de Pescado!',
  catAddedToCollection: '¡Nuevo gato añadido a tu colección!',
  notEnoughFishTokensPass: '¡No tienes suficientes Fichas de Pescado para el pase!',
  premiumPassActivated: '¡Pase Gatuno Premium activado!',
  errorActivatePass: 'Error al activar el pase.',
  errorClaimReward: 'Error al reclamar la recompensa.',
  errorClaimMission: 'Error al reclamar la misión.',
  profileUpdated: '¡Perfil actualizado con éxito!',
  multiplierBonus: '¡Bonus x2! +{{coins}} monedas extra',
  errorSaveGame: 'Error al guardar los resultados del juego.',
  reportSubmitted: 'Reporte enviado. Gracias por tu feedback.',
  errorReport: 'No se pudo enviar el reporte.',
  multiplierActivated: '¡Multiplicador de monedas x2 activado por 10 minutos!',
  missionCompleted: '¡Gato de Misión! Se ha completado una de tus misiones diarias.',
  luckyCatBonusTitle: '¡Gato de la Suerte!',
  luckyCatBonusMessage: 'Has encontrado un bonus de',

  // Rarity
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  
  // Envelope Modal
  envelopeTitle: '¡Has abierto un {{envelopeName}}!',
  envelopeAllRevealed: '¡Nuevos gatos se unen a tu colección!',
  envelopeRevealHint: '¡Toca las cartas para revelarlas!',
  revealAll: 'Revelar Todo',
  share: 'Compartir',
  awesome: '¡Genial!',
  shareImageError: 'No se pudo generar la imagen para compartir. Por favor, inténtalo de nuevo.',
  newCatsUnlocked: '¡Nuevos Gatos Desbloqueados!',

};

export type TranslationEs = typeof es;
