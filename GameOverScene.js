gameState.fragmentosColetados
class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }



     preload() {
    this.load.image('gameover-bg', 'assets/gameover_screen_fixed.png');
    this.load.audio('gameover_music', 'assets/sounds/gameover.mp3');
}

    create() {

 
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width / 2, height / 2, 'gameover-bg')
            .setOrigin(0.5)
            .setDisplaySize(width, height);
            
            
        this.music = this.sound.add('gameover_music', {
         volume: 0.5,
         loop: false
            });
        this.music.play();

    
        this.add.text(width / 2, height / 2 + 40, `Fragmentos coletados:\n${gameState.fragmentosColetados}/${gameState.fragmentosTotal}`, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#f8e9d8',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

      
        const criarBotaoPixelArt = (texto, callback) => {
            const paddingX = 32;
            const paddingY = 20;

            const text = this.add.text(0, 0, texto.toUpperCase(), {
                fontFamily: 'Courier',
                fontSize: '24px',
                fontStyle: 'bold',
                color: '#d0c5aa'
            }).setOrigin(0.5);

            const boxWidth = text.width + paddingX * 2;
            const boxHeight = text.height + paddingY * 2;

            const graphics = this.add.graphics();
            graphics.fillStyle(0x1a1a1a, 1);
            graphics.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
            graphics.lineStyle(4, 0xb79c70, 1);
            graphics.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

            const container = this.add.container(0, 0, [graphics, text])
                .setSize(boxWidth, boxHeight)
                .setInteractive(new Phaser.Geom.Rectangle(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight), Phaser.Geom.Rectangle.Contains)
                .on('pointerover', () => {
                    graphics.clear();
                    graphics.fillStyle(0x2e2e2e, 1);
                    graphics.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
                    graphics.lineStyle(4, 0xffffff, 1);
                    graphics.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
                    text.setColor('#ffffff');
                })
                .on('pointerout', () => {
                    graphics.clear();
                    graphics.fillStyle(0x1a1a1a, 1);
                    graphics.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
                    graphics.lineStyle(4, 0xb79c70, 1);
                    graphics.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
                    text.setColor('#d0c5aa');
                })
                .on('pointerdown', callback);

            return container;
        };

      
        const btnReiniciar = criarBotaoPixelArt('Reiniciar Fase', () => {
            this.music.stop();
    
    gameState.vidas = 3;
   

    if (gameState.mundoAtual) {
    this.scene.start(gameState.mundoAtual);
} else {
    this.scene.start('MundoNormalScene');
}

});


        const btnMenu = criarBotaoPixelArt('Menu Principal', () => {
            this.music.stop();
            this.scene.start('StartScene');
        });

        
        const botoesContainer = this.add.container(width / 2, height / 2 + 130);
        const spacing = 40;

        btnReiniciar.x = -btnReiniciar.width / 2 - spacing / 2;
        btnMenu.x = btnMenu.width / 2 + spacing / 2;

        botoesContainer.add([btnReiniciar, btnMenu]);
    }
}

export default GameOverScene;

