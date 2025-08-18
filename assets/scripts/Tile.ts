const {ccclass, property} = cc._decorator;

@ccclass
export class Tile extends cc.Component {

    private sprite: cc.Sprite | null = null;
    private options: Tile.TileOptions | null = null;

    protected onLoad(): void {
        this.sprite = this.getComponent(cc.Sprite);
        if (this.options !== null) {
            this.setOptions(this.options);
        }
    }

    unuse() {
        this.resetNodeProperties();
    }

    reuse(options: Tile.TileOptions) {
        this.options = options;
        this.resetNodeProperties();
        if (this.sprite === null) {
            return;
        }
        this.setOptions(options);
    }

    setOptions(options: Tile.TileOptions) {
        this.options = options;
        if (!this.sprite) {
            return;
        }

        this.sprite.spriteFrame = options.sprite;
    }

    private resetNodeProperties() {
        this.node.scale = 1;
        this.node.opacity = 255;
    }
}

export namespace Tile {
    export type TileOptions = {
        sprite: cc.SpriteFrame,
    }
}
