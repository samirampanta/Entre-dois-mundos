class Orc extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, layer) {
        super(scene, x, y, 'orc');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setScale(2);
        this.setCollideWorldBounds(true);
        this.speed = 35; // ===== VELOCIDADE REDUZIDA =====
        this.direction = 1;
        this.layer = layer;
        this.setBodySize(35, 40);
        this.setOffset(40, 20);
        this.health = 3;
        this.isDead = false;
        this.lastHit = 0;
        this.isAttacking = false; // ===== ADICIONADO =====
        this.lastDirectionChange = 0; // ===== PARA EVITAR TROCA MUITO RÁPIDA =====
        this.anims.play('orc-walk');
    }

    update() {
        if (this.isDead || this.isAttacking) {
            this.setVelocityX(0);
            return;
        }

        // ===== SISTEMA DE PATRULHAMENTO MELHORADO =====
        this.setVelocityX(this.speed * this.direction);
        
        // ===== VERIFICAR COLISÕES COM COOLDOWN =====
        const currentTime = Date.now();
        if (currentTime - this.lastDirectionChange > 500) { // ===== COOLDOWN DE 500ms =====
            const isBlocked = this.body.blocked.left || this.body.blocked.right;
            
            // ===== VERIFICAR BORDAS DO MUNDO =====
            const nearLeftEdge = this.x <= 50;
            const nearRightEdge = this.x >= 750;
            
            if (isBlocked || nearLeftEdge || nearRightEdge) {
                this.direction *= -1;
                this.flipX = this.direction === -1;
                this.lastDirectionChange = currentTime;
            }
        }
    }
}

export default class MundoNormalScene_2 extends Phaser.Scene {
    constructor() {
        super({ key: 'Mapa2' });
        this.portalUsado = false;
        this.timerMensagem = null;
    }

    preload() {
        this.load.image('AllSprites', 'assets/AllSprites.png');
        this.load.tilemapTiledJSON('mapa2', 'assets/mapa2.json');
        this.load.image('heart', 'assets/Hearts.png');
        this.load.spritesheet('itens', 'assets/rpgItems.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', { frameWidth: 50, frameHeight: 37 });
        this.load.spritesheet('orc', 'assets/Orc.png', { frameWidth: 100, frameHeight: 64 });
        this.load.spritesheet('portal', 'assets/Portal_100x100px.png', { frameWidth: 100, frameHeight: 100 });

        // ===== CARREGAMENTO DOS SONS =====
        this.load.audio('stepSound', 'assets/sounds/andar.wav');
        this.load.audio('jumpSound', 'assets/sounds/pulo.wav');
        this.load.audio('collectSound', 'assets/sounds/fragmento.wav');
        this.load.audio('damageSound', 'assets/sounds/dano.wav');
        this.load.audio('attackSound', 'assets/sounds/ataque.wav');
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

        const map = this.make.tilemap({ key: 'mapa2' });
        const tileset = map.addTilesetImage('AllSprites', 'AllSprites');

        const layer2 = map.createLayer('Camada de Blocos 2', tileset, 0, 0);
        const layer3 = map.createLayer('Camada de Blocos 3', tileset, 0, 0);
        const layer4 = map.createLayer('Camada de Blocos 4', tileset, 0, 0);
        const layer1 = map.createLayer('Camada de Blocos 1', tileset, 0, 0);
        if (layer1) layer1.setCollisionByExclusion([-1]);

        const fragmento = this.physics.add.staticSprite(80, 50, 'itens', 26).setScale(1.5);
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
        });

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
        this.isAttacking = false;
        this.transicaoFeita = false;

        this.createAnimations();

        this.portal = this.physics.add.staticSprite(700, 100, 'portal');
        this.portal.play('portal_anim');

        this.mensagemPortal = this.add.text(400, 300, 'Colete todos os fragmentos para usar o portal!', {
            fontSize: '20px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 },
            align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);

        this.physics.add.overlap(this.player, this.portal, () => {
            if (this.fragmentosColetados >= 3 && !this.portalUsado) {
                this.portalUsado = true;
                this.transicaoParaProximoMapa();
            } else if (!this.portalUsado) {
                this.exibirMensagemPortal();
            }
        });

        this.textoFragmento = this.add.text(90, 10, `Fragmentos: ${this.fragmentosColetados}/3`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);

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

        this.maxLives = 3;
        this.heartIcon = this.add.image(20, 20, 'heart').setScale(0.3).setScrollFactor(0);
        this.vidaTexto = this.add.text(40, 10, `${this.currentLives}/${this.maxLives}`, {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'Arial'
        }).setScrollFactor(0);

        this.updateHearts();

        this.orcs = this.physics.add.group();
        const orc1 = new Orc(this, 300, 100, layer1);
        const orc2 = new Orc(this, 400, 100, layer1);
        this.orcs.add(orc1);
        this.orcs.add(orc2);
        this.physics.add.collider(this.orcs, layer1);
        this.player.isInvulnerable = false; 

        // ===== COLISÃO COM ORCS COM SOM E ANIMAÇÃO MELHORADA =====
        this.physics.add.overlap(this.player, this.orcs, (player, orc) => {
            if (!this.player.isInvulnerable && !orc.isDead) {
                // Se o orc não está atacando, começar ataque
                if (!orc.isAttacking) {
                    orc.isAttacking = true;
                    
                    // ===== PARAR MOVIMENTO E VIRAR PARA O PLAYER =====
                    orc.setVelocityX(0);
                    orc.flipX = this.player.x < orc.x; // Virar para o player
                    
                    // ===== APLICAR DANO IMEDIATAMENTE (SEM ANIMAÇÃO) =====
                    this.time.delayedCall(200, () => {
                        if (!this.player.isInvulnerable && !orc.isDead) {
                            this.currentLives--;
                            this.updateHearts();
                            
                            // ===== TOCAR SOM DE DANO =====
                            this.sounds.damage.play();
                            
                            this.player.isInvulnerable = true;
                            this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
                        }
                    });
                    
                    // ===== VOLTAR A ANDAR APÓS ATAQUE =====
                    this.time.delayedCall(600, () => {
                        if (!orc.isDead) {
                            orc.isAttacking = false;
                        }
                    });
                }
            }
        }, null, this);
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

        this.stepSoundPlaying = false;
        console.log("Sistema de áudio configurado - Mapa2!");
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

    updateHearts() {
        if (this.vidaTexto) {
            this.vidaTexto.setText(`${this.currentLives}/${this.maxLives}`);
        }
        if (this.currentLives <= 0) {
            gameState.mundoAtual = 'Mapa2';
            this.scene.start('GameOverScene');
        }
    }

    createAnimations() {
        if (!this.anims.exists('portal_anim')) {
            this.anims.create({
                key: 'portal_anim',
                frames: this.anims.generateFrameNumbers('portal', { start: 0, end: 40 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.anims.exists('idle')) {
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
            this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }), frameRate: 12, repeat: -1 });
            this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }), frameRate: 1 });
            this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }), frameRate: 1 });
            this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }), frameRate: 10 });
            
            // ===== ANIMAÇÕES CORRIGIDAS DOS ORCS =====
            this.anims.create({ 
                key: 'orc-walk', 
                frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 3 }), 
                frameRate: 4, 
                repeat: -1 
            });
            
            // ===== ATAQUE SEM ANIMAÇÃO (SÓ PARADO) =====
            this.anims.create({ 
                key: 'orcAtacando', 
                frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 0 }), 
                frameRate: 1, 
                repeat: 0 
            });
            
            // ===== MORTE (frames 40-43) =====
            this.anims.create({ 
                key: 'orcMorrendo', 
                frames: this.anims.generateFrameNumbers('orc', { start: 40, end: 43 }), 
                frameRate: 4, 
                repeat: 0 
            });
        }
    }

    exibirMensagemPortal() {
        this.mensagemPortal.setAlpha(1);
        if (this.timerMensagem) this.timerMensagem.remove();
        this.timerMensagem = this.time.delayedCall(3000, () => {
            this.mensagemPortal.setAlpha(0);
        });
    }

    transicaoParaMapa() {
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
        
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.restart();
        });
    }

    transicaoParaProximoMapa() {
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
        
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MapaSombrio', {
                vidas: this.currentLives,
                fragmentosColetados: this.fragmentosColetados
            });
        });
    }

    update() {
        if (!this.transicaoFeita && this.player.x >= 750) {
            this.transicaoFeita = true;
            this.transicaoParaMapa();
            return;
        }

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
                // ===== VERIFICAR DANO NOS ORCS COM SISTEMA MELHORADO =====
                this.orcs.children.iterate((orc) => {
                    if (orc && !orc.isDead && !orc.destroyed) {
                        const distOrc = Phaser.Math.Distance.Between(this.player.x, this.player.y, orc.x, orc.y);
                        if (distOrc < 60 && this.time.now - orc.lastHit > 500) {
                            orc.health--;
                            orc.lastHit = this.time.now;
                            
                            console.log(`Orc tomou dano! Vida restante: ${orc.health}`);
                            
                            if (orc.health <= 0) {
                                // ===== MORTE: SUMIR IMEDIATAMENTE =====
                                orc.isDead = true;
                                orc.setVelocityX(0);
                                orc.setVelocityY(0);
                                orc.isAttacking = false;
                                
                                // ===== REMOVER COLISÕES E FAZER FADE OUT =====
                                this.physics.world.removeCollider(orc);
                                
                                this.tweens.add({
                                    targets: orc,
                                    alpha: 0,
                                    duration: 500,
                                    onComplete: () => {
                                        if (orc && !orc.destroyed) {
                                            orc.destroy();
                                            console.log("Orc destruído!");
                                        }
                                    }
                                });
                            } else {
                                // ===== EFEITO VISUAL DE DANO SEM ANIMAÇÃO PROBLEMÁTICA =====
                                const wasAttacking = orc.isAttacking;
                                const currentVelocity = orc.body.velocity.x;
                                
                                orc.isAttacking = true;
                                orc.setVelocityX(0);
                                orc.setVelocityY(0);
                                
                                // ===== EFEITO VISUAL SIMPLES: PISCAR VERMELHO =====
                                orc.setTint(0xff0000);
                                
                                this.time.delayedCall(200, () => {
                                    if (orc && !orc.isDead && !orc.destroyed) {
                                        orc.clearTint();
                                        orc.isAttacking = false;
                                        
                                        // ===== VOLTAR A ANDAR NORMALMENTE =====
                                        if (Math.abs(currentVelocity) > 5) {
                                            orc.setVelocityX(currentVelocity);
                                        }
                                    }
                                });
                            }
                        }
                    }
                });
                return;
            }
        }

        if (this.player.body.blocked.down) this.jumpCount = 0;

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
        const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
                           Phaser.Input.Keyboard.JustDown(this.keys.up) || 
                           Phaser.Input.Keyboard.JustDown(this.keys.space);
                           
        if (jumpPressed && this.jumpCount < this.maxJumps) {
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

        // ===== ATUALIZAR ORCS COM VERIFICAÇÃO DE SEGURANÇA =====
        this.orcs.children.iterate((orc) => {
            if (orc && !orc.destroyed) {
                orc.update();
            }
        });

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
            
            this.scene.start('Mapa1', {
                voltarPeloLadoEsquerdo: true,
                fragmentosColetados: this.fragmentosColetados,
                vidas: this.currentLives
            });
        }

        // ===== ATUALIZAR SOM DE PASSOS =====
        this.updateStepSound();
    }
}