export default class StartScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StartScene' });
  }

  preload() {
    this.load.image('background', 'assets/backgroundInicio.png');
    this.load.image('particle', 'assets/particulas.png');
    this.load.image('logo', 'assets/logo.png');
    this.load.image('btnIniciar', 'assets/btn_iniciar.png');
    this.load.image('btnInstrucoes', 'assets/btn_instrucoes.png');
    this.load.image('btnCreditos', 'assets/btn_creditos.png');
  }

  create() {
    this.add.image(400, 300, 'background')
      .setOrigin(0.5)
      .setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

    this.add.image(400, 140, 'logo')
      .setOrigin(0.5)
      .setScale(0.21);

    const particles = this.add.particles('particle');
    particles.createEmitter({
      x: { min: 0, max: 800 },
      y: { min: 0, max: 600 },
      lifespan: 3500,
      speedY: { min: 20, max: 70 },
      scale: { start: 0.02, end: 0 },
      quantity: 1,
      blendMode: 'ADD'
    });

    const posX = 400;
    const posY = 320;          
    const espacamento = 95;
    const escala = 0.2;

    this.createButton(posX, posY, 'btnIniciar', escala, () => this.scene.start('CenaIntro'));
    this.createButton(posX, posY + espacamento, 'btnInstrucoes', escala, () => this.scene.start('InstructionsScene'));
    this.createButton(posX, posY + espacamento * 2, 'btnCreditos', escala, () => this.scene.start('CreditsScene'));
  }

  createButton(x, y, key, scale, callback) {
    const btn = this.add.image(x, y, key)
      .setOrigin(0.5)
      .setScale(scale)
      .setInteractive();

    btn.on('pointerover', () => btn.setScale(scale + 0.02));
    btn.on('pointerout', () => btn.setScale(scale));
    btn.on('pointerdown', callback);
  }
}
