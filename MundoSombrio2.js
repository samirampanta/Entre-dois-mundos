export default class MundoNormalScene_1 extends Phaser.Scene {
    constructor() {
        super({ key: 'MapaSombrio2' });
    }

    preload() {
        this.load.image('AllSprites', 'assets/AllSprites.png');
        this.load.image('Background', 'assets/Background1.png');
        this.load.image('dark_castle_tileset', 'assets/dark_castle_tileset.png');
        this.load.tilemapTiledJSON('mapa5', 'assets/mundosombrio2.json');
        this.load.image('heart', 'assets/Hearts.png');
        this.load.spritesheet('portal', 'assets/Portal_100x100px.png', { frameWidth: 100, frameHeight: 100 });

        this.load.spritesheet('itens', 'assets/rpgItems.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('inimigos', 'assets/enemies-spritesheet.png', { frameWidth: 20, frameHeight: 20 });
        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', { frameWidth: 50, frameHeight: 37 });
        this.load.spritesheet('orc', 'assets/Orc.png', { frameWidth: 100, frameHeight: 64 });

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
        this.portalUsado = false;
        this.timerMensagem = null;

        // ===== CONFIGURAÇÃO DE ÁUDIO =====
        this.setupAudio();

        // ===== CONFIGURAÇÃO DE CONTROLE DE PASSOS =====
        this.isWalking = false;
        this.stepTimer = 0;
        this.stepInterval = 400;

        const map = this.make.tilemap({ key: 'mapa5' });
        const tileset = map.addTilesetImage('AllSprites', 'AllSprites');
        const tileset2 = map.addTilesetImage('Background', 'Background');
        const tileset3 = map.addTilesetImage('dark_castle_tileset', 'dark_castle_tileset');

        map.createLayer('Camada de Blocos 2', tileset2, 0, 0);
        map.createLayer('Camada de Blocos 3', tileset3, 0, 0);
        const layer1 = map.createLayer('Camada de Blocos 1', tileset3, 0, 0);

        if (layer1) layer1.setCollisionByExclusion([-1]);

        const fragmento1 = this.physics.add.staticSprite(560, 40, 'itens', 24).setScale(1.5);
        const fragmento2 = this.physics.add.staticSprite(70, 50, 'itens', 24).setScale(1.5);

        // ===== INIMIGO PEQUENO CORRIGIDO (TAMANHO ORIGINAL) =====
        this.inimigo = this.physics.add.sprite(300, 100, 'inimigos').setScale(2); // ===== VOLTOU PARA SCALE 2 =====
        this.inimigo.play('andarInimigo');
        this.inimigo.setVelocityX(50);
        this.inimigo.setBounce(1, 0);
        this.inimigo.setCollideWorldBounds(true);
        this.physics.add.collider(this.inimigo, layer1);
        this.inimigo.health = 1;
        this.inimigo.isDead = false;
        this.inimigo.isAttacking = false;
        this.inimigo.lastHit = 0;

        // ===== CONFIGURAÇÃO CORRIGIDA DO ORC (linha ~47 do arquivo) =====
        this.orc = this.physics.add.sprite(500, 150, 'orc').setScale(2); // ===== Y AJUSTADO PARA 150 =====
        this.orc.play('orcAndando');
        this.orc.setCollideWorldBounds(true);
        this.orc.health = 3;
        this.orc.isDead = false;
        this.orc.isAttacking = false;
        this.orc.lastHit = 0;
        this.orc.patrolDirection = 1;
        this.orc.lastDirectionChange = 0; // ===== CONTROLE DE MUDANÇA DE DIREÇÃO =====

        // ===== FÍSICA CORRIGIDA - HITBOX REALISTA =====
        this.orc.setSize(50, 60);  // ===== HITBOX AJUSTADA =====
        this.orc.setOffset(25, 4); // ===== OFFSET PARA GRUDAR NO CHÃO =====

        // ===== GRAVIDADE E FÍSICA PARA FICAR NO CHÃO =====
        this.orc.body.setGravityY(400); // ===== GRAVIDADE MAIOR =====
        this.orc.body.setMaxVelocity(200, 800);
        this.orc.body.setDragX(150); // ===== DRAG MAIOR PARA ESTABILIDADE =====

        this.physics.add.collider(this.orc, layer1);

        this.player = this.physics.add.sprite(100, 100, 'adventurer', 0).setScale(2);
        this.player.setBodySize(25, 30);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, layer1);

        this.setupUI();

        // ===== SONS AO COLETAR FRAGMENTOS =====
        [fragmento1, fragmento2].forEach(fragmento => {
            this.physics.add.overlap(this.player, fragmento, () => {
                fragmento.destroy();
                this.fragmentosColetados++;
                this.textoFragmento.setText(`Fragmentos: ${this.fragmentosColetados}/3`);

                // TOCAR SOM DE COLETA
                this.sounds.collect.play();
            });
        });

        this.player.isInvulnerable = false;

        // ===== COLISÕES COM SOM =====
        this.physics.add.overlap(this.player, this.inimigo, () => {
            if (!this.player.isInvulnerable && !this.inimigo.isDead) {
                this.currentLives--;
                this.updateHearts();

                // ===== TOCAR SOM DE DANO =====
                this.sounds.damage.play();

                this.player.isInvulnerable = true;
                this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
            }
        });

        // ===== COLISÃO COM ORC COM SOM E ANIMAÇÃO MELHORADA =====
        this.physics.add.overlap(this.player, this.orc, () => {
            if (!this.player.isInvulnerable && !this.orc.isDead) {
                if (!this.orc.isAttacking) {
                    this.orc.isAttacking = true;

                    // ===== TOCAR SOM DE ATAQUE DO ORC =====
                    this.sounds.orcAttack.play();

                    this.orc.setVelocityX(0);
                    this.orc.flipX = this.player.x < this.orc.x;

                    const attackFixedY = this.orc.y;
                    this.orc.play('orcAtacando', true);

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

                    this.time.delayedCall(500, () => {
                        if (!this.player.isInvulnerable && !this.orc.isDead) {
                            this.currentLives--;
                            this.updateHearts();

                            this.sounds.damage.play();

                            this.player.isInvulnerable = true;
                            this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
                        }
                    });

                    this.orc.once('animationcomplete', () => {
                        attackTimer.destroy();
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

        this.createAnimations();
        this.setupPortal();
    }

    // ===== CONFIGURAÇÃO DE ÁUDIO =====
    setupAudio() {
        this.sounds = {
            step: this.sound.add('stepSound', { volume: 0.2 }),
            jump: this.sound.add('jumpSound', { volume: 0.5 }),
            collect: this.sound.add('collectSound', { volume: 0.2 }),
            damage: this.sound.add('damageSound', { volume: 0.6 }),
            attack: this.sound.add('attackSound', { volume: 0.5 }),
            orcAttack: this.sound.add('orcAttackSound', { volume: 0.2 }) // ===== SOM DO ORC =====
        };

        this.stepSoundPlaying = false;
        console.log("Sistema de áudio configurado - MapaSombrio2!");
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
        this.maxLives = 3;
        this.heartIcon = this.add.image(20, 20, 'heart').setScale(0.3).setScrollFactor(0);
        this.vidaTexto = this.add.text(40, 10, `${this.currentLives}/${this.maxLives}`, {
            fontSize: '16px',
            fill: '#ffffff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);

        this.textoFragmento = this.add.text(90, 10, `Fragmentos: ${this.fragmentosColetados}/3`, {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'Arial'
        }).setScrollFactor(0);

        this.missaoTitulo = this.add.text(20, 80, '📜 Missão', {
            fontFamily: 'Arial', fontSize: '18px', fill: '#ffff66', fontStyle: 'bold'
        }).setScrollFactor(0);

        this.missaoTexto = this.add.text(10, 105, '☐ Encontrar e salvar Lira', {
            fontFamily: 'Arial', fontSize: '16px', fill: '#ffffff', lineSpacing: 6
        }).setScrollFactor(0);

        this.updateHearts();
    }

    setupPortal() {
        this.portal = this.physics.add.staticSprite(700, 100, 'portal');
        this.portal.play('portal_anim');

        this.mensagemPortal = this.add.text(400, 300, 'Colete todos os fragmentos para usar o portal!', {
            fontSize: '20px',
            fill: '#ff0000',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 15, y: 5 },
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
    }

    updateHearts() {
        if (this.vidaTexto) {
            this.vidaTexto.setText(`${this.currentLives}/${this.maxLives}`);
        }
    
        if (this.currentLives <= 0) {
            // ===== SALVAR ESTADO NO GAMESTATE GLOBAL =====
            gameState.mundoAtual = 'MapaSombrio2';
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

        if (!this.anims.exists('andarInimigo')) {
            this.anims.create({ key: 'andarInimigo', frames: this.anims.generateFrameNumbers('inimigos', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
            this.anims.create({ key: 'inimigoMorrendo', frames: this.anims.generateFrameNumbers('inimigos', { start: 2, end: 3 }), frameRate: 6, repeat: 0 });
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
            this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }), frameRate: 12, repeat: -1 });
            this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }), frameRate: 1, repeat: 0 });
            this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }), frameRate: 1, repeat: 0 });
            this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }), frameRate: 10, repeat: 0 });

            // ===== ANIMAÇÕES CORRIGIDAS DO ORC =====
            this.anims.create({
                key: 'orcAndando',
                frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 3 }),
                frameRate: 6,
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
            this.scene.start('Boss', {
                vidas: this.currentLives,
                fragmentosColetados: this.fragmentosColetados
            });
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
            this.scene.start('MapaSombrio2', {
                voltarPeloLadoEsquerdo: false,
                fragmentosColetados: this.fragmentosColetados,
                vidas: this.currentLives,
                mapaAtual: 'mundosombrio2.json'
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

            this.sounds.attack.play();
            return;
        }

        if (this.isAttacking) {
            if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'attack') {
                this.isAttacking = false;
            } else {
                // ===== VERIFICAR DANO NO ORC =====
                if (this.orc && !this.orc.isDead) {
                    const distOrc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.orc.x, this.orc.y);
                    if (distOrc < 60 && this.time.now - this.orc.lastHit > 500) {
                        this.orc.health--;
                        this.orc.lastHit = this.time.now;

                        console.log(`Orc tomou dano! Vida restante: ${this.orc.health}`);

                        if (this.orc.health <= 0) {
                            this.orc.isDead = true;
                            this.orc.setVelocityX(0);
                            this.orc.setVelocityY(0);
                            this.orc.isAttacking = false;

                            this.physics.world.removeCollider(this.orc);

                            this.tweens.add({
                                targets: this.orc,
                                alpha: 0,
                                duration: 500,
                                onComplete: () => {
                                    if (this.orc && !this.orc.destroyed) {
                                        this.orc.destroy();
                                        this.orc = null;
                                        console.log("Orc destruído!");
                                    }
                                }
                            });
                        } else {
                            const wasAttacking = this.orc.isAttacking;
                            const currentVelocity = this.orc.body.velocity.x;

                            this.orc.isAttacking = true;
                            this.orc.setVelocityX(0);
                            this.orc.setVelocityY(0);

                            this.orc.play('orcAndando', true);
                            this.orc.anims.pause();
                            this.orc.setTint(0xff0000);

                            this.time.delayedCall(200, () => {
                                if (this.orc && !this.orc.isDead) {
                                    this.orc.clearTint();
                                    this.orc.anims.resume();
                                    this.orc.isAttacking = false;

                                    this.orc.play('orcAndando', true);
                                    if (Math.abs(currentVelocity) > 5) {
                                        this.orc.setVelocityX(currentVelocity);
                                    }
                                }
                            });
                        }
                    }
                }

                // ===== VERIFICAR DANO NO INIMIGO =====
                if (this.inimigo && !this.inimigo.isDead) {
                    const distInimigo = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.inimigo.x, this.inimigo.y);
                    if (distInimigo < 60 && this.time.now - (this.inimigo.lastHit || 0) > 500) {
                        this.inimigo.health--;
                        this.inimigo.lastHit = this.time.now;

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
        const isJumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.space);

        if (isJumpPressed && this.jumpCount < this.maxJumps) {
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

        // ===== TRANSIÇÃO PARA PRÓXIMO MAPA =====
        if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
            this.transicaoParaMapa();
            return;
        }

        // ===== IA CORRIGIDA DO ORC (SEM TREMULAÇÃO) =====
        if (this.orc && !this.orc.isDead && !this.orc.isAttacking && !this.orc.destroyed) {
            const currentTime = Date.now();
            const distance = Phaser.Math.Distance.Between(this.orc.x, this.orc.y, this.player.x, this.player.y);

            const directionChangeCooldown = 800;

            if (distance < 120) {
                // ===== PERSEGUIR COM ZONA MORTA =====
                const speed = 40;
                const deadZone = 25;

                if (currentTime - this.orc.lastDirectionChange > directionChangeCooldown) {
                    if (this.player.x > this.orc.x + deadZone) {
                        this.orc.setVelocityX(speed);
                        this.orc.flipX = false;
                        this.orc.patrolDirection = 1;
                        this.orc.lastDirectionChange = currentTime;
                    } else if (this.player.x < this.orc.x - deadZone) {
                        this.orc.setVelocityX(-speed);
                        this.orc.flipX = true;
                        this.orc.patrolDirection = -1;
                        this.orc.lastDirectionChange = currentTime;
                    }
                }

            } else {
                // ===== PATRULHAMENTO ESTÁVEL =====
                const patrolSpeed = 25;

                const nearLeftEdge = this.orc.x <= 80;
                const nearRightEdge = this.orc.x >= 720;
                const hitWall = this.orc.body.blocked.left || this.orc.body.blocked.right;

                if ((nearLeftEdge || nearRightEdge || hitWall) &&
                    currentTime - this.orc.lastDirectionChange > 500) {

                    this.orc.patrolDirection *= -1;
                    this.orc.flipX = this.orc.patrolDirection < 0;
                    this.orc.lastDirectionChange = currentTime;
                }

                this.orc.setVelocityX(patrolSpeed * this.orc.patrolDirection);
            }

            if (this.orc.anims.currentAnim?.key !== 'orcAndando') {
                this.orc.play('orcAndando', true);
            }
        }

        // ===== IA DO INIMIGO PEQUENO =====
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