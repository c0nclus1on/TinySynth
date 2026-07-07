// Optional Web MIDI input. Maps hardware note on/off (with velocity) onto the
// given callbacks, and reports connected devices. No-ops gracefully when MIDI
// is unsupported or permission is denied — the on-screen/computer keyboard
// keeps working regardless.
export function initMidi({ onNoteOn, onNoteOff, onState }) {
  if (!navigator.requestMIDIAccess) {
    onState?.({ supported: false });
    return;
  }
  navigator.requestMIDIAccess().then(
    (access) => {
      const handle = (e) => {
        const [status, note, vel = 0] = e.data;
        const cmd = status & 0xf0;
        if (cmd === 0x90 && vel > 0) onNoteOn?.(note, vel / 127);
        else if (cmd === 0x80 || (cmd === 0x90 && vel === 0)) onNoteOff?.(note);
      };
      const refresh = () => {
        const devices = [];
        for (const input of access.inputs.values()) {
          input.onmidimessage = handle;
          devices.push(input.name);
        }
        onState?.({ supported: true, devices });
      };
      access.onstatechange = refresh; // hot-plug
      refresh();
    },
    () => onState?.({ supported: true, devices: [] }) // denied / error
  );
}
