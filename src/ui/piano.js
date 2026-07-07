import { noteName, isBlack } from '../notes.js';

/**
 * Renders an on-screen piano and reports note on/off via callbacks. Pure UI —
 * it knows nothing about the synth engine.
 *
 *   const piano = createPiano(el, { span: 17, onDown, onUp, hintFor });
 *   piano.setBase(60);            // C4
 *   piano.setActive(60, true);    // highlight a key
 */
export function createPiano(container, { span = 17, onDown, onUp, hintFor } = {}) {
  let baseMidi = 60;
  const keyEls = new Map(); // midi -> element
  let mouseMidi = null;

  function countWhites() {
    let n = 0;
    for (let i = 0; i < span; i++) if (!isBlack(baseMidi + i)) n++;
    return n;
  }

  function keyEl(midi, cls) {
    const el = document.createElement('div');
    el.className = `key ${cls}`;
    el.dataset.midi = String(midi);
    const hint = hintFor ? hintFor(midi) : '';
    el.innerHTML =
      `${hint ? `<span class="khint">${hint}</span>` : '<span class="khint"></span>'}` +
      `<span class="klabel">${noteName(midi)}</span>`;
    return el;
  }

  function render() {
    container.innerHTML = '';
    keyEls.clear();
    const wrap = document.createElement('div');
    wrap.className = 'piano';
    const whiteWidth = 100 / countWhites();

    // White keys first (in-flow), then black keys positioned over the gaps.
    for (let i = 0; i < span; i++) {
      const midi = baseMidi + i;
      if (!isBlack(midi)) {
        const el = keyEl(midi, 'white');
        el.style.width = `${whiteWidth}%`;
        wrap.appendChild(el);
        keyEls.set(midi, el);
      }
    }
    let wIdx = 0;
    for (let i = 0; i < span; i++) {
      const midi = baseMidi + i;
      if (isBlack(midi)) {
        const el = keyEl(midi, 'black');
        el.style.left = `${wIdx * whiteWidth - whiteWidth * 0.3}%`;
        el.style.width = `${whiteWidth * 0.6}%`;
        wrap.appendChild(el);
        keyEls.set(midi, el);
      } else {
        wIdx++;
      }
    }
    container.appendChild(wrap);
  }

  container.addEventListener('pointerdown', (e) => {
    const k = e.target.closest('.key');
    if (!k) return;
    e.preventDefault();
    mouseMidi = Number(k.dataset.midi);
    onDown?.(mouseMidi);
  });
  // Release on pointerup anywhere so dragging off a key still stops the note.
  window.addEventListener('pointerup', () => {
    if (mouseMidi != null) {
      onUp?.(mouseMidi);
      mouseMidi = null;
    }
  });

  return {
    render,
    setBase(m) { baseMidi = m; render(); },
    getBase() { return baseMidi; },
    setActive(midi, on) {
      keyEls.get(midi)?.classList.toggle('active', on);
    },
  };
}
