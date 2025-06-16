export default class CenaIntro extends Phaser.Scene {
    constructor() {
        super({ key: 'CenaIntro' });
    }

    preload() {
        this.load.image('bg', 'assets/00016.png');
        this.load.image('eron1', 'assets/eron_sprite1.png');
        this.load.image('eron2', 'assets/eron_sprite2.png');
        this.load.image('lira1', 'assets/lira_sprite1.png');
        this.load.image('lira2', 'assets/lira_sprite2.png');
    }

    create() {
        this.add.image(0, 0, 'bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

        this.spriteEron = this.add.image(150, 400, 'eron1')
            .setOrigin(0.5)
            .setScale(0.5)
            .setVisible(false);

        this.spriteLira = this.add.image(650, 400, 'lira1')
            .setOrigin(0.5)
            .setScale(0.5)
            .setVisible(false);

        this.dialogos = [
            { nome: 'Lira', texto: 'Viu? Te falei que não seria tão ruim.' },
            { nome: 'Eron', texto: 'Ainda não tenho certeza.' },
            { nome: 'Eron', texto: 'Lira, você está vendo isso? A névoa está mais densa que o normal...' },
            { nome: 'Lira', texto: 'Sim... tem algo errado. A floresta está... observando a gente.' },
            { nome: 'Eron', texto: 'Fique atrás de mim. Estou ouvindo passos...' },
            { nome: 'Narrador', texto: 'Subitamente, criaturas corrompidas emergem das sombras, cercando os dois.' },
            { nome: 'Lira', texto: 'Eron! Atrás de você!' },
            { nome: 'Narrador', texto: 'Um vórtice sombrio se abre no céu. Mãos negras brotam do chão e agarram Lira.' },
            { nome: 'Eron', texto: 'Não! Liraaa!!' },
            { nome: 'Narrador', texto: 'Ela é puxada para dentro de uma torre flutuante, em outro mundo.' },
            { nome: 'Narrador', texto: 'Aquele mundo parece suspenso no tempo. Eron fica sozinho, em silêncio...' },
            { nome: 'Eron', texto: 'Eu vou te encontrar, Lira. Eu juro por tudo.' }
        ];

        this.dialogoAtual = 0;

        this.caixa = this.add.rectangle(400, 500, 750, 150, 0x000000, 0.7)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);

        this.nomePersonagem = this.add.text(70, 430, '', {
            font: '20px Arial',
            fill: '#80dfff',
            fontStyle: 'bold'
        });

        this.textoDialogo = this.add.text(70, 460, '', {
            font: '18px Arial',
            fill: '#ffffff',
            wordWrap: { width: 660 }
        });

        this.input.on('pointerdown', () => {
            this.avancarDialogo();
        });

        this.avancarDialogo();
    }

    avancarDialogo() {
        if (this.dialogoAtual < this.dialogos.length) {
            const fala = this.dialogos[this.dialogoAtual];
            this.nomePersonagem.setText(fala.nome);
            this.textoDialogo.setText(fala.texto);

            this.spriteEron.setVisible(false);
            this.spriteLira.setVisible(false);

            if (fala.nome === 'Eron') {
                if (fala.texto === 'Ainda não tenho certeza.') {
                    this.spriteEron.setTexture('eron2');
                } else {
                    this.spriteEron.setTexture('eron1');
                }
                this.spriteEron.setVisible(true);
            } else if (fala.nome === 'Lira') {
                if (fala.texto === 'Viu? Te falei que não seria tão ruim.') {
                    this.spriteLira.setTexture('lira2');
                } else {
                    this.spriteLira.setTexture('lira1');
                }
                this.spriteLira.setVisible(true);
            }

            this.dialogoAtual++;
        } else {
            this.scene.start('CenaJogo');
        }
    }
}
