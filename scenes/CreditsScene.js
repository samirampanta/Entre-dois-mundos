export default class CreditsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CreditsScene' });
  }

  create() {
    // dimensões da câmera
    const { width, height } = this.cameras.main;
    const boxWidth  = width  * 0.975;
    const boxHeight = height * 0.93;
    const centerX   = width  / 2;
    const centerY   = height / 2;

    // caixa preta com borda branca
    this.add
      .rectangle(centerX, centerY, boxWidth, boxHeight, 0x000000, 1)
      .setStrokeStyle(2, 0xffffff);

    // título centralizado no topo da caixa
    this.add
      .text(centerX, centerY - boxHeight / 2 + 40, 'CRÉDITOS', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // linhas de crédito centralizadas
    const credits = [
      'Desenvolvido por:',
      'Gustavo, Samira, Vinicius e José',
      '',
      'Agradecimentos especiais:',
      'Família, amigos e todos que apoiaram esta jornada.'
    ];

    this.add
      .text(centerX, centerY, credits.join('\n'), {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        align: 'center',
        lineSpacing: 6,
        wordWrap: { width: boxWidth - 60 }
      })
      .setOrigin(0.5);

    // aviso ESC centralizado no rodapé da caixa
    this.add
      .text(
        centerX,
        centerY + boxHeight / 2 - 30,
        'Pressione ESC para retornar ao menu principal.',
        {
          fontSize: '18px',
          fill: '#ffffff',
          fontFamily: 'Arial',
          align: 'center'
        }
      )
      .setOrigin(0.5);

    // volta ao menu com ESC
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('StartScene');
    });
  }
}
