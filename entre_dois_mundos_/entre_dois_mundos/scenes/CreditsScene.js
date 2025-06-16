export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
  }

  create() {
    // Fundo escurecido com borda
    this.add.rectangle(400, 300, 760, 520, 0x000000, 0.7).setStrokeStyle(2, 0xffffff);

    // Título centralizado
    this.add.text(400, 80, 'CRÉDITOS', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Texto dos créditos
    const texto = [
      'Desenvolvido por:',
      'Gustavo, Samira, Vinicius e José',
      '',
      'Agradecimentos especiais:',
      'Família, amigos e todos que apoiaram esta jornada.',
      '',
      'Pressione ESC para retornar ao menu principal.'
    ];

    this.add.text(400, 150, texto.join('\n'), {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      align: 'center'
    }).setOrigin(0.5, 0);

    // ESC para voltar ao menu
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('StartScene');
    });
  }
}
