class BaseLevelScene extends Phaser.Scene {
  constructor(key, levelNumber) {
    super({ key });
    this.levelNumber = levelNumber;
    this.contactTimers = new Map();
    this.damageThreshold = gameConfig.damageThreshold;
    this.cheatBuffer = "";
    this.cheatActive = false;
    this.shieldSprite = null;
  }

  preload() {
    this.load.image('fondo1a', '../src/assets/fondos/N1a.jpg');
    this.load.image('fondo1b', '../src/assets/fondos/N1b.jpg');
    this.load.image('fondo1c', '../src/assets/fondos/N1c.jpg');

    this.load.image('fondo2a', '../src/assets/fondos/N2a.jpg');
    this.load.image('fondo2b', '../src/assets/fondos/N2b.jpg');
    this.load.image('fondo2c', '../src/assets/fondos/N2c.jpg');
    
    this.load.image('fondo3', '../src/assets/fondos/N3a.jpg');

    this.load.image('player', '../src/assets/jugador.png');
    this.load.image('trash', '../src/assets/basura.png');
    this.load.image('Cplayer', '../src/assets/Cusuario.png');
    this.load.image('Cenemy', '../src/assets/Cenemigo.png');
    this.load.image('enemy', '../src/assets/Enemy.png');
    this.load.image('power', '../src/assets/Powerup.png');
  }

  create() {
    gameState.enemies.forEach(e => e.destroy());
    gameState.enemies = [];

    this.resetGameState();
    this.setupBackground();
    this.createPlayer();
    this.createTrashItems(gameConfig.levels[this.levelNumber].trashCount);
    this.createEnemies();
    this.setupControls();
    this.createCounters();
    this.createLivesHUD();
    this.setupResizeHandler();
    this.createPauseMenu();
    this.setupPauseKey();
    this.setupHiddenPauseKey();


    if (this.levelNumber !== 3) this.updateBackground();

    if (Phaser.Math.Between(0, 100) > 70) this.createPowerUp();

    this.physics.add.overlap(gameState.player, gameState.enemies, this.startContactTimer, null, this);
    this.physics.add.overlap(gameState.player, gameState.trashItems, collectTrash, null, this);

// --- cheat-code handler: manejo robusto por escena ---
if (!this.__cheatHandlerAdded) {
  // Guardamos el buffer en la escena (no en global) para evitar interferencia
  this.cheatBuffer = "";
  this.__cheatHandler = (event) => this._handleCheatKey(event);
  this.input.keyboard.on('keydown', this.__cheatHandler);
  this.__cheatHandlerAdded = true;

  // Limpiar el listener al salir de la escena para evitar duplicados
  this.events.on('shutdown', () => {
    if (this.__cheatHandler) {
      this.input.keyboard.off('keydown', this.__cheatHandler);
      this.__cheatHandler = null;
      this.__cheatHandlerAdded = false;
    }
  }, this);
}

  }

  mostrarMensaje(texto) {
  const msg = this.add.text(
    this.cameras.main.centerX,
    this.cameras.main.centerY - 200,
    texto,
    {
      font: "32px Arial",
      fill: "#00ff00",
      backgroundColor: "#000000",
      padding: { x: 20, y: 10 },
      stroke: "#ffffff",
      strokeThickness: 3
    }
  ).setOrigin(0.5).setDepth(9999);

  // Animación suave
  this.tweens.add({
    targets: msg,
    alpha: { from: 1, to: 0 },
    duration: 1500,
    ease: "Sine.easeIn",
    onComplete: () => msg.destroy()
  });
}


  resetGameState() {
    gameState.trashCollected = 0;
    gameState.gameOver = false;
    gameState.trashItems = [];
    gameState.currentLevel = this.levelNumber;

    if (typeof gameState.lives === 'undefined' || gameState.lives === null)
      gameState.lives = 3;

    gameState.isInvulnerable = false;
    if (this.shieldSprite) this.shieldSprite.destroy();
  }

  createPauseMenu() {
    // Contenedor centrado correctamente
    this.pauseMenu = this.add.container(
      this.cameras.main.centerX,
      this.cameras.main.centerY
    );
    this.pauseMenu.setDepth(9999);
    this.pauseMenu.setVisible(false);

    // Fondo oscuro
    const overlay = this.add.rectangle(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000,
      0.55
    ).setOrigin(0.5);

    // Panel
    const panel = this.add.rectangle(
      0, 0,
      480, 380,
      0x1d1d1d,
      0.95
    ).setOrigin(0.5);
    panel.setStrokeStyle(4, 0xffffff, 0.25);

    // Título
    const title = this.add.text(
      0, -130,
      'PAUSA',
      {
        fontFamily: 'Arial',
        fontSize: '64px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5);

    // Función botón
    const makeButton = (label, yPos, callback) => {
      const btn = this.add.container(0, yPos);
      
      const bg = this.add.rectangle(0, 0, 260, 60, 0x2e2e2e, 0.9).setOrigin(0.5);
      bg.setStrokeStyle(3, 0xffffff, 0.2);

      const txt = this.add.text(
        0, 0,
        label,
        { fontSize: '32px', fontFamily: 'Arial', color: '#ffffff' }
      ).setOrigin(0.5);

      btn.add([bg, txt]);
      btn.setSize(260, 60);

      btn.setInteractive(
        new Phaser.Geom.Rectangle(-130, -30, 260, 60),
        Phaser.Geom.Rectangle.Contains
      );

      btn.on('pointerover', () => this.tweens.add({
        targets: btn,
        scale: 1.07,
        duration: 150
      }));

      btn.on('pointerout', () => this.tweens.add({
        targets: btn,
        scale: 1,
        duration: 150
      }));

      btn.on('pointerdown', () => {
        this.tweens.add({ targets: btn, scale: 0.92, yoyo: true, duration: 120 });
        callback();
      });

      return btn;
    };

    const btnContinue = makeButton("Continuar", 0, () => this.togglePause());
    const btnMenu = makeButton("Menú Principal", 90, () => {
      this.scene.stop();
      this.scene.start('MenuScene');
    });

    // Añadir todo al contenedor principal
    this.pauseMenu.add([overlay, panel, title, btnContinue, btnMenu]);

    // Animaciones
    this.pauseMenu.open = () => {
      this.pauseMenu.setVisible(true);
      this.pauseMenu.alpha = 0;
      this.tweens.add({
        targets: this.pauseMenu,
        alpha: 1,
        duration: 150
      });
    };

    this.pauseMenu.close = () => {
      this.tweens.add({
        targets: this.pauseMenu,
        alpha: 0,
        duration: 150,
        onComplete: () => this.pauseMenu.setVisible(false)
      });
    };
  }

  setupHiddenPauseKey() {
  this.hiddenPauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

  this.hiddenPauseKey.on('down', () => {
    if (!gameState.gameOver) {
      this.toggleHiddenPause();
    }
  });
  }

  toggleHiddenPause() {
    // Otra bandera de pausa independiente
    gameState.hiddenPaused = !gameState.hiddenPaused;

    if (gameState.hiddenPaused) {
      console.log("🔒 PAUSA OCULTA Activada");

      // Pausar físicas, tiempo y tu lógica
      this.physics.pause();
      this.time.paused = true;

      // No tocar tweens del UI, para no romper nada
      // Tampoco mostramos menú
    } else {
      console.log("🔓 PAUSA OCULTA Desactivada");

      this.physics.resume();
      this.time.paused = false;
    }
  }

  setupPauseKey() {
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.input.keyboard.on('keydown-ESC', (event) => {
      // Solo activar si no está repetida
      if (!event.repeat && !gameState.gameOver) {
        this.togglePause();
      }
    });
  }

  togglePause() {
    if (gameState.gameOver) return;

    gameState.isPaused = !gameState.isPaused;

    if (gameState.isPaused) {

      // 🚫 NO apagar tweens — dejan de funcionar los menús
      // this.tweens.pauseAll();  <-- QUITA ESTO PARA SIEMPRE

      // ✔ Pausar física del juego
      this.physics.pause();

      // ✔ Pausar eventos del tiempo (boss, ataques, etc.)
      this.time.paused = true;

      // ✔ Mostrar menú sin riesgo
      this.pauseMenu.open();

    } else {

      this.physics.resume();
      this.time.paused = false;

      // 🚫 NO reanudar tweens — el UI nunca se pausó
      // this.tweens.resumeAll(); <-- QUITALO

      this.pauseMenu.close();
    }
  }

  setupBackground() {
    if (this.levelNumber === 3) {
      this.background = this.add.image(0, 0, 'fondo3').setOrigin(0, 0);
      this.background.setScale(
        game.scale.width / this.background.width,
        game.scale.height / this.background.height
      );
      return;
    }

    const bgKeys = gameConfig.levels[this.levelNumber].backgrounds;
    this.backgrounds = bgKeys.map(key => this.add.image(0, 0, key).setOrigin(0, 0).setVisible(false));

    this.backgrounds.forEach(bg => bg.setScale(
      game.scale.width / bg.width,
      game.scale.height / bg.height
    ));

    this.backgrounds[0].setVisible(true);
    this.currentBackground = 0;
  }

  updateBackground() {
    if (this.levelNumber === 3) return;

    const pct = gameState.trashCollected / gameConfig.levels[this.levelNumber].trashCount;

    if (pct > 0.5 && this.currentBackground === 0) {
      this.backgrounds[0].setVisible(false);
      this.backgrounds[1].setVisible(true);
      this.currentBackground = 1;
      this.cameras.main.flash(500, 200, 230, 200);
    }

    else if (pct > 0.9 && this.currentBackground === 1) {
      this.backgrounds[1].setVisible(false);
      this.backgrounds[2].setVisible(true);
      this.currentBackground = 2;
      this.cameras.main.flash(500, 100, 255, 100);
    }
  }

  createPlayer() {
    gameState.player = this.physics.add.sprite(
      (100 / gameConfig.originalWidth) * game.scale.width,
      (560 / gameConfig.originalHeight) * game.scale.height,
      'player'
    ).setScale((game.scale.width / gameConfig.originalWidth) * 0.45);

    gameState.player.setCollideWorldBounds(true);
    gameState.player.body.setSize(200, 350);
    gameState.player.setDepth(10);
  }

  createEnemies() {
    if (this.levelNumber === 3) return;

    const base = 2;
    const extra = gameState.currentLevel - 1;
    const total = base + extra;

    for (let i = 0; i < total; i++) {
      const x = Phaser.Math.Between(100, this.scale.width - 100);
      const y = Phaser.Math.Between(100, this.scale.height - 100);

      const enemy = this.physics.add.sprite(x, y, 'enemy')
        .setScale(0.20).setCollideWorldBounds(true).setBounce(1);

      enemy.setVelocity(
        Phaser.Math.Between(-150, 150),
        Phaser.Math.Between(-150, 150)
      );

      gameState.enemies.push(enemy);
    }
  }

  createPowerUp() {
    const type = Phaser.Math.RND.pick(['shield', 'speed', 'life']);
    const p = this.physics.add.sprite(
      Phaser.Math.Between(100, this.scale.width - 100),
      Phaser.Math.Between(100, this.scale.height - 100),
      'power'
    ).setScale(0.1);

    p.type = type;

    this.physics.add.overlap(gameState.player, p, () => {
      let msg = "";

      if (type === 'shield') {
        gameState.isInvulnerable = true;
        msg = "¡Escudo activado!";
        if (this.shieldSprite) this.shieldSprite.destroy();
        this.shieldSprite = this.add.circle(gameState.player.x, gameState.player.y - 10, 60, 0x1188ff, 0.35);
        this.shieldSprite.setDepth(11);
      }

      if (type === 'speed') {
        gameConfig.playerSpeed += 100;
        this.time.delayedCall(5000, () => gameConfig.playerSpeed -= 100);
        msg = "¡Velocidad activa!";
      }

      if (type === 'life') {
        gameState.lives++;
        this.createLivesHUD();
        msg = "¡Vida extra obtenida!";
      }

      const t = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 150,
        msg, { font: '32px Arial', fill: '#0f0', backgroundColor: '#000', padding: { x: 20, y: 10 } }).setOrigin(0.5);

      this.time.delayedCall(2000, () => t.destroy());

      p.destroy();
    });
  }

  createTrashItems(count) {
    const scale = (game.scale.width / gameConfig.originalWidth) * 0.15;

    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(100, game.scale.width - 100);
      const y = Phaser.Math.Between(100, game.scale.height - 100);

      const trash = this.physics.add.sprite(x, y, 'trash').setScale(scale);
      gameState.trashItems.push(trash);
    }
  }

  setupControls() {
    gameState.cursors = this.input.keyboard.createCursorKeys();
  }

  createLivesHUD() {
    if (gameState.livesContainer) gameState.livesContainer.destroy();

    gameState.livesContainer = this.add.container(640, 30);

    for (let i = 0; i < gameState.lives; i++) {
      const h = this.add.image(60 * i, 0, 'Cplayer').setScale(0.1).setScrollFactor(0);
      gameState.livesContainer.add(h);
    }
  }

  createCounters() {
    gameState.trashCounterText = this.add.text(20, 20, 'Basura recogida: 0', {
      font: '24px Arial', fill: '#fff', backgroundColor: '#000', padding: { x: 10, y: 5 }
    }).setScrollFactor(0);

    gameState.levelCounterText = this.add.text(1130, 20, `Nivel actual: ${this.levelNumber}`, {
      font: '24px Arial', fill: '#fff', backgroundColor: '#000', padding: { x: 10, y: 5 }
    }).setScrollFactor(0);
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => {
      if (this.backgrounds) {
        this.backgrounds.forEach(bg => bg.setScale(
          game.scale.width / bg.width,
          game.scale.height / bg.height
        ));
      }

      if (this.background) {
        this.background.setScale(
          game.scale.width / this.background.width,
          game.scale.height / this.background.height
        );
      }

      scaleAndReposition(this);
    });
  }

  update() {
    if (gameState.gameOver || gameState.isPaused || gameState.hiddenPaused) return;

    if (this.shieldSprite && gameState.player) {
      this.shieldSprite.x = gameState.player.x;
      this.shieldSprite.y = gameState.player.y - 10;
    }

    const now = this.time.now;
    this.contactTimers.forEach((start, enemy) => {
      const dur = now - start;
      if (dur >= this.damageThreshold) {
        this.applyDamage(gameState.player, enemy);
        this.contactTimers.delete(enemy);
      } else if (!this.physics.overlap(gameState.player, enemy)) {
        enemy.clearTint();
        this.contactTimers.delete(enemy);
      }
    });

    gameState.player.setVelocity(0);

    if (gameState.cursors.left.isDown) {
      gameState.player.setVelocityX(-gameConfig.playerSpeed);
      gameState.player.setFlipX(true);
    } else if (gameState.cursors.right.isDown) {
      gameState.player.setVelocityX(gameConfig.playerSpeed);
      gameState.player.setFlipX(false);
    }

    if (gameState.cursors.up.isDown) gameState.player.setVelocityY(-gameConfig.playerSpeed);
    else if (gameState.cursors.down.isDown) gameState.player.setVelocityY(gameConfig.playerSpeed);

    if (gameState.cursors.left.isDown && gameState.cursors.up.isDown) {
      gameState.player.setVelocity(-gameConfig.diagonalSpeed, -gameConfig.diagonalSpeed);
    }
    if (gameState.cursors.right.isDown && gameState.cursors.up.isDown) {
      gameState.player.setVelocity(gameConfig.diagonalSpeed, -gameConfig.diagonalSpeed);
    }
    if (gameState.cursors.left.isDown && gameState.cursors.down.isDown) {
      gameState.player.setVelocity(-gameConfig.diagonalSpeed, gameConfig.diagonalSpeed);
    }
    if (gameState.cursors.right.isDown && gameState.cursors.down.isDown) {
      gameState.player.setVelocity(gameConfig.diagonalSpeed, gameConfig.diagonalSpeed);
    }

    if (gameState.isInvulnerable && !this.shieldSprite) {
      gameState.player.alpha = Math.floor(this.time.now / 100) % 2 === 0 ? 0.5 : 1;
    } else gameState.player.alpha = 1;
  }

  applyDamage(player, enemy) {
    if (gameState.gameOver) return;

    if (gameState.isInvulnerable && this.shieldSprite) {
      this.shieldSprite.destroy();
      this.shieldSprite = null;
      gameState.isInvulnerable = false;
      this.cameras.main.flash(150, 50, 150, 255);
      return;
    }

    if (gameState.isInvulnerable) return;

    gameState.lives--;
    if (gameState.livesContainer && gameState.livesContainer.getAt(gameState.lives))
      gameState.livesContainer.getAt(gameState.lives).setVisible(false);

    this.cameras.main.shake(200, 0.01);
    player.setTint(0xff0000);
    if (enemy) enemy.setTint(0xff0000);

    this.time.delayedCall(200, () => {
      player.clearTint(); if (enemy) enemy.clearTint();
    });

    gameState.isInvulnerable = true;
    this.time.delayedCall(gameState.invulnerabilityTime, () => gameState.isInvulnerable = false);

    if (gameState.lives <= 0) this.gameOver();
  }

  gameOver() {
    gameState.gameOver = true;
    gameState.enemies.forEach(e => e.setVelocity(0));

    const txt = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 50,
      '¡Game Over!', { font: '48px Arial', fill: '#f00', backgroundColor: '#000', padding: { x: 20, y: 10 } }
    ).setOrigin(0.5);

    const retry = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50,
      'Reintentar', { font: '32px Arial', fill: '#fff', backgroundColor: '#f33', padding: { x: 20, y: 10 } })
      .setOrigin(0.5).setInteractive().on('pointerdown', () => {
        this.scene.restart();
        gameState.lives = 3;
      });

    this.tweens.add({ targets: txt, scale: { from: 0.5, to: 1 }, duration: 500, ease: 'Back.out' });
  }

  startContactTimer(player, enemy) {
    if (this.contactTimers.has(enemy)) return;
    this.contactTimers.set(enemy, this.time.now);
    enemy.setTint(0xffaaaa);
  }

  freezeGameObjects() {
    if (gameState.player && gameState.player.body) {
      gameState.player.setVelocity(0);
      gameState.player.body.enable = false;
      gameState.player.setTint(0x00ff00);
    }

    gameState.enemies.forEach(e => {
      if (e && e.body) {
        e.setVelocity(0);
        e.body.enable = false;
      }
    });

    if (this.shieldSprite) this.shieldSprite.destroy();

    gameState.gameOver = true;
  }

    // Maneja la entrada de teclas para el código secreto
  _handleCheatKey(event) {
    // evita interferir cuando el juego está en pausa o terminado
    if (gameState.gameOver || gameState.isPaused) return;

    // concatenar tecla (usar event.key para entradas de texto)
    this.cheatBuffer = (this.cheatBuffer || "") + event.key;

    // limitar buffer a últimos 4 caracteres
    if (this.cheatBuffer.length > 4) {
      this.cheatBuffer = this.cheatBuffer.slice(-4);
    }

    // Si coincide el código secreto, salta nivel
    if (this.cheatBuffer === "2006") {
      console.log("Código secreto: saltar nivel");
      this.cheatBuffer = "";
      this.saltarNivel();
    }
  }

  saltarNivel() {
    // Evita múltiples activaciones
    if (this.cheatActive) return;
    this.cheatActive = true;

    this.mostrarMensaje("🔥 Código secreto activado: Nivel saltado");

    // Pequeña animación/retardo y luego cambio de escena
    this.time.delayedCall(500, () => {
      // Determinar el siguiente nivel
      let next = typeof gameState.currentLevel === 'number' ? gameState.currentLevel + 1 : 2;

      // Si sobrepasa totalLevels, ir a menú
      if (typeof gameConfig.totalLevels === 'number' && next > gameConfig.totalLevels) {
        this.scene.start("MenuScene");
        this.cheatActive = false;
        return;
      }

      // Actualizar estado y iniciar la escena correcta
      gameState.currentLevel = next;
      console.log(`Saltar a nivel ${next}`);
      this.scene.start("Level" + next + "Scene");

      // permitir volver a usar cheat después de un corto delay
      this.time.delayedCall(500, () => { this.cheatActive = false; });
    });
  }
}