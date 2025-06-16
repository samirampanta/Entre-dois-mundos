export default class InstructionsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InstructionsScene' });
  }

  create() {
    this.add.rectangle(400, 300, 780, 560, 0x000000, 0.7).setStrokeStyle(2, 0xffffff);
    
    this.add.text(400, 100, 'INSTRUÇÕES', {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const texto = `
- Use as teclas W, A, D ou setas para mover Eron.
- Pressione BARRA DE ESPAÇO para pular (pulo duplo disponível).
- ENTER para atacar inimigos.
- O objetivo é resgatar Lira e sobreviver aos perigos.
- Colete corações para recuperar vida.

Pressione ESC para voltar ao menu.
    `;

    this.add.text(100, 160, texto, {
      fontSize: '18px',
      fill: '#ffffff',
      fontFamily: 'Arial',
      wordWrap: { width: 600 }
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('StartScene');
    });
  }
}
