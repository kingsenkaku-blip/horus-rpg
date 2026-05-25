import type { EntityType } from "./types";

interface SpriteOptions {
  label?: string;
  entityType?: EntityType;
}

const placeholderColors: Record<EntityType, { fill: string; accent: string }> = {
  player: { fill: "#1b1b1b", accent: "#f2f2f2" },
  npc: { fill: "#202020", accent: "#b9f0ff" },
  enemy: { fill: "#241818", accent: "#ff9d9d" },
  object: { fill: "#1e1e24", accent: "#c6c6ff" }
};

export function renderSprite(
  context: CanvasRenderingContext2D,
  spriteId: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  options: SpriteOptions = {}
): void {
  if (!spriteId) {
    renderDebugPlaceholder(context, x, y, width, height, options);
    return;
  }

  renderDebugPlaceholder(context, x, y, width, height, {
    ...options,
    label: options.label ?? spriteId
  });
}

function renderDebugPlaceholder(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: SpriteOptions
): void {
  const colors = placeholderColors[options.entityType ?? "object"];
  const text = options.label ?? "デバッグ";

  context.save();
  context.fillStyle = colors.fill;
  context.fillRect(x, y, width, height);
  context.strokeStyle = colors.accent;
  context.lineWidth = 1;
  context.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);

  context.strokeStyle = "#5b5b5b";
  context.beginPath();
  context.moveTo(x + 2, y + 2);
  context.lineTo(x + width - 2, y + height - 2);
  context.moveTo(x + width - 2, y + 2);
  context.lineTo(x + 2, y + height - 2);
  context.stroke();

  context.fillStyle = colors.accent;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `${fitFontSize(context, text, Math.max(4, width - 3), Math.max(4, height - 3))}px "MS Gothic", monospace`;
  context.fillText(text, x + width / 2, y + height / 2);
  context.restore();
}

function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number
): number {
  const maxSize = Math.max(4, Math.floor(Math.min(maxHeight, maxWidth / 2)));
  for (let size = maxSize; size >= 4; size -= 1) {
    context.font = `${size}px "MS Gothic", monospace`;
    if (context.measureText(text).width <= maxWidth && size <= maxHeight) {
      return size;
    }
  }
  return 4;
}
