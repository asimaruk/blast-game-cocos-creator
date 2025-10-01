import { Game } from "../Game";
import { TileFactory } from "../TileFactory";
import { AppearCommand } from "./AppearCommand";
import { BurnCommand } from "./BurnCommand";
import { Command } from "./Command";
import { CommandFactory } from "./CommandFactory";

type CommandResult = Command.Result['type'];
type AutoCommandsCreate<T extends CommandResult> = (
    game: Game, 
    tileFactory: TileFactory,
    result: Extract<Command.Result, { type: T }>,
) => Command[];
type AutoCommandsCreator<T extends CommandResult> =  { 
    type: T,
    invoke: AutoCommandsCreate<T>, 
};

export class DefaultCommandFactory implements CommandFactory {

    private autoCommandCreators: {[Key in CommandResult]?: AutoCommandsCreator<Key>} = {
        blasts: {
            type: 'blasts' as const,
            invoke: (game, factory, res) => this.createBlastAutoCommands(game, factory, res),
        },
        burns: {
            type: 'burns' as const, 
            invoke: (game, _, res) => this.createBurnAutoCommands(game, res),
        }
    };

    createSuperCommandForPosition(
        game: Game, 
        actions: Game.Action[], 
        actionPosition: Game.Position, 
        movesCost: number,
    ): Command {
        if (actions.every(a => a.id === 'burn')) {
            const burns = actions.reduce<Game.BurnAction['burns']>((burns, action) => { 
                burns.push(...action.burns);
                return burns;
            }, []);
            return new BurnCommand(game, burns, actionPosition, movesCost);
        }

        throw new Error(`Can't create command for actiions ${actions}`);
    }

     createAutoCommandsForResponse(
        game: Game, 
        tileFactory: TileFactory,
        result: Command.Result,
    ): Command[] {
        return this.invokeCreator(
            game, 
            tileFactory, 
            result, 
            this.autoCommandCreators[result.type],
        );
    }

    private invokeCreator<
        T extends CommandResult,
        R extends Extract<Command.Result, { type: T }>,
        C extends (typeof this.autoCommandCreators)[T],
    >(
        game: Game, 
        tileFactory: TileFactory,
        result: R,
        creator: C,
    ): Command[] {
        return creator?.invoke(game, tileFactory, result) ?? [];
    }

    private createBlastAutoCommands(
        game: Game, 
        tileFactory: TileFactory,
        result: Command.BlastResult,
    ): Command[] {
        const config = game.getConfig().config;
        const commands: Command[] = [];
        if (result.blasts.length >= config.countToSuper) {
            commands.push(new AppearCommand(
                tileFactory.createRandomSuperTile(), 
                result.position.x, 
                result.position.y,
            ));
        }
        return commands;
    }

    private createBurnAutoCommands(
        game: Game,
        result: Command.BurnsResult,
    ): Command[] {
        const configUtils = game.getConfig();
        const commands: Command[] = [];
        for (const burn of result.burns) {
            if (burn.x === result.position.x && burn.y === result.position.y) {
                continue;
            }
            const actions = configUtils.config.superActions[burn.tile];
            if (!actions || actions.length === 0) {
                continue;
            }
            const cmd = this.createSuperCommandForPosition(
                game, 
                actions, 
                burn, 
                0,
            );
            commands.push(cmd);
        }
        return commands;
    }
}