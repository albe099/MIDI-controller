var midiAccess = null;
var consoleEl = document.getElementById("console");
var statusEl = document.getElementById("status-bar");
var unlockBtn = document.getElementById("unlock-btn");

var colori = [
  "#FF5555",
  "#FFaa55",
  "#FFFF55",
  "#55FF55",
  "#55FFFF",
  "#5555FF",
  "#FF55FF",
  "#FFFFFF",
];

// --- LOGICA MIDI ---
function sendMIDI(cmd, n, v) {
  if (!midiAccess) return;
  var outputs = [];
  midiAccess.outputs.forEach(function (o) {
    outputs.push(o);
  });
  outputs.forEach(function (output) {
    output.send([Math.floor(cmd), Math.floor(n), Math.floor(v)]);
  });
}

unlockBtn.onclick = function () {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(function (access) {
      midiAccess = access;
      unlockBtn.style.display = "none";
      statusEl.innerHTML = "MIDI ATTIVO";
      statusEl.style.color = "#00ff88";
    });
  }
};

// --- GENERAZIONE INTERFACCIA ---
for (var t = 0; t < 8; t++) {
  var strip = document.createElement("div");
  strip.className = "strip";
  strip.style.borderTop = "3px solid " + colori[t];

  // Label
  var label = document.createElement("div");
  label.className = "track-label";
  label.innerText = "CH " + (t + 1);
  strip.appendChild(label);

  // Griglia Pad (4 per traccia)
  var grid = document.createElement("div");
  grid.className = "pad-grid";
  for (var p = 0; p < 4; p++) {
    (function (tr, pd) {
      var btn = document.createElement("div");
      btn.className = "pad";
      btn.addEventListener("touchstart", function (e) {
        e.preventDefault();
        sendMIDI(0x90 + tr, 60 + pd, 127);
      });
      btn.addEventListener("touchend", function (e) {
        e.preventDefault();
        sendMIDI(0x80 + tr, 60 + pd, 0);
      });
      grid.appendChild(btn);
    })(t, p);
  }
  strip.appendChild(grid);

  // Fader Volume (Workaround Div)
  var volArea = document.createElement("div");
  volArea.className = "volume-touch-area";

  var volBar = document.createElement("div");
  volBar.className = "volume-bar";
  volBar.style.height = "70%"; // Valore di default
  volArea.appendChild(volBar);

  (function (tr, area, bar) {
    function updateVol(e) {
      e.preventDefault();
      var touch = e.touches[0];
      var rect = area.getBoundingClientRect();
      var val = (rect.bottom - touch.clientY) / rect.height;

      if (val < 0) val = 0;
      if (val > 1) val = 1;

      bar.style.height = val * 100 + "%";
      bar.style.background = "#00ff88";

      sendMIDI(0xb0 + tr, 7, Math.floor(val * 127));
    }

    area.addEventListener("touchstart", updateVol);
    area.addEventListener("touchmove", updateVol);
    area.addEventListener("touchend", function () {
      bar.style.background = "#444";
    });
  })(t, volArea, volBar);

  strip.appendChild(volArea);
  consoleEl.appendChild(strip);
}

// Blocco scroll pagina
document.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
  },
  { passive: false },
);
