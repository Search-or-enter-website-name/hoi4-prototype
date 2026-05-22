import { fileOf, rankOf, colorOf, PIECE_UNICODE } from '../constants.js';

const EFFECT_MS = 700;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function squareEl(boardContainer, sq) {
  return boardContainer.querySelector(`[data-sq="${sq}"]`);
}

function animateMove(boardContainer, from, to) {
  const fromSq = squareEl(boardContainer, from);
  const toSq = squareEl(boardContainer, to);
  const piece = toSq?.querySelector('.piece:not(.fx-captured-ghost)');

  if (fromSq) fromSq.classList.add('fx-move-from');
  if (toSq) toSq.classList.add('fx-move-to');

  if (piece && !prefersReducedMotion()) {
    const df = fileOf(to) - fileOf(from);
    const dr = rankOf(to) - rankOf(from);
    piece.style.setProperty('--slide-dx', `${df * 100}%`);
    piece.style.setProperty('--slide-dy', `${dr * 100}%`);
    piece.classList.add('fx-sliding');
  }
}

/** Ghost of captured piece — shakes, then fades (square stays still) */
function spawnCapturedGhost(boardContainer, capturedSq, capturedPiece) {
  if (!capturedPiece || prefersReducedMotion()) return null;
  const sq = squareEl(boardContainer, capturedSq);
  if (!sq) return null;

  const ghost = document.createElement('span');
  ghost.className = `piece ${colorOf(capturedPiece)} fx-captured-ghost`;
  ghost.textContent = PIECE_UNICODE[capturedPiece];
  ghost.setAttribute('aria-hidden', 'true');
  sq.appendChild(ghost);
  return ghost;
}

function animateCapture(boardContainer, effect) {
  const { from, to, captured, capturedSq } = effect;
  animateMove(boardContainer, from, to);

  const fromSq = squareEl(boardContainer, from);
  const toSq = squareEl(boardContainer, to);
  if (fromSq) fromSq.classList.add('fx-capture-from');
  if (toSq) toSq.classList.add('fx-capture');

  return spawnCapturedGhost(boardContainer, capturedSq ?? to, captured);
}

function spawnConfetti(fxLayer) {
  if (!fxLayer || prefersReducedMotion()) return [];
  const colors = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#e67e22'];
  const pieces = [];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('span');
    el.className = 'confetti';
    el.style.left = `${15 + Math.random() * 70}%`;
    el.style.background = colors[i % colors.length];
    el.style.animationDelay = `${Math.random() * 0.25}s`;
    el.style.setProperty('--confetti-drift', `${(Math.random() - 0.5) * 120}px`);
    fxLayer.appendChild(el);
    pieces.push(el);
  }
  return pieces;
}

function animateCheckmate(boardContainer, overlayEl, fxLayer) {
  const grid = boardContainer.querySelector('.board-grid');
  const card = overlayEl?.querySelector('.overlay-card');

  if (grid && !prefersReducedMotion()) {
    grid.classList.add('fx-checkmate-board');
  }
  if (card) {
    card.classList.add('fx-checkmate-pop');
  }
  overlayEl?.classList.add('fx-checkmate-overlay');

  return spawnConfetti(fxLayer);
}

function cleanup(boardContainer, overlayEl, fxLayer, confetti, ghosts) {
  boardContainer.querySelectorAll('.fx-move-from, .fx-move-to, .fx-capture, .fx-capture-from').forEach((el) => {
    el.classList.remove('fx-move-from', 'fx-move-to', 'fx-capture', 'fx-capture-from');
  });
  boardContainer.querySelectorAll('.piece:not(.fx-captured-ghost)').forEach((el) => {
    el.classList.remove('fx-sliding');
    el.style.removeProperty('--slide-dx');
    el.style.removeProperty('--slide-dy');
  });
  ghosts.forEach((g) => g?.remove());
  boardContainer.querySelectorAll('.fx-captured-ghost').forEach((g) => g.remove());
  boardContainer.querySelector('.board-grid')?.classList.remove('fx-checkmate-board');
  overlayEl?.querySelector('.overlay-card')?.classList.remove('fx-checkmate-pop');
  overlayEl?.classList.remove('fx-checkmate-overlay');
  confetti.forEach((el) => el.remove());
  if (fxLayer) fxLayer.innerHTML = '';
}

export function playEffect(effect, boardContainer, overlayEl, fxLayer) {
  if (!effect || !boardContainer) return () => {};

  let confetti = [];
  let ghosts = [];

  if (effect.type === 'checkmate') {
    if (effect.capture) {
      ghosts = [animateCapture(boardContainer, effect)].filter(Boolean);
    } else {
      animateMove(boardContainer, effect.from, effect.to);
    }
    confetti = animateCheckmate(boardContainer, overlayEl, fxLayer);
  } else if (effect.type === 'capture') {
    ghosts = [animateCapture(boardContainer, effect)].filter(Boolean);
  } else {
    animateMove(boardContainer, effect.from, effect.to);
  }

  return () => cleanup(boardContainer, overlayEl, fxLayer, confetti, ghosts);
}

export function scheduleEffectCleanup(cleanupFn) {
  return window.setTimeout(cleanupFn, EFFECT_MS);
}
