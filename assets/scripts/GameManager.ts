const { ccclass, property, requireComponent } = cc._decorator;
import { 
    DefaultCommandFactory,
    DefaultGame,
    Game,
    TileFactory as GameTileFactory,
} from "blast-core";
import { Tiles } from "./Tiles";
import { error, log } from "./utils-log";
import { 
    tweenScaleOut, 
    tweenTileBlast, 
    tweenFadeOut, 
    tweenMove,
    tweenFadeIn, 
} from "./tweens";
import { 
    Config, 
    DEFAULT_GAME_CONFIG, 
    DEFAULT_SPRITES,
} from "./Config";
import TileFactory from "./TileFactory";
import { KeyboardManager } from "./KeyboardManager";

@ccclass
@requireComponent(TileFactory)
@requireComponent(KeyboardManager)
export default class GameManager extends cc.Component implements Game.GameListener {

    @property(cc.Label)
    moves: cc.Label | null = null;
    @property(cc.Label)
    score: cc.Label | null = null;
    @property(cc.Label)
    winScore: cc.Label | null = null;
    @property(Tiles)
    tiles: Tiles | null = null;
    @property(cc.Prefab)
    sparksPrefab: cc.Prefab | null = null;
    @property(cc.Node)
    winTitle: cc.Node | null = null;
    @property(cc.Node)
    loseTitle: cc.Node | null = null;

    private game: Game | null = null;
    private sparksPool = new cc.NodePool();
    private tileFactory: TileFactory = null!;
    private gameEventsAsyncQueue: Promise<void> = Promise.resolve();

    protected onLoad(): void {
        const extGameConfig = cc.game.config['gameConfig'];
        if (!CC_PREVIEW && !Config.isConfig(extGameConfig)) {
            error('Game config invalid');
        }
        const config: Config = Config.isConfig(extGameConfig) 
                     ? extGameConfig 
                     : {
                        game: DEFAULT_GAME_CONFIG,
                        sprites: DEFAULT_SPRITES,
                     };
        const tilesFactory = new GameTileFactory(
            config.game.colors,
            Object.keys(config.game.superActions),
        );
        const commandFactory = new DefaultCommandFactory();
        this.game = new DefaultGame(
            config.game, 
            tilesFactory,
            commandFactory,
        );
        this.game.addGameListener(this);
        this.tiles?.node.on(Tiles.EventType.TILES_CLICK, this.onTilesClick, this);
        this.node.on(KeyboardManager.EventType.CLICK_EVENT, this.onKeyClickEvent, this);
        this.onLoadAsync(config);

        this.onRestart(
            config.game, 
            {
                resizeTiles: false,
                gameOverTitlesFadeOut: false,
                tilesFadeIn: false,
            },
        );
    }

    private async onLoadAsync(config: Config): Promise<void> {
        await this.setupTilesFactory(config.sprites);
        this.resizeTiles(config.game.width, config.game.height);
        this.appearAllTiles();
    }

    private async setupTilesFactory(spritesConfig: Config['sprites']): Promise<void> {
        this.tileFactory = this.getComponent(TileFactory);
        this.tileFactory.setupSpritesConfig(spritesConfig);

        const proms = Object.keys(spritesConfig).map(tile =>  new Promise<void>((res, rej) => {
            const path = spritesConfig[tile];
            cc.resources.load(
                path, 
                (err: Error, tex: cc.Texture2D) => {
                    if (err) {
                        error(err);
                        rej(err);
                    } else {
                        const sprite = new cc.SpriteFrame(tex);
                        this.tileFactory.setupSprite(tile, sprite);
                        res();
                    }
                }
            );
        }));
        await Promise.all(proms);
    }

    protected onDestroy(): void {
        this.game?.removeGameListener(this);
        this.tiles?.node.off(Tiles.EventType.TILES_CLICK, this.onTilesClick, this);
        this.node.off(KeyboardManager.EventType.CLICK_EVENT, this.onKeyClickEvent, this);
    }

    public onGameEvent(event: Game.Event) {
        log('Game Event: ', event);
        this.gameEventsAsyncQueue = this.gameEventsAsyncQueue.then(() => this.onGameEventAsync(event));
    }

    private async onGameEventAsync(event: Game.Event): Promise<void> {
        this.setScore(this.game?.getScore() ?? 0);
        this.setMoves(this.game?.getMovesLeft() ?? 0);
        switch (event.id) {
            case "win":
            case "lose":
                await this.onGameOver(event);
                break;
            case "blasts":
                await this.onGameBlastEvent(event);
                break;
            case "moves":
                await this.onGameMoveEvent(event);
                break;
            case "refills":
                await this.onGameRefillEvent(event);
                break;
            case "appears":
                await this.onGameAppearsEvent(event);
                break;
            case "burns":
                await this.onGameBurnEvent(event);
                break;
            case "disappears":
                await this.onGameDisappearEvent(event);
                break;
            case 'restart':
                await this.onGameRestart(event);
                break;
        }
    }

    private restart(config?: Game.Config) {
        this.game?.restart(config);
    }

    private async onRestart(
        config: Game.Config, 
        options?: {
            resizeTiles?: boolean,
            tilesFadeIn: boolean,
            gameOverTitlesFadeOut: boolean,
        },
    ): Promise<void> {
        if (options?.resizeTiles ?? false) {
            this.resizeTiles(config.width, config.height);
        } 
        if (options?.tilesFadeIn) {
            await this.appearAllTiles();
        }
        this.setWinScore(config.winScore);
        this.setScore(0);
        this.setMoves(config.moves);
        this.hideGameOverTitle(this.winTitle, options?.gameOverTitlesFadeOut ?? false);
        this.hideGameOverTitle(this.loseTitle, options?.gameOverTitlesFadeOut ?? false);
    }

    private resizeTiles(
        width: number, 
        height: number,
    ) {
        if (!this.tiles) {
            return;
        }

        this.tiles.resize(width, height);
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const tile = this.game?.getTile(x, y);
                if (!tile) {
                    continue;
                }
                const tileNode = this.tileFactory.getTile(tile);
                this.tiles.addTile(tileNode);
                tileNode.setPosition(this.tiles.getNodePosition(x, y));
            }
        }
    }

    private async appearAllTiles(): Promise<void> {
        if (!this.tiles) {
            return;
        }
        const tweens: cc.Tween[] = [];
        for (const t of this.tiles.getAllChildTiles() ?? []) {
            tweens.push(tweenFadeIn(t));
        }
        await this.tiles.queueTweens(...tweens);
    }

    private setWinScore(winScore: number) {
        if (!this.winScore) {
            return;
        }

        this.winScore.string = `${winScore}`;
    }

    private hideGameOverTitle(
        title: cc.Node | null,
        fadeOut: boolean,
    ) {
        if (!title || !title.active) {
            return;
        }

        if (fadeOut) {
            tweenFadeOut(title)
                .call(() => title.active = false)
                .start();
        } else {
            title.active = false;
        }
    }

    private onTilesClick(tilePosition: cc.Vec2) {
        log(`Tile pick {${tilePosition.x}; ${tilePosition.y}}`);
        if (this.game === null) {
            return;
        }

        if (this.game.isGameOver()) {
            this.restart();
        } else {
            this.game.pickTile(tilePosition.x, tilePosition.y);
        }
    }

    private onKeyClickEvent(event: KeyboardManager.ClickEvent) {
        log('ClickEvent', event);
        switch (event.hotKey) {
            case KeyboardManager.KeyActions.UNDO:
                this.game?.undo();
                break;
        }
    }

    private onGameBlastEvent(event: Game.BlastEvent): Promise<void> {
        return this.blastTiles(event.blasts);
    }

    private async onGameMoveEvent(event: Game.MoveEvent): Promise<void> {
        if (!this.tiles) {
            return;
        }

        const tweens: cc.Tween[] = [];
        for (const move of event.moves) {
            const tileNode = await this.tiles.getChildTile(move[0].x, move[0].y);
            const moveTo = this.tiles.getNodePosition(move[1].x, move[1].y);
            if (!moveTo) {
                throw new Error(`Unknown position for {${move[1].x}; ${move[1].y}}`);
            }
            const tween = tweenMove(tileNode, moveTo);
            tweens.push(tween);
        }
        await this.tiles.queueTweens(...tweens);
    }

    private async appearTilePositions(tilePositions: Game.TilePosition[]): Promise<void> {
        if (!this.tiles) {
            return;
        }
        const tweens: cc.Tween[] = [];
        for (const aptile of tilePositions) {
            const tileNode = this.tileFactory.getTile(aptile.tile);
            this.tiles.addTile(tileNode);
            const nodePos = this.tiles.getNodePosition(aptile.x, aptile.y);
            tileNode.setPosition(nodePos);
            const tween = tweenScaleOut(tileNode);
            tweens.push(tween);
        }
        await this.tiles.queueTweens(...tweens);
    }

    private onGameAppearsEvent(event: Game.AppearsEvent): Promise<void> {
        return this.appearTilePositions(event.appears);
    }

    private onGameRefillEvent(event: Game.RefillEvent): Promise<void> {
        return this.appearTilePositions(event.refills);
    }

    private onGameBurnEvent(event: Game.BurnEvent): Promise<void> {
        return this.blastTiles(event.burns);
    }

    private async onGameOver(event: Game.WinEvent | Game.LoseEvent): Promise<void> {
        if (!this.tiles) {
            return;
        }
        const tweens: cc.Tween[] = [];
        this.tiles.getAllChildTiles().forEach(tileNode => {
            const tween = tweenFadeOut(tileNode)
                .call(() => {
                    this.tileFactory.put(tileNode);
                });
            tweens.push(tween);
        });
        await this.tiles.queueTweens(...tweens);
        const titleNode = event.id === 'win' ? this.winTitle : this.loseTitle;
        if (titleNode) {
            titleNode.active = true;
            tweenFadeIn(titleNode).start();
        }
    }

    private onGameRestart(event: Game.Restart): Promise<void> {
        return this.onRestart(
            event.config, 
            {
                resizeTiles: true,
                tilesFadeIn: true,
                gameOverTitlesFadeOut: true,
            },
        );
    }

    private onGameDisappearEvent(event: Game.DisappearEvent): Promise<void> {
        return this.fadeOutPositions(event.disappears);
    }

    private async fadeOutPositions(positions: Game.Position[]): Promise<void> {
        const tiles = this.tiles;
        if (!tiles) {
            return;
        }

        const tweens: cc.Tween[] = [];
        const tileNodes = await Promise.all(positions.map(p => tiles.getChildTile(p.x, p.y)));
        tileNodes.forEach(tileNode => {
            const tween = tweenFadeOut(tileNode)
                .call(() => {
                    this.tileFactory.put(tileNode);
                });
            tweens.push(tween);
        });
        await tiles.queueTweens(...tweens);
    }

    private getSparks(): cc.ParticleSystem {
        if (this.sparksPrefab === null) {
            throw new Error('Sparks prefab is not set');
        }
        const sparks = this.sparksPool.get() || cc.instantiate(this.sparksPrefab);
        const particles = sparks.getComponent(cc.ParticleSystem);
        if (!particles) {
            throw new Error('No ParticleSystem component');
        }
        particles.resetSystem();
        
        return particles;
    }

    private setScore(score: number) {
        if (this.score) {
            this.score.string = `${score}`;
        }
    }

    private setMoves(moves: number) {
        if (this.moves) {
            this.moves.string = `${moves}`;
        }
    }

    private async blastTiles(tilelPositions: Game.Position[]): Promise<void> {
        const tiles = this.tiles;
        if (!tiles) {
            return;
        }
        const blastTiles = await Promise.all(tilelPositions.map(p => tiles.getChildTile(p.x, p.y)));
        const tweens: cc.Tween[] = [];
        for (const t of blastTiles) {
            const tween = tweenTileBlast(
                t, 
                () => {
                    const sparks = this.getSparks();
                    tiles.node.addChild(sparks.node);
                    sparks.node.setPosition(t.position);
                    sparks.scheduleOnce(
                        () => {
                            tiles.node.removeChild(sparks.node);
                            this.sparksPool.put(sparks.node);
                        },
                        sparks.duration + sparks.life + sparks.lifeVar,
                    );
                }
            )
            .call(() => {
                this.tileFactory.put(t);
            });
            tweens.push(tween);
        }
        await tiles.queueTweens(...tweens);
    }
}
