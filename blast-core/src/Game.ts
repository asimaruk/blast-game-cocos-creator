import { 
    isColorTile,
    isSuperTile,
    Position,
    TileColor,
    TileKind,
    TileSuper, 
    TilePosition,
    NotEmptyTilePosition,
} from "./Tile";
import { 
    DefaultTileField, 
    TileField, 
} from "./TileField";
import {
    createRandomSuperTile,
    fallTiles, 
    findTouchingTiles, 
    generateNewTiles,
    getAffectedPositions,
    hasMoves, 
} from "./utils-game";

export class Game {

    private score = 0;
    private movesLeft = 0;
    private gameListeners: Game.GameListener[] = [];

    constructor(
        private config: Game.Config,
        private tileField: TileField = new DefaultTileField(config.width, config.height),
    ) {
        this.onRestart();
    }

    public getTile(x: number, y: number): TileKind | undefined {
        return this.tileField.getTile(x, y);
    }

    public pick(x: number, y: number) {
        if (this.isGameOver()) {
            return;
        }

        const tile = this.tileField.getTile(x, y);
        if (isColorTile(tile)) {
            this.onColorPick(x, y, tile);
        } else if (isSuperTile(tile)) {
            this.onSuperPick(x, y, tile);
        } else {
            throw new Error(`${tile} tile at {${x}; ${y}}`);
        }

        const falls = fallTiles(this.tileField);
        if (falls.length > 0) {
            this.emitEvent({
                id: 'fall',
                falls: falls,
            });
        }

        const gens = generateNewTiles(this.tileField);
        if (gens.length > 0) {
            this.emitEvent({
                id: 'appear',
                tiles: gens,
            });
        }

        this.checkWinOrLose();
    }

    public restart(cfg?: Game.Config) {
        if (cfg) {
            this.config = cfg;
        }
        this.tileField = new DefaultTileField(this.config.width, this.config.height);
        this.onRestart();
        this.emitEvent({
            id: 'restart',
            config: this.config,
        });
    }

    public addGameListener(listener: Game.GameListener) {
        if (this.gameListeners.indexOf(listener) >= 0) {
            return;
        }

        this.gameListeners.push(listener);
    }

    public removeGameListener(listener: Game.GameListener) {
        const listenerIdx = this.gameListeners.indexOf(listener);
        if (listenerIdx === -1) {
            return;
        }

        this.gameListeners.splice(listenerIdx, 1);
    }

    public getMovesLeft(): number {
        return this.movesLeft;
    }

    public getScore(): number {
        return this.score;
    }

    public isGameOver() {
        return this.movesLeft === 0 || !hasMoves(this.tileField);
    }

    public getWidth(): number {
        return this.config.width;
    }

    public getHeight(): number {
        return this.config.height;
    }

    private onRestart() {
        this.score = 0;
        this.movesLeft = this.config.moves;
    }
    
    private onColorPick(x: number, y: number, tile: TileColor) {
        const touchingPositions = findTouchingTiles(this.tileField, x, y, tile);
        if (touchingPositions.length === 1) {
            return;
        }

        this.score += touchingPositions.length;
        this.movesLeft--;

        this.emitEvent({
            id: 'blast',
            positions: touchingPositions,
            score: this.score,
            movesLeft: this.movesLeft,
        });

        if (touchingPositions.length >= this.config.countToSuper) {
            const randomSuper = createRandomSuperTile();
            this.tileField.setTile(x, y, randomSuper);
            this.emitEvent({
                id: 'appear',
                tiles: [
                    { x, y, tile: randomSuper },
                ],
            });
            const superIdx = touchingPositions.findIndex(p => p.x === x && p.y === y);
            if (superIdx >= 0) {
                touchingPositions.splice(superIdx, 1);
            }
        }

        this.burnTiles(touchingPositions);
    }

    private onSuperPick(x: number, y: number, tile: TileSuper) {
        const burnPositions: Position[] = [];
        const superTiles: TilePosition[] = [{ x, y, tile }];
        for (let i = 0; i < superTiles.length; i++) {
            const superTile = superTiles[i];
            if (!isSuperTile(superTile?.tile)) {
                throw new Error('Super tile should be super');
            }
            this.useSuperTile(superTile.x, superTile.y, superTile.tile, burnPositions, superTiles);
        }

        this.score += burnPositions.length;
        this.movesLeft--;

        this.burnTiles(burnPositions.concat(superTiles));

        this.emitEvent({
            id: 'burn',
            burnPositions: burnPositions,
            superTiles: superTiles,
            movesLeft: this.movesLeft,
            score: this.score,
        });
    }

    private useSuperTile(
        x: number, 
        y: number, 
        superTile: TileSuper, 
        outBurnPositions: Position[], 
        outSuperTiles: TilePosition[],
    ) {
        const affectedPositions = getAffectedPositions(
            x, 
            y, 
            superTile, 
            this.config.width, 
            this.config.height,
        );
        for (const p of affectedPositions) {
            const tile = this.getTile(p.x, p.y);
            const isUnknownColorTile = outBurnPositions.findIndex(bp => bp.x === p.x && bp.y === p.y) === -1;
            const isUnknownSuperTile = outSuperTiles.findIndex(t => t.x === p.x && t.y === p.y) === -1;
            if (isColorTile(tile) && isUnknownColorTile) {
                outBurnPositions.push({ x: p.x, y: p.y });
            } else if (isSuperTile(tile) && isUnknownSuperTile) {
                outSuperTiles.push({ x: p.x, y: p.y, tile: tile });
            }
        }
    }

    private checkWinOrLose() {
        if (this.movesLeft === 0) {
            this.emitEvent({
                id: this.score >= this.config.winScore ? 'win' : 'lose'
            });
        } else if (!hasMoves(this.tileField)) {
            this.emitEvent({ id: 'lose' });
        }
    }

    private emitEvent(event: Game.Event) {
        for (const listnr of this.gameListeners) {
            listnr.onGameEvent(event);
        }
    }

    private burnTiles(burnPositions: Position[]) {
        for (const bp of burnPositions) {
            this.tileField.setTile(bp.x, bp.y, 'empty');
        }
    }
}

export namespace Game {

    type GameStats = {
        score: number,
        movesLeft: number,
    };

    type WinEvent = {
        id: 'win',
    };
    type LoseEvent = {
        id: 'lose',
    };
    type BlastEvent = {
        id: 'blast',
        positions: { x: number, y: number }[],
    } & GameStats;
    type FallEvent = {
        id: 'fall',
        falls: [Position, Position][],
    };
    type AppearEvent = {
        id: 'appear',
        tiles: NotEmptyTilePosition[],
    };
    type BurnEvent = {
        id: 'burn',
        burnPositions: { x: number, y: number }[],
        superTiles: TilePosition[],
    } & GameStats;
    type Restart = {
        id: 'restart',
        config: Game.Config,
    }

    export type Event = WinEvent 
                      | LoseEvent 
                      | BlastEvent 
                      | FallEvent 
                      | AppearEvent 
                      | BurnEvent
                      | Restart
                      ;

    export interface GameListener {
        onGameEvent(event: Event): void;
    }

    export type Config = {
        readonly width: number,
        readonly height: number,
        readonly moves: number,
        readonly winScore: number,
        readonly countToSuper: number,
    }
}