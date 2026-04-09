// ---=== THEME CONFIGURATION ===---
//
// themes: ordered list of theme names; THEME button cycles through them.
// PALETTES: animated themes with their color arrays. Static themes (bsod,
//   terminal) have no entry here — their colors are handled entirely by CSS.

const themes = ["bsod", "terminal", "ember"];

const PALETTES = {
  ember: [
    "hsl(62,  80%, 72%)", // bright yellow
    "hsl(58,  85%, 67%)", // yellow
    "hsl(52,  86%, 66%)", // warm yellow
    "hsl(45,  88%, 65%)", // amber
    "hsl(30,  88%, 63%)", // orange
    "hsl(22,  87%, 62%)", // deep orange
    "hsl(15,  85%, 62%)", // red-orange
    "hsl(8,   83%, 61%)", // warm red
    "hsl(0,   82%, 60%)", // red
    "hsl(350, 75%, 45%)", // deep crimson
  ],
};

// Color applied to AUTO button chars when auto-cycle is paused on ember theme
const EMBER_PAUSED_COLOR = "#555555";

// ---=== DOM REFERENCES ===---

const themeToggle = document.querySelector(".theme-toggle");
const autoToggle = document.querySelector(".auto-toggle");
const themeLabel = document.querySelector(".theme-label");
const footer = document.querySelector(".footer");
const body = document.body;

// ---=== MASTER ANIMATION LOOP ===---
//
// A single shared tick drives both the footer buttons and the page wave so
// they always step together. pageAnimationActive gates page char painting.

let masterTick = 0;
let pageAnimationActive = false;

function paintFooterChars() {
  const isEmber = body.dataset.theme === "ember";
  const palette = PALETTES.ember;
  const themeChars = [...themeToggle.querySelectorAll(".char")];
  const autoChars = [...autoToggle.querySelectorAll(".char")];

  if (isEmber) {
    themeChars.forEach((char, i) => {
      char.style.color = palette[(masterTick + i) % palette.length];
    });
    // Offset by THEME char count so the wave flows continuously into AUTO
    const autoOffset = themeChars.length;
    autoChars.forEach((char, i) => {
      char.style.color = autoCycleInterval ? palette[(masterTick + autoOffset + i) % palette.length] : EMBER_PAUSED_COLOR;
    });
    autoToggle.classList.remove("paused");
  } else {
    // Clear inline styles so CSS theme variables take over
    [...themeChars, ...autoChars].forEach((char) => (char.style.color = ""));
    autoToggle.classList.toggle("paused", !autoCycleInterval);
  }
}

function paintPageChars() {
  const palette = PALETTES[body.dataset.theme];
  if (!palette) return;
  const chars = [...document.querySelectorAll(".char")].filter((c) => !footer.contains(c));
  chars.forEach((char, i) => {
    char.style.color = palette[(masterTick + i) % palette.length];
  });
}

function startMasterLoop() {
  setInterval(() => {
    masterTick = (masterTick + 1) % PALETTES.ember.length;
    paintFooterChars();
    if (pageAnimationActive) paintPageChars();
  }, 400);
}

// ---=== FOOTER BUTTON SETUP ===---

function wrapButtonChars(button) {
  const spans = [...button.textContent].map((char) => {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = char;
    return span;
  });
  button.textContent = "";
  spans.forEach((span) => button.appendChild(span));
}

function initFooterButtons() {
  wrapButtonChars(themeToggle);
  wrapButtonChars(autoToggle);
  paintFooterChars();
}

// ---=== PAGE WAVE ANIMATION ===---

// Wraps every non-whitespace character in the page (excluding the footer)
// in a <span class="char"> for per-character color control.
function wrapChars() {
  const walker = document.createTreeWalker(document.querySelector(".page-shell"), NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    if (!footer.contains(walker.currentNode)) textNodes.push(walker.currentNode);
  }

  textNodes.forEach((node) => {
    if (!node.textContent.trim()) return;
    const fragment = document.createDocumentFragment();
    [...node.textContent].forEach((char) => {
      if (char.trim()) {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = char;
        fragment.appendChild(span);
      } else {
        fragment.appendChild(document.createTextNode(char));
      }
    });
    node.parentNode.replaceChild(fragment, node);
  });
}

// Removes page char spans (footer char spans are permanent).
function unwrapChars() {
  document.querySelectorAll(".char").forEach((span) => {
    if (!footer.contains(span)) span.replaceWith(span.textContent);
  });
  document.querySelector(".layout").normalize();
}

function startAnimation(theme) {
  if (!PALETTES[theme]) return;
  wrapChars();
  requestAnimationFrame(() => {
    paintPageChars(); // immediate first paint before first tick
    pageAnimationActive = true;
  });
}

function stopAnimation(theme) {
  pageAnimationActive = false;
  if (PALETTES[theme]) unwrapChars();
}

// ---=== THEME LABEL ===---

let themeLabelTimeout = null;

function showThemeLabel(name) {
  clearTimeout(themeLabelTimeout);
  themeLabel.textContent = name;
  themeLabel.classList.add("visible");
  themeLabelTimeout = setTimeout(() => themeLabel.classList.remove("visible"), 1500);
}

// ---=== THEME ADVANCE ===---

function advanceTheme() {
  const current = body.dataset.theme;
  const next = themes[(themes.indexOf(current) + 1) % themes.length];
  stopAnimation(current);
  body.dataset.theme = next;
  showThemeLabel(next);
  startAnimation(next);
  paintFooterChars();
}

// ---=== AUTO-CYCLE ===---

const AUTO_CYCLE_MS = 10000;
let autoCycleInterval = null;

function startAutoCycle() {
  autoCycleInterval = setInterval(advanceTheme, AUTO_CYCLE_MS);
  paintFooterChars();
}

function stopAutoCycle() {
  clearInterval(autoCycleInterval);
  autoCycleInterval = null;
  paintFooterChars();
}

function resetAutoCycle() {
  if (autoCycleInterval) {
    stopAutoCycle();
    startAutoCycle();
  }
}

// ---=== INIT ===---

initFooterButtons();
startMasterLoop();
startAutoCycle();

// ---=== EVENT LISTENERS ===---

themeToggle.addEventListener("click", () => {
  advanceTheme();
  resetAutoCycle();
});

autoToggle.addEventListener("click", () => {
  if (autoCycleInterval) stopAutoCycle();
  else startAutoCycle();
});
