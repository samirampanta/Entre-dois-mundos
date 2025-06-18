export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InstructionsScene' });
  }

  create() {
    // pega dimensões da câmera
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
      .text(centerX, centerY - boxHeight / 2 + 40, 'INSTRUÇÕES', {
        fontSize: '32px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // lista de instruções, centro da caixa
    const instructions = [
      '• Use W, A, D ou setas para mover o Eron.',
      '• Pressione BARRA DE ESPAÇO para pular (duplo pulo disponível).',
      '• ENTER para atacar inimigos.',
      '• Resgate a Lira e sobreviva aos perigos.',
      '• Colete corações para recuperar vida.'
    ];

    this.add
      .text(centerX, centerY, instructions.join('\n'), {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Arial',
        align: 'center',
        lineSpacing: 8,
        wordWrap: { width: boxWidth - 60 }
      })
      .setOrigin(0.5);

    // aviso ESC centralizado no rodapé da caixa
    this.add
      .text(centerX, centerY + boxHeight / 2 - 30, 'Pressione ESC para voltar ao menu.', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Arial'
      })
      .setOrigin(0.5);

    // tecla ESC volta ao menu
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('StartScene');
    });
  }
}
