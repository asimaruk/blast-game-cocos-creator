import { Game } from "../Game";
import { UtilityConfig } from "../UtilityConfig";
import { Command } from "./Command";

export class BurnCommand implements Command {

    private config: UtilityConfig;
    private burnPositionsLazy: () => Game.TilePosition[];
    private _burnTiles: Game.TilePosition[] = [];

    constructor(
        game: Game,
        private readonly burns: Game.BurnAction['burns'],
        private readonly detonatorPos: Game.Position,
        private movesCost: number = Command.DEFAULT_MOVES_DIFF,
    ) { 
        this.config = game.getConfig();
        this.burnPositionsLazy = () => {
            return this.findBurnPositions(
                this.detonatorPos.x, 
                this.detonatorPos.y, 
                this.config.config.width, 
                this.config.config.height,
                this.burns,
            ).map(p => {
                return {
                    x: p.x,
                    y: p.y,
                    tile: game.getTile(p.x, p.y),
                };
            }).filter((tp): tp is Game.TilePosition => {
                return tp.tile !== undefined && !Game.isTileEmpty(tp.tile);
            });
        }
    }

    private get burnTiles(): Game.TilePosition[] {
        this._burnTiles ??= this.burnPositionsLazy();
        return this._burnTiles;
    }
    
    do(game: Game): Command.Result {
        let plusScore = 0;
        for (const b of this.burnPositionsLazy()) {
            const tile = game.getTile(b.x, b.y);
            if (tile === undefined || tile === Game.EMPTY_TILE) {
                continue;
            }
            this.burnTiles.push({ ...b, tile });
            game.setTile(b.x, b.y, Game.EMPTY_TILE);
            if (this.config.isColorTile(tile)) {
                plusScore++;
            }
        }
        game.setScore(game.getScore() + plusScore);
        game.setMovesLeft(game.getMovesLeft() - this.movesCost);
        return {
            type: 'burns',
            scoreDiff: plusScore,
            movesDiff: -this.movesCost,
            burns: this.burnTiles,
            position: this.detonatorPos,
        };
    }

    undo(game: Game): Command.Result {
        let minusScore = 0;
        for (const b of this.burnTiles) {
            game.setTile(b.x, b.y, b.tile);
            if (this.config.isColorTile(b.tile)) {
                minusScore--;
            }
        }
        game.setScore(game.getScore() + minusScore);
        game.setMovesLeft(game.getMovesLeft() + this.movesCost);
        return {
            type: 'appears',
            scoreDiff: minusScore,
            movesDiff: this.movesCost,
            appears: this.burnTiles,
        };
    }

    private findBurnPositions(
        tileX: number, 
        tileY: number,
        tilesWidth: number,
        tilesHeight: number,
        burns: Game.BurnAction['burns'],
    ): Game.Position[] {
        const positions: Game.Position[] = [];
        const isValid = (x: number, y: number): boolean => {
            return x >= 0
                && y >= 0
                && x < tilesWidth
                && y < tilesHeight
                && positions.findIndex(p => p.x === x && p.y === y) === -1;
        };
        for (const burn of burns) {
            if (Game.isPosition(burn)) {
                const burnX = tileX + burn.x;
                const burnY = tileY + burn.y;
                if (isValid(burnX, burnY)) {
                    positions.push({ x: burnX, y: burnY });
                }
                continue;
            }

            const fromX = this.getRangeValue(tileX, burn[0].x, Math.max, 0);
            const toX = this.getRangeValue(tileX, burn[1].x, Math.min, tilesWidth - 1);
            const fromY = this.getRangeValue(tileY, burn[0].y, Math.max, 0);
            const toY = this.getRangeValue(tileY, burn[1].y, Math.min, tilesHeight - 1);
            for (let x = fromX; x <= toX; x++) {
                for (let y = fromY; y <= toY; y++) {
                    if (isValid(x, y)) {
                        positions.push({ x, y });
                    }
                }
            }
        }
        return positions;
    }

    private getRangeValue(
        tileC: number,
        c: Game.RangePosition['x'],
        alignFn: (...values: number[]) => number,
        alignValue: number,
    ): number {
        return c === 'e' ? alignValue : alignFn(c + tileC, alignValue);
    }
}