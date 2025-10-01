import { Game } from "../Game";
import { TileFactory } from "../TileFactory";
import { Command } from "./Command";

export interface CommandFactory {
    createSuperCommandForPosition(
        game: Game,
        actions: Game.Action[],
        actionPosition: Game.Position,
        movesCost: number,
    ): Command;

    createAutoCommandsForResponse(
        game: Game, 
        tileFactory: TileFactory,
        result: Command.Result,
    ): Command[];
}