import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const metrics = JSON.parse(readFileSync(new URL('src/characters/fighters/CharacterSpriteMetrics.json', root), 'utf8'));
const fighters = ['xiang_shao_long', 'lian_jin', 'wu_ting_fang', 'shan_rou', 'ying_zheng'];
const poses = ['idle', 'walk', 'attack'];
const enemySprites = [
  'sprite_enemy_soldier',
  'sprite_enemy_archer',
  'sprite_enemy_spearman',
  'sprite_enemy_shieldman',
  'sprite_enemy_cavalry',
  'sprite_enemy_elite',
  'sprite_enemy_assassin',
  'sprite_enemy_zhaoguard',
  'sprite_enemy_qinguard',
  'sprite_enemy_general',
  'sprite_enemy_minilj',
  'sprite_enemy_minitx',
  'sprite_enemy_zhaomu',
  'sprite_enemy_guokai',
  'sprite_enemy_limu',
  'sprite_enemy_lubuwei',
  'sprite_enemy_chengjiao',
  'sprite_enemy_jingke',
  'sprite_enemy_fanyuqi',
  'sprite_enemy_yandan',
  'sprite_enemy_wangjian',
  'sprite_boss_lao',
];

for (const fighter of fighters) {
  for (const pose of poses) {
    test(`${fighter} ${pose} is a complete transparent game asset`, () => {
      const file = readFileSync(new URL(`public/assets/characters/${fighter}_${pose}.png`, root));
      assert.equal(file.subarray(1, 4).toString(), 'PNG');
      assert.equal(file.readUInt32BE(16), 96);
      assert.equal(file.readUInt32BE(20), 112);
      assert.equal(file[25], 6, 'PNG must retain its RGBA alpha channel');
      const metric = metrics[`sprite_${fighter}_${pose}`];
      assert.ok(metric, 'pose needs an alignment metric');
      assert.ok(metric.artHeight > 40 && metric.artHeight <= 104);
      assert.ok(metric.originX > 0.05 && metric.originX < 0.95);
      assert.ok(metric.originY > 0.8 && metric.originY <= 1);
    });
  }
  test(`${fighter} base texture uses the idle alignment`, () => {
    assert.deepEqual(metrics[`sprite_${fighter}`], metrics[`sprite_${fighter}_idle`]);
  });
}

for (const sprite of enemySprites) {
  test(`${sprite} is a complete transparent game asset`, () => {
    const file = readFileSync(new URL(`public/assets/enemies/${sprite}.png`, root));
    assert.equal(file.subarray(1, 4).toString(), 'PNG');
    assert.equal(file.readUInt32BE(16), 96);
    assert.equal(file.readUInt32BE(20), 112);
    assert.equal(file[25], 6, 'PNG must retain its RGBA alpha channel');
    const metric = metrics[sprite];
    assert.ok(metric, 'enemy needs an alignment metric');
    assert.ok(metric.artHeight > 40 && metric.artHeight <= 108);
    assert.ok(metric.originX > 0.05 && metric.originX < 0.95);
    assert.ok(metric.originY > 0.8 && metric.originY <= 1);
  });
}
