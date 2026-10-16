// src/engine/canvasRenderer.ts
import {
  sample,
  type Point2D,
  type Scene,
  type SceneObject,
  type SimResult,
} from "./rehearsalCore.ts";

export interface IsoView {
  s: number;
  ox: number;
  oy: number;
  w: number;
  h: number;
}

export interface ThemePalette {
  floorTop: string;
  floorSide: string;
  floorStroke: string;
  wallLeft: string;
  wallRight: string;
  wallTop: string;
  gridLine: string;
  primaryBox: [string, string, string];
  tableBox: [string, string, string];
  deskBox: [string, string, string];
  accentColor: string;
}

export const DESIGN_THEMES: Record<string, ThemePalette> = {
  express: {
    floorTop: "#18212f",
    floorSide: "#0f172a",
    floorStroke: "#334155",
    wallLeft: "#1e293b",
    wallRight: "#263346",
    wallTop: "#475569",
    gridLine: "rgba(148, 163, 184, 0.14)",
    primaryBox: ["#2563eb", "#1d4ed8", "#3b82f6"],
    tableBox: ["#b48a64", "#926c4b", "#cfa67e"],
    deskBox: ["#0f766e", "#115e59", "#14b8a6"],
    accentColor: "#10b981",
  },
  island: {
    floorTop: "#1f1d1b",
    floorSide: "#141210",
    floorStroke: "#44403c",
    wallLeft: "#292524",
    wallRight: "#332e2a",
    wallTop: "#57534e",
    gridLine: "rgba(214, 211, 209, 0.13)",
    primaryBox: ["#d97706", "#b45309", "#f59e0b"],
    tableBox: ["#a8a29e", "#78716c", "#d6d3d1"],
    deskBox: ["#44403c", "#292524", "#57534e"],
    accentColor: "#f59e0b",
  },
  lounge: {
    floorTop: "#171f24",
    floorSide: "#0d1317",
    floorStroke: "#334155",
    wallLeft: "#1e293b",
    wallRight: "#273545",
    wallTop: "#475569",
    gridLine: "rgba(148, 163, 184, 0.14)",
    primaryBox: ["#0d9488", "#0f766e", "#2dd4bf"],
    tableBox: ["#c28e66", "#9c6d49", "#d9a782"],
    deskBox: ["#334155", "#1e293b", "#475569"],
    accentColor: "#38bdf8",
  },
};

export function project(
  view: IsoView,
  x: number,
  y: number,
  z = 0
): Point2D {
  return {
    x: view.ox + (x - y) * view.s,
    y: view.oy + (x + y) * view.s * 0.48 - z * view.s * 0.65,
  };
}

export function unproject(view: IsoView, px: number, py: number): Point2D {
  const a = (px - view.ox) / view.s;
  const b = (py - view.oy) / (view.s * 0.48);
  return {
    x: (a + b) / 2,
    y: (b - a) / 2,
  };
}

function poly(
  ctx: CanvasRenderingContext2D,
  pts: Point2D[],
  fill?: string,
  stroke?: string,
  lineWidth = 1
): void {
  if (!pts.length) return;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function line(
  ctx: CanvasRenderingContext2D,
  a: Point2D,
  b: Point2D,
  color: string,
  width = 1
): void {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

const OBJECT_KO_MAP: Record<string, string> = {
  display: "시그니처 진열대",
  "order-desk": "주문 바",
  "pickup-desk": "픽업 바",
  bench: "창가 벤치",
  "table-a": "테이블 A",
  "table-b": "테이블 B",
  "table-c": "테이블 C",
};

function drawCutawayWalls(
  ctx: CanvasRenderingContext2D,
  v: IsoView,
  scene: Scene,
  theme: ThemePalette,
  lightsOn: boolean,
  acOn: boolean,
  animTime: number
): void {
  const p = (x: number, y: number, z = 0) => project(v, x, y, z);
  const wallH = 1.9;

  // Back-Right Wall (along y = 0, x from 0 to width)
  poly(
    ctx,
    [p(0, 0, 0), p(scene.width, 0, 0), p(scene.width, 0, wallH), p(0, 0, wallH)],
    theme.wallRight,
    theme.wallTop,
    1.2
  );

  // Back-Left Wall (along x = 0, y from 0 to height)
  poly(
    ctx,
    [p(0, 0, 0), p(0, scene.height, 0), p(0, scene.height, wallH), p(0, 0, wallH)],
    theme.wallLeft,
    theme.wallTop,
    1.2
  );

  // Window frame on Back-Left Wall (y from 1.5 to 5.5, z from 0.55 to 1.55)
  poly(
    ctx,
    [
      p(0.02, 1.5, 0.55),
      p(0.02, 5.5, 0.55),
      p(0.02, 5.5, 1.55),
      p(0.02, 1.5, 1.55),
    ],
    lightsOn ? "rgba(56, 189, 248, 0.18)" : "rgba(30, 41, 59, 0.45)",
    "rgba(148, 163, 184, 0.45)",
    1.2
  );

  // Wall-mounted Smart AC Unit on Back-Right Wall (x from 5.0 to 6.8, z from 1.35 to 1.72)
  const acA = p(5.0, 0.08, 1.35);
  const acB = p(6.8, 0.08, 1.35);
  const acC = p(6.8, 0.08, 1.72);
  const acD = p(5.0, 0.08, 1.72);
  poly(
    ctx,
    [acA, acB, acC, acD],
    acOn ? "#e0f2fe" : "#475569",
    acOn ? "#38bdf8" : "#64748b",
    1.4
  );

  // House-Control style visible AC airflow streams when acOn is true
  if (acOn) {
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const startX = 5.2 + i * 0.45;
      const phase = ((animTime * 1.4 + i * 0.25) % 1);
      const len = 1.2 + phase * 3.0;
      const pStart = p(startX, 0.2, 1.32);
      const pEnd = p(startX + (i - 1.5) * 0.25, 0.2 + len, Math.max(0.25, 1.32 - len * 0.24));
      const grad = ctx.createLinearGradient(pStart.x, pStart.y, pEnd.x, pEnd.y);
      grad.addColorStop(0, "rgba(56, 189, 248, 0.55)");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Warm Architectural Wall Sconces when lightsOn is true
  if (lightsOn) {
    for (const lx of [2.2, 5.9, 9.2]) {
      const sp = p(lx, 0.06, 1.55);
      const g = ctx.createRadialGradient(sp.x, sp.y, 2, sp.x, sp.y + 18, 46);
      g.addColorStop(0, "rgba(253, 224, 71, 0.65)");
      g.addColorStop(0.4, "rgba(251, 191, 36, 0.18)");
      g.addColorStop(1, "rgba(251, 191, 36, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y + 10, 46, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  v: IsoView,
  o: SceneObject,
  isSelected: boolean,
  isHovered: boolean,
  theme: ThemePalette,
  lightsOn: boolean
): void {
  const h = o.kind === "table" ? 0.46 : o.kind === "seating" ? 0.48 : 0.78;
  const p = (x: number, y: number, z = 0) => project(v, x, y, z);

  const a = p(o.x, o.y);
  const b = p(o.x + o.w, o.y);
  const c = p(o.x + o.w, o.y + o.h);
  const d = p(o.x, o.y + o.h);

  const at = p(o.x, o.y, h);
  const bt = p(o.x + o.w, o.y, h);
  const ct = p(o.x + o.w, o.y + o.h, h);
  const dt = p(o.x, o.y + o.h, h);

  const isPrimaryMovable =
    o.movable &&
    (o.id === "display" ||
      o.id.startsWith("manual-") ||
      o.id.startsWith("custom-"));
  const isMovableTable = o.movable && o.kind === "table";

  let colors: [string, string, string];
  let topStroke = "rgba(255, 255, 255, 0.22)";

  if (isPrimaryMovable) {
    colors = theme.primaryBox;
    topStroke = isSelected ? "#34d399" : "rgba(255,255,255,0.5)";
  } else if (isMovableTable) {
    colors = theme.tableBox;
    topStroke = isSelected ? "#34d399" : "rgba(255,255,255,0.28)";
  } else if (o.kind === "desk") {
    colors = theme.deskBox;
  } else {
    colors = ["#475569", "#334155", "#64748b"];
  }

  // Warm ambient floor glow under key furniture when lightsOn is enabled
  if (lightsOn && (isPrimaryMovable || o.kind === "desk")) {
    const centerFloor = p(o.x + o.w / 2, o.y + o.h / 2, 0);
    const rad = Math.max(o.w, o.h) * v.s * 0.85;
    const glow = ctx.createRadialGradient(
      centerFloor.x,
      centerFloor.y,
      4,
      centerFloor.x,
      centerFloor.y,
      rad
    );
    glow.addColorStop(
      0,
      isPrimaryMovable
        ? "rgba(251, 191, 36, 0.22)"
        : "rgba(52, 211, 153, 0.16)"
    );
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(centerFloor.x, centerFloor.y, rad, rad * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floor shadow
  poly(
    ctx,
    [
      { x: a.x, y: a.y + 4 },
      { x: b.x + 3, y: b.y + 5 },
      { x: c.x + 3, y: c.y + 6 },
      { x: d.x, y: d.y + 5 },
    ],
    "rgba(0, 0, 0, 0.35)"
  );

  // Selection/Hover ring on floor
  if (o.movable && (isSelected || isHovered)) {
    poly(
      ctx,
      [a, b, c, d],
      undefined,
      isSelected ? "#34d399" : "#38bdf8",
      isSelected ? 2.5 : 1.8
    );
  }

  poly(ctx, [b, c, ct, bt], colors[1]);
  poly(ctx, [c, d, dt, ct], colors[0]);
  poly(ctx, [at, bt, ct, dt], colors[2], topStroke, isSelected ? 2 : 1);

  const labelPos = p(o.x + o.w / 2, o.y + o.h / 2, h);
  const displayName = o.koLabel || OBJECT_KO_MAP[o.id] || o.label || o.id;

  if (o.w >= 1.1 || isPrimaryMovable) {
    ctx.font =
      "700 10px 'Plus Jakarta Sans', 'Noto Sans KR', -apple-system, sans-serif";
    const tw = ctx.measureText(displayName).width + 10;
    const th = 16;
    ctx.fillStyle = "rgba(15, 23, 42, 0.86)";
    ctx.strokeStyle = isSelected ? "#34d399" : "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(labelPos.x - tw / 2, labelPos.y - th / 2, tw, th, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "center";
    ctx.fillText(displayName, labelPos.x, labelPos.y + 3.5);
  }
}

export interface DrawWorldOptions {
  canvas: HTMLCanvasElement;
  scene: Scene;
  result: SimResult | null | undefined;
  worldIndex: 0 | 1;
  currentTimeSec: number;
  walkMode: boolean;
  playerPos: Point2D;
  bodyWidth: number;
  selectedObjectId: string | null;
  hoveredObjectId: string | null;
  themeKey?: string;
  lightsOn?: boolean;
  acOn?: boolean;
}

export function drawWorldCanvas(opts: DrawWorldOptions): IsoView {
  const {
    canvas,
    scene,
    result,
    worldIndex,
    currentTimeSec,
    walkMode,
    playerPos,
    bodyWidth,
    selectedObjectId,
    hoveredObjectId,
    themeKey = "express",
    lightsOn = true,
    acOn = true,
  } = opts;

  const theme = DESIGN_THEMES[themeKey] || DESIGN_THEMES.express;

  const bounds = canvas.getBoundingClientRect();
  const w = Math.max(bounds.width, 280);
  const h = Math.max(bounds.height, 260);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (
    canvas.width !== Math.round(w * dpr) ||
    canvas.height !== Math.round(h * dpr)
  ) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }

  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const s = Math.min(
    (w - 48) / (scene.width + scene.height),
    (h - 74) / ((scene.width + scene.height) * 0.48)
  );
  const v: IsoView = {
    s,
    ox: (w - (scene.width + scene.height) * s) / 2 + scene.height * s,
    oy: (h - (scene.width + scene.height) * s * 0.48) / 2 + 18,
    w,
    h,
  };

  const p = (x: number, y: number, z = 0) => project(v, x, y, z);
  const corners = [
    p(0, 0),
    p(scene.width, 0),
    p(scene.width, scene.height),
    p(0, scene.height),
  ];

  // Floor slab
  poly(
    ctx,
    corners.map((c) => ({ x: c.x, y: c.y + 9 })),
    theme.floorSide
  );
  poly(ctx, corners, theme.floorTop, theme.floorStroke, 1.5);

  // 1m architectural grid
  for (let x = 1; x < scene.width; x++) {
    line(ctx, p(x, 0), p(x, scene.height), theme.gridLine, 0.8);
  }
  for (let y = 1; y < scene.height; y++) {
    line(ctx, p(0, y), p(scene.width, y), theme.gridLine, 0.8);
  }

  // House-Control 3D Cutaway Walls + Smart Lights + AC Airflow
  drawCutawayWalls(
    ctx,
    v,
    scene,
    theme,
    lightsOn,
    acOn,
    currentTimeSec * 0.15
  );

  // Station floor pads
  for (const [stKey, stColor] of [
    ["order", "rgba(59, 130, 246, 0.22)"],
    ["pickup", "rgba(16, 185, 129, 0.24)"],
  ] as const) {
    const pt = scene[stKey];
    const r = 0.58;
    poly(
      ctx,
      [
        p(pt.x - r, pt.y - r),
        p(pt.x + r, pt.y - r),
        p(pt.x + r, pt.y + r),
        p(pt.x - r, pt.y + r),
      ],
      stColor,
      stKey === "order" ? "rgba(96, 165, 250, 0.55)" : "rgba(52, 211, 153, 0.6)",
      1.2
    );
  }

  // A* path trajectory
  if (result?.route?.length) {
    ctx.beginPath();
    result.route.forEach((a, i) => {
      const pp = p(a.x, a.y);
      if (i) ctx.lineTo(pp.x, pp.y);
      else ctx.moveTo(pp.x, pp.y);
    });
    ctx.strokeStyle =
      worldIndex === 1
        ? "rgba(52, 211, 153, 0.2)"
        : "rgba(148, 163, 184, 0.16)";
    ctx.lineWidth = Math.max(5, bodyWidth * v.s * 0.65);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.beginPath();
    result.route.forEach((a, i) => {
      const pp = p(a.x, a.y);
      if (i) ctx.lineTo(pp.x, pp.y);
      else ctx.moveTo(pp.x, pp.y);
    });
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = worldIndex === 1 ? "#34d399" : "#94a3b8";
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const f = result
    ? sample(result, Math.max(0, Math.min(result.duration, currentTimeSec)))
    : { people: [], queue: 0, orderQueue: 0, pickupQueue: 0, completed: 0 };

  type RenderItem =
    | { sort: number; object: SceneObject; person?: undefined }
    | { sort: number; person: (typeof f.people)[number]; object?: undefined };

  const items: RenderItem[] = scene.objects
    .map<RenderItem>((o) => ({ sort: o.x + o.y + o.w / 2 + o.h / 2, object: o }))
    .concat(f.people.map<RenderItem>((person) => ({ sort: person.x + person.y, person })))
    .sort((a, b) => a.sort - b.sort);

  for (const item of items) {
    if (item.object) {
      const obj = item.object;
      drawIsoBox(
        ctx,
        v,
        obj,
        worldIndex === 1 && obj.id === selectedObjectId,
        worldIndex === 1 && obj.id === hoveredObjectId,
        theme,
        lightsOn
      );
      continue;
    }
    const person = item.person;
    const pp = p(person.x, person.y);
    const color =
      person.state === "queue"
        ? "#fbbf24"
        : person.state === "service"
        ? "#a78bfa"
        : "#38bdf8";

    ctx.beginPath();
    ctx.ellipse(pp.x, pp.y + 1, 3.8, 2.0, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(pp.x - 2.3, pp.y - 7.2, 4.6, 6.4, 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pp.x, pp.y - 9.8, 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Walk mode player avatar
  if (walkMode && playerPos) {
    const r = bodyWidth / 2;
    poly(
      ctx,
      [
        p(playerPos.x - r, playerPos.y - r),
        p(playerPos.x + r, playerPos.y - r),
        p(playerPos.x + r, playerPos.y + r),
        p(playerPos.x - r, playerPos.y + r),
      ],
      "rgba(52, 211, 153, 0.28)",
      "#34d399",
      2
    );
    const here = p(playerPos.x, playerPos.y, 0.48);
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(here.x, here.y, 6.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font =
      "700 11px 'Plus Jakarta Sans', 'Noto Sans KR', -apple-system, sans-serif";
    ctx.fillStyle = "#6ee7b7";
    ctx.textAlign = "center";
    ctx.fillText(`나 (${bodyWidth.toFixed(2)}m)`, here.x, here.y - 12);
  }

  // Queue badges
  for (const key of ["order", "pickup"] as const) {
    const count = f.people.filter(
      (a) => a.state === "queue" && a.stage === key
    ).length;
    if (count > 0) {
      const q = p(scene[key].x, scene[key].y, 1.48);
      const text = `${key === "order" ? "주문" : "픽업"} 대기 ${count}명`;
      ctx.font =
        "700 10.5px 'Plus Jakarta Sans', 'Noto Sans KR', -apple-system, sans-serif";
      const tw = ctx.measureText(text).width + 14;
      ctx.fillStyle = "rgba(251, 191, 36, 0.95)";
      ctx.beginPath();
      ctx.roundRect(q.x - tw / 2, q.y - 10, tw, 19, 6);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "center";
      ctx.fillText(text, q.x, q.y + 3.5);
    }
  }

  // Entrance & Exit labels
  for (const [key, name] of [
    ["entrance", "입구 (IN)"],
    ["exit", "출구 (OUT)"],
  ] as const) {
    const a = scene[key];
    if (a) {
      const pp = p(a.x, a.y);
      ctx.fillStyle = "#94a3b8";
      ctx.font =
        "700 10.5px 'Plus Jakarta Sans', 'Noto Sans KR', -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name, pp.x, pp.y + 15);
    }
  }

  // Bottom HUD inside canvas
  ctx.textAlign = "left";
  ctx.fillStyle = "#94a3b8";
  ctx.font =
    "600 10.5px 'JetBrains Mono', 'Noto Sans KR', -apple-system, sans-serif";
  ctx.fillText(`12m × 9m · 폭 ${bodyWidth.toFixed(2)}m`, 14, h - 12);

  ctx.textAlign = "right";
  ctx.fillText(
    `완료 ${f.completed || 0}명 · 대기 ${f.queue || 0}명`,
    w - 14,
    h - 12
  );

  if (result?.routeBlocked) {
    ctx.fillStyle = "rgba(127, 29, 29, 0.92)";
    ctx.fillRect(0, h / 2 - 24, w, 48);
    ctx.strokeStyle = "#f87171";
    ctx.strokeRect(0, h / 2 - 24, w, 48);
    ctx.fillStyle = "#fecaca";
    ctx.font =
      "700 12px 'Plus Jakarta Sans', 'Noto Sans KR', -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `동선 막힘 (폭 ${bodyWidth.toFixed(2)}m) — 가구를 드래그해 통로를 넓혀주세요`,
      w / 2,
      h / 2 + 4
    );
  }

  return v;
}

export function generateSampleBlueprintCanvas(): HTMLCanvasElement {
  const off = document.createElement("canvas");
  const W = 840;
  const H = 340;
  off.width = W;
  off.height = H;
  const ctx = off.getContext("2d")!;

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  for (let x = 0; x <= 12; x++) {
    const px = (x / 12) * W;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
    ctx.stroke();
  }
  for (let y = 0; y <= 9; y++) {
    const py = (y / 9) * H;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(W, py);
    ctx.stroke();
  }

  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  const drawRectM = (
    mx: number,
    my: number,
    mw: number,
    mh: number,
    label: string,
    fill: string,
    stroke: string
  ) => {
    const rx = (mx / 12) * W;
    const ry = (my / 9) * H;
    const rw = (mw / 12) * W;
    const rh = (mh / 9) * H;
    ctx.fillStyle = fill;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 11.5px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, rx + rw / 2, ry + rh / 2 + 4);
  };

  drawRectM(
    3.0,
    0.4,
    2.6,
    1.1,
    "ORDER BAR",
    "rgba(59, 130, 246, 0.25)",
    "#3b82f6"
  );
  drawRectM(
    7.1,
    0.4,
    2.6,
    1.1,
    "PICKUP BAR",
    "rgba(16, 185, 129, 0.25)",
    "#10b981"
  );
  drawRectM(
    0.4,
    5.8,
    2.0,
    1.1,
    "BENCH",
    "rgba(148, 163, 184, 0.2)",
    "#64748b"
  );
  drawRectM(
    4.3,
    3.6,
    3.0,
    1.5,
    "DRAG BOOTH ZONE",
    "rgba(245, 158, 11, 0.25)",
    "#f59e0b"
  );

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 11px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("CAD 12.0m × 9.0m", 14, H - 12);

  return off;
}
