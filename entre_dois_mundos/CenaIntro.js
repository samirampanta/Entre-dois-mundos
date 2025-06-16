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
        // Pega as dimensões da câmera para posicionamento relativo
        const { width, height } = this.cameras.main;

        // Fundo ocupa a tela toda
        this.add.image(width / 2, height / 2, 'bg')
            .setOrigin(0.5)
            .setDisplaySize(width, height);

        // Personagens posicionados de forma relativa
        this.spriteEron = this.add.image(width * 0.25, height * 0.8, 'eron1')
            .setOrigin(0.5, 1) // Alinhado pela base
            .setScale(0.5)
            .setVisible(false);

        this.spriteLira = this.add.image(width * 0.75, height * 0.8, 'lira1')
            .setOrigin(0.5, 1) // Alinhado pela base
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

        // Caixa de diálogo com tamanho e posição relativos
        const caixaAltura = 150;
        const caixaLargura = width * 0.9;
        this.caixa = this.add.rectangle(width / 2, height - (caixaAltura / 2) - 20, caixaLargura, caixaAltura, 0x000000, 0.7)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);

        // Posição do texto relativa à caixa de diálogo
        const paddingTexto = 25;
        this.nomePersonagem = this.add.text(this.caixa.x - caixaLargura / 2 + paddingTexto, this.caixa.y - caixaAltura / 2 + paddingTexto - 10, '', {
            font: '20px Arial',
            fill: '#80dfff',
            fontStyle: 'bold'
        });

        this.textoDialogo = this.add.text(this.nomePersonagem.x, this.nomePersonagem.y + 30, '', {
            font: '18px Arial',
            fill: '#ffffff',
            wordWrap: { width: caixaLargura - (paddingTexto * 2) }
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
            this.scene.start('CenaJogo'); // Mudei aqui para uma cena de jogo mais provável
        }
    }
}