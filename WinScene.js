class WinScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WinScene' });
    }

    preload() {
        this.load.image('win-bg', 'assets/vitoria.png'); 
    }

    create() {
        // ===== REDIMENSIONAR CÂMERA PARA TELA CHEIA =====
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Redimensionar o jogo para a tela toda
        this.scale.resize(width, height);
        this.cameras.main.setSize(width, height);

        // ===== BACKGROUND RESPONSIVO =====
        this.add.image(width / 2, height / 2, 'win-bg')
            .setOrigin(0.5)
            .setDisplaySize(width, height);

        // ===== BOTÕES SIMPLES QUE FUNCIONAM =====
        const criarBotaoPixelArt = (texto, callback) => {
            const text = this.add.text(0, 0, texto.toUpperCase(), {
                fontFamily: 'Courier',
                fontSize: '32px',
                fontStyle: 'bold',
                color: '#d0c5aa',
                backgroundColor: '#1a1a1a',
                padding: { x: 50, y: 30 }
            }).setOrigin(0.5);

            // ===== SÓ O TEXTO É CLICÁVEL =====
            text.setInteractive()
                .on('pointerover', () => {
                    text.setStyle({ 
                        color: '#ffff00',
                        backgroundColor: '#3a3a3a'
                    });
                    this.input.setDefaultCursor('pointer');
                })
                .on('pointerout', () => {
                    text.setStyle({ 
                        color: '#d0c5aa',
                        backgroundColor: '#1a1a1a'
                    });
                    this.input.setDefaultCursor('default');
                })
                .on('pointerdown', () => {
                    text.setStyle({ color: '#ff0000' });
                    callback();
                });

            return text;
        };

        // ===== CRIAR BOTÕES COM FUNCIONALIDADES MELHORADAS =====
        const btnReiniciar = criarBotaoPixelArt('Reiniciar Fase', () => {
            console.log("🔄 Reiniciando fase...");
            
            // Fade out antes de reiniciar
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                gameState.vidas = 3;

                if (gameState.mundoAtual) {
                    this.scene.start(gameState.mundoAtual);
                } else {
                    this.scene.start('MundoNormalScene');
                }
            });
        });

        const btnMenu = criarBotaoPixelArt('Menu Principal', () => {
            console.log("🏠 Voltando ao menu principal...");
            
            // Fade out antes de recarregar
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // ===== RECARREGAR A PÁGINA INTEIRA (F5) =====
                window.location.reload();
            });
        });

        // ===== POSICIONAMENTO ORIGINAL MELHORADO DOS BOTÕES =====
        const botoesContainer = this.add.container(width / 2, height * 0.75); // 75% da altura da tela
        const spacing = Math.max(60, width * 0.05); // Espaçamento responsivo

        // Posicionar botões lado a lado com espaçamento adequado (POSIÇÃO ORIGINAL)
        btnReiniciar.x = -btnReiniciar.width / 2 - spacing / 2;
        btnMenu.x = btnMenu.width / 2 + spacing / 2;

        botoesContainer.add([btnReiniciar, btnMenu]);

        console.log("🎮 Botões na posição original com clique melhorado!");
        console.log("📏 Área de clique expandida para cada botão!");

        // ===== SEM TÍTULO E TEXTO EXTRAS =====
        // Removido conforme solicitado

        // ===== EFEITO DE ENTRADA SUAVE SÓ DOS BOTÕES =====
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // Animação de entrada só dos botões
        botoesContainer.setAlpha(0);

        this.tweens.add({
            targets: botoesContainer,
            alpha: 1,
            duration: 800,
            delay: 200,
            ease: 'Power2.easeOut'
        });

        // ===== CONTROLES DE TECLADO =====
        this.input.keyboard.on('keydown-R', () => {
            btnReiniciar.emit('pointerdown');
        });

        this.input.keyboard.on('keydown-M', () => {
            btnMenu.emit('pointerdown');
        });

        this.input.keyboard.on('keydown-ESC', () => {
            btnMenu.emit('pointerdown');
        });

        // ===== REDIMENSIONAMENTO AUTOMÁTICO =====
        this.scale.on('resize', (gameSize) => {
            const newWidth = gameSize.width;
            const newHeight = gameSize.height;
            
            // Reposicionar elementos
            this.children.list.forEach(child => {
                if (child.x) {
                    child.x = child.x * (newWidth / width);
                    child.y = child.y * (newHeight / height);
                }
            });
        });

        console.log("🎉 Tela de vitória carregada! Pressione R para reiniciar ou M para menu");
    }
}

export default WinScene;