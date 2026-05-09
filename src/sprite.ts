import type { SpriteId } from './types';

export function renderSprite(spriteId: SpriteId, label: string): HTMLElement {
  const node = document.createElement('div');
  if (!spriteId) {
    node.className = 'debug-sprite';
    node.textContent = 'デバッグ';
    node.setAttribute('aria-label', `${label} プレースホルダー`);
    return node;
  }

  node.className = 'sprite-missing';
  node.textContent = spriteId;
  return node;
}
