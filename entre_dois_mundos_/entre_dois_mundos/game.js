import StartScene from './scenes/StartScene.js';
import InstructionsScene from './scenes/InstructionsScene.js';
import CreditsScene from './scenes/CreditsScene.js';
import CenaIntro from './CenaIntro.js';
import MundoNormal from './MundoNormalScene.js';
import MundoNormalScene_1 from './MundoNormalScene_1.js';
import MundoNormalScene_2 from './MundoNormalScene_2.js';
import MundoSombrio from './MundoSombrio.js';
import MundoSombrio2 from './MundoSombrio2.js';
import Boss from './Boss.js';
import GameOverScene from './GameOverScene.js';
import WinScene from './WinScene.js';


const config = {
    type: Phaser.AUTO,
    // Ajuste a largura e altura para preencher a tela
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1d1d1d',
    // Adicione a configuração de escala
    scale: {
        mode: Phaser.Scale.FIT, // Ajusta o jogo à tela mantendo a proporção
        autoCenter: Phaser.Scale.CENTER_BOTH // Centraliza o jogo na tela
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: [ StartScene, CenaIntro, MundoNormal, MundoNormalScene_1, MundoNormalScene_2, MundoSombrio, MundoSombrio2, Boss, GameOverScene, WinScene ]
};

const game = new Phaser.Game(config);
