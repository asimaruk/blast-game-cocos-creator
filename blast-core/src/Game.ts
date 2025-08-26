import {
    TileKind,
    EMPTY_TILE,
    isTileKind,
} from "./Tile";
import { TileFactory } from "./TileFactory";
import { 
    DefaultTileField, 
    TileField, 
} from "./TileField";
import { UtilityConfig } from "./UtilityConfig";
import {
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
    private tileField: TileField;
    private config: UtilityConfig;

    constructor(
        config: Game.Config,
        private tileFactory: TileFactory,
        tileField?: TileField,
    ) {
        this.config = new UtilityConfig(config);
        this.tileField = tileField 
                      ?? new DefaultTileField(
                        config.width,
                        config.height,
                        tileFactory.createRandomColors(config.width * config.height),
                      )
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
        if (this.config.isColorTile(tile)) {
            this.onColorPick(x, y, tile);
        } else if (this.config.isSuperTile(tile)) {
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

        const gens = generateNewTiles(this.tileField, () => this.tileFactory.createRandomColorTile());
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
            this.config = new UtilityConfig(cfg);
        }
        this.tileField = new DefaultTileField(
            this.config.config.width, 
            this.config.config.height,
            this.tileFactory.createRandomColors(this.config.config.width * this.config.config.height),
        );
        this.onRestart();
        this.emitEvent({
            id: 'restart',
            config: this.config.config,
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
        return this.movesLeft === 0 || !hasMoves(this.tileField, (t: TileKind) => this.config.isSuperTile(t));
    }

    public getWidth(): number {
        return this.config.config.width;
    }

    public getHeight(): number {
        return this.config.config.height;
    }

    private onRestart() {
        this.score = 0;
        this.movesLeft = this.config.config.moves;
    }
    
    private onColorPick(x: number, y: number, tile: TileKind) {
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

        if (touchingPositions.length >= this.config.config.countToSuper) {
            const randomSuper = this.tileFactory.createRandomSuperTile();
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

    private onSuperPick(x: number, y: number, tile: TileKind) {
        const burnPositions: Game.Position[] = [];
        const superTiles:Game.TilePosition[] = [{ x, y, tile }];
        for (let i = 0; i < superTiles.length; i++) {
            const superTile = superTiles[i];
            if (!this.config.isSuperTile(superTile?.tile)) {
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
        superTile: TileKind, 
        outBurnPositions: Game.Position[], 
        outSuperTiles: Game.TilePosition[],
    ) {
        const affectedPositions = getAffectedPositions(
            x, 
            y, 
            this.config.config.width, 
            this.config.config.height,
            this.config.config.superActions[superTile] ?? [],
        );
        for (const p of affectedPositions) {
            const tile = this.getTile(p.x, p.y);
            const isUnknownColorTile = outBurnPositions.findIndex(bp => bp.x === p.x && bp.y === p.y) === -1;
            const isUnknownSuperTile = outSuperTiles.findIndex(t => t.x === p.x && t.y === p.y) === -1;
            if (this.config.isColorTile(tile) && isUnknownColorTile) {
                outBurnPositions.push({ x: p.x, y: p.y });
            } else if (this.config.isSuperTile(tile) && isUnknownSuperTile) {
                outSuperTiles.push({ x: p.x, y: p.y, tile: tile });
            }
        }
    }

    private checkWinOrLose() {
        if (this.movesLeft === 0) {
            this.emitEvent({
                id: this.score >= this.config.config.winScore ? 'win' : 'lose'
            });
        } else if (!hasMoves(this.tileField, (t) => this.config.isSuperTile(t))) {
            this.emitEvent({ id: 'lose' });
        }
    }

    private emitEvent(event: Game.Event) {
        for (const listnr of this.gameListeners) {
            listnr.onGameEvent(event);
        }
    }

    private burnTiles(burnPositions: Game.Position[]) {
        for (const bp of burnPositions) {
            this.tileField.setTile(bp.x, bp.y, EMPTY_TILE);
        }
    }
}

export namespace Game {

    export type Position = {
        x: number,
        y: number,
    };

    export function isPosition(obj: unknown): obj is Position {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return 'x' in obj
            && typeof obj.x === 'number'
            && 'y' in obj
            && typeof obj.y === 'number';
    }

    export type TilePosition = { tile: TileKind } & Position;

    export function isTilePosition(obj: unknown): obj is Position {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return isPosition(obj)
            && 'tile' in obj
            && isTileKind(obj.tile);
    }

    export type RangePosition = {
        x: number | 'e',
        y : number | 'e',
    }

    export function isRangePosition(obj: unknown): obj is Position {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return 'x' in obj
            && (typeof obj.x === 'number' || obj.x === 'e')
            && 'y' in obj
            && (typeof obj.y === 'number' || obj.y === 'e');
    }

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
        tiles: TilePosition[],
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

    export type BurnAction = {
        id: 'burn',
        burns: (Position | [RangePosition, RangePosition])[],
    }

    function isBurnAction(obj: unknown): obj is BurnAction {
        if (typeof obj !== 'object' || obj === null) {
            return false;
        }

        return 'id' in obj
            && obj.id === 'burn'
            && 'burns' in obj
            && Array.isArray(obj.burns)
            && obj.burns.every(b => {
                return isPosition(b)
                    || Array.isArray(b)
                    && b.length === 2
                    && isRangePosition(b[0])
                    && isRangePosition(b[1]); 
            });
    }

    export type Action = BurnAction
                        ;

    export function isAction(obj: unknown): obj is Action {
        return isBurnAction(obj);
    }

    export type Config = {
        readonly width: number,
        readonly height: number,
        readonly moves: number,
        readonly winScore: number,
        readonly countToSuper: number,
        readonly colors: TileKind[],
        readonly superActions: {[key: TileKind]: Action[]},
    }
}