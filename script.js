var midiAccess = null;
var editMode = false;
var consoleEl = document.getElementById("console");
var statusEl = document.getElementById("status-bar");
var unlockBtn = document.getElementById("unlock-btn");

var colori = [
  "#FF4444",
  "#FF8844",
  "#FFFF44",
  "#44FF44",
  "#44FFFF",
  "#4488FF",
  "#8844FF",
  "#FFFFFF",
];

function hexToRgb(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

function sendMIDI(cmd, n, v) {
  if (!midiAccess) return;
  midiAccess.outputs.forEach(function (output) {
    output.send([Math.floor(cmd), Math.floor(n), Math.floor(v)]);
  });
}

function toggleEditMode() {
  editMode = !editMode;
  document.body.classList.toggle("edit-mode-on", editMode);
  document.querySelectorAll(".track-label").forEach(function (l) {
    l.classList.toggle("edit-active", editMode);
  });
  statusEl.innerText = editMode
    ? "EDIT MODE: TOCCA I PAD PER ATTIVARLI"
    : "SISTEMA MIDI ONLINE";
  statusEl.style.color = editMode ? "#ffaa00" : "#00ff88";
}

unlockBtn.onclick = function () {
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(function (access) {
      midiAccess = access;
      unlockBtn.style.display = "none";
      statusEl.innerText = "SISTEMA MIDI ONLINE";
    });
  }
};

for (var t = 0; t < 8; t++) {
  var strip = document.createElement("div");
  strip.className = "strip";
  strip.style.borderTop = "3px solid " + colori[t];

  var label = document.createElement("div");
  label.className = "track-label";
  label.style.color = colori[t];
  label.innerText = "CH " + (t + 1);
  label.onclick = toggleEditMode;
  strip.appendChild(label);

  // FILTRO
  var fBox = createTouchBox("filter-area", "FILTER");
  var fInd = document.createElement("div");
  fInd.className = "filter-indicator";
  fInd.style.top = "50%";
  fBox.appendChild(document.createElement("div")).className = "filter-line";
  fBox.appendChild(fInd);
  setupTouch(fBox, fInd, t, 10, true);
  strip.appendChild(fBox);

  // REVERB
  var rBox = createTouchBox("reverb-area", "REVERB");
  var rBar = document.createElement("div");
  rBar.className = "reverb-bar";
  rBar.style.backgroundColor = colori[t];
  rBox.appendChild(rBar);
  setupTouch(rBox, rBar, t, 11, false);
  strip.appendChild(rBox);

  // PAD GRID
  var grid = document.createElement("div");
  grid.className = "pad-grid";
  for (var p = 0; p < 4; p++) {
    (function (tr, pd) {
      var btn = document.createElement("div");
      btn.className = "pad";

      function updatePadVisual() {
        if (btn.classList.contains("is-assigned")) {
          btn.style.backgroundColor = hexToRgb(colori[tr], 0.3);
        } else {
          btn.style.backgroundColor = "";
        }
      }

      btn.addEventListener("touchstart", function (e) {
        e.preventDefault();
        if (editMode) {
          btn.classList.toggle("is-assigned");
          updatePadVisual();
        } else if (btn.classList.contains("is-assigned")) {
          btn.style.backgroundColor = colori[tr];
          sendMIDI(0x90 + tr, 60 + pd, 127);
        }
      });

      btn.addEventListener("touchend", function (e) {
        e.preventDefault();
        if (!editMode) {
          updatePadVisual();
          sendMIDI(0x80 + tr, 60 + pd, 0);
        }
      });
      grid.appendChild(btn);
    })(t, p);
  }
  strip.appendChild(grid);

  // VOLUME
  var vBox = createTouchBox("volume-area", "VOL");
  var vBar = document.createElement("div");
  vBar.className = "volume-bar";
  vBar.style.background =
    "linear-gradient(to top, " + colori[t] + ", transparent)";

  // Creazione della linea indicatrice
  var vLine = document.createElement("div");
  vLine.className = "volume-line";
  vLine.style.bottom = "0%"; // Parte dal basso

  vBox.appendChild(vBar);
  vBox.appendChild(vLine);

  setupTouch(vBox, vBar, t, 7, false, vLine);

  strip.appendChild(vBox);

  consoleEl.appendChild(strip);
}

function createTouchBox(className, labelText) {
  var box = document.createElement("div");
  box.className = "touch-box " + className;
  var l = document.createElement("div");
  l.className = "box-label";
  l.innerText = labelText;
  box.appendChild(l);
  return box;
}

function setupTouch(area, visual, tr, cc, isFilter, lineEl) {
  function handle(e) {
    e.preventDefault();
    var rect = area.getBoundingClientRect();
    // Calcolo della posizione del tocco
    var touchY = e.touches[0].clientY;
    var val = (rect.bottom - touchY) / rect.height;

    // Limitiamo tra 0 e 1
    val = Math.max(0, Math.min(1, val));

    var percent = val * 100 + "%";

    if (isFilter) {
      // Logica Filtro (muove dall'alto)
      visual.style.top = 100 - val * 100 + "%";
    } else {
      // Logica Volume (muove dal basso)
      visual.style.height = percent;

      // MUOVE LA LINEA: Se abbiamo passato l'elemento linea, aggiorniamo il suo bottom
      if (lineEl) {
        lineEl.style.bottom = percent;
      }
    }

    sendMIDI(0xb0 + tr, cc, val * 127);
  }

  area.addEventListener("touchstart", handle);
  area.addEventListener("touchmove", handle);
}

document.addEventListener(
  "touchmove",
  function (e) {
    e.preventDefault();
  },
  { passive: false },
);
