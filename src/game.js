/**
 * Configuración global del juego que define:
 * - Resolución base
 * - Umbrales y constantes de juego
 * - Configuración de niveles
 * @type {Object}
 */
const gameConfig = {
  originalWidth: 1366,
  originalHeight: 768,
  damageThreshold: 700, // Tiempo en ms para daño por contacto prolongado
  playerSpeed: 200,     // Velocidad normal del jugador
  diagonalSpeed: 180,   // Velocidad reducida en movimiento diagonal
  totalLevels: 3,
  levels: {
    1: { trashCount: 10, nextLevel: 2, backgrounds: ['fondo1a', 'fondo1b', 'fondo1c'] },
    2: { trashCount: 15, nextLevel: 3, backgrounds: ['fondo2a', 'fondo2b', 'fondo2c'] },
    3: { trashCount: 20, nextLevel: null, backgrounds: ['fondo3a', 'fondo3b', 'fondo3c'] }
  }
};

/**
 * Estado global del juego que mantiene:
 * - Referencias a objetos del juego
 * - Variables de estado
 * - Progreso del jugador
 * @type {Object}
 */
const gameState = {
  player: null,
  trashItems: [],
  trashCollected: 0,
  trashCounterText: null,
  levelCounterText: null,
  restartButton: null,
  gameOver: false,
  cursors: null,
  currentLevel: 1,
  lives: 3,
  enemies: [],
  isInvulnerable: false,
  invulnerabilityTime: 1000,
  isPaused: false
};

/**
 * Configuración inicial del motor Phaser
 */
const config = {
  type: Phaser.WEBGL,
  width: gameConfig.originalWidth,
  height: gameConfig.originalHeight,
  parent: "game-container",
  physics: {
    default: 'arcade',
    arcade: { 
      gravity: { y: 0 },
      debug: true
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MenuScene, Level1Scene, Level2Scene, Level3Scene]
};

const game = new Phaser.Game(config);

/**
 * 🔥 ACTUALIZADO — Nivel 3 ya NO termina por basura
 */
function collectTrash(player, trash) {
  if (gameState.gameOver || gameState.isPaused) return;

  trash.disableBody(true, true);
  gameState.trashCollected++;
  gameState.trashCounterText.setText(`Basura recogida: ${gameState.trashCollected}`);

  // Actualizar fondo si no es nivel 3
  this.updateBackground();

  // 🔥 SOLO NIVELES 1 Y 2 TERMINAN POR BASURA
  if (gameState.currentLevel !== 3) {
    if (gameState.trashCollected === gameState.trashItems.length) {
      this.freezeGameObjects();
      completeLevel.call(this);
    }
  }
}

/**
 * Maneja completar un nivel
 */
function completeLevel() {
  gameState.gameOver = true;

  const victoryMessage = this.add.text(
    game.scale.width / 2,
    game.scale.height / 2 - 50,
    gameState.currentLevel < 3 ?
      '¡Felicidades!\nCompletaste el nivel' :
      '¡Felicidades!\nCompletaste el juego',
    {
      font: '48px Arial',
      fill: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }
  ).setOrigin(0.5);

  // Avanzar al siguiente nivel
  if (gameState.currentLevel < 3) {
    this.time.delayedCall(3000, () => {
      if (gameState.player && gameState.player.body) {
        gameState.player.body.enable = true;
      }
      gameState.lives = 3;
      gameState.currentLevel++;
      this.scene.start(`Level${gameState.currentLevel}Scene`);
    });
  } 
  else {
    showRestartButton.call(this);
  }
}

/**
 * Muestra botón de reinicio al completar el juego
 */
function showRestartButton() {
  gameState.restartButton = this.add.text(
    game.scale.width / 2,
    game.scale.height / 1.5,
    'Reintentar',
    {
      font: '32px Arial',
      fill: '#ffffff',
      backgroundColor: '#ff3333',
      padding: { x: 20, y: 10 }
    }
  ).setOrigin(0.5)
  .setInteractive()
  .on('pointerdown', () => location.reload());
}

/**
 * Ajusta elementos al redimensionar pantalla
 */
function scaleAndReposition(scene) {

  // Fondo único del nivel 3
  if (scene.levelNumber === 3) {
    if (scene.background) {
      scene.background.setScale(
        game.scale.width / scene.background.width,
        game.scale.height / scene.background.height
      );
    }
    return;
  }

  // Niveles 1 y 2
  const newScaleX = game.scale.width / scene.backgrounds[0].width;
  const newScaleY = game.scale.height / scene.backgrounds[0].height;

  scene.backgrounds.forEach(bg => {
    bg.setScale(newScaleX, newScaleY);
  });

  gameState.player.setPosition(
    (100 / gameConfig.originalWidth) * game.scale.width,
    (560 / gameConfig.originalHeight) * game.scale.height
  );

  gameState.trashItems.forEach((trash) => {
    trash.setPosition(
      Phaser.Math.Between(100, game.scale.width - 100),
      Phaser.Math.Between(100, game.scale.height - 100)
    );
  });
}
