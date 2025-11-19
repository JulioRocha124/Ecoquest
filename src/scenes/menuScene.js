/**
 * Escena del menú principal del juego
 * @extends Phaser.Scene
 */
class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' }); // Identificador único para la escena
  }

  /**
   * Precarga los assets necesarios para el menú:
   * - Fondo
   * - Logo del juego
   */
  preload() {
  this.load.image('background', '../src/assets/fondo.png');
  this.load.image('logo', '../src/assets/logo.png');
}

  /**
   * Crea los elementos visuales del menú:
   * - Fondo escalable
   * - Logo
   * - Botones de inicio y salida
   */
  create() {
    // Configurar fondo responsivo
    const background = this.add.image(0, 0, 'background').setOrigin(0, 0);
    background.setScale(
      game.scale.width / background.width,
      game.scale.height / background.height
    );

    // Logo centrado
    const logo = this.add.image(
      game.scale.width / 2, 
      game.scale.height / 3.5, 
      'logo'
    );

    // Botón de inicio (verde)
    const startButton = this.createButton(
      game.scale.width / 2, 
      game.scale.height / 1.9, 
      'Iniciar Juego', 
      '#74ff33', 
      () => {
        gameState.currentLevel = 1;
        this.scene.start('Level1Scene');
      }
    );

    // Botón de salida (rojo)
    const exitButton = this.createButton(
      game.scale.width / 2, 
      game.scale.height / 2 + 100, 
      'Salir', 
      '#Ff0000', 
      () => window.close()
    );

    // Manejador de redimensión de pantalla
    window.addEventListener('resize', () => {
      background.setScale(
        game.scale.width / background.width,
        game.scale.height / background.height
      );
      logo.setPosition(game.scale.width / 2, game.scale.height / 4);
      startButton.setPosition(game.scale.width / 2, game.scale.height / 2);
      exitButton.setPosition(game.scale.width / 2, game.scale.height / 2 + 100);
    });
  }

  /**
   * Crea un botón interactivo con efectos visuales
   * @param {number} x - Posición horizontal
   * @param {number} y - Posición vertical
   * @param {string} text - Texto del botón
   * @param {string} bgColor - Color de fondo en hexadecimal
   * @param {function} callback - Función a ejecutar al hacer clic
   * @returns {Phaser.GameObjects.Text} El objeto de texto del botón creado
   */
  createButton(x, y, text, bgColor, callback) {
    const button = this.add.text(x, y, text, {
      font: '32px Arial',
      fill: '#ffffff',
      backgroundColor: bgColor,
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive()
    // Efecto hover
    .on('pointerover', () => {
      button.setScale(1.05);
      this.tweens.add({
        targets: button,
        scale: { from: 1.05, to: 1.08 },
        duration: 200,
        yoyo: true,
        repeat: -1
      });
    })
    // Efecto al salir del hover
    .on('pointerout', () => {
      button.setScale(1);
      this.tweens.killTweensOf(button);
    })
    // Efecto al hacer clic
    .on('pointerdown', () => {
      this.tweens.add({
        targets: button,
        scale: 0.95,
        duration: 100,
        yoyo: true
      });
      callback();
    });
    
    return button;
  }
}