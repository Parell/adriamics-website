const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tagName, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tagName);

  for (const [key, value] of Object.entries(attrs)) {
    if (value !== undefined && value !== null) {
      node.setAttribute(key, String(value));
    }
  }

  return node;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function wrapLabel(text, maxCharacters = 18) {
  const words = cleanText(text).split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxCharacters && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [cleanText(text)];
}

function createTextBlock(text, x, y, options = {}) {
  const {
    anchor = "middle",
    className,
    lineHeight = 14,
    maxCharacters = 18,
    weight = 500,
  } = options;

  const textNode = svgEl("text", {
    x,
    y,
    "text-anchor": anchor,
    class: className,
    "font-size": options.fontSize ?? 12,
    "font-weight": weight,
    fill: options.fill ?? "currentColor",
  });

  const lines = wrapLabel(text, maxCharacters);
  lines.forEach((line, index) => {
    const span = svgEl("tspan", {
      x,
      dy: index === 0 ? 0 : lineHeight,
    });
    span.textContent = line;
    textNode.appendChild(span);
  });

  return textNode;
}

function createSvgRoot({ width = 960, height = 320, ariaLabel, title, description }) {
  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "100%",
    role: "img",
    "aria-label": ariaLabel,
    preserveAspectRatio: "xMidYMid meet",
    class: "chart-svg",
  });

  if (title) {
    const titleNode = svgEl("title");
    titleNode.textContent = title;
    svg.appendChild(titleNode);
  }

  if (description) {
    const descNode = svgEl("desc");
    descNode.textContent = description;
    svg.appendChild(descNode);
  }

  return svg;
}

export function renderEmptyChartSvg(message, { width = 960, height = 180, ariaLabel = "Empty chart" } = {}) {
  const svg = createSvgRoot({
    width,
    height,
    ariaLabel,
    title: ariaLabel,
    description: message,
  });

  svg.appendChild(
    svgEl("rect", {
      x: 0,
      y: 0,
      width,
      height,
      rx: 18,
      fill: "rgba(255,255,255,0.03)",
      stroke: "rgba(255,255,255,0.1)",
    }),
  );
  svg.appendChild(
    createTextBlock(message, width / 2, height / 2 - 6, {
      className: "chart-empty-copy",
      maxCharacters: 32,
      fontSize: 14,
      weight: 600,
    }),
  );

  return svg;
}

export function renderLineChartSvg({
  points,
  formatValue,
  ariaLabel,
  title,
  description,
  note,
  width = 960,
  height = 320,
}) {
  const validPoints = Array.isArray(points)
    ? points
        .filter((point) => Number.isFinite(point?.year) && Number.isFinite(point?.value))
        .map((point) => ({
          ...point,
          year: Number(point.year),
          value: Number(point.value),
        }))
        .sort((a, b) => a.year - b.year)
    : [];

  if (validPoints.length === 0) {
    return renderEmptyChartSvg(note ?? "No time series data is available for this chart.", {
      width,
      height: 180,
      ariaLabel,
    });
  }

  const svg = createSvgRoot({ width, height, ariaLabel, title, description });
  const pad = { top: 28, right: 28, bottom: 44, left: 68 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const values = validPoints.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueSpan = maxValue - minValue || Math.max(Math.abs(maxValue), 1) * 0.25;
  const yMin = minValue - valueSpan * 0.12;
  const yMax = maxValue + valueSpan * 0.12;
  const xStep = validPoints.length > 1 ? plotWidth / (validPoints.length - 1) : plotWidth / 2;
  const baselineY = pad.top + plotHeight;

  svg.appendChild(svgEl("rect", { x: 0, y: 0, width, height, rx: 18, fill: "transparent" }));

  for (let i = 0; i <= 4; i += 1) {
    const y = pad.top + (plotHeight / 4) * i;
    svg.appendChild(
      svgEl("line", {
        x1: pad.left,
        x2: width - pad.right,
        y1: y,
        y2: y,
        stroke: "rgba(255,255,255,0.08)",
      }),
    );

    const tickValue = yMax - ((yMax - yMin) / 4) * i;
    const tick = createTextBlock(formatValue(tickValue), pad.left - 12, y + 4, {
      anchor: "end",
      className: "chart-axis-label",
      maxCharacters: 10,
      fontSize: 11,
      weight: 500,
    });
    svg.appendChild(tick);
  }

  svg.appendChild(
    svgEl("line", {
      x1: pad.left,
      x2: width - pad.right,
      y1: baselineY,
      y2: baselineY,
      stroke: "rgba(255,255,255,0.18)",
      "stroke-width": 1.2,
    }),
  );

  const pointsPath = validPoints
    .map((point, index) => {
      const x = pad.left + (validPoints.length > 1 ? xStep * index : plotWidth / 2);
      const valueOffset = clamp((point.value - yMin) / (yMax - yMin || 1), 0, 1);
      const y = pad.top + plotHeight - valueOffset * plotHeight;
      return { ...point, x, y };
    })
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  if (validPoints.length > 1) {
    svg.appendChild(
      svgEl("path", {
        d: pointsPath,
        fill: "none",
        stroke: "rgba(255,255,255,0.82)",
        "stroke-width": 2.5,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    );
  }

  const renderedPoints = validPoints.map((point, index) => {
    const x = pad.left + (validPoints.length > 1 ? xStep * index : plotWidth / 2);
    const valueOffset = clamp((point.value - yMin) / (yMax - yMin || 1), 0, 1);
    const y = pad.top + plotHeight - valueOffset * plotHeight;
    return { ...point, x, y };
  });

  for (const point of renderedPoints) {
    svg.appendChild(
      svgEl("circle", {
        cx: point.x,
        cy: point.y,
        r: 5.5,
        fill: "rgba(255,255,255,0.95)",
        stroke: "rgba(0,0,0,0.35)",
        "stroke-width": 1.5,
      }),
    );

    svg.appendChild(
      createTextBlock(formatValue(point.value), point.x, point.y - 14, {
        className: "chart-point-label",
        maxCharacters: 12,
        fontSize: 11,
        weight: 600,
      }),
    );

    svg.appendChild(
      createTextBlock(String(point.year), point.x, baselineY + 18, {
        className: "chart-axis-label",
        maxCharacters: 8,
        fontSize: 11,
        weight: 500,
      }),
    );
  }

  if (note) {
    svg.appendChild(
      createTextBlock(note, width - pad.right, height - 12, {
        anchor: "end",
        className: "chart-note",
        maxCharacters: 42,
        fontSize: 11,
        weight: 500,
      }),
    );
  }

  return svg;
}

export function renderComparisonChartSvg({
  items,
  formatValue,
  ariaLabel,
  title,
  description,
  note,
  width = 960,
  height = 320,
}) {
  const validItems = Array.isArray(items)
    ? items
        .filter((item) => Number.isFinite(item?.value))
        .map((item) => ({
          ...item,
          value: Number(item.value),
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  if (validItems.length === 0) {
    return renderEmptyChartSvg(note ?? "No comparison data is available for this chart.", {
      width,
      height: 180,
      ariaLabel,
    });
  }

  const svg = createSvgRoot({ width, height, ariaLabel, title, description });
  const pad = { top: 30, right: 28, bottom: 52, left: 72 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const maxValue = Math.max(...validItems.map((item) => item.value));
  const barWidth = clamp(plotWidth / (validItems.length * 1.7), 110, 190);
  const gap = (plotWidth - barWidth * validItems.length) / Math.max(validItems.length - 1, 1);

  svg.appendChild(
    svgEl("line", {
      x1: pad.left,
      x2: width - pad.right,
      y1: pad.top + plotHeight,
      y2: pad.top + plotHeight,
      stroke: "rgba(255,255,255,0.18)",
      "stroke-width": 1.2,
    }),
  );

  validItems.forEach((item, index) => {
    const x = pad.left + index * (barWidth + gap);
    const barHeight = (item.value / (maxValue || 1)) * plotHeight;
    const y = pad.top + plotHeight - barHeight;

    svg.appendChild(
      svgEl("rect", {
        x,
        y,
        width: barWidth,
        height: barHeight,
        rx: 12,
        fill: index === 0 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.34)",
        stroke: "rgba(255,255,255,0.1)",
      }),
    );

    svg.appendChild(
      createTextBlock(formatValue(item.value), x + barWidth / 2, y - 14, {
        className: "chart-point-label",
        maxCharacters: 12,
        fontSize: 11,
        weight: 600,
      }),
    );

    svg.appendChild(
      createTextBlock(item.label ?? item.name ?? "", x + barWidth / 2, height - 28, {
        className: "chart-axis-label",
        maxCharacters: 20,
        fontSize: 11,
        weight: 500,
      }),
    );

    if (item.year) {
      svg.appendChild(
        createTextBlock(String(item.year), x + barWidth / 2, height - 12, {
          className: "chart-axis-label",
          maxCharacters: 8,
          fontSize: 10,
          weight: 500,
        }),
      );
    }
  });

  if (note) {
    svg.appendChild(
      createTextBlock(note, width - pad.right, height - 12, {
        anchor: "end",
        className: "chart-note",
        maxCharacters: 44,
        fontSize: 11,
        weight: 500,
      }),
    );
  }

  return svg;
}

export function renderStackedShareSvg({
  items,
  formatValue,
  ariaLabel,
  title,
  description,
  note,
  width = 960,
  height = 240,
}) {
  const validItems = Array.isArray(items)
    ? items
        .filter((item) => Number.isFinite(item?.value) && item.value >= 0)
        .map((item) => ({
          ...item,
          value: Number(item.value),
        }))
    : [];

  if (validItems.length === 0) {
    return renderEmptyChartSvg(note ?? "No payer-share data is available for this chart.", {
      width,
      height: 180,
      ariaLabel,
    });
  }

  const svg = createSvgRoot({ width, height, ariaLabel, title, description });
  const pad = { top: 42, right: 32, bottom: 54, left: 32 };
  const barWidth = width - pad.left - pad.right;
  const barHeight = 40;
  const barY = pad.top + 16;
  const total = validItems.reduce((sum, item) => sum + item.value, 0) || 1;

  svg.appendChild(
    svgEl("rect", {
      x: pad.left,
      y: barY,
      width: barWidth,
      height: barHeight,
      rx: 14,
      fill: "rgba(255,255,255,0.04)",
      stroke: "rgba(255,255,255,0.14)",
    }),
  );

  let currentX = pad.left;
  validItems.forEach((item, index) => {
    const segmentWidth = (item.value / total) * barWidth;
    svg.appendChild(
      svgEl("rect", {
        x: currentX,
        y: barY,
        width: segmentWidth,
        height: barHeight,
        rx: index === 0 ? 14 : 0,
        ry: 14,
        fill: item.fill ?? `rgba(255,255,255,${0.88 - index * 0.13})`,
        stroke: "rgba(0,0,0,0.12)",
      }),
    );

    if (segmentWidth > 90) {
      svg.appendChild(
        createTextBlock(
          `${item.label ?? item.name ?? ""} ${formatValue(item.value)}`,
          currentX + segmentWidth / 2,
          barY + 24,
          {
            className: "chart-segment-label",
            maxCharacters: 16,
            fontSize: 11,
            weight: 600,
          },
        ),
      );
    }

    currentX += segmentWidth;
  });

  svg.appendChild(
    svgEl("line", {
      x1: pad.left,
      x2: width - pad.right,
      y1: barY + barHeight,
      y2: barY + barHeight,
      stroke: "rgba(255,255,255,0.18)",
      "stroke-width": 1.2,
    }),
  );

  const totalLabel = note ?? `Known sponsor shares total ${formatValue(total)}.`;
  svg.appendChild(
    createTextBlock(totalLabel, pad.left, height - 14, {
      anchor: "start",
      className: "chart-note",
      maxCharacters: 48,
      fontSize: 11,
      weight: 500,
    }),
  );

  return svg;
}

export function renderTimelineSvg({
  steps,
  ariaLabel,
  title,
  description,
  note,
  width = 960,
  height = 520,
}) {
  const validSteps = Array.isArray(steps)
    ? steps
        .filter((step) => step && step.label)
        .map((step, index) => ({
          ...step,
          phase: Number.isFinite(step.phase) ? Number(step.phase) : index + 1,
        }))
        .sort((a, b) => a.phase - b.phase)
    : [];

  if (validSteps.length === 0) {
    return renderEmptyChartSvg(note ?? "No rollout sequence has been loaded.", {
      width,
      height: 180,
      ariaLabel,
    });
  }

  const svg = createSvgRoot({ width, height, ariaLabel, title, description });
  const pad = { top: 30, right: 28, bottom: 30, left: 32 };
  const lineX = 132;
  const rowHeight = Math.max(52, (height - pad.top - pad.bottom) / Math.max(validSteps.length, 1));
  const totalHeight = pad.top + rowHeight * (validSteps.length - 1);

  svg.appendChild(
    svgEl("line", {
      x1: lineX,
      x2: lineX,
      y1: pad.top + 20,
      y2: totalHeight,
      stroke: "rgba(255,255,255,0.2)",
      "stroke-width": 2,
    }),
  );

  validSteps.forEach((step, index) => {
    const y = pad.top + rowHeight * index + 20;

    svg.appendChild(
      svgEl("circle", {
        cx: lineX,
        cy: y,
        r: 15,
        fill: "rgba(255,255,255,0.92)",
        stroke: "rgba(0,0,0,0.35)",
        "stroke-width": 1.5,
      }),
    );

    svg.appendChild(
      createTextBlock(String(step.phase), lineX, y + 4, {
        className: "chart-step-number",
        maxCharacters: 4,
        fontSize: 12,
        weight: 700,
      }),
    );

    svg.appendChild(
      createTextBlock(step.label, lineX + 34, y - 5, {
        anchor: "start",
        className: "chart-step-label",
        maxCharacters: 26,
        fontSize: 13,
        weight: 600,
      }),
    );

    svg.appendChild(
      createTextBlock(step.description ?? "", lineX + 34, y + 16, {
        anchor: "start",
        className: "chart-step-description",
        maxCharacters: 50,
        fontSize: 11,
        weight: 500,
      }),
    );
  });

  if (note) {
    svg.appendChild(
      createTextBlock(note, width - pad.right, height - 12, {
        anchor: "end",
        className: "chart-note",
        maxCharacters: 44,
        fontSize: 11,
        weight: 500,
      }),
    );
  }

  return svg;
}
