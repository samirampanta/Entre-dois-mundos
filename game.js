const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#1d1d1d',
    scene: {
        preload,
        create,
        update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;

function preload() {
    this.load.image('bg', 'assets/background.png');
    this.load.spritesheet('eron', 'assets/eron_walk_spritesheet.png', {
    frameWidth: 128,
    frameHeight: 128
});

}

function create() {
    this.add.image(0, 0, 'bg').setOrigin(0, 0).setScale(800 / 2304, 600 / 1296);

    player = this.add.sprite(100, 500, 'eron', 0);

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('eron', { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
    });

    cursors = this.input.keyboard.createCursorKeys();
wasd = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.W,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    right: Phaser.Input.Keyboard.KeyCodes.D
});


}

function update() {
    let moving = false;

    if (cursors.right.isDown || wasd.right.isDown) {
        player.x += 2;
        player.anims.play('walk', true);
        player.flipX = false;
        moving = true;
    } else if (cursors.left.isDown || wasd.left.isDown) {
        player.x -= 2;
        player.anims.play('walk', true);
        player.flipX = true;
        moving = true;
    }

    if (!moving) {
        player.anims.stop();
        player.setFrame(0);
    }
}
