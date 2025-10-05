import { Game } from "../Game";
import { Command } from "./Command";

export class AppearCommand implements Command {

    constructor(
        private tile: Game.TileKind,
        private x: number,
        private y: number,
    ) {}

    do(game: Game): Command.Result {
        game.setTile(this.x, this.y, this.tile);
        return {
            type: 'appears',
            appears: [{ 
                x: this.x, 
                y: this.y, 
                tile: this.tile
            }],
        }
    }

    undo(game: Game): Command.Result {
        game.setTile(this.x, this.y, Game.EMPTY_TILE);
        return {
            type: 'disappears',
            disappears: [{ 
                x: this.x, 
                y: this.y,
            }],
        }
    }

    getAffectedPositions(): Game.Position[] {
        return [{ x: this.x, y: this.y }];
    }
}