export default class MundoNormalScene_1 extends Phaser.Scene {
    constructor() {
        super({ key: 'Boss' });
    }

    preload() {
        this.load.image('AllSprites', 'assets/AllSprites.png');
        this.load.image('Background', 'assets/Background1.png');
        this.load.image('dark_castle_tileset', 'assets/dark_castle_tileset.png');
        this.load.tilemapTiledJSON('mapa4', 'assets/mapaboss_embutido.json');
        this.load.image('lira', 'assets/lira_presa.png');
        this.load.image('heart', 'assets/Hearts.png');

        this.load.spritesheet('itens', 'assets/rpgItems.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('inimigos', 'assets/enemies-spritesheet.png', { frameWidth: 20, frameHeight: 20 });
        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', { frameWidth: 50, frameHeight: 37 });
        
        for (let i = 1; i <= 6; i++) {
            this.load.image(`demon_idle_${i}`, `assets/boss/01_demon_idle/demon_idle_${i}.png`);
        }
        for (let i = 1; i <= 12; i++) {
            this.load.image(`demon_walk_${i}`, `assets/boss/02_demon_walk/demon_walk_${i}.png`);
        }
        for (let i = 1; i <= 15; i++) {
            this.load.image(`demon_cleave_${i}`, `assets/boss/03_demon_cleave/demon_cleave_${i}.png`);
        }
        for (let i = 1; i <= 5; i++) {
            this.load.image(`demon_hit_${i}`, `assets/boss/04_demon_take_hit/demon_take_hit_${i}.png`);
        }
        for (let i = 1; i <= 22; i++) {
            this.load.image(`demon_death_${i}`, `assets/boss/05_demon_death/demon_death_${i}.png`);
        }

        // ===== CARREGAMENTO DOS SONS DO BOSS =====
        this.load.audio('stepSound', 'assets/sounds/andar.wav');
        this.load.audio('jumpSound', 'assets/sounds/pulo.wav');
        this.load.audio('attackSound', 'assets/sounds/ataque.wav');
        this.load.audio('damageSound', 'assets/sounds/dano.wav');
        this.load.audio('collectSound', 'assets/sounds/fragmento.wav');
        this.load.audio('bossBgMusic', 'assets/sounds/Treachery.mp3');
    }

    create(data) {
        this.currentLives = data?.vidas ?? 3;
        
        // ===== CONFIGURAÇÃO DE ÁUDIO DO BOSS =====
        this.setupBossAudio();
        
        // ===== CONFIGURAÇÃO DE SOM DE PASSOS =====
        this.isWalking = false;
        this.stepTimer = 0;
        this.stepInterval = 400;
        
        const map = this.make.tilemap({ key: 'mapa4' });
        const tileset = map.addTilesetImage('AllSprites', 'AllSprites');
        const tileset3 = map.addTilesetImage('dark_castle_tileset', 'dark_castle_tileset');

        // ===== ADICIONAR COLISÃO COM LAYER1 =====
        const layer1 = map.createLayer('Camada de Blocos 1', tileset3, 0, 0);
        map.createLayer('Camada de Blocos 2', tileset3, 0, 0);
        map.createLayer('Camada de Blocos 3', tileset3, 0, 0);
        map.createLayer('Camada de Blocos 4', tileset3, 0, 0);

        layer1.setCollisionByExclusion([-1]);

        // ===== ARMAZENAR LAYER1 PARA USO POSTERIOR =====
        this.layer1 = layer1;

        this.player = this.physics.add.sprite(100, 100, 'adventurer', 0).setScale(2);
        this.player.setBodySize(20, 24);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.layer1);
        this.player.isInvulnerable = false;

        this.inimigo = this.physics.add.sprite(500, 100, 'inimigos').setScale(2);
        this.inimigo.play('andarInimigo');
        this.inimigo.setVelocityX(50);
        this.inimigo.setBounce(1, 0);
        this.inimigo.setCollideWorldBounds(true);
        this.physics.add.collider(this.inimigo, this.layer1);
        this.inimigo.health = 3; // 3 hits para inimigo pequeno
        this.inimigo.isDead = false;
        this.inimigo.isAttacking = false;

        this.lira = this.physics.add.staticImage(730, 30, 'lira').setScale(0.05);
        
        this.physics.add.overlap(this.player, this.lira, () => {
            this.missaoTexto.setText('☑ Encontrar e salvar Lira');
        }, null, this);

        this.liraDialogo = this.add.text(this.lira.x, this.lira.y - 15, 'Eron!!!! Socorro!', {
            fontFamily: 'Arial', fontSize: '14px', fill: '#ffffff', backgroundColor: '#000000',
            padding: { x: 6, y: 3 }, align: 'center'
        }).setOrigin(1.1, 0.5).setScrollFactor(0);

        this.time.delayedCall(4000, () => this.liraDialogo.setVisible(false));

        this.setupUI();
        this.setupControls();
        this.setupAnimations();
        this.setupDemon();
        this.setupOverlaps();
        this.setupLiraSave();

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        this.scale.resize(mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.shake(500, 0.01);

        this.orc = null;
    }

    setupBossAudio() {
        this.bossAudio = {
            bgMusic: this.sound.add('bossBgMusic', { loop: true, volume: 0.3 }),
            playerDamage: this.sound.add('damageSound', { volume: 0.7 }),
            step: this.sound.add('stepSound', { volume: 0.3 }),
            jump: this.sound.add('jumpSound', { volume: 0.5 }),
            attack: this.sound.add('attackSound', { volume: 0.5 }),
            collect: this.sound.add('collectSound', { volume: 0.6 })
        };

        this.bossAudio.bgMusic.play();
        this.stepSoundPlaying = false;
        
        console.log("Sistema de áudio do BOSS configurado!");
    }

    updateStepSound() {
        const currentTime = this.time.now;
        
        const isActuallyMoving = this.isWalking && 
                                this.player.body.blocked.down && 
                                Math.abs(this.player.body.velocity.x) > 50;
        
        if (isActuallyMoving) {
            if (!this.stepSoundPlaying && currentTime - this.stepTimer > this.stepInterval) {
                this.bossAudio.step.play();
                this.stepTimer = currentTime;
                this.stepSoundPlaying = true;
                
                this.time.delayedCall(300, () => {
                    this.stepSoundPlaying = false;
                });
            }
        } else {
            if (this.stepSoundPlaying) {
                this.bossAudio.step.stop();
                this.stepSoundPlaying = false;
            }
        }
    }

    setupUI() {
        this.heartIcon = this.add.image(20, 20, 'heart').setScale(0.3).setScrollFactor(0);
        this.vidaTexto = this.add.text(40, 10, `${this.currentLives}/3`, {
            fontSize: '16px', fill: '#ffffff', fontFamily: 'Arial'
        }).setScrollFactor(0);

        this.missaoTitulo = this.add.text(20, 80, '📜 Missão', {
            fontFamily: 'Arial', fontSize: '18px', fill: '#ffff66', fontStyle: 'bold'
        }).setScrollFactor(0);

        this.missaoTexto = this.add.text(10, 105, '☐ Encontrar e salvar Lira', {
            fontFamily: 'Arial', fontSize: '16px', fill: '#ffffff', lineSpacing: 6
        }).setScrollFactor(0);
    }

    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            attack: Phaser.Input.Keyboard.KeyCodes.ENTER,
            salvar: Phaser.Input.Keyboard.KeyCodes.E
        });

        this.jumpCount = 0;
        this.maxJumps = 2;
        this.transicaoFeita = false;
        this.isAttacking = false;
        
        // ===== CONTROLE DE ATAQUE ÚNICO =====
        this.attackHasHit = false; // Flag para controlar se o ataque já acertou
    }

    setupAnimations() {
        this.anims.create({ key: 'andarInimigo', frames: this.anims.generateFrameNumbers('inimigos', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'inimigoMorrendo', frames: this.anims.generateFrameNumbers('inimigos', { start: 2, end: 3 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }), frameRate: 10, repeat: 0 });

        this.anims.create({
            key: 'demonIdle',
            frames: Array.from({ length: 6 }, (_, i) => ({ key: `demon_idle_${i + 1}` })),
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'demonAndando',
            frames: Array.from({ length: 12 }, (_, i) => ({ key: `demon_walk_${i + 1}` })),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'demonAtacando',
            frames: Array.from({ length: 15 }, (_, i) => ({ key: `demon_cleave_${i + 1}` })),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'demonDano',
            frames: Array.from({ length: 5 }, (_, i) => ({ key: `demon_hit_${i + 1}` })),
            frameRate: 10,
            repeat: 0
        });

        this.anims.create({
            key: 'demonMorrendo',
            frames: Array.from({ length: 22 }, (_, i) => ({ key: `demon_death_${i + 1}` })),
            frameRate: 6,
            repeat: 0
        });
    }

    setupDemon() {
        // ===== POSIÇÃO CORRIGIDA DO BOSS NO CHÃO =====
        this.demon = this.physics.add.sprite(400, 350, 'demon_idle_1').setScale(1.5);
        this.demon.play('demonAndando');
        this.demon.setCollideWorldBounds(true);
        this.demon.setSize(80, 150);
        this.demon.setOffset(100, 40);
        this.demon.health =20; // ===== BOSS AGORA TEM 15 HITS =====
        this.demon.maxHealth = 15;
        this.demon.isDead = false;
        this.demon.isAttacking = false;
        this.demon.isBoss = true;
        this.demon.attackCooldown = 0;
        
        // ===== CONFIGURAR FÍSICA PARA FICAR NO CHÃO =====
        this.demon.body.setGravityY(300);
        this.demon.setDepth(1);
        
        console.log(`Boss criado na posição: x=${this.demon.x}, y=${this.demon.y}, vida: ${this.demon.health} hits`);
    }

    setupOverlaps() {
        // ===== DETECÇÃO DE PROXIMIDADE COM BOSS (SEM DANO IMEDIATO) =====
        this.physics.add.overlap(this.player, this.demon, () => {
            if (!this.demon.isDead && !this.demon.isAttacking && this.time.now > this.demon.attackCooldown) {
                const dx = Math.abs(this.player.x - this.demon.x);
                const dy = Math.abs(this.player.y - this.demon.y);

                // ===== BOSS INICIA ATAQUE QUANDO PLAYER ESTÁ PERTO =====
                if (dx < 60 && dy < 80) {
                    this.demon.isAttacking = true;
                    this.demon.setVelocityX(0);
                    
                    // ===== VIRAR PARA O PLAYER ANTES DE ATACAR =====
                    if (this.player.x > this.demon.x) {
                        this.demon.setFlipX(true);
                    } else {
                        this.demon.setFlipX(false);
                    }
                    
                    this.demon.play('demonAtacando', true);
                    this.demon.attackCooldown = this.time.now + 2000;
                    
                    console.log("🗡️ Boss iniciou ataque! Player pode escapar...");
                    
                    // ===== VERIFICAR DANO APENAS NO FINAL DA ANIMAÇÃO =====
                    this.demon.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
                        this.checkBossDamageAtAnimationEnd();
                        
                        this.demon.isAttacking = false;
                        if (!this.demon.isDead) {
                            this.demon.play('demonAndando', true);
                        }
                    });
                }
            }
        }, null, this);

        // ===== COLISÃO COM INIMIGO PEQUENO =====
        this.physics.add.overlap(this.player, this.inimigo, () => {
            if (!this.player.isInvulnerable && !this.inimigo.isDead) {
                this.currentLives--;
                this.updateHearts();
                
                this.bossAudio.playerDamage.play();
                
                this.player.isInvulnerable = true;
                this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
            }
        }, null, this);
    }

    // ===== NOVA FUNÇÃO: VERIFICAR DANO APENAS NO FINAL DO ATAQUE =====
    checkBossDamageAtAnimationEnd() {
        if (!this.player.isInvulnerable && !this.demon.isDead) {
            const dx = Math.abs(this.player.x - this.demon.x);
            const dy = Math.abs(this.player.y - this.demon.y);
            
            // ===== SÓ APLICA DANO SE PLAYER AINDA ESTIVER NO RANGE NO FINAL =====
            if (dx < 80 && dy < 100) {
                console.log("💥 Player estava no range no final do ataque! Tomou dano!");
                
                this.currentLives--;
                this.updateHearts();
                
                this.bossAudio.playerDamage.play();
                
                this.player.isInvulnerable = true;
                this.time.delayedCall(1000, () => {
                    this.player.isInvulnerable = false;
                });
                
                // ===== EFEITO VISUAL DE DANO (OPCIONAL) =====
                this.cameras.main.shake(200, 0.02);
                
            } else {
                console.log("✅ Player escapou! Estava fora do range no final do ataque!");
            }
        }
    }

    setupLiraSave() {
        this.liraSalva = false;
        this.salvarTexto = this.add.text(this.lira.x, this.lira.y - 10, 'Pressione [E] para salvar Lira', {
            fontFamily: 'Arial', fontSize: '14px', fill: '#ffff00', backgroundColor: '#000000',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
    }

    updateHearts() {
        if (this.vidaTexto) this.vidaTexto.setText(`${this.currentLives}/3`);
        if (this.currentLives <= 0) {
            if (this.bossAudio.bgMusic && this.bossAudio.bgMusic.isPlaying) {
                this.bossAudio.bgMusic.stop();
            }
            
            gameState.fragmentosColetados = 3;
            gameState.mundoAtual = 'Boss';
            gameState.vidas = this.currentLives;
            this.scene.start('GameOverScene');
        }
    }

    transicaoParaMapa() {
        if (this.stepSoundPlaying) {
            this.bossAudio.step.stop();
            this.stepSoundPlaying = false;
        }
        
        Object.values(this.bossAudio).forEach(sound => {
            if (sound && sound.isPlaying) {
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

    movimentarJogador() {
        let isMoving = false;

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
                this.bossAudio.step.stop();
                this.stepSoundPlaying = false;
            }
        }

        if (!isMoving || Math.abs(this.player.body.velocity.x) < 50) {
            this.isWalking = false;
            if (this.stepSoundPlaying) {
                this.bossAudio.step.stop();
                this.stepSoundPlaying = false;
            }
        }

        const isJumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);

        if (isJumpPressed && this.jumpCount < this.maxJumps) {
            this.player.setVelocityY(-350);
            this.player.anims.play('jump', true);
            this.jumpCount++;
            
            this.bossAudio.jump.play();
        } else if (!this.player.body.blocked.down) {
            this.player.anims.play(this.player.body.velocity.y < 0 ? 'jump' : 'fall', true);
        } else if (isMoving) {
            this.player.anims.play('run', true);
        } else {
            this.player.anims.play('idle', true);
        }
    }

    // ===== FUNÇÃO DE DANO CORRIGIDA =====
    verificarDanoInimigos() {
        // Só executa se estiver atacando e o ataque ainda não acertou
        if (!this.isAttacking || this.attackHasHit) {
            return;
        }

        const atacar = (alvo) => {
            if (alvo && !alvo.isDead) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, alvo.x, alvo.y);
                
                // ===== DISTÂNCIA DE ATAQUE ADEQUADA =====
                if (dist < 80) { // Aumentei a distância de ataque para 80 pixels
                    // ===== MARCAR QUE O ATAQUE JÁ ACERTOU =====
                    this.attackHasHit = true;
                    
                    // ===== DANO FIXO DE 1 HIT =====
                    alvo.health -= 1;
                    
                    console.log(`${alvo === this.demon ? 'Boss' : 'Inimigo'} tomou dano! Vida restante: ${alvo.health}/${alvo === this.demon ? this.demon.maxHealth : '3'}`);
                    
                    if (alvo === this.demon) {
                        // ===== BOSS TOMOU DANO =====
                        if (alvo.health > 0) {
                            alvo.play('demonDano', true);
                            
                            alvo.once('animationcomplete', () => {
                                if (!alvo.isDead && !alvo.isAttacking) {
                                    alvo.play('demonAndando', true);
                                }
                            });
                        }
                        
                        if (alvo.health <= 0) {
                            // ===== BOSS MORREU =====
                            alvo.isDead = true;
                            alvo.setVelocityX(0);

                            if (this.bossAudio.bgMusic && this.bossAudio.bgMusic.isPlaying) {
                                this.bossAudio.bgMusic.stop();
                            }
                            
                            console.log("🎉 BOSS DERROTADO!");
                            
                            alvo.play('demonMorrendo', true);
                            alvo.once('animationcomplete', () => alvo.destroy());
                        }
                        
                    } else if (alvo === this.inimigo) {
                        // ===== INIMIGO PEQUENO TOMOU DANO =====
                        if (alvo.health <= 0) {
                            alvo.isDead = true;
                            alvo.setVelocityX(0);
                            
                            alvo.play('inimigoMorrendo', true);
                            alvo.once('animationcomplete', () => alvo.destroy());
                        }
                    }
                }
            }
        };
        
        // Atacar inimigos na ordem correta
        if (this.inimigo) atacar(this.inimigo);
        if (this.demon) atacar(this.demon);
        if (this.orc) atacar(this.orc);
    }

    atualizarInimigo(inimigo) {
        if (!inimigo || inimigo.isDead) return;

        // ===== INTELIGÊNCIA ESPECÍFICA DO BOSS =====
        if (inimigo === this.demon) {
            const dist = Phaser.Math.Distance.Between(inimigo.x, inimigo.y, this.player.x, this.player.y);
            
            if (!inimigo.isAttacking && dist < 500) {
                const speed = 60;
                const distanciaMinima = 15;
                
                if (this.player.x > inimigo.x + distanciaMinima) {
                    inimigo.setVelocityX(speed);
                    inimigo.setFlipX(true);
                } else if (this.player.x < inimigo.x - distanciaMinima) {
                    inimigo.setVelocityX(-speed);
                    inimigo.setFlipX(false);
                } else {
                    inimigo.setVelocityX(0);
                }
                
                if (Math.abs(inimigo.body.velocity.x) > 5) {
                    if (inimigo.anims.currentAnim?.key !== 'demonAndando') {
                        inimigo.play('demonAndando', true);
                    }
                } else {
                    if (inimigo.anims.currentAnim?.key !== 'demonIdle') {
                        inimigo.play('demonIdle', true);
                    }
                }
                
            } else if (!inimigo.isAttacking) {
                inimigo.setVelocityX(0);
                if (inimigo.anims.currentAnim?.key !== 'demonIdle') {
                    inimigo.play('demonIdle', true);
                }
            }
            
            if (inimigo.y < 300) {
                inimigo.body.setVelocityY(100);
            }
            
            return;
        }

        // ===== INTELIGÊNCIA DOS OUTROS INIMIGOS =====
        const dist = Phaser.Math.Distance.Between(inimigo.x, inimigo.y, this.player.x, this.player.y);

        if (dist < 150) {
            if (this.player.x > inimigo.x) {
                inimigo.setVelocityX(50);
                inimigo.flipX = false;
            } else {
                inimigo.setVelocityX(-50);
                inimigo.flipX = true;
            }

            if (dist < 40 && !inimigo.isAttacking) {
                const anim = `${inimigo.texture.key}Atacando`;
                if (inimigo.anims.currentAnim?.key !== anim && inimigo.anims.animationManager.exists(anim)) {
                    inimigo.play(anim, true);
                }
                inimigo.isAttacking = true;
            } else if (dist >= 40 && inimigo.isAttacking) {
                const anim = `${inimigo.texture.key}Andando`;
                if (inimigo.anims.currentAnim?.key !== anim && inimigo.anims.animationManager.exists(anim)) {
                    inimigo.play(anim, true);
                }
                inimigo.isAttacking = false;
            }
        } else {
            inimigo.setVelocityX(0);
            const anim = `${inimigo.texture.key}Andando`;
            if (!inimigo.isAttacking && inimigo.anims.currentAnim?.key !== anim && inimigo.anims.animationManager.exists(anim)) {
                inimigo.play(anim, true);
            }
        }
    }

    update() {
        const limiteDireita = 750;

        if (this.player.body.blocked.down) this.jumpCount = 0;

        // ===== ATAQUE COM CONTROLE DE HIT ÚNICO =====
        if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            this.player.anims.play('attack', true);
            this.player.setVelocityX(0);
            this.isAttacking = true;
            this.attackHasHit = false; // ===== RESETAR FLAG DE HIT =====
            
            this.bossAudio.attack.play();
            
            return;
        }

        if (this.isAttacking) {
            this.verificarDanoInimigos();

            // ===== VERIFICAR SE A ANIMAÇÃO DE ATAQUE TERMINOU =====
            if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'attack') {
                this.isAttacking = false;
                this.attackHasHit = false; // ===== RESETAR FLAG QUANDO ATAQUE TERMINA =====
            }

            return;
        }

        this.movimentarJogador();

        if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
            this.transicaoParaMapa();
        }

        this.atualizarInimigo(this.inimigo);
        if (this.orc) this.atualizarInimigo(this.orc);
        this.atualizarInimigo(this.demon);

        // ===== SISTEMA DE SALVAR LIRA COM SOM =====
        if (!this.liraSalva) {
            const distLira = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lira.x, this.lira.y);
            if (distLira < 60) {
                this.salvarTexto.setVisible(true);

                if (Phaser.Input.Keyboard.JustDown(this.keys.salvar)) {
                    this.liraSalva = true;
                    this.salvarTexto.setText('Lira foi salva!');
                    this.salvarTexto.setStyle({ fill: '#00ff00' });

                    this.bossAudio.collect.play();
                    
                    this.time.delayedCall(1500, () => {
                        this.time.delayedCall(1000, () => {
                            if (this.stepSoundPlaying) {
                                this.bossAudio.step.stop();
                                this.stepSoundPlaying = false;
                            }
                            
                            Object.values(this.bossAudio).forEach(sound => {
                                if (sound && sound.isPlaying) {
                                    sound.stop();
                                }
                            });
                            
                            this.scene.start('WinScene');
                        });
                    });
                }
            } else {
                this.salvarTexto.setVisible(false);
            }
        } else {
            this.salvarTexto.setVisible(false);
        }

        // ===== ATUALIZAR SOM DE PASSOS =====
        this.updateStepSound();
    }
}