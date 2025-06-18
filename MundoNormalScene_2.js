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

        // ===== CRIAÇÃO DOS ORCS COM A MESMA LÓGICA DO MAPA1 =====
        this.orc1 = this.physics.add.sprite(300, 100, 'orc').setScale(2);
        this.orc1.play('orcAndando');
        this.orc1.setCollideWorldBounds(true);
        this.orc1.health = 3;
        this.orc1.isDead = false;
        this.orc1.isAttacking = false;
        this.orc1.lastHit = 0;
        this.orc1.patrolDirection = 1; // Direção inicial
        this.orc1.setSize(35, 40);
        this.orc1.setOffset(40, 20);
        this.physics.add.collider(this.orc1, layer1);

        this.orc2 = this.physics.add.sprite(500, 100, 'orc').setScale(2);
        this.orc2.play('orcAndando');
        this.orc2.setCollideWorldBounds(true);
        this.orc2.health = 3;
        this.orc2.isDead = false;
        this.orc2.isAttacking = false;
        this.orc2.lastHit = 0;
        this.orc2.patrolDirection = -1; // Direção inicial oposta
        this.orc2.setSize(35, 40);
        this.orc2.setOffset(40, 20);
        this.physics.add.collider(this.orc2, layer1);

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

        this.player.isInvulnerable = false;

        // ===== COLISÃO COM ORC1 COM SOM E ANIMAÇÃO MELHORADA =====
        this.physics.add.overlap(this.player, this.orc1, () => {
            if (!this.player.isInvulnerable && !this.orc1.isDead) {
                if (!this.orc1.isAttacking) {
                    this.orc1.isAttacking = true;
                    
                    // ===== TOCAR SOM DE ATAQUE DO ORC =====
                    this.sounds.orcAttack.play();
                    
                    this.orc1.setVelocityX(0);
                    this.orc1.flipX = this.player.x < this.orc1.x;
                    
                    const attackFixedY = this.orc1.y;
                    this.orc1.play('orcAtacando', true);
                    
                    const attackTimer = this.time.addEvent({
                        delay: 50,
                        repeat: -1,
                        callback: () => {
                            if (this.orc1 && !this.orc1.destroyed && this.orc1.anims.currentAnim?.key === 'orcAtacando') {
                                this.orc1.setY(attackFixedY);
                                this.orc1.setVelocityX(0);
                                this.orc1.setVelocityY(0);
                            }
                        }
                    });
                    
                    this.time.delayedCall(500, () => {
                        if (!this.player.isInvulnerable && !this.orc1.isDead) {
                            this.currentLives--;
                            this.updateHearts();
                            this.sounds.damage.play();
                            this.player.isInvulnerable = true;
                            this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
                        }
                    });
                    
                    this.orc1.once('animationcomplete', () => {
                        attackTimer.destroy();
                        if (!this.orc1.isDead) {
                            this.orc1.isAttacking = false;
                            this.orc1.play('orcAndando', true);
                        }
                    });
                }
            }
        }, null, this);

        // ===== COLISÃO COM ORC2 COM SOM E ANIMAÇÃO MELHORADA =====
        this.physics.add.overlap(this.player, this.orc2, () => {
            if (!this.player.isInvulnerable && !this.orc2.isDead) {
                if (!this.orc2.isAttacking) {
                    this.orc2.isAttacking = true;
                    
                    // ===== TOCAR SOM DE ATAQUE DO ORC =====
                    this.sounds.orcAttack.play();
                    
                    this.orc2.setVelocityX(0);
                    this.orc2.flipX = this.player.x < this.orc2.x;
                    
                    const attackFixedY = this.orc2.y;
                    this.orc2.play('orcAtacando', true);
                    
                    const attackTimer = this.time.addEvent({
                        delay: 50,
                        repeat: -1,
                        callback: () => {
                            if (this.orc2 && !this.orc2.destroyed && this.orc2.anims.currentAnim?.key === 'orcAtacando') {
                                this.orc2.setY(attackFixedY);
                                this.orc2.setVelocityX(0);
                                this.orc2.setVelocityY(0);
                            }
                        }
                    });
                    
                    this.time.delayedCall(500, () => {
                        if (!this.player.isInvulnerable && !this.orc2.isDead) {
                            this.currentLives--;
                            this.updateHearts();
                            this.sounds.damage.play();
                            this.player.isInvulnerable = true;
                            this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
                        }
                    });
                    
                    this.orc2.once('animationcomplete', () => {
                        attackTimer.destroy();
                        if (!this.orc2.isDead) {
                            this.orc2.isAttacking = false;
                            this.orc2.play('orcAndando', true);
                        }
                    });
                }
            }
        }, null, this);

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

    setupUI() {
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
    }

    updateHearts() {
        if (this.vidaTexto) {
            this.vidaTexto.setText(`${this.currentLives}/${this.maxLives}`);
        }
        
        if (this.currentLives <= 0) {
            // ===== SALVAR ESTADO NO GAMESTATE GLOBAL =====
            gameState.mundoAtual = 'Mapa2';
            gameState.fragmentosColetados = this.fragmentosColetados;
            gameState.vidas = this.currentLives;
            
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
            
            // ===== ANIMAÇÕES DOS ORCS IGUAIS AO MAPA1 =====
            this.anims.create({ 
                key: 'orcAndando', 
                frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 3 }), 
                frameRate: 4, 
                repeat: -1 
            });
            
            this.anims.create({ 
                key: 'orcAtacando', 
                frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 0 }),
                frameRate: 1,
                repeat: 0
            });
            
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

    // ===== FUNÇÃO PARA ATUALIZAR IA DOS ORCS (MESMA LÓGICA DO MAPA1) =====
    updateOrcAI(orc) {
        if (!orc || orc.isDead || orc.isAttacking || orc.destroyed) {
            return;
        }

        const distance = Phaser.Math.Distance.Between(orc.x, orc.y, this.player.x, this.player.y);
        
        if (distance < 120) {
            // ===== PERSEGUIR O PLAYER =====
            const speed = 35;
            
            if (this.player.x > orc.x) {
                orc.setVelocityX(speed);
                orc.flipX = false;
            } else {
                orc.setVelocityX(-speed);
                orc.flipX = true;
            }
            
            if (orc.anims.currentAnim?.key !== 'orcAndando') {
                orc.play('orcAndando', true);
            }
            
        } else {
            // ===== PATRULHAMENTO =====
            if (!orc.patrolDirection) {
                orc.patrolDirection = 1;
            }
            
            orc.setVelocityX(20 * orc.patrolDirection);
            orc.flipX = orc.patrolDirection < 0;
            
            // ===== INVERTER DIREÇÃO NAS BORDAS =====
            if (orc.body.blocked.left || orc.body.blocked.right || 
                orc.x <= 50 || orc.x >= 750) {
                orc.patrolDirection *= -1;
            }
            
            if (orc.anims.currentAnim?.key !== 'orcAndando') {
                orc.play('orcAndando', true);
            }
        }
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
            
            this.sounds.attack.play();
            return;
        }

        if (this.isAttacking) {
            if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'attack') {
                this.isAttacking = false;
            } else {
                // ===== VERIFICAR DANO NO ORC1 =====
                if (this.orc1 && !this.orc1.isDead) {
                    const distOrc1 = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.orc1.x, this.orc1.y);
                    if (distOrc1 < 60 && this.time.now - this.orc1.lastHit > 500) {
                        this.orc1.health--;
                        this.orc1.lastHit = this.time.now;
                        
                        console.log(`Orc1 tomou dano! Vida restante: ${this.orc1.health}`);
                        
                        if (this.orc1.health <= 0) {
                            this.orc1.isDead = true;
                            this.orc1.setVelocityX(0);
                            this.orc1.setVelocityY(0);
                            this.orc1.isAttacking = false;
                            
                            this.physics.world.removeCollider(this.orc1);
                            
                            this.tweens.add({
                                targets: this.orc1,
                                alpha: 0,
                                duration: 500,
                                onComplete: () => {
                                    if (this.orc1 && !this.orc1.destroyed) {
                                        this.orc1.destroy();
                                        this.orc1 = null;
                                        console.log("Orc1 destruído!");
                                    }
                                }
                            });
                        } else {
                            const wasAttacking = this.orc1.isAttacking;
                            const currentVelocity = this.orc1.body.velocity.x;
                            
                            this.orc1.isAttacking = true;
                            this.orc1.setVelocityX(0);
                            this.orc1.setVelocityY(0);
                            
                            this.orc1.play('orcAndando', true);
                            this.orc1.anims.pause();
                            this.orc1.setTint(0xff0000);
                            
                            this.time.delayedCall(200, () => {
                                if (this.orc1 && !this.orc1.isDead) {
                                    this.orc1.clearTint();
                                    this.orc1.anims.resume();
                                    this.orc1.isAttacking = false;
                                    this.orc1.play('orcAndando', true);
                                    if (Math.abs(currentVelocity) > 5) {
                                        this.orc1.setVelocityX(currentVelocity);
                                    }
                                }
                            });
                        }
                    }
                }

                // ===== VERIFICAR DANO NO ORC2 =====
                if (this.orc2 && !this.orc2.isDead) {
                    const distOrc2 = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.orc2.x, this.orc2.y);
                    if (distOrc2 < 60 && this.time.now - this.orc2.lastHit > 500) {
                        this.orc2.health--;
                        this.orc2.lastHit = this.time.now;
                        
                        console.log(`Orc2 tomou dano! Vida restante: ${this.orc2.health}`);
                        
                        if (this.orc2.health <= 0) {
                            this.orc2.isDead = true;
                            this.orc2.setVelocityX(0);
                            this.orc2.setVelocityY(0);
                            this.orc2.isAttacking = false;
                            
                            this.physics.world.removeCollider(this.orc2);
                            
                            this.tweens.add({
                                targets: this.orc2,
                                alpha: 0,
                                duration: 500,
                                onComplete: () => {
                                    if (this.orc2 && !this.orc2.destroyed) {
                                        this.orc2.destroy();
                                        this.orc2 = null;
                                        console.log("Orc2 destruído!");
                                    }
                                }
                            });
                        } else {
                            const wasAttacking = this.orc2.isAttacking;
                            const currentVelocity = this.orc2.body.velocity.x;
                            
                            this.orc2.isAttacking = true;
                            this.orc2.setVelocityX(0);
                            this.orc2.setVelocityY(0);
                            
                            this.orc2.play('orcAndando', true);
                            this.orc2.anims.pause();
                            this.orc2.setTint(0xff0000);
                            
                            this.time.delayedCall(200, () => {
                                if (this.orc2 && !this.orc2.isDead) {
                                    this.orc2.clearTint();
                                    this.orc2.anims.resume();
                                    this.orc2.isAttacking = false;
                                    this.orc2.play('orcAndando', true);
                                    if (Math.abs(currentVelocity) > 5) {
                                        this.orc2.setVelocityX(currentVelocity);
                                    }
                                }
                            });
                        }
                    }
                }
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
            
            if (this.stepSoundPlaying) {
                this.sounds.step.stop();
                this.stepSoundPlaying = false;
            }
        }

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
            
            this.sounds.jump.play();
        } else if (!this.player.body.blocked.down) {
            this.player.anims.play(this.player.body.velocity.y < 0 ? 'jump' : 'fall', true);
        } else if (isMoving) {
            this.player.anims.play('run', true);
        } else {
            this.player.anims.play('idle', true);
        }

        // ===== ATUALIZAR IA DOS ORCS =====
        this.updateOrcAI(this.orc1);
        this.updateOrcAI(this.orc2);

        if (this.player.x <= this.player.width / 2) {
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