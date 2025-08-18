import { TileColor, TileSuper } from "blast";

export function getTileSprite(atlas: cc.SpriteAtlas, tile: TileColor | TileSuper): cc.SpriteFrame {
    switch (tile) {
        case "red":
            return atlas.getSpriteFrame('block_red');
        case "green":
            return atlas.getSpriteFrame('block_green');
        case "blue":
            return atlas.getSpriteFrame('block_blue');
        case "purple":
            return atlas.getSpriteFrame('block_purpure');
        case "yellow":
            return atlas.getSpriteFrame('block_yellow');
        case "burn_raw":
            return atlas.getSpriteFrame('block_rockets_horisontal');
        case "burn_column":
            return atlas.getSpriteFrame('block_rakets');
        case "burn_around":
            return atlas.getSpriteFrame('block_bomb');
        case "burn_all":
            return atlas.getSpriteFrame('block_bomb_max');
    }
}