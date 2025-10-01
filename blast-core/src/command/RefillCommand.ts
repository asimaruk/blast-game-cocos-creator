import { Game } from "../Game";
import { TileFactory } from "../TileFactory";
import { Command } from "./Command";

export class RefillCommand implements Command {

    private refills: Game.TilePosition[] | null = null;
    private refillsLazy: () => Game.TilePosition[];

    constructor(
        game: Game, 
        tileFactory: TileFactory,
    ) {
        this.refillsLazy = () => {
            const w = game.getConfig().config.width;
            const h = game.getConfig().config.height;
            const result: Game.TilePosition[] = [];
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) {
                    const tile = game.getTile(i, j);
                    if (tile === Game.EMPTY_TILE) {
                        result.push({
                            x: i,
                            y: j,
                            tile: tileFactory.createRandomColorTile(),
                        });
                    }
                }
            }
            return result;
        }
    }

    do(game: Game): Command.Result {
        this.refills ??= this.refillsLazy?.() ?? [];
        for (const apr of this.refills) {
            game.setTile(apr.x, apr.y, apr.tile);
        }
        return this.toResult('refills', this.refills);
    }

    undo(game: Game): Command.Result {
        const disappears = this.refills ?? [];
        for (const apr of disappears) {
            game.setTile(apr.x, apr.y, Game.EMPTY_TILE);
        }
        return this.toResult('disappears', disappears);
    }

    private toResult(
        type: Command.RefillsResult['type'] | Command.DisappearsResult['type'], 
        refills: Game.TilePosition[],
    ): Command.Result {
        return type === 'refills' 
             ? { 
                type: 'refills',
                refills: refills,
            }
            : { 
                type: 'disappears',
                disappears: refills, 
            };
    }
}