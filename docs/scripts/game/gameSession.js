import { audioPlayer, audios } from "../Audio.js";
import { canvas } from "../Canvas.js";
import { colors } from "../Color.js";
import { Fonts } from "../Font.js";
import { session } from "../Session.js";
import { Button } from "../ui/Button.js";
import { TextObject } from "../ui/Text.js";
import { UiObject } from "../ui/UiObject.js";
import { difficulties } from "./gameModes.js";
import { gameModeRounds } from "./rounds.js";
import { tracks } from "./tracks.js";
var sessionState;
(function (sessionState) {
    sessionState[sessionState["WAITING"] = 0] = "WAITING";
    sessionState[sessionState["ROUND"] = 1] = "ROUND";
})(sessionState || (sessionState = {}));
export class GameSession extends UiObject {
    constructor() {
        super(0, 0, canvas.width, canvas.height);
        this.startFlash = 0;
        this.endFlash = 0;
        this.HUD = {
            // "track": new TextObject("T", 30, 5, 10, Fonts.BODY, colors.SOLID),
            "roundNumber": new TextObject("R", 5, 285, 10, Fonts.BODY, colors.SOLID),
            "lives": new TextObject("♥", 30, 5, 10, Fonts.BODY, colors.SOLID),
            "cash": new TextObject("$", 30, 15, 10, Fonts.BODY, colors.SOLID),
        };
        this.startButton = new Button("NEXT ROUND", 301, 275, 10, () => null);
        this.pauseButton = new Button("❚❚", 7, 5, 10, () => null);
        this.startButton.onClick = (function () {
            this.startNextRound();
        }).bind(this);
    }
    initialize(trackName, difficulty, gameMode) {
        console.log("INITALIZED!");
        this.trackName = trackName;
        this.difficulty = difficulty;
        this.gameMode = gameMode;
        this.enemies = [];
        this.track = tracks.getTrack(this.trackName);
        switch (difficulty) {
            case difficulties.MEDIUM:
                this.cash = 800;
                this.lives = 100;
                break;
            case difficulties.HARD:
                this.cash = 600;
                this.lives = 40;
                break;
            case difficulties.DEATH:
                this.cash = 400;
                this.lives = 1;
                break;
            default: // Easy
                this.cash = 1000;
                this.lives = 200;
                break;
        }
        this.startButton.calcSize();
        this.roundNumber = 0;
        this.roundQueue = gameModeRounds.getGameModeRounds(this.gameMode);
        this.currentRound = this.roundQueue.getRound(1);
        this.currentState = sessionState.WAITING;
        this.startButton.disabled = false;
    }
    addEnemy(enemy) {
        this.enemies.push(enemy);
        this.startFlash = 5;
    }
    drawTrack() {
        this.track.draw();
    }
    drawTrackStart() {
        this.track.drawStart();
    }
    drawTrackEnd() {
        this.track.drawEnd();
    }
    drawHUD() {
        this.HUD.roundNumber.draw();
        this.HUD.cash.draw();
        this.HUD.lives.draw();
        // this.HUD.track.draw()
    }
    draw() {
        this.drawTrack();
        this.drawTrackStart();
        this.drawTrackEnd();
        this.enemies.forEach(e => e.draw());
        this.drawHUD();
        this.startButton.draw();
        this.pauseButton.draw();
    }
    loseLives(numLives) {
        audioPlayer.playAudio(audios.DESTROY);
        this.endFlash = 5;
        this.lives -= numLives;
        if (this.lives <= 0) {
            session.currentScreen = "LOSE" /* LOSE */;
        }
    }
    startNextRound() {
        if (this.roundNumber < this.roundQueue.length) {
            this.startButton.disabled = true;
            this.currentState = sessionState.ROUND;
            this.currentRound = this.roundQueue.getRound(this.roundNumber + 1);
        }
    }
    endCurrentRound() {
        this.currentState = sessionState.WAITING;
        this.startButton.disabled = false;
        this.roundNumber++;
        if (this.roundNumber == this.roundQueue.length) {
            session.currentScreen = "WIN" /* WIN */;
        }
    }
    update() {
        // this.HUD.track.text = "" + this.trackName
        this.startButton.update();
        this.pauseButton.update();
        if (this.currentState == sessionState.ROUND) {
            this.currentRound.update();
            if (this.currentRound.numRemaining == 0 && this.enemies.length == 0) {
                this.endCurrentRound();
            }
        }
        this.enemies = this.enemies.filter(e => {
            e.update(this.track);
            if (e.distance >= this.track.length) { // Enemy escaped!
                this.loseLives(e.health);
                return false;
            }
            else {
                return true;
            }
        });
        this.HUD.roundNumber.text = "R " + this.roundNumber + "/" + this.roundQueue.length;
        this.HUD.cash.text = "$ " + this.cash;
        this.HUD.lives.text = "♥ " + this.lives;
        this.startFlash -= this.startFlash > 0 ? 1 : 0;
        this.endFlash -= this.endFlash > 0 ? 1 : 0;
        this.track.startColor = this.startFlash > 0 ? colors.ULTRABRIGHT : colors.SOLID;
        this.track.endColor = this.endFlash > 0 ? colors.ULTRABRIGHT : colors.SOLID;
    }
}
const gameSession = new GameSession();
export { gameSession };
