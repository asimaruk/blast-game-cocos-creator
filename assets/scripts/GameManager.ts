const { ccclass, property, requireComponent } = cc._decorator;
import { 
    DefaultGame,
    Game,
    TileFactory as GameTileFactory,
} from "blast-core";
import { Tiles } from "./Tiles";
import { Tile } from "./Tile";
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

@ccclass
@requireComponent(TileFactory)
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
        this.game = new DefaultGame(config.game, tilesFactory);
        this.game.addGameListener(this);
        this.tiles?.node.on(Tiles.EventType.TILES_CLICK, this.onTilesClick, this);
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
    }

    public onGameEvent(event: Game.Event) {
        switch (event.id) {
            case "win":
            case "lose":
                this.onGameOver(event);
                break;
            case "blast":
                this.onGameBlastEvent(event);
                break;
            case "fall":
                this.onGameFallEvent(event);
                break;
            case "appear":
                this.onGameAppearEvent(event);
                break;
            case 'burn':
                this.onGameBurnEvent(event);
                break;
            case 'restart':
                this.onGameRestart(event);
                break;
        }
    }

    private restart(config?: Game.Config) {
        this.game?.restart(config);
    }

    private onRestart(
        config: Game.Config, 
        options?: {
            resizeTiles?: boolean,
            tilesFadeIn: boolean,
            gameOverTitlesFadeOut: boolean,
        },
    ) {
        if (options?.resizeTiles ?? false) {
            this.resizeTiles(config.width, config.height);
        } 
        if (options?.tilesFadeIn) {
            this.appearAllTiles();
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

    private appearAllTiles() {
        const tweens: cc.Tween[] = [];
        for (const t of this.tiles?.getAllChildTiles() ?? []) {
            tweens.push(tweenFadeIn(t));
        }
        this.tiles?.queueTweens(...tweens);
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
            this.game.pick(tilePosition.x, tilePosition.y);
        }
    }

    private onGameBlastEvent(event: Extract<Game.Event, { id: 'blast' }>) {
        log('Game: blast', event);
        this.setScore(event.score);
        this.setMoves(event.movesLeft)
        this.blastTiles(event.positions);
    }

    private onGameFallEvent(event: Extract<Game.Event, { id: 'fall'}>) {
        log('Game: fall', event);
        const tweens: cc.Tween[] = [];
        for (const fall of event.falls) {
            const tileNode = this.tiles?.getChildTile(fall[0].x, fall[0].y);
            if (!tileNode) {
                throw new Error(`Can not find tile for {${fall[0].x}; ${fall[0].y}}`);
            }
            const fallTo = this.tiles?.getNodePosition(fall[1].x, fall[1].y);
            if (!fallTo) {
                throw new Error(`Unknown position for {${fall[1].x}; ${fall[1].y}}`);
            }
            const tween = tweenMove(tileNode, fallTo);
            tweens.push(tween);
        }
        this.tiles?.queueTweens(...tweens);
    }

    private onGameAppearEvent(event: Extract<Game.Event, { id: 'appear'}>) {
        log('Game: appear', event);
        if (!this.tiles) {
            return;
        }
        const tweens: cc.Tween[] = [];
        for (const aptile of event.tiles) {
            const tileNode = this.tileFactory.getTile(aptile.tile);
            this.tiles.addTile(tileNode);
            const nodePos = this.tiles.getNodePosition(aptile.x, aptile.y);
            tileNode.setPosition(nodePos);
            const tween = tweenScaleOut(tileNode);
            tweens.push(tween);
        }
        this.tiles.queueTweens(...tweens);
    }

    private onGameBurnEvent(event: Extract<Game.Event, { id: 'burn' }>) {
        log('Game: burn', event);
        this.setScore(event.score);
        this.setMoves(event.movesLeft)
        this.blastTiles(event.burnPositions.concat(event.superTiles));
    }

    private onGameOver(event: Extract<Game.Event, { id: 'win' | 'lose' }>) {
        log(`Game: ${event.id}`, event);
        const tweens: cc.Tween[] = [];
        this.tiles?.node.children.forEach(tileNode => {
            if (tileNode.getComponent(Tile) === null) {
                return;
            }
            const tween = tweenFadeOut(tileNode)
                .call(() => {
                    this.tileFactory.put(tileNode);
                });
            tweens.push(tween);
        });
        this.tiles?.queueTweens(...tweens);
        const titleNode = event.id === 'win' ? this.winTitle : this.loseTitle;
        if (titleNode) {
            titleNode.active = true;
            tweenFadeIn(titleNode).start();
        }
    }

    private onGameRestart(event: Extract<Game.Event, { id: 'restart' }>) {
        this.onRestart(
            event.config, 
            {
                resizeTiles: true,
                tilesFadeIn: true,
                gameOverTitlesFadeOut: true,
            },
        );
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

    private blastTiles(tilelPositions: Game.Position[]) {
        const blastTiles = tilelPositions.map(p => this.tiles?.getChildTile(p.x, p.y)).filter(t => t !== undefined);
        const tweens: cc.Tween[] = [];
        for (const t of blastTiles) {
            const tween = tweenTileBlast(
                t, 
                () => {
                    const sparks = this.getSparks();
                    this.tiles?.node.addChild(sparks.node);
                    sparks.node.setPosition(t.position);
                    sparks.scheduleOnce(
                        () => {
                            this.tiles?.node.removeChild(sparks.node);
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
        this.tiles?.queueTweens(...tweens);
    }
}
