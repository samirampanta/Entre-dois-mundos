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

        this.load.spritesheet('hearts', 'assets/Hearts.png', {
            frameWidth: 15,
            frameHeight: 15
        });

        this.load.spritesheet('itens', 'assets/rpgItems.png', {
    frameWidth: 16,
    frameHeight: 16
    });


        
    }

    create(data) {
        this.fragmentosColetados = data?.fragmentosColetados || 0;
        this.transicaoFeita = false;
        const map = this.make.tilemap({ key: 'mapa' });
        const tileset = map.addTilesetImage('AllSprites', 'AllSprites');


        const layer1 = map.createLayer('Camada de Blocos 1', tileset, 0, 0);
        const layer2 = map.createLayer('Camada de Blocos 2', tileset, 0, 0);
        const layer3 = map.createLayer('Camada de Blocos 3', tileset, 0, 0);
        const layer4 = map.createLayer('Camada de Blocos 4', tileset, 0, 0);
        const layer5 = map.createLayer('Camada de Blocos 5', tileset, 0, 0);
        const layer6 = map.createLayer('Camada de Blocos 6', tileset, 0, 0);

        this.fragmentosColetados = 0;

        this.textoFragmento = this.add.text(90,  10, 'Fragmentos: 0/4', {
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
        this.player = this.physics.add.sprite(spawnX, spawnY, 'adventurer', 0).setScale(2)
        this.player.setBodySize(25, 30);
        this.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.player, layer1, () => {
            this.jumpCount = 0;
        });

        this.physics.add.overlap(this.player, fragmento, () => {
    fragmento.destroy();
    this.fragmentosColetados++;
    this.textoFragmento.setText(`Fragmentos: ${this.fragmentosColetados}/4`);
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

        this.maxLives = 4;
        this.currentLives = 4;
        this.heartIcons = [];

        for (let i = 0; i < this.maxLives; i++) {
            const heart = this.add.sprite(20 + i * 12, 20, 'hearts', 0).setScale(2).setScrollFactor(0);
            this.heartIcons.push(heart);
        }

        this.updateHearts = () => {
            for (let i = 0; i < this.maxLives; i++) {
                const frame = i < this.currentLives ? 0 : 1;
                this.heartIcons[i].setFrame(frame);
            }
        };

        if (this.currentLives > 0) {
            this.currentLives--;
            this.updateHearts();
        }

        console.log("Camadas válidas:", map.layers.map(l => l.name));
    }

    transicaoParaMapa() {
    this.cameras.main.fadeOut(500, 0, 0, 0); 
    this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Mapa1', {
            voltarPeloLadoEsquerdo: false,
            fragmentosColetados: this.fragmentosColetados
        }, {
            vidas: this.currentLives,
            mapaAtual: 'mapa1.json'
        });
    });
}
    

    update() {
        const limiteDireita = 750;
        if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
            console.log("Transição acionada para 'Mapa1'");
            console.log("Transição acionada!");
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
                              Phaser.Input.Keyboard.JustDown(this.keys.up) ||
                              Phaser.Input.Keyboard.JustDown(this.keys.space);

        if (isJumpPressed && this.jumpCount < this.maxJumps) {
            this.player.setVelocityY(-350);
            this.player.anims.play('jump', true);
            this.jumpCount++;
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.attack)) {
            this.isAttacking = true;
            this.player.anims.play('attack', true);
            this.player.setVelocityX(0);
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

if (!this.transicaoFeita && this.player.x >= limiteDireita) {
            this.transicaoFeita = true;
    console.log("Transição acionada!");
            this.transicaoParaMapa();
    return;
}

    
    }
}