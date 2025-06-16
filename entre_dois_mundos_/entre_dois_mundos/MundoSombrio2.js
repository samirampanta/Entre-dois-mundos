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
        this.load.spritesheet('inimigos', 'assets/enemies-spritesheet.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', { frameWidth: 50, frameHeight: 37 });
        this.load.spritesheet('orc', 'assets/Orc.png', { frameWidth: 100, frameHeight: 64 });
    }

    create(data) {
        this.currentLives = data?.vidas ?? 3;
        this.fragmentosColetados = data?.fragmentosColetados || 0;

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

        this.inimigo = this.physics.add.sprite(300, 100, 'inimigos').setScale(2);
        this.inimigo.play('andarInimigo');
        this.inimigo.setVelocityX(50);
        this.inimigo.setBounce(1, 0);
        this.inimigo.setCollideWorldBounds(true);
        this.physics.add.collider(this.inimigo, layer1);
        this.inimigo.health = 1;
        this.inimigo.isAttacking = false;

        this.orc = this.physics.add.sprite(700, 5, 'orc').setScale(2);
        this.orc.play('orcAndando');
        this.orc.setCollideWorldBounds(true);
        this.orc.health = 3;
        this.orc.isDead = false;
        this.orc.isAttacking = false;
        this.physics.add.collider(this.orc, layer1);

        this.player = this.physics.add.sprite(100, 100, 'adventurer', 0).setScale(2);
        this.player.setBodySize(25, 30);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, layer1);

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

        [fragmento1, fragmento2].forEach(fragmento => {
            this.physics.add.overlap(this.player, fragmento, () => {
                fragmento.destroy();
                this.fragmentosColetados++;
                this.textoFragmento.setText(`Fragmentos: ${this.fragmentosColetados}/3`);
            });
        });

        this.player.isInvulnerable = false;

        this.physics.add.overlap(this.player, this.inimigo, () => {
            if (!this.player.isInvulnerable) {
                this.currentLives--;
                this.updateHearts();
                this.player.isInvulnerable = true;
                this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
            }
        });

        this.physics.add.overlap(this.player, this.orc, () => {
            if (!this.player.isInvulnerable && !this.orc.isDead) {
                this.orc.play('orcAtacando', true);
                this.currentLives--;
                this.updateHearts();
                this.player.isInvulnerable = true;
                this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
            }
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
        this.transicaoFeita = false;
        this.isAttacking = false;

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


        this.anims.create({ key: 'andarInimigo', frames: this.anims.generateFrameNumbers('inimigos', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'inimigoMorrendo', frames: this.anims.generateFrameNumbers('inimigos', { start: 4, end: 5 }), frameRate: 6, repeat: 0 });

        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }), frameRate: 10, repeat: 0 });

        this.anims.create({ key: 'orcAndando', frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'orcAtacando', frames: this.anims.generateFrameNumbers('orc', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'orcMorrendo', frames: this.anims.generateFrameNumbers('orc', { start: 8, end: 11 }), frameRate: 8, repeat: 0 });
    }

    updateHearts() {
    if (this.vidaTexto) {
        this.vidaTexto.setText(`${this.currentLives}/${this.maxLives}`);
    }

    if (this.currentLives <= 0) {
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
        if (!this.anims.exists('idle')) {
            this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
            this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }), frameRate: 12, repeat: -1 });
            this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }), frameRate: 1 });
            this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }), frameRate: 1 });
            this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }), frameRate: 10 });
            this.anims.create({ key: 'orc-walk', frames: this.anims.generateFrameNumbers('orc', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
            this.anims.create({ key: 'orcAtacando', frames: this.anims.generateFrameNumbers('orc', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'orcMorrendo', frames: this.anims.generateFrameNumbers('orc', { start: 8, end: 11 }), frameRate: 8 });
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

        if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            this.player.anims.play('attack', true);
            this.player.setVelocityX(0);
            this.isAttacking = true;
            return;
        }

        if (this.isAttacking) {
            if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== 'attack') {
                this.isAttacking = false;
            } else {
                
                if (this.orc && !this.orc.isDead) {
                    const distOrc = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.orc.x, this.orc.y);
                    if (distOrc < 40) {
                        this.orc.health--;
                        if (this.orc.health <= 0) {
                            this.orc.isDead = true;
                            this.orc.setVelocityX(0);
                            this.orc.play('orcMorrendo', true);
                            this.orc.once('animationcomplete', () => this.orc.destroy());
                        }
                    }
                }
                
                if (this.inimigo) {
                    const distInimigo = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.inimigo.x, this.inimigo.y);
                    if (distInimigo < 40 && !this.inimigo.isDead) {
                        this.inimigo.health--;
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
        if (this.cursors.left.isDown || this.keys.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.flipX = true;
            isMoving = true;
        } else if (this.cursors.right.isDown || this.keys.right.isDown) {
            this.player.setVelocityX(160);
            this.player.flipX = false;
            isMoving = true;
        } else {
            this.player.setVelocityX(0);
        }

        const isJumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);
        if (isJumpPressed && this.jumpCount < this.maxJumps) {
            this.player.setVelocityY(-350);
            this.player.anims.play('jump', true);
            this.jumpCount++;
        } else if (!this.player.body.blocked.down) {
            this.player.anims.play(this.player.body.velocity.y < 0 ? 'jump' : 'fall', true);
        } else if (isMoving) {
            this.player.anims.play('run', true);
        } else {
            this.player.anims.play('idle', true);
        }

        if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
            this.transicaoParaMapa();
            return;
        }

        if (this.orc && !this.orc.isDead) {
            const distance = Phaser.Math.Distance.Between(this.orc.x, this.orc.y, this.player.x, this.player.y);
            if (distance < 150) {
                this.orc.setVelocityX(this.orc.x < this.player.x ? 50 : -50);
                this.orc.flipX = this.orc.x > this.player.x;
                if (distance < 40 && !this.orc.isAttacking) {
                    this.orc.play('orcAtacando', true);
                    this.orc.isAttacking = true;
                } else if (distance >= 40 && this.orc.isAttacking) {
                    this.orc.play('orcAndando', true);
                    this.orc.isAttacking = false;
                }
            } else {
                this.orc.setVelocityX(0);
                if (!this.orc.isAttacking) this.orc.play('orcAndando', true);
            }
        }

        
        if (this.inimigo && !this.inimigo.isDead) {
            const distToPlayer = Phaser.Math.Distance.Between(this.inimigo.x, this.inimigo.y, this.player.x, this.player.y);
            if (distToPlayer < 150) {
                this.inimigo.setVelocityX(this.inimigo.x < this.player.x ? 50 : -50);
                this.inimigo.flipX = this.inimigo.x > this.player.x;
            } else {
                this.inimigo.setVelocityX(50 * (this.inimigo.body.velocity.x < 0 ? -1 : 1));
            }
        }
    }
}
