const TEXT_STREAM = {
  maxRows: 32,
  minLinesPerRow: 6,
};

const TEXT_STREAM_LINES = [
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

function renderTextStreamRow(rowIndex, linesPerRow) {
  const seed = rowIndex * linesPerRow;
  const items = Array.from({ length: linesPerRow }, (_, lineIndex) => {
    const line = TEXT_STREAM_LINES[(seed + lineIndex) % TEXT_STREAM_LINES.length];
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

function renderTextStream() {
  const container = $("#text-stream");
  if (!container) {
    return;
  }

  const rows = TEXT_STREAM.maxRows;
  const linesPerRow = Math.max(TEXT_STREAM.minLinesPerRow, Math.ceil(TEXT_STREAM_LINES.length / rows));

  container.innerHTML = Array.from({ length: rows }, (_, rowIndex) => renderTextStreamRow(rowIndex, linesPerRow)).join("");
}

function initTextStreamFade() {
  const stream = $("#text-stream");
  if (!stream) {
    return;
  }

  let updateFrame = 0;
  const updateOpacity = () => {
    updateFrame = 0;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    stream.style.opacity = String(0.3 * (1 - progress));
  };

  const scheduleUpdate = () => {
    if (updateFrame) {
      return;
    }
    updateFrame = window.requestAnimationFrame(updateOpacity);
  };

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate, { passive: true });
  updateOpacity();
}

function initFrameGallery() {
  const gallery = $("#frame-gallery");
  if (!gallery) {
    return;
  }

  const image = $("#frame-image", gallery);
  const capabilityButtons = gallery.querySelectorAll("[data-frame-index]");
  if (!image) {
    return;
  }

  const slides = [
    {
      src: "/assets/SL3-114-1626.webp",
      alt: "Spacecraft above the Earth, viewed from orbit",
    },
    {
      src: "/assets/S-IVB_ignition_from_Apollo_9.webp",
      alt: "Apollo 9 S-IVB engine igniting in space",
    },
    {
      src: "/assets/SL3-114-1626.webp",
      alt: "Spacecraft above the Earth, viewed from orbit",
    },
    {
      src: "/assets/S-IVB_ignition_from_Apollo_9.webp",
      alt: "Apollo 9 S-IVB engine igniting in space",
    },
  ];
  let activeSlide = 0;

  const showSlide = (index) => {
    activeSlide = (index + slides.length) % slides.length;
    image.src = slides[activeSlide].src;
    image.alt = slides[activeSlide].alt;
    capabilityButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(Number(button.dataset.frameIndex) === activeSlide));
    });
  };

  gallery.addEventListener("click", (event) => {
    const capability = event.target.closest("[data-frame-index]");
    if (capability) {
      showSlide(Number(capability.dataset.frameIndex));
    }
  });

  showSlide(activeSlide);
}

function initContactMenu() {
  const menu = $("[data-contact-menu]");
  if (!menu) return;

  const trigger = $(".contact-menu__trigger", menu);
  const panel = $(".contact-menu__panel", menu);
  if (!trigger || !panel) return;

  const setOpen = (open) => {
    menu.open = open;
    trigger.setAttribute("aria-expanded", String(open));
  };

  trigger.setAttribute("aria-expanded", String(menu.open));
  menu.addEventListener("toggle", () => trigger.setAttribute("aria-expanded", String(menu.open)));
  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.open) {
      setOpen(false);
      trigger.focus();
    }
  });
  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
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

renderTextStream();
initTextStreamFade();
initFrameGallery();
initContactMenu();
