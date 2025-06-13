import CenaIntro from './CenaIntro.js';
import MundoNormal from './MundoNormalScene.js';

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
    scene: [CenaIntro, MundoNormal]
};

const game = new Phaser.Game(config);
