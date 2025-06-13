export default class MundoNormal extends Phaser.Scene {
    constructor() {
        super({ key: 'CenaJogo' });
    }

    preload() {
        this.load.image('bg', 'assets/00016.png');
        this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', {
            frameWidth: 50,
            frameHeight: 37
        });
        this.load.spritesheet('hearts', 'assets/Hearts.png', {
    frameWidth: 15,
    frameHeight: 15
});
    }

    create() {
        this.add.image(0, 0, 'bg')
            .setOrigin(0, 0)
            .setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);

        this.player = this.physics.add.sprite(100, 500, 'adventurer', 0).setScale(2);
        this.player.setCollideWorldBounds(true);
        
        this.missaoTitulo = this.add.text(30, 200, '📜 Missão', {
    fontFamily: 'Arial',
    fontSize: '18px',
    fill: '#ffff66',
    fontStyle: 'bold'
}).setScrollFactor(0);

this.missaoTexto = this.add.text(30, 225, '☐ Encontrar e salvar Lira', {
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

        const ground = this.add.rectangle(400, 580, 800, 40, 0x1a2b2f);
        this.physics.add.existing(ground, true);
        this.physics.add.collider(this.player, ground, () => {
            this.jumpCount = 0;
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


    }

    update() {
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
    }
}
