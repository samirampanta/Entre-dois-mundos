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
    // Pega as dimensões da câmera para posicionamento relativo
    const { width, height } = this.cameras.main;

    // Fundo ocupa a tela toda
    this.add.image(width / 2, height / 2, 'background')
      .setOrigin(0.5)
      .setDisplaySize(width, height);

    // Logo posicionado no topo da tela
    this.add.image(width / 2, height * 0.25, 'logo')
      .setOrigin(0.5)
      .setScale(0.25);

    // Partículas ocupam toda a área da tela
    const particles = this.add.particles('particle');
    particles.createEmitter({
      x: { min: 0, max: width },
      y: { min: 0, max: height },
      lifespan: 3500,
      speedY: { min: 20, max: 70 },
      scale: { start: 0.02, end: 0 },
      quantity: 1,
      blendMode: 'ADD'
    });

    // Posições e espaçamento relativos para os botões
    const buttonCenterY = height * 0.50;
    const espacamento = 150;
    const escala = 0.3;

    this.createButton(width / 2, buttonCenterY, 'btnIniciar', escala, () => this.scene.start('CenaIntro'));
    this.createButton(width / 2, buttonCenterY + espacamento, 'btnInstrucoes', escala, () => this.scene.start('InstructionsScene'));
    this.createButton(width / 2, buttonCenterY + espacamento * 2, 'btnCreditos', escala, () => this.scene.start('CreditsScene'));
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