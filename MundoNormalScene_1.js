export default class MundoNormalScene_1 extends Phaser.Scene {
    constructor() {
        super({ key: 'Mapa1' });
    }

    preload() {
        this.load.image('AllSprites', 'assets/AllSprites.png');
        this.load.tilemapTiledJSON('mapa1', 'assets/mapa1.json');
        this.load.image('heart', 'assets/Hearts.png');

        this.load.spritesheet('itens', 'assets/rpgItems.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet('inimigos', 'assets/enemies-spritesheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', {
            frameWidth: 50,
            frameHeight: 37
        });

        this.load.spritesheet('orc', 'assets/Orc.png', {
            frameWidth: 100,
            frameHeight: 64
        });

        // ===== CARREGAMENTO DOS SONS =====
        this.load.audio('stepSound', 'assets/sounds/andar.wav');
        this.load.audio('jumpSound', 'assets/sounds/pulo.wav');
        this.load.audio('collectSound', 'assets/sounds/fragmento.wav');
        this.load.audio('damageSound', 'assets/sounds/dano.wav');
        this.load.audio('attackSound', 'assets/sounds/ataque.wav');
        this.load.audio('orcAttackSound', 'assets/sounds/orc.wav'); // ===== SOM DO ORC =====
    }

    create(data) {
        this.currentLives = data?.vidas ?? 3;
        this.fragmentosColetados = data?.fragmentosColetados || 0;

        // ===== CONFIGURAÇÃO DE ÁUDIO =====
        this.setupAudio();
        
        // ===== CONFIGURAÇÃO DE CONTROLE DE PASSOS =====
        this.isWalking = false;
        this.stepTimer = 0;
        this.stepInterval = 400;

        const map = this.make.tilemap({ key: 'mapa1' });
        const tileset = map.addTilesetImage('AllSprites', 'AllSprites');

        const layers = [2, 3, 4, 5, 6, 7, 8, 1].map(n => map.createLayer(`Camada de Blocos ${n}`, tileset, 0, 0));
        const layer1 = layers[7];
        if (layer1) layer1.setCollisionByExclusion([-1]);

        const fragmento = this.physics.add.staticSprite(440, 60, 'itens', 26).setScale(1.5);

        this.inimigo = this.physics.add.sprite(300, 100, 'inimigos').setScale(4);
        this.inimigo.play('andarInimigo');
        this.inimigo.setVelocityX(50);
        this.inimigo.setBounce(1, 0);
        this.inimigo.setCollideWorldBounds(true);
        this.physics.add.collider(this.inimigo, layer1);
        this.inimigo.health = 1;
        this.inimigo.isDead = false;
        this.inimigo.isAttacking = false;

        // ===== CONFIGURAÇÃO CORRIGIDA DO ORC =====
        this.orc = this.physics.add.sprite(700, 5, 'orc').setScale(2); // ===== VOLTANDO POSIÇÃO ORIGINAL =====
        this.orc.play('orcAndando');
        this.orc.setCollideWorldBounds(true);
        this.orc.health = 3;
        this.orc.isDead = false;
        this.orc.isAttacking = false;
        this.orc.lastHit = 0; // Para evitar múltiplos hits muito rápidos
        
        // ===== CONFIGURAÇÃO DE FÍSICA ORIGINAL =====
        this.orc.setSize(35, 40);  // ===== HITBOX ORIGINAL =====
        this.orc.setOffset(40, 20); // ===== OFFSET ORIGINAL =====
        
        this.physics.add.collider(this.orc, layer1);

        this.player = this.physics.add.sprite(100, 100, 'adventurer', 0).setScale(2);
        this.player.setBodySize(25, 30);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, layer1);

        // ===== SOM AO COLETAR FRAGMENTO =====
        this.physics.add.overlap(this.player, fragmento, () => {
            fragmento.destroy();
            this.fragmentosColetados++;
            this.textoFragmento.setText(`Fragmentos: ${this.fragmentosColetados}/3`);
            
            // TOCAR SOM DE COLETA
            this.sounds.collect.play();
        }, null, this);

        this.player.isInvulnerable = false;
        
        // ===== COLISÃO COM INIMIGO COM SOM =====
        this.physics.add.overlap(this.player, this.inimigo, () => {
            if (!this.player.isInvulnerable && !this.inimigo.isDead) {
                this.currentLives--;
                this.updateHearts();
                
                // ===== TOCAR SOM DE DANO =====
                this.sounds.damage.play();
                
                this.player.isInvulnerable = true;
                this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
            }
        }, null, this);

        // ===== COLISÃO COM ORC COM SOM E ANIMAÇÃO MELHORADA =====
        this.physics.add.overlap(this.player, this.orc, () => {
            if (!this.player.isInvulnerable && !this.orc.isDead) {
                // Se o orc não está atacando, começar ataque
                if (!this.orc.isAttacking) {
                    this.orc.isAttacking = true;
                    
                    // ===== PARAR MOVIMENTO E VIRAR PARA O PLAYER =====
                    this.orc.setVelocityX(0);
                    this.orc.flipX = this.player.x < this.orc.x; // Virar para o player
                    
                    // ===== TOCAR SOM DE ATAQUE DO ORC =====
                    this.sounds.orcAttack.play();
                    
                    // ===== MANTER POSIÇÃO Y FIXA DURANTE ATAQUE =====
                    const attackFixedY = this.orc.y;
                    
                    // ===== ANIMAÇÃO DE ATAQUE COM MOVIMENTO CORRETO DO MACHADO =====
                    this.orc.play('orcAtacando', true);
                    
                    // ===== TIMER PARA MANTER POSIÇÃO DURANTE ATAQUE =====
                    const attackTimer = this.time.addEvent({
                        delay: 50,
                        repeat: -1,
                        callback: () => {
                            if (this.orc && !this.orc.destroyed && this.orc.anims.currentAnim?.key === 'orcAtacando') {
                                this.orc.setY(attackFixedY);
                                this.orc.setVelocityX(0);
                                this.orc.setVelocityY(0);
                            }
                        }
                    });
                    
                    // ===== APLICAR DANO NO FRAME CORRETO (quando o machado desce) =====
                    this.time.delayedCall(500, () => { // ===== AJUSTADO PARA 500ms =====
                        if (!this.player.isInvulnerable && !this.orc.isDead) {
                            this.currentLives--;
                            this.updateHearts();
                            
                            // ===== TOCAR SOM DE DANO =====
                            this.sounds.damage.play();
                            
                            this.player.isInvulnerable = true;
                            this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
                        }
                    });
                    
                    // ===== APÓS ANIMAÇÃO COMPLETA, VOLTAR A ANDAR =====
                    this.orc.once('animationcomplete', () => {
                        attackTimer.destroy(); // Parar timer de posição
                        if (!this.orc.isDead) {
                            this.orc.isAttacking = false;
                            this.orc.play('orcAndando', true);
                        }
                    });
                }
            }
        }, null, this);

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        this.scale.resize(mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player);

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
        this.transicaoFeita = false;
        this.isAttacking = false;

        this.setupAnimations();
        this.setupUI();
    }

    // ===== CONFIGURAÇÃO DE ÁUDIO =====
    setupAudio() {
        this.sounds = {
            step: this.sound.add('stepSound', { volume: 0.3 }),
            jump: this.sound.add('jumpSound', { volume: 0.5 }),
            collect: this.sound.add('collectSound', { volume: 0.2 }),
            damage: this.sound.add('damageSound', { volume: 0.6 }),
            attack: this.sound.add('attackSound', { volume: 0.5 }),
            orcAttack: this.sound.add('orcAttackSound', { volume: 0.2 }) // ===== SOM DO ORC =====
        };

        this.stepSoundPlaying = false;
        console.log("Sistema de áudio configurado - Mapa1!");
    }

    // ===== CONTROLE DE SOM DE PASSOS =====
    updateStepSound() {
        const currentTime = this.time.now;
        
        const isActuallyMoving = this.isWalking && 
                                this.player.body.blocked.down && 
                                Math.abs(this.player.body.velocity.x) > 50;
        
        if (isActuallyMoving) {
            if (!this.stepSoundPlaying && currentTime - this.stepTimer > this.stepInterval) {
                this.sounds.step.play();
                this.stepTimer = currentTime;
                this.stepSoundPlaying = true;
                
                this.time.delayedCall(300, () => {
                    this.stepSoundPlaying = false;
                });
            }
        } else {
            if (this.stepSoundPlaying) {
                this.sounds.step.stop();
                this.stepSoundPlaying = false;
            }
        }
    }

    setupAnimations() {
        this.anims.create({ key: 'andarInimigo', frames: this.anims.generateFrameNumbers('inimigos', { start: 24, end: 25 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'inimigoMorrendo', frames: this.anims.generateFrameNumbers('inimigos', { start: 26, end: 27 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }), frameRate: 10, repeat: 0 });
        
        // ===== ANIMAÇÕES CORRIGIDAS DO ORC COM FRAMES CORRETOS =====
        this.anims.create({ 
            key: 'orcAndando', 
            frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 3 }), 
            frameRate: 4, 
            repeat: -1 
        });
        
        // ===== ATAQUE COM MOVIMENTO DO MACHADO (sem animação - só parado) =====
        this.anims.create({ 
            key: 'orcAtacando', 
            frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 0 }), // ===== SÓ FRAME 0 - PARADO =====
            frameRate: 1,
            repeat: 0
        });
        
        // ===== ANIMAÇÃO DE LEVAR DANO - USANDO FRAME ÚNICO OU EFEITO VISUAL =====
        this.anims.create({ 
            key: 'orcTomandoDano', 
            frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 0 }), // ===== FRAME 0 (PARADO) =====
            frameRate: 1,
            repeat: 0
        });
        
        // ===== MORTE COMPLETA: DEITAR (linha 6 - frames 40-43) =====
        this.anims.create({ 
            key: 'orcMorrendo', 
            frames: this.anims.generateFrameNumbers('orc', { start: 40, end: 43 }), // ===== LINHA 6 - SPRITES DEITADOS =====
            frameRate: 4,
            repeat: 0
        });
    }

    setupUI() {
        this.textoFragmento = this.add.text(90, 10, `Fragmentos: ${this.fragmentosColetados}/3`, { 
            fontSize: '16px', fill: '#ffffff', fontFamily: 'Arial' 
        }).setScrollFactor(0);
        
        this.missaoTitulo = this.add.text(20, 80, '📜 Missão', { 
            fontFamily: 'Arial', fontSize: '18px', fill: '#ffff66', fontStyle: 'bold' 
        }).setScrollFactor(0);
        
        this.missaoTexto = this.add.text(10, 105, '☐ Encontrar e salvar Lira', { 
            fontFamily: 'Arial', fontSize: '16px', fill: '#ffffff', lineSpacing: 6 
        }).setScrollFactor(0);

        this.maxLives = 3;
        this.heartIcon = this.add.image(20, 20, 'heart').setScale(0.3).setScrollFactor(0);
        this.vidaTexto = this.add.text(40, 10, `${this.currentLives}/${this.maxLives}`, {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'Arial'
        }).setScrollFactor(0);

        this.updateHearts();
    }

    updateHearts() {
        if (this.vidaTexto) {
            this.vidaTexto.setText(`${this.currentLives}/${this.maxLives}`);
        }
    
        if (this.currentLives <= 0) {
            // ===== SALVAR ESTADO NO GAMESTATE GLOBAL =====
            gameState.mundoAtual = 'Mapa1';
            gameState.fragmentosColetados = this.fragmentosColetados;
            gameState.vidas = this.currentLives;
            
            this.scene.start('GameOverScene');
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
            this.scene.start('Mapa2', {
                voltarPeloLadoEsquerdo: false,
                fragmentosColetados: this.fragmentosColetados,
                vidas: this.currentLives,
                mapaAtual: 'mapa2.json'
            });
        });
    }

    update() {
        const limiteDireita = 750;
        if (this.player.body.blocked.down) this.jumpCount = 0;

        // ===== ATAQUE COM SOM =====
        if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            this.player.anims.play('attack', true);
            this.player.setVelocityX(0);
            this.isAttacking = true;
            
            // ===== TOCAR SOM DE ATAQUE =====
            this.sounds.attack.play();
            
            return;
        }

        if (this.isAttacking) {
            if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'attack') {
                this.isAttacking = false;
            } else {
                // ===== VERIFICAR DANO NO ORC COM TIMER PARA EVITAR SPAM =====
                if (this.orc && !this.orc.isDead) {
                    const distOrc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.orc.x, this.orc.y);
                    if (distOrc < 60 && this.time.now - this.orc.lastHit > 500) { // ===== COOLDOWN DE 500ms =====
                        this.orc.health--;
                        this.orc.lastHit = this.time.now;
                        
                        console.log(`Orc tomou dano! Vida restante: ${this.orc.health}`);
                        
                        if (this.orc.health <= 0) {
                            // ===== MORTE: SUMIR IMEDIATAMENTE =====
                            this.orc.isDead = true;
                            this.orc.setVelocityX(0);
                            this.orc.setVelocityY(0);
                            this.orc.isAttacking = false;
                            
                            // ===== REMOVER TODAS AS REFERÊNCIAS ANTES DE DESTRUIR =====
                            this.physics.world.removeCollider(this.orc);
                            
                            // ===== FADE OUT DIRETO - SEM ANIMAÇÃO DE MORTE =====
                            this.tweens.add({
                                targets: this.orc,
                                alpha: 0,
                                duration: 500,
                                onComplete: () => {
                                    if (this.orc && !this.orc.destroyed) {
                                        this.orc.destroy();
                                        this.orc = null; // ===== LIMPAR REFERÊNCIA =====
                                        console.log("Orc destruído!");
                                    }
                                }
                            });
                        } else {
                            // ===== EFEITO VISUAL DE DANO SEM ANIMAÇÃO PROBLEMÁTICA =====
                            const wasAttacking = this.orc.isAttacking;
                            const currentVelocity = this.orc.body.velocity.x;
                            
                            // ===== PARAR IMEDIATAMENTE QUALQUER ATAQUE EM ANDAMENTO =====
                            this.orc.isAttacking = true;
                            this.orc.setVelocityX(0);
                            this.orc.setVelocityY(0);
                            
                            // ===== FORÇAR ANIMAÇÃO DE CAMINHADA (FRAME PARADO) =====
                            this.orc.play('orcAndando', true);
                            this.orc.anims.pause(); // ===== PAUSAR NA POSIÇÃO ATUAL =====
                            
                            // ===== EFEITO VISUAL SIMPLES: PISCAR VERMELHO =====
                            this.orc.setTint(0xff0000);
                            
                            this.time.delayedCall(200, () => {
                                if (this.orc && !this.orc.isDead) {
                                    this.orc.clearTint();
                                    this.orc.anims.resume(); // ===== RETOMAR ANIMAÇÃO =====
                                    this.orc.isAttacking = false; // ===== SEMPRE PARAR ATAQUE APÓS DANO =====
                                    
                                    // ===== VOLTAR A ANDAR NORMALMENTE =====
                                    this.orc.play('orcAndando', true);
                                    if (Math.abs(currentVelocity) > 5) {
                                        this.orc.setVelocityX(currentVelocity);
                                    }
                                }
                            });
                        }
                    }
                }
                
                // ===== VERIFICAR DANO NO INIMIGO COM TIMER =====
                if (this.inimigo && !this.inimigo.isDead) {
                    const distInimigo = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.inimigo.x, this.inimigo.y);
                    if (distInimigo < 60 && this.time.now - (this.inimigo.lastHit || 0) > 500) {
                        this.inimigo.health--;
                        this.inimigo.lastHit = this.time.now;
                        
                        // ===== EFEITO VISUAL DE DANO =====
                        this.inimigo.setTint(0xff0000);
                        this.time.delayedCall(150, () => {
                            if (this.inimigo && !this.inimigo.isDead) {
                                this.inimigo.clearTint();
                            }
                        });
                        
                        if (this.inimigo.health <= 0) {
                            this.inimigo.isDead = true;
                            this.inimigo.setVelocityX(0);
                            this.inimigo.play('inimigoMorrendo', true);
                            this.inimigo.once('animationcomplete', () => this.inimigo.destroy());
                        }
                    }
                }
                return;
            }
        }

        let isMoving = false;

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
        } else if (!this.player.body.blocked.down) {
            this.player.anims.play(this.player.body.velocity.y < 0 ? 'jump' : 'fall', true);
        } else if (isMoving) {
            this.player.anims.play('run', true);
        } else {
            this.player.anims.play('idle', true);
        }

        // ===== TRANSIÇÃO PARA PRÓXIMO MAPA =====
        if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
            this.transicaoParaMapa();
            return;
        }

        // ===== VOLTAR PARA MAPA ANTERIOR =====
        if (this.player.x <= this.player.width / 2) {
            // ===== PARAR TODOS OS SONS ANTES DA TRANSIÇÃO =====
            if (this.stepSoundPlaying) {
                this.sounds.step.stop();
                this.stepSoundPlaying = false;
            }
            
            Object.values(this.sounds).forEach(sound => {
                if (sound.isPlaying) {
                    sound.stop();
                }
            });
            
            this.scene.start('CenaJogo', {
                voltarPeloLadoEsquerdo: true,
                fragmentosColetados: this.fragmentosColetados,
                vidas: this.currentLives,
                mapaAtual: 'mapa.json'
            });
        }

        // ===== INTELIGÊNCIA ARTIFICIAL CORRIGIDA DO ORC =====
        if (this.orc && !this.orc.isDead && !this.orc.isAttacking && !this.orc.destroyed) {
            const distance = Phaser.Math.Distance.Between(this.orc.x, this.orc.y, this.player.x, this.player.y);
            
            if (distance < 120) { // ===== RANGE REDUZIDO PARA 120px =====
                // ===== PERSEGUIR O PLAYER COM VELOCIDADE REDUZIDA =====
                const speed = 35; // ===== VELOCIDADE REDUZIDA =====
                
                if (this.player.x > this.orc.x) {
                    this.orc.setVelocityX(speed);
                    this.orc.flipX = false; // ===== VIRAR PARA DIREITA =====
                } else {
                    this.orc.setVelocityX(-speed);
                    this.orc.flipX = true; // ===== VIRAR PARA ESQUERDA =====
                }
                
                // ===== GARANTIR QUE ESTÁ ANDANDO =====
                if (this.orc.anims.currentAnim?.key !== 'orcAndando') {
                    this.orc.play('orcAndando', true);
                }
                
            } else {
                // ===== PATRULHAMENTO QUANDO LONGE DO PLAYER =====
                if (!this.orc.patrolDirection) {
                    this.orc.patrolDirection = 1; // Direção inicial
                }
                
                // ===== MOVER EM PATRULHA COM VELOCIDADE MAIS LENTA =====
                this.orc.setVelocityX(20 * this.orc.patrolDirection);
                this.orc.flipX = this.orc.patrolDirection < 0;
                
                // ===== INVERTER DIREÇÃO SE CHEGAR NAS BORDAS =====
                if (this.orc.body.blocked.left || this.orc.body.blocked.right || 
                    this.orc.x <= 50 || this.orc.x >= 750) {
                    this.orc.patrolDirection *= -1;
                }
                
                // ===== GARANTIR ANIMAÇÃO DE CAMINHADA =====
                if (this.orc.anims.currentAnim?.key !== 'orcAndando') {
                    this.orc.play('orcAndando', true);
                }
            }
        }

        // ===== INTELIGÊNCIA DO INIMIGO PEQUENO =====
        if (this.inimigo && !this.inimigo.isDead) {
            const distToPlayer = Phaser.Math.Distance.Between(this.inimigo.x, this.inimigo.y, this.player.x, this.player.y);
            if (distToPlayer < 150) {
                this.inimigo.setVelocityX(this.inimigo.x < this.player.x ? 50 : -50);
                this.inimigo.flipX = this.inimigo.x > this.player.x;
            } else {
                this.inimigo.setVelocityX(50 * (this.inimigo.body.velocity.x < 0 ? -1 : 1));
            }
        }

        // ===== ATUALIZAR SOM DE PASSOS =====
        this.updateStepSound();
    }
}