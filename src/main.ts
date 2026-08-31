import "./style.css";
import { Game } from "./game/game";
import { UI } from "./game/ui";

const canvas = document.getElementById("view") as HTMLCanvasElement;
const ui = new UI();
const game = new Game(canvas, ui);
game.boot();
