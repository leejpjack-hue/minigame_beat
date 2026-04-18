import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { StageScene } from '../scenes/StageScene';
import { VictoryScene } from '../scenes/VictoryScene';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: undefined,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, CharacterSelectScene, StageScene, VictoryScene],
  input: {
    activePointers: 3,
  },
};
