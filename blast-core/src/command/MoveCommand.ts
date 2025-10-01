import { Game } from "../Game";
import { TileField } from "../TileField";
import { Command } from "./Command";

type Moves = Command.MovesResult['moves'];
type Move = Moves[number];
type StringToNumber<S extends string> = S extends `${infer N extends number}` ? N : never;
type MoveIndex = StringToNumber<Exclude<keyof Move, keyof []>>;

export class MoveCommand implements Command {

    static createFalls(game: Game): MoveCommand {
        return new MoveCommand(() => this.getFallMoves(game.getTileField()));
    }

    static getFallMoves(tileField: TileField): Moves {
        const falls: Moves = [];
        for (let x = 0; x < tileField.width; x++) {
            for (let y = 0; y < tileField.height; y++) {
                const tile = tileField.getTile(x, y);
                const isFallen = falls.findIndex(m => m[0].x === x && m[0].y === y) >= 0;
                if (!(Game.isTileEmpty(tile) || isFallen)) {
                    continue;
                }
                for (let fallY = y + 1; fallY < tileField.height; fallY++) {
                    const fallTile = tileField.getTile(x, fallY);
                    const isFallen = falls.findIndex(m => m[0].x === x && m[0].y === fallY) >= 0;
                    const isTaken = falls.findIndex(f => f[1].x === x && f[1].y === y) >= 0;
                    const willNotFall = Game.isTileEmpty(fallTile) 
                                     || fallTile === undefined 
                                     || isFallen 
                                     || isTaken;
                    if (willNotFall) {
                        continue;
                    }
                    falls.push([
                        { x: x, y: fallY },
                        { x: x, y: y },
                    ]);
                    break;
                }
            }
        }
        return falls;
    }

    private _moves: Moves | null = null;
    private lazyMoves?: () => Moves;

    constructor(moves: Moves | (() => Moves)) {
        if (typeof moves === 'function') {
            this.lazyMoves = moves;
        } else {
            this._moves = moves;
        }
    }

    private get moves(): Moves {
        this._moves ??= this.lazyMoves?.() ?? [];
        return this._moves;
    }

    do(game: Game): Command.Result {
        const moves = this.move(game, 0, 1);
        return this.toResult(moves);

    }

    undo(game: Game): Command.Result {
        const moves = this.move(game, 1, 0);
        return this.toResult(moves);
    }

    private move<T extends MoveIndex>(
        game: Game, 
        from: T, 
        to: Exclude<MoveIndex, T>,
    ): Moves {
        const moves = this.moves.map<Move>(m => [m[from], m[to]]);
        const moveTiles = moves.map(m => game.getTile(m[0].x, m[0].y));
        for (let i = 0; i < moves.length; i++) {
            const move = moves[i];
            const tile = moveTiles[i];
            if (move === undefined || tile === undefined) {
                continue;
            }
            game.setTile(move[1].x, move[1].y, tile);
        }

        const empties = moves
            .filter(m1 => moves.findIndex(m2 => m1[0].x === m2[1].x && m1[0].y === m2[1].y) === -1)
            .map(m => m[0]);
        for (const emp of empties) {
            game.setTile(emp.x, emp.y, Game.EMPTY_TILE);
        }

        return moves;
    }

    private toResult(moves: Moves): Command.Result {
        return {
            type: 'moves',
            moves: moves,
        };
    }
}