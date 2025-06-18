export default class MundoNormal extends Phaser.Scene {
    constructor() {
        super({ key: 'CenaJogo' });
    }

    preload() {
        this.load.image('AllSprites', 'assets/AllSprites.png');
        this.load.tilemapTiledJSON('mapa', 'assets/mapa.json');
        
        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', {
            frameWidth: 50,
            frameHeight: 37
        });

        // ===== CORRIGIDO: CARREGAR COMO IMAGEM IGUAL AOS OUTROS MAPAS =====
        this.load.image('heart', 'assets/Hearts.png');

        this.load.spritesheet('itens', 'assets/rpgItems.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // ===== CARREGAMENTO DOS SONS =====
        this.load.audio('stepSound', 'assets/sounds/andar.wav');
        this.load.audio('jumpSound', 'assets/sounds/pulo.wav');
        this.load.audio('collectSound', 'assets/sounds/fragmento.wav');
        this.load.audio('damageSound', 'assets/sounds/dano.wav');
        this.load.audio('attackSound', 'assets/sounds/ataque.wav');
    }

    create(data) {
        this.fragmentosColetados = data?.fragmentosColetados || 0;
        this.transicaoFeita = false;
        
        // ===== CONFIGURAÇÃO DE ÁUDIO =====
        this.setupAudio();
        
        // ===== CONFIGURAÇÃO DE CONTROLE DE PASSOS =====
        this.isWalking = false;
        this.stepTimer = 0;
        this.stepInterval = 400; // Intervalo entre passos em ms
        
        const map = this.make.tilemap({ key: 'mapa' });
        const tileset = map.addTilesetImage('AllSprites', 'AllSprites');

        const layer1 = map.createLayer('Camada de Blocos 1', tileset, 0, 0);
        const layer2 = map.createLayer('Camada de Blocos 2', tileset, 0, 0);
        const layer3 = map.createLayer('Camada de Blocos 3', tileset, 0, 0);
        const layer4 = map.createLayer('Camada de Blocos 4', tileset, 0, 0);
        const layer5 = map.createLayer('Camada de Blocos 5', tileset, 0, 0);
        const layer6 = map.createLayer('Camada de Blocos 6', tileset, 0, 0);

        // ===== CORRIGIDO: USAR FRAGMENTOS RECEBIDOS E MOSTRAR 0/3 =====
        this.textoFragmento = this.add.text(90, 10, `Fragmentos: ${this.fragmentosColetados}/3`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);

        const fragmento = this.physics.add.staticSprite(400, 130, 'itens', 26).setScale(1.5);

        if (layer1) {
            layer1.setCollisionByExclusion([-1]);
        }

        let spawnX = 0;
        let spawnY = 0;
        for (let x = 0; x < map.width; x++) {
            for (let y = 0; y < map.height; y++) {
                const tile = layer1.getTileAt(x, y);
                if (tile && tile.index !== -1) {
                    spawnX = map.tileToWorldX(x) + map.tileWidth / 2;
                    spawnY = map.tileToWorldY(y) - (37 * 2) / 2;
                    break;
                }
            }
            if (spawnY !== 0) break;
        }
        
        this.player = this.physics.add.sprite(spawnX, spawnY, 'adventurer', 0).setScale(2);
        this.player.setBodySize(25, 30);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, layer1, () => {
            this.jumpCount = 0;
        });

        // ===== SOM AO COLETAR FRAGMENTO =====
        this.physics.add.overlap(this.player, fragmento, () => {
            fragmento.destroy();
            this.fragmentosColetados++;
            this.textoFragmento.setText(`Fragmentos: ${this.fragmentosColetados}/3`);
            
            // TOCAR SOM DE COLETA
            this.sounds.collect.play();
        }, null, this);

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;

        this.scale.resize(mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player);

        this.missaoTitulo = this.add.text(20, 80, '📜 Missão', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fill: '#ffff66',
            fontStyle: 'bold'
        }).setScrollFactor(0);

        this.missaoTexto = this.add.text(10, 105, '☐ Encontrar e salvar Lira', {
            fontFamily: 'Arial',
            fontSize: '16px',
            fill: '#ffffff',
            lineSpacing: 6
        }).setScrollFactor(0);

        this.setupAnimations();
        this.setupControls();
        this.setupPlayerStats(data); // ===== PASSAR DATA PARA SETUPPLAYERSTATS =====

        console.log("Camadas válidas:", map.layers.map(l => l.name));
    }

    // ===== CONFIGURAÇÃO DE ÁUDIO =====
    setupAudio() {
        this.sounds = {
            step: this.sound.add('stepSound', { volume: 0.3 }),
            jump: this.sound.add('jumpSound', { volume: 0.5 }),
            collect: this.sound.add('collectSound', { volume: 0.3 }),
            damage: this.sound.add('damageSound', { volume: 0.7 }),
            attack: this.sound.add('attackSound', { volume: 0.5 })
        };

        // Variável para controlar se o som de passos está tocando
        this.stepSoundPlaying = false;

        console.log("Sistema de áudio configurado!");
    }

    // ===== CONTROLE DE SOM DE PASSOS =====
    updateStepSound() {
        const currentTime = this.time.now;
        
        // Verificar se realmente está andando
        const isActuallyMoving = this.isWalking && 
                                this.player.body.blocked.down && 
                                Math.abs(this.player.body.velocity.x) > 50;
        
        if (isActuallyMoving) {
            // Só tocar se não estiver tocando e passou o intervalo
            if (!this.stepSoundPlaying && currentTime - this.stepTimer > this.stepInterval) {
                this.sounds.step.play();
                this.stepTimer = currentTime;
                this.stepSoundPlaying = true;
                
                // Parar o som após a duração do arquivo (aproximadamente 300ms)
                this.time.delayedCall(300, () => {
                    this.stepSoundPlaying = false;
                });
            }
        } else {
            // Se não está andando, parar qualquer som de passos
            if (this.stepSoundPlaying) {
                this.sounds.step.stop();
                this.stepSoundPlaying = false;
            }
        }
    }

    setupAnimations() {
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }),
            frameRate: 1,
            repeat: 0
        });

        this.anims.create({
            key: 'fall',
            frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }),
            frameRate: 1,
            repeat: 0
        });

        this.anims.create({
            key: 'attack',
            frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }),
            frameRate: 10,
            repeat: 0
        });
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            attack: Phaser.Input.Keyboard.KeyCodes.ENTER
        });

        this.jumpCount = 0;
        this.maxJumps = 2;
        this.isAttacking = false;
    }

    // ===== CORRIGIDO: SISTEMA DE VIDAS 3/3 IGUAL AOS OUTROS MAPAS =====
    setupPlayerStats(data) {
        this.maxLives = 3; // ===== CORRIGIDO: 3 VIDAS =====
        this.currentLives = data?.vidas ?? 3; // ===== USAR VIDAS RECEBIDAS OU 3 =====

        // ===== USAR O MESMO PADRÃO DOS OUTROS MAPAS =====
        this.heartIcon = this.add.image(20, 20, 'heart').setScale(0.3).setScrollFactor(0);
        this.vidaTexto = this.add.text(40, 10, `${this.currentLives}/${this.maxLives}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);

        this.updateHearts();
    }

    // ===== FUNÇÃO DE ATUALIZAR CORAÇÕES IGUAL AOS OUTROS MAPAS =====
    updateHearts() {
        if (this.vidaTexto) {
            this.vidaTexto.setText(`${this.currentLives}/${this.maxLives}`);
        }
    
        if (this.currentLives <= 0) {
            // ===== SALVAR ESTADO NO GAMESTATE GLOBAL =====
            gameState.mundoAtual = 'CenaJogo';
            gameState.fragmentosColetados = this.fragmentosColetados;
            gameState.vidas = this.currentLives;
            
            this.scene.start('GameOverScene');
        }
    }

    // ===== FUNÇÃO PARA TOMAR DANO COM SOM =====
    takeDamage() {
        if (this.currentLives > 0) {
            this.currentLives--;
            this.updateHearts();
            
            // TOCAR SOM DE DANO
            this.sounds.damage.play();
            
            if (this.currentLives <= 0) {
                console.log("Game Over!");
            }
        }
    }

    transicaoParaMapa() {
        // ===== PARAR TODOS OS SONS ANTES DA TRANSIÇÃO =====
        if (this.stepSoundPlaying) {
            this.sounds.step.stop();
            this.stepSoundPlaying = false;
        }
        
        // Parar qualquer outro som que possa estar tocando
        Object.values(this.sounds).forEach(sound => {
            if (sound.isPlaying) {
                sound.stop();
            }
        });
        
        this.cameras.main.fadeOut(500, 0, 0, 0); 
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Mapa1', {
                voltarPeloLadoEsquerdo: false,
                fragmentosColetados: this.fragmentosColetados,
                vidas: this.currentLives, // ===== PASSAR AS VIDAS CORRETAMENTE =====
                mapaAtual: 'mapa1.json'
            });
        });
    }

    update() {
        const limiteDireita = 750;
        if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
            console.log("Transição acionada para 'Mapa1'");
            this.transicaoParaMapa();
            return;
        }

        let isMoving = false;

        if (this.isAttacking) {
            if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'attack') {
                this.isAttacking = false;
            } else {
                return;
            }
        }

        // ===== MOVIMENTO COM SOM DE PASSOS =====
        if (this.cursors.left.isDown || this.keys.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.flipX = true;
            isMoving = true;
            this.isWalking = true;
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            this.player.setVelocityX(160);
            this.player.flipX = false;
            isMoving = true;
            this.isWalking = true;
        } else {
            this.player.setVelocityX(0);
            this.isWalking = false;
            
            // PARAR SOM DE PASSOS IMEDIATAMENTE
            if (this.stepSoundPlaying) {
                this.sounds.step.stop();
                this.stepSoundPlaying = false;
            }
        }

        // ===== VERIFICAÇÃO ADICIONAL =====
        if (!isMoving || Math.abs(this.player.body.velocity.x) < 50) {
            this.isWalking = false;
            if (this.stepSoundPlaying) {
                this.sounds.step.stop();
                this.stepSoundPlaying = false;
            }
        }

        // ===== PULO COM SOM =====
        const isJumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
                              Phaser.Input.Keyboard.JustDown(this.keys.up) ||
                              Phaser.Input.Keyboard.JustDown(this.keys.space);

        if (isJumpPressed && this.jumpCount < this.maxJumps) {
            this.player.setVelocityY(-350);
            this.player.anims.play('jump', true);
            this.jumpCount++;
            
            // ===== TOCAR SOM DE PULO =====
            this.sounds.jump.play();
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            this.isAttacking = true;
            this.player.anims.play('attack', true);
            this.player.setVelocityX(0);
            
            // ===== TOCAR SOM DE ATAQUE =====
            this.sounds.attack.play();
        } else if (!this.player.body.blocked.down) {
            if (this.player.body.velocity.y < 0) {
                this.player.anims.play('jump', true);
            } else {
                this.player.anims.play('fall', true);
            }
        } else if (isMoving) {
            this.player.anims.play('run', true);
        } else {
            this.player.anims.play('idle', true);
        }

        // ===== ATUALIZAR SOM DE PASSOS =====
        this.updateStepSound();

        // Teste de dano - pressione T para testar som de dano
        if (Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('T'))) {
            this.takeDamage();
        }
    }
}