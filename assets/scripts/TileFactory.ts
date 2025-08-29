import { Game } from "blast-core";
import { Tile } from "./Tile";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TileFactory extends cc.Component {

    @property(cc.Prefab)
    tilePrefab: cc.Prefab | null = null;

    private tilePool = new cc.NodePool('Tile');
    private spritesConfig: {[key: Game.TileKind]: string} | null = null;
    private tileSprites: {[id: Game.TileKind]: cc.SpriteFrame} = {};

    public setupSpritesConfig(spritesConfig: {[key: Game.TileKind]: string}) {
        this.spritesConfig = spritesConfig;
    }

    public setupSprite(tile: Game.TileKind, sprite: cc.SpriteFrame) {
        this.tileSprites[tile] = sprite;
    }

    public getTile(tile: Game.TileKind): cc.Node {
        if (!this.spritesConfig) {
            throw new Error('TileFactory: spritesConfig is null');
        }
        const tileConfig: Tile.TileOptions = { sprite: this.tileSprites[tile] };
        return this.tilePool.get(tileConfig) || this.createTile(tileConfig);
    }

    public put(node: cc.Node) {
        this.tilePool.put(node);
    }

    private createTile(tileConfig: Tile.TileOptions): cc.Node {
        if (this.tilePrefab === null) {
            throw new Error('Tile prefab is not set');
        }
        const n = cc.instantiate(this.tilePrefab);
        n.getComponent(Tile)?.setOptions(tileConfig);
        return n;
    }
}
