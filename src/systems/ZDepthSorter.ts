import Phaser from 'phaser';

export class ZDepthSorter {
  private characters: { groundY: number; setDepth: (d: number) => void }[] = [];

  addCharacter(char: { groundY: number; setDepth: (d: number) => void }): void {
    this.characters.push(char);
  }

  removeCharacter(char: { groundY: number; setDepth: (d: number) => void }): void {
    const idx = this.characters.indexOf(char);
    if (idx >= 0) this.characters.splice(idx, 1);
  }

  update(): void {
    // Sort by groundY ascending (further from camera = lower depth)
    this.characters.sort((a, b) => a.groundY - b.groundY);
    for (let i = 0; i < this.characters.length; i++) {
      this.characters[i].setDepth(i);
    }
  }

  clear(): void {
    this.characters = [];
  }
}
