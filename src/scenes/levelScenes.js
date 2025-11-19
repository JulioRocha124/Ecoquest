// 📌 LevelScenes.js (versión modificada y sincronizada con BaseLevelScene Mod)
// --------------------------------------------------------------
// Esta versión está ajustada para funcionar con:
// - NUEVO BaseLevelScene modificado
// - Eliminación del sistema viejo de fondos para Nivel 3
// - Sistema de jefe independiente
// - Eliminación de transición por basura (Nivel 3 NO usa basura)
// - Carga correcta de escenas
// --------------------------------------------------------------

class Level1Scene extends BaseLevelScene {
  constructor() {
    super("Level1Scene", 1);
  }

  preload() {
    super.preload();
  }

  create() {
    super.create();
  }

  update() {
    super.update();
  }
}

// --------------------------------------------------------------
// NIVEL 2
// --------------------------------------------------------------
class Level2Scene extends BaseLevelScene {
  constructor() {
    super("Level2Scene", 2);
  }

  preload() {
    super.preload();
  }

  create() {
    super.create();
  }

  update() {
    super.update();
  }
}

// --------------------------------------------------------------
// NIVEL 3 – JEFE FINAL CON VIDA, FASES Y BASURA TEMPORIZADA
// --------------------------------------------------------------

class Level3Scene extends BaseLevelScene {
  constructor() {
    super("Level3Scene", 3);

    this.boss = null;
    this.bossHealth = 100;  
    this.maxBossHealth = 100;
    this.phase = 1;

    this.bossTrash = null;
    this.bossAttackSpeed = 220;
    this.trashTimeLimit = 5000;
  }

  preload() {
    super.preload();

    // Sprites del Jefe
    this.load.image("boss_robot", "../src/assets/Robot/boss_robot.png");
    this.load.image("boss_robot_danado", "../src/assets/Robot/boss_robot_danado.png");
    this.load.image("boss_robot_caido", "../src/assets/Robot/boss_robot_caido.png");

    // Ataque y basura
    this.load.image("bossAttack", "../src/assets/Robot/bossAttack.png");
    this.load.image("bossTrash", "../src/assets/basura.png");
  }

  create() {
    console.log("=== Nivel 3 creado ===");

    super.create();

    // Se elimina basura del BaseLevelScene
    gameState.trashItems.forEach(t => t.destroy());
    gameState.trashItems = [];

    gameState.trashCounterText.setText("JEFE FINAL");

    // -----------------------------------
    // CREAR JEFE
    // -----------------------------------
    this.boss = this.physics.add.sprite(
      this.cameras.main.centerX,
      320,
      "boss_robot"
    ).setScale(0.25);

    this.boss.setImmovable(true);
    this.boss.setDepth(10);

    // Colisión jugador-jefe
    this.physics.add.overlap(gameState.player, this.boss, () => {
      this.applyDamage(gameState.player, this.boss);
    });

    // -----------------------------------
    // BARRA DE VIDA DEL JEFE
    //-----------------------------------
    this.bossHealthBarBG = this.add.rectangle(
      this.cameras.main.centerX,
      this.scale.height - 50,
      500,
      25,
      0x222222
    ).setOrigin(0.5);

    this.bossHealthBar = this.add.rectangle(
      this.cameras.main.centerX,
      this.scale.height - 50,
      500,
      25,
      0xff0000
    ).setOrigin(0.5);

    // -----------------------------------
    // ATAQUES REPETIDOS
    // -----------------------------------
    this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.bossAttack(),
    });

    // -----------------------------------
    // BASURA DEL JEFE CADA 5s
    // -----------------------------------
    this.time.addEvent({
      delay: 6000,
      loop: true,
      callback: () => this.spawnBossTrash(),
    });
  }

  // --------------------------------------------------------------
  // ATAQUE DEL JEFE
  // --------------------------------------------------------------
bossAttack() {
  console.log("🔥 Ataque del jefe");

  const atk = this.physics.add.sprite(
    this.boss.x,
    this.boss.y + 80,
    "bossAttack"
  ).setScale(0.15);

  atk.setDepth(5);

  let pursuing = true;  // fase de persecución

  // FASE DE PERSECUCIÓN - seguir al jugador durante 2 segundos
  const pursueInterval = this.time.addEvent({
    delay: 50,         // actualizar dirección cada 50ms
    loop: true,
    callback: () => {
      if (!pursuing || !atk.active) return;

      // vector hacia el jugador
      const dx = gameState.player.x - atk.x;
      const dy = gameState.player.y - atk.y;

      const len = Math.sqrt(dx * dx + dy * dy);
      const speed = this.bossAttackSpeed;

      atk.setVelocity((dx / len) * speed, (dy / len) * speed);
    }
  });

  // Después de 2 segundos → dejar de seguir
  this.time.delayedCall(1500, () => {
    pursuing = false;

    // deja la última velocidad (sigue recto)
    pursueInterval.remove();
  });

  // Colisión con jugador
  this.physics.add.overlap(gameState.player, atk, () => {
    atk.destroy();
    this.applyDamage(gameState.player);
  });

  // Auto-destruir al salir del mundo
  atk.setCollideWorldBounds(true);
  atk.body.onWorldBounds = true;
  atk.body.world.on("worldbounds", (body) => {
    if (body.gameObject === atk) atk.destroy();
  });
}


  // --------------------------------------------------------------
  // BASURA QUE EL JEFE GENERA
  // --------------------------------------------------------------
  spawnBossTrash() {
    if (!this.boss.active) return;

    console.log("Basura del jefe generada");

    const x = Phaser.Math.Between(120, this.scale.width - 120);
    const y = Phaser.Math.Between(200, this.scale.height - 120);

    const trash = this.physics.add.sprite(x, y, "bossTrash")
      .setScale(0.22);

    trash.setCircle(300);
    trash.setOffset(30, 30);

    // Jugador recoge → daña al jefe
    this.physics.add.overlap(gameState.player, trash, () => {
      trash.destroy();
      this.damageBoss(10); // 10% por basura
    });

    // Si NO la recoge → jefe se cura
    this.time.delayedCall(this.trashTimeLimit, () => {
      if (trash.active) {
        trash.destroy();
        this.failBossTrash();
      }
    });
  }

  // --------------------------------------------------------------
  // Si el jugador NO recoge la basura
  // --------------------------------------------------------------
  failBossTrash() {
    console.log("⚠ Basura fallida → El jefe se cura");

    this.bossHealth = Math.min(this.bossHealth + 10, this.maxBossHealth);
    this.updateBossHealthBar();

    // Efecto visual
    this.cameras.main.flash(100, 0, 255, 0);
  }

  // --------------------------------------------------------------
  // DAÑO AL JEFE
  // --------------------------------------------------------------
  damageBoss(amount) {
    this.bossHealth -= amount;
    console.log("💥 Jefe recibió daño:", this.bossHealth);

    this.updateBossHealthBar();
    this.updateBossPhase();

    if (this.bossHealth <= 0) {
      this.bossDefeated();
    }
  }

  // --------------------------------------------------------------
  // ACTUALIZA BARRA DE VIDA
  // --------------------------------------------------------------
  updateBossHealthBar() {
    const pct = this.bossHealth / this.maxBossHealth;
    this.bossHealthBar.width = 500 * pct;
  }

  // --------------------------------------------------------------
  // FASES DEL JEFE
  // --------------------------------------------------------------
  updateBossPhase() {
    const pct = this.bossHealth / this.maxBossHealth;

    if (pct <= 0.66 && this.phase === 1) {
      this.phase = 2;
      this.boss.setTexture("boss_robot_danado");
      this.bossAttackSpeed = 300;
      console.log("⚠ FASE 2: ATAQUES MÁS RÁPIDOS");
    }

    if (pct <= 0.33 && this.phase === 2) {
      this.phase = 3;
      this.boss.setTexture("boss_robot_caido");
      this.bossAttackSpeed = 420;
      console.log("🔥 FASE 3: ATAQUES MUY RÁPIDOS");
    }
  }

  // --------------------------------------------------------------
  // JEFE DERROTADO
  // --------------------------------------------------------------
  bossDefeated() {
    console.log("🏆 Jefe derrotado");

    this.boss.destroy();
    this.freezeGameObjects();

    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      "¡Has derrotado al jefe!",
      {
        font: "48px Arial",
        fill: "#00ff00",
        backgroundColor: "#000000",
        padding: { x: 15, y: 10 }
      }
    ).setOrigin(0.5);

    this.time.delayedCall(4000, () => {
      this.scene.start("MenuScene");
    });
  }

  update() {
    super.update();
  }
}



// --------------------------------------------------------------
// EXPORTACIÓN GLOBAL (si tu bundler lo requiere)
// --------------------------------------------------------------
window.Level1Scene = Level1Scene;
window.Level2Scene = Level2Scene;
window.Level3Scene = Level3Scene;
