import { RefillCommand } from './command/RefillCommand';
import { BlastCommand } from './command/BlastCommand';
import { Command } from './command/Command';
import { Game } from './Game';
import { TileFactory } from './TileFactory';
import { 
    DefaultTileField, 
    TileField, 
} from './TileField';
import { UtilityConfig } from './UtilityConfig';
import { renameProperties } from './utils';
import { hasMoves } from './utils-game';
import { MoveCommand } from './command/MoveCommand';
import { CommandFactory } from './command/CommandFactory';

export class DefaultGame implements Game {

    private score = 0;
    private movesLeft = 0;
    private gameListeners: Game.GameListener[] = [];
    private tileField: TileField;
    private config: UtilityConfig;
    private commandChunks: Command[][] = [];

    constructor(
        config: Game.Config,
        private tileFactory: TileFactory,
        private commandFactory: CommandFactory,
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

    public getTile(x: number, y: number): Game.TileKind | undefined {
        return this.tileField.getTile(x, y);
    }

    public pickTile(x: number, y: number) {
        if (this.isGameOver()) {
            return;
        }

        const commandsChunk: Command[] = [];
        this.commandChunks.push(commandsChunk);
        const tile = this.tileField.getTile(x, y);
        if (this.config.isColorTile(tile)) {
            const blastCommand = new BlastCommand(this.tileField, { x, y });
            this.pushCommand(blastCommand);
        } else if (this.config.isSuperTile(tile)) {
            const superActions = this.config.config.superActions[tile];
            if (superActions === undefined) {
                throw new Error(`Undefined actions for ${tile} tile at {${x}; ${y}}`);
            }

            const superCommand = this.commandFactory.createSuperCommandForPosition(
                this, 
                superActions, 
                { x, y }, 
                1,
            );
            this.pushCommand(superCommand);
        } else {
            throw new Error(`${tile} tile at {${x}; ${y}}`);
        }
        if (commandsChunk.length === 0) {
            this.commandChunks.pop();
            return;
        }

        this.pushCommand(MoveCommand.createFalls(this));
        this.pushCommand(new RefillCommand(this, this.tileFactory));
        for (const command of commandsChunk) {
            this.execCommand(command);
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
        return this.movesLeft === 0 || !hasMoves(this.tileField, (t: Game.TileKind) => this.config.isSuperTile(t));
    }

    public getConfig(): UtilityConfig {
        return this.config;
    }

    public getTileField(): TileField {
        return this.tileField;
    }

    blastTile(x: number, y: number): void {
        this.setTile(x, y, Game.EMPTY_TILE);
    }

    moveTile(x0: number, y0: number, x1: number, y1: number): void {
        const tile = this.tileField.getTile(x0, y0);
        if (tile === undefined || Game.isTileEmpty(tile)) {
            return;
        }
        this.tileField.setTile(x1, y1, tile);
        this.tileField.setTile(x0, y0, Game.EMPTY_TILE);
    }

    setMovesLeft(value: number): void {
        this.movesLeft = value;
    }

    setScore(value: number): void {
        this.score = value;
    }

    setTile(x: number, y: number, tile: Game.TileKind): void {
        this.tileField.setTile(x, y, tile);
    }

    undo(): void {
        const chunk = this.commandChunks.pop();
        if (chunk === undefined) {
            return;
        }
        for (let i = chunk.length - 1; i >= 0; i--) {
            const cmd = chunk[i]!!;
            this.undoCommand(cmd);
        }
    }

    private execCommand(command: Command) {
        const result = command.do(this);
        this.handleCommandResult(result);
        const responseCommands = this.commandFactory.createAutoCommandsForResponse(
            this,
            this.tileFactory,
            result,
        );
        if (responseCommands.length === 0) {
            return;
        }
        this.insertCommandsAfter(command, ...responseCommands);
    }

    private undoCommand(command: Command) {
        const result = command.undo(this);
        this.handleCommandResult(result);
    }

    private handleCommandResult(result: Command.Result) {
        this.emitEvent(renameProperties(result, { type: 'id' }));
    }
    
    private onRestart() {
        this.score = 0;
        this.movesLeft = this.config.config.moves;
        this.commandChunks = [];
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

    private pushCommand(command: Command) {
        const commandChunk = this.commandChunks[this.commandChunks.length - 1];
        commandChunk?.push(command);
    }

    private insertCommandsAt(index: number, ...commands: Command[]) {
        const commandChunk = this.commandChunks[this.commandChunks.length - 1];
        commandChunk?.splice(index, 0, ...commands);
    }

    private insertCommandsAfter(command: Command, ...commands: Command[]) {
        const commandChunk = this.commandChunks[this.commandChunks.length - 1];
        const commandIndex = commandChunk?.indexOf(command);
        if (commandIndex === undefined || commandIndex === -1) {
            return;
        }

        this.insertCommandsAt(commandIndex + 1, ...commands);
    }
}
