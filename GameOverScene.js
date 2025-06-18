class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    preload() {
        this.load.image('gameover-bg', 'assets/gameover_screen_fixed.png');
        this.load.audio('gameover_music', 'assets/sounds/gameover.mp3');
    }

    create() {
        // ===== PARAR TODOS OS SONS DE TODAS AS CENAS IMEDIATAMENTE =====
        this.sound.stopAll();
        console.log("🔇 TODOS OS SONS DO JOGO FORAM PARADOS!");

        // ===== USAR DIMENSÕES REAIS DA TELA DO JOGO =====
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        
        // ===== BACKGROUND COBRINDO A TELA INTEIRA SEM CORTES =====
        const bg = this.add.image(gameWidth / 2, gameHeight / 2, 'gameover-bg')
            .setOrigin(0.5);
            
        // ===== FORÇAR A IMAGEM A COBRIR EXATAMENTE AS DIMENSÕES DA TELA =====
        bg.setDisplaySize(gameWidth, gameHeight);

        // ===== AGUARDAR UM POUCO ANTES DE TOCAR A MÚSICA DE DERROTA =====
        this.time.delayedCall(300, () => {
            // ===== MÚSICA DE GAME OVER (ÚNICA) =====
            this.music = this.sound.add('gameover_music', {
                volume: 0.3,
                loop: false
            });
            
            this.music.play();
            console.log("🎵 Música de Game Over iniciada!");
        });

        // ===== PEGAR FRAGMENTOS DO GAMESTATE GLOBAL =====
        const fragmentosColetados = gameState.fragmentosColetados || 0;

        // ===== TEXTO DE FRAGMENTOS (SEM TÍTULO DUPLICADO) =====
        this.add.text(gameWidth / 2, gameHeight / 2 - 50, `Fragmentos coletados:\n${fragmentosColetados}/3`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#f8e9d8',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);

        // ===== FUNÇÃO PARA CRIAR BOTÕES MELHORADOS =====
        const criarBotaoPixelArt = (x, y, texto, callback) => {
            const paddingX = 20;
            const paddingY = 12;

            // Texto do botão
            const text = this.add.text(x, y, texto.toUpperCase(), {
                fontFamily: 'Courier',
                fontSize: '18px',
                fontStyle: 'bold',
                color: '#d0c5aa'
            }).setOrigin(0.5);

            // Dimensões do botão
            const boxWidth = text.width + paddingX * 2;
            const boxHeight = text.height + paddingY * 2;

            // Gráficos do botão
            const graphics = this.add.graphics();
            
            // Estado normal
            const drawNormal = () => {
                graphics.clear();
                graphics.fillStyle(0x1a1a1a, 0.9);
                graphics.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
                graphics.lineStyle(3, 0xb79c70, 1);
                graphics.strokeRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
            };

            // Estado hover
            const drawHover = () => {
                graphics.clear();
                graphics.fillStyle(0x2e2e2e, 0.9);
                graphics.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
                graphics.lineStyle(3, 0xffffff, 1);
                graphics.strokeRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
            };

            drawNormal();

            // Container interativo
            const hitArea = this.add.rectangle(x, y, boxWidth, boxHeight, 0x000000, 0)
                .setInteractive()
                .on('pointerover', () => {
                    drawHover();
                    text.setColor('#ffffff');
                })
                .on('pointerout', () => {
                    drawNormal();
                    text.setColor('#d0c5aa');
                })
                .on('pointerdown', () => {
                    // ===== PARAR MÚSICA ANTES DE SAIR =====
                    if (this.music && this.music.isPlaying) {
                        this.music.stop();
                        console.log("🔇 Música de Game Over parada!");
                    }
                    
                    callback();
                });

            return { graphics, text, hitArea };
        };

        // ===== BOTÕES POSICIONADOS CORRETAMENTE =====
        const btnY = gameHeight / 2 + 80;
        const btnSpacing = 200;

        // Botão Reiniciar
        const btnReiniciar = criarBotaoPixelArt(
            gameWidth / 2 - btnSpacing / 2,
            btnY,
            'Reiniciar Fase',
            () => {
                console.log("🔄 Reiniciando fase...");
                
                // ===== RESETAR GAMESTATE PARA REINICIAR =====
                gameState.vidas = 3;
                gameState.fragmentosColetados = 0;

                if (gameState.mundoAtual) {
                    this.scene.start(gameState.mundoAtual);
                } else {
                    this.scene.start('CenaJogo');
                }
            }
        );

        // Botão Menu Principal
        const btnMenu = criarBotaoPixelArt(
            gameWidth / 2 + btnSpacing / 2,
            btnY,
            'Menu Principal',
            () => {
                console.log("🏠 Voltando ao menu principal...");
                
                // ===== PARAR TODOS OS SONS ANTES DE RECARREGAR =====
                this.sound.stopAll();
                
                // ===== RESETAR GAMESTATE COMPLETAMENTE =====
                gameState.vidas = 3;
                gameState.fragmentosColetados = 0;
                gameState.mundoAtual = null;
                
                // ===== RECARREGAR A PÁGINA AUTOMATICAMENTE (F5) =====
                window.location.reload();
            }
        );

        // ===== INSTRUÇÕES =====
        this.add.text(gameWidth / 2, gameHeight / 2 + 160, 'Clique nos botões para continuar', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888',
            align: 'center'
        }).setOrigin(0.5);

        // ===== EFEITO DE FADE IN =====
        this.cameras.main.fadeIn(500, 0, 0, 0);

        // ===== CONTROLE DE TECLADO PARA REINICIAR =====
        this.input.keyboard.on('keydown-R', () => {
            console.log("⌨️ Tecla R pressionada - Reiniciando...");
            if (this.music && this.music.isPlaying) {
                this.music.stop();
            }
            
            gameState.vidas = 3;
            gameState.fragmentosColetados = 0;
            
            if (gameState.mundoAtual) {
                this.scene.start(gameState.mundoAtual);
            } else {
                this.scene.start('CenaJogo');
            }
        });

        // ===== CONTROLE DE TECLADO PARA MENU =====
        this.input.keyboard.on('keydown-M', () => {
            console.log("⌨️ Tecla M pressionada - Menu Principal...");
            this.sound.stopAll();
            gameState.vidas = 3;
            gameState.fragmentosColetados = 0;
            gameState.mundoAtual = null;
            window.location.reload();
        });
    }

    // ===== MÉTODO PARA SER CHAMADO QUANDO A CENA É DESTRUÍDA =====
    shutdown() {
        // ===== GARANTIR QUE TODOS OS SONS PARAM =====
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
        this.sound.stopAll();
        console.log("🗑️ GameOverScene destruída - todos os sons parados!");
    }
}

export default GameOverScene;