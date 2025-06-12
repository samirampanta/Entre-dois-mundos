const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let keys;
let jumpCount = 0;
const maxJumps = 2;
let isAttacking = false;

function preload() {
    this.load.image('bg', 'assets/00016.png');
    this.load.spritesheet('adventurer', 'assets/adventurer-Sheet.png', {
        frameWidth: 50,
        frameHeight: 37
    });
}

function create() {
    this.add.image(0, 0, 'bg')
    .setOrigin(0, 0)
    .setDisplaySize(this.sys.game.config.width, this.sys.game.config.height);


    player = this.physics.add.sprite(100, 450, 'adventurer', 0).setScale(2);
    player.setCollideWorldBounds(true);

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

    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE,
        attack: Phaser.Input.Keyboard.KeyCodes.ENTER
    });

    const ground = this.add.rectangle(400, 580, 800, 40, 0x1a2b2f);
    this.physics.add.existing(ground, true);

    this.physics.add.collider(player, ground, () => {
        jumpCount = 0;
    });
}

function update() {
    let isMoving = false;

    if (isAttacking) {
        if (!player.anims.isPlaying || player.anims.currentAnim.key !== 'attack') {
            isAttacking = false;
        } else {
            return;
        }
    }

    if (cursors.left.isDown || keys.left.isDown) {
        player.setVelocityX(-160);
        player.flipX = true;
        isMoving = true;
    } else if (cursors.right.isDown || keys.right.isDown) {
        player.setVelocityX(160);
        player.flipX = false;
        isMoving = true;
    } else {
        player.setVelocityX(0);
    }

    const isJumpPressed = Phaser.Input.Keyboard.JustDown(cursors.up) ||
                          Phaser.Input.Keyboard.JustDown(keys.up) ||
                          Phaser.Input.Keyboard.JustDown(keys.space);

    if (isJumpPressed && jumpCount < maxJumps) {
        player.setVelocityY(-350);
        player.anims.play('jump', true);
        jumpCount++;
    } else if (Phaser.Input.Keyboard.JustDown(keys.attack)) {
        isAttacking = true;
        player.anims.play('attack', true);
        player.setVelocityX(0);
    } else if (!player.body.blocked.down) {
        if (player.body.velocity.y < 0) {
            player.anims.play('jump', true);
        } else {
            player.anims.play('fall', true);
        }
    } else if (isMoving) {
        player.anims.play('run', true);
    } else {
        player.anims.play('idle', true);
    }
}
