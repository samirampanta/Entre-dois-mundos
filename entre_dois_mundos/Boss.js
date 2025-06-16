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
        this.load.spritesheet('inimigos', 'assets/enemies-spritesheet.png', { frameWidth: 16, frameHeight: 16 });
        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', { frameWidth: 50, frameHeight: 37 });
        this.load.spritesheet('demon', 'assets/demon_sspritesheet.png', { frameWidth: 110, frameHeight: 180 });
    }

    create(data) {
        this.currentLives = data?.vidas ?? 3;
        const map = this.make.tilemap({ key: 'mapa4' });
        const tileset = map.addTilesetImage('AllSprites', 'AllSprites');
        const tileset3 = map.addTilesetImage('dark_castle_tileset', 'dark_castle_tileset');

        const layer1 = map.createLayer('Camada de Blocos 1', tileset3, 0, 0);
        map.createLayer('Camada de Blocos 2', tileset3, 0, 0);
        map.createLayer('Camada de Blocos 3', tileset3, 0, 0);
        map.createLayer('Camada de Blocos 4', tileset3, 0, 0);

        layer1.setCollisionByExclusion([-1]);

        this.player = this.physics.add.sprite(100, 100, 'adventurer', 0).setScale(2);
        this.player.setBodySize(20, 24);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, layer1);
        this.player.isInvulnerable = false;

        this.inimigo = this.physics.add.sprite(500, 100, 'inimigos').setScale(2);
        this.inimigo.play('andarInimigo');
        this.inimigo.setVelocityX(50);
        this.inimigo.setBounce(1, 0);
        this.inimigo.setCollideWorldBounds(true);
        this.physics.add.collider(this.inimigo, layer1);
        this.inimigo.health = 1;
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

        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        this.scale.resize(mapWidth, mapHeight);
        this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
        this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
        this.cameras.main.startFollow(this.player);
        this.cameras.main.shake(500, 0.01);

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

        this.liraSalva = false;
        this.salvarTexto = this.add.text(this.lira.x, this.lira.y - 10, 'Pressione [E] para salvar Lira', {
            fontFamily: 'Arial', fontSize: '14px', fill: '#ffff00', backgroundColor: '#000000',
            padding: { x: 6, y: 4 }
        }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
        if (Phaser.Input.Keyboard.JustDown(this.keys.salvar)) {
    this.liraSalva = true;
    this.salvarTexto.setText('Lira foi salva!');
    this.salvarTexto.setStyle({ fill: '#00ff00' });
    this.time.delayedCall(1500, () => {
        this.scene.start('WinScene');
    });
}

       
        this.anims.create({ key: 'andarInimigo', frames: this.anims.generateFrameNumbers('inimigos', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
        this.anims.create({ key: 'inimigoMorrendo', frames: this.anims.generateFrameNumbers('inimigos', { start: 4, end: 5 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('adventurer', { start: 0, end: 3 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'run', frames: this.anims.generateFrameNumbers('adventurer', { start: 8, end: 13 }), frameRate: 12, repeat: -1 });
        this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('adventurer', { start: 22, end: 22 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'fall', frames: this.anims.generateFrameNumbers('adventurer', { start: 23, end: 23 }), frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'attack', frames: this.anims.generateFrameNumbers('adventurer', { start: 52, end: 55 }), frameRate: 10, repeat: 0 });

        this.anims.create({ key: 'demonIdle', frames: this.anims.generateFrameNumbers('demon', { start: 0, end: 6 }), frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'demonAndando', frames: this.anims.generateFrameNumbers('demon', { start: 7, end: 18 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'demonAtacando', frames: this.anims.generateFrameNumbers('demon', { start: 19, end: 23 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'demonDano', frames: this.anims.generateFrameNumbers('demon', { start: 24, end: 27 }), frameRate: 10, repeat: 0 });
        this.anims.create({ key: 'demonMorrendo', frames: this.anims.generateFrameNumbers('demon', { start: 28, end: 34 }), frameRate: 6, repeat: 0 });
        this.anims.create({ key: 'demonCinzas', frames: this.anims.generateFrameNumbers('demon', { start: 35, end: 44 }), frameRate: 6, repeat: 0 });

        this.demon = this.physics.add.sprite(300, 30, 'demon').setScale(1);
        this.demon.play('demonAndando');
        this.demon.setCollideWorldBounds(true);
        this.demon.setSize(50, 100);
        this.demon.setOffset(15, 60);
        this.demon.health = 10;
        this.demon.isDead = false;
        this.demon.isAttacking = false;
        this.physics.add.collider(this.demon, layer1);

        this.physics.add.overlap(this.player, this.demon, () => {
            if (!this.player.isInvulnerable && !this.demon.isDead) {
                this.demon.play('demonAtacando', true);
                this.currentLives--;
                this.updateHearts();
                this.player.isInvulnerable = true;
                this.time.delayedCall(1000, () => this.player.isInvulnerable = false);
            }
        }, null, this);

        this.orc = null;
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
                this.verificarDanoInimigos();
                return;
            }
        }

        this.movimentarJogador();

        if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
            this.transicaoParaMapa();
        }

        this.atualizarInimigo(this.inimigo);
        if (this.orc) this.atualizarInimigo(this.orc);
        this.atualizarInimigo(this.demon);

       
       if (!this.liraSalva) {
    const distLira = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lira.x, this.lira.y);
    if (distLira < 60) {
        this.salvarTexto.setVisible(true);

        if (Phaser.Input.Keyboard.JustDown(this.keys.salvar)) {
            this.liraSalva = true;
            this.salvarTexto.setText('Lira foi salva!');
            this.salvarTexto.setStyle({ fill: '#00ff00' });

            this.time.delayedCall(1500, () => {
                this.scene.start('WinScene');
            });
        }
    } else {
        this.salvarTexto.setVisible(false);
    }
} else {
   
    this.salvarTexto.setVisible(false);
}

    }

    updateHearts() {
        if (this.vidaTexto) this.vidaTexto.setText(`${this.currentLives}/3`);
        if (this.currentLives <= 0) {
            gameState.mundoAtual = 'Boss';
            gameState.vidas = this.currentLives;
            this.scene.start('GameOverScene');
        }
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

    movimentarJogador() {
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

        const isJumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.space);

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
    }

    verificarDanoInimigos() {
        const atacar = (alvo) => {
            if (alvo && !alvo.isDead) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, alvo.x, alvo.y);
                if (dist < 40) {
                    alvo.health--;
                    if (alvo.health <= 0) {
                        alvo.isDead = true;
                        alvo.setVelocityX(0);
                        const animKey = `${alvo.texture.key}Morrendo`;
                        if (alvo.anims && alvo.anims.animationManager.exists(animKey)) {
                            alvo.play(animKey, true);
                            alvo.once('animationcomplete', () => alvo.destroy());
                        } else {
                            alvo.destroy();
                        }
                    }
                }
            }
        };
        atacar(this.inimigo);
        atacar(this.demon);
        if (this.orc) atacar(this.orc);
    }

    atualizarInimigo(inimigo) {
        if (!inimigo || inimigo.isDead) return;

        const dist = Phaser.Math.Distance.Between(inimigo.x, inimigo.y, this.player.x, this.player.y);

        if (dist < 150) {
            inimigo.setVelocityX(inimigo.x < this.player.x ? 50 : -50);
            inimigo.flipX = inimigo.x > this.player.x;

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
}
