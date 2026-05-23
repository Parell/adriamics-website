const TEXT_STREAM = {
  maxRows: 32,
  minLinesPerRow: 6,
  minRows: 16,
  rowHeight: 48,
  url: "/text-stream.txt",
};

const FALLBACK_TEXT_STREAM_LINES = [
  "systems over slogans",
  "physics informed software",
  "high signal, low ceremony",
  "deterministic by design",
  "measure before you guess",
  "control the failure modes",
  "numerics before intuition",
  "clarity over cleverness",
  "engineer the edge cases",
  "fast enough is a requirement",
  "reduce ambiguity early",
  "instrument everything useful",
  "good defaults, explicit exits",
  "build what can be verified",
  "simplicity is a constraint",
  "make state transitions obvious",
  "optimize the critical path",
  "prefer repeatable results",
  "document the invariants",
  "keep the feedback loop short",
];

const $ = (selector, root = document) => root.querySelector(selector);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseStreamText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

let currentTextStreamLines = FALLBACK_TEXT_STREAM_LINES;
let currentTextStreamRowCount = 0;
let textStreamResizeFrame = null;

function getTextStreamRowCount() {
  return Math.min(TEXT_STREAM.maxRows, Math.max(TEXT_STREAM.minRows, Math.round(window.innerHeight / TEXT_STREAM.rowHeight)));
}

function renderTextStreamRow(rowIndex, linesPerRow) {
  const seed = rowIndex * linesPerRow;
  const items = Array.from({ length: linesPerRow }, (_, lineIndex) => {
    const line = currentTextStreamLines[(seed + lineIndex) % currentTextStreamLines.length];
    return `<span class="text-stream__line">${escapeHtml(line)}</span>`;
  });

  const speed = 120 + (rowIndex % 4) * 80 + (rowIndex % 3) * 40;
  const delay = -(rowIndex % 5) * 6;

  return `
    <div class="text-stream__row">
      <div class="text-stream__track" style="--speed: ${speed}s; --delay: ${delay}s;">
        <div class="text-stream__group">${items.join("")}</div>
        <div class="text-stream__group" aria-hidden="true">${items.join("")}</div>
      </div>
    </div>
  `;
}

function renderTextStream(lines = currentTextStreamLines) {
  const container = $("#text-stream");
  if (!container) {
    return;
  }

  const nextLines = lines.length > 0 ? lines : FALLBACK_TEXT_STREAM_LINES;
  const rows = getTextStreamRowCount();
  const sourceChanged = nextLines !== currentTextStreamLines;

  currentTextStreamLines = nextLines;
  if (!sourceChanged && rows === currentTextStreamRowCount) {
    return;
  }

  currentTextStreamRowCount = rows;
  const linesPerRow = Math.max(TEXT_STREAM.minLinesPerRow, Math.ceil(currentTextStreamLines.length / rows));

  container.innerHTML = Array.from({ length: rows }, (_, rowIndex) => renderTextStreamRow(rowIndex, linesPerRow)).join("");
}

function scheduleTextStreamRender() {
  if (textStreamResizeFrame !== null) {
    return;
  }

  textStreamResizeFrame = window.requestAnimationFrame(() => {
    textStreamResizeFrame = null;
    renderTextStream();
  });
}

async function loadTextStream() {
  try {
    const response = await fetch(TEXT_STREAM.url);
    if (!response.ok) {
      throw new Error(`Failed to load text stream: ${response.status}`);
    }

    const lines = parseStreamText(await response.text());
    renderTextStream(lines);
  } catch {
    renderTextStream(FALLBACK_TEXT_STREAM_LINES);
  }
}

const copyEmailResetTimers = new WeakMap();

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const succeeded = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!succeeded) {
    throw new Error("Copy command failed");
  }
}

function setCopyEmailState(button, state, message) {
  if (!button) {
    return;
  }

  button.dataset.copyState = state;

  const hint = button.querySelector("[data-copy-email-hint]");
  if (hint) {
    hint.textContent = message;
  }

  const status = button.querySelector("[data-copy-email-status]");
  if (status) {
    status.textContent = state === "idle" ? "" : message === "copied" ? "Email copied to clipboard" : "Could not copy email";
  }

  button.title = state === "copied" ? "Copied to clipboard" : state === "error" ? "Copy failed" : "Copy email to clipboard";
}

function scheduleCopyEmailReset(button, delayMs = 1600) {
  const previous = copyEmailResetTimers.get(button);
  if (previous) {
    window.clearTimeout(previous);
  }

  const timeoutId = window.setTimeout(() => {
    setCopyEmailState(button, "idle", "copy");
    copyEmailResetTimers.delete(button);
  }, delayMs);

  copyEmailResetTimers.set(button, timeoutId);
}

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-email]");
  if (!button) {
    return;
  }

  event.preventDefault();

  const email = button.dataset.copyEmail;
  if (!email) {
    return;
  }

  try {
    await copyTextToClipboard(email);
    setCopyEmailState(button, "copied", "copied");
    scheduleCopyEmailReset(button);
  } catch {
    setCopyEmailState(button, "error", "failed");
    scheduleCopyEmailReset(button, 2200);
  }
});

window.addEventListener("resize", scheduleTextStreamRender);

void loadTextStream();
