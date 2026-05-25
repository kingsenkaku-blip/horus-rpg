import type { Action, Direction, ScreenPoint } from "./types";

const keyToAction = new Map<string, Action>([
  ["ArrowUp", "up"],
  ["KeyW", "up"],
  ["ArrowDown", "down"],
  ["KeyS", "down"],
  ["ArrowLeft", "left"],
  ["KeyA", "left"],
  ["ArrowRight", "right"],
  ["KeyD", "right"],
  ["Enter", "confirm"],
  ["Space", "confirm"],
  ["Escape", "cancel"],
  ["Backspace", "cancel"]
]);

const directionPriority: Direction[] = ["up", "down", "left", "right"];

export class InputController {
  private down = new Set<Action>();
  private pressed = new Set<Action>();
  private clicks: ScreenPoint[] = [];

  constructor(canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", (event) => {
      const action = keyToAction.get(event.code);
      if (!action) {
        return;
      }

      event.preventDefault();
      if (!this.down.has(action)) {
        this.pressed.add(action);
      }
      this.down.add(action);
    });

    window.addEventListener("keyup", (event) => {
      const action = keyToAction.get(event.code);
      if (!action) {
        return;
      }

      event.preventDefault();
      this.down.delete(action);
    });

    window.addEventListener("blur", () => {
      this.down.clear();
      this.pressed.clear();
    });

    canvas.addEventListener("click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.clicks.push({
        x: Math.floor((event.clientX - rect.left) * scaleX),
        y: Math.floor((event.clientY - rect.top) * scaleY)
      });
    });
  }

  consumeAction(...actions: Action[]): Action | undefined {
    const action = actions.find((candidate) => this.pressed.has(candidate));
    if (action) {
      this.pressed.delete(action);
    }
    return action;
  }

  getHeldDirection(): Direction | undefined {
    return directionPriority.find((direction) => this.down.has(direction));
  }

  consumeClick(): ScreenPoint | undefined {
    return this.clicks.shift();
  }

  endFrame(): void {
    this.pressed.clear();
  }
}
