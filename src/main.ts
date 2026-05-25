import "./styles.css";
import { createTitleState, updateGame } from "./gameLogic";
import { InputController } from "./input";
import { renderGame } from "./renderer";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) {
  throw new Error("Canvas element was not found.");
}

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("2D canvas context is not available.");
}

const renderContext = context;
const input = new InputController(canvas);
let state = createTitleState();

function frame(now: number): void {
  state = updateGame(state, input, now);
  renderGame(renderContext, state);
  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
