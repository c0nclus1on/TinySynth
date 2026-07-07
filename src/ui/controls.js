// Builds the synth control panels and binds each control to synth.set(path).
// Sliders support an optional logarithmic curve (used for filter cutoff).
const WAVES = ['sine', 'sawtooth', 'square', 'triangle'];

export function buildControls(root, synth) {
  const p = synth.params;
  root.innerHTML = '';

  root.append(
    panel('Oscillator 1', [select('osc1.wave', 'Waveform', WAVES, p.osc1.wave)]),
    panel('Oscillator 2', [
      select('osc2.wave', 'Waveform', WAVES, p.osc2.wave),
      slider('osc2.detune', 'Detune', -50, 50, 1, p.osc2.detune, 'cent'),
      slider('osc2.level', 'Level', 0, 1, 0.01, p.osc2.level, ''),
    ]),
    panel('Filter (low-pass)', [
      slider('filter.cutoff', 'Cutoff', 20, 12000, null, p.filter.cutoff, 'Hz', 'log'),
      slider('filter.q', 'Resonance', 0, 20, 0.1, p.filter.q, ''),
    ]),
    panel('Amp Envelope', [
      slider('env.a', 'Attack', 0.001, 2, 0.001, p.env.a, 's'),
      slider('env.d', 'Decay', 0.001, 2, 0.001, p.env.d, 's'),
      slider('env.s', 'Sustain', 0, 1, 0.01, p.env.s, ''),
      slider('env.r', 'Release', 0.001, 3, 0.001, p.env.r, 's'),
    ]),
    panel('LFO', [
      select('lfo.wave', 'Waveform', WAVES, p.lfo.wave),
      slider('lfo.rate', 'Rate', 0.1, 20, 0.1, p.lfo.rate, 'Hz'),
      slider('lfo.depth', 'Depth', 0, 1, 0.01, p.lfo.depth, ''),
      select('lfo.dest', 'Destination', ['off', 'pitch', 'filter'], p.lfo.dest),
    ]),
    panel('Master', [slider('master.volume', 'Volume', 0, 1, 0.01, p.master.volume, '')])
  );

  root.querySelectorAll('[data-path]').forEach((el) => {
    const path = el.dataset.path;
    const isLog = el.dataset.curve === 'log';
    const readout = el.parentElement.querySelector('.val');
    const readValue = () => {
      if (el.tagName === 'SELECT') return el.value;
      if (isLog) {
        const t = parseFloat(el.value);
        const min = parseFloat(el.dataset.min);
        const max = parseFloat(el.dataset.max);
        return min * Math.pow(max / min, t);
      }
      return parseFloat(el.value);
    };
    const showValue = () => {
      if (readout) readout.textContent = fmt(readValue(), el.dataset.unit);
    };
    const apply = () => {
      synth.set(path, readValue());
      showValue();
    };

    if (el.tagName === 'SELECT') {
      // Nothing to drag: apply on change, then hand focus back to the keyboard.
      el.addEventListener('change', () => { apply(); el.blur(); });
    } else {
      // Sliders apply in real time while dragging — the engine smooths the
      // continuous params so fast moves don't zipper. Focus returns on release.
      el.addEventListener('input', apply);
      el.addEventListener('change', () => el.blur());
    }
  });
}

function panel(title, parts) {
  const sec = document.createElement('section');
  sec.className = 'panel';
  sec.innerHTML = `<h2>${title}</h2><div class="ctls">${parts.join('')}</div>`;
  return sec;
}

function slider(path, label, min, max, step, value, unit, curve) {
  let attrs;
  if (curve === 'log') {
    const t = Math.log(value / min) / Math.log(max / min);
    attrs = `type="range" min="0" max="1" step="0.001" value="${t}" data-min="${min}" data-max="${max}" data-curve="log"`;
  } else {
    attrs = `type="range" min="${min}" max="${max}" step="${step}" value="${value}"`;
  }
  return `
    <div class="ctl">
      <label>${label} <span class="val">${fmt(value, unit)}</span></label>
      <input data-path="${path}" data-unit="${unit || ''}" ${attrs}>
    </div>`;
}

function select(path, label, options, value) {
  return `
    <div class="ctl">
      <label>${label}</label>
      <select data-path="${path}">
        ${options.map((o) => `<option value="${o}" ${o === value ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>`;
}

function fmt(val, unit) {
  if (typeof val !== 'number') return String(val);
  if (unit === 'Hz') return val >= 1000 ? `${(val / 1000).toFixed(2)} kHz` : `${Math.round(val)} Hz`;
  if (unit === 's') return val < 1 ? `${Math.round(val * 1000)} ms` : `${val.toFixed(2)} s`;
  if (unit === 'cent') return `${val > 0 ? '+' : ''}${Math.round(val)} c`;
  return val.toFixed(2);
}
