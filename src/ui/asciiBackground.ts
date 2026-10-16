/** Original, decorative Canvas 2D field. It never participates in the simulation. */
export function mountAsciiBackground(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const glyphs = " .·:+*#";
  let timer: number | undefined;
  let phase = 0;
  let width = 1;
  let height = 1;

  function paint(): void {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.font = "10px monospace";
    ctx.textBaseline = "top";
    const stepX = Math.max(18, width / 88);
    const stepY = Math.max(22, height / 42);
    for (let y = 0; y < height; y += stepY) {
      for (let x = 0; x < width; x += stepX) {
        const nx = x / width;
        const ny = y / height;
        const field = (Math.sin(nx * 7 + phase) + Math.cos(ny * 6 - phase * 0.6) + 2) / 4;
        const index = Math.min(glyphs.length - 1, Math.floor(field * glyphs.length));
        ctx.fillStyle = ny < 0.45 ? "#65bda1" : "#527b87";
        ctx.globalAlpha = 0.12 + field * 0.3;
        ctx.fillText(glyphs[index], x, y);
      }
    }
    ctx.globalAlpha = 1;
  }

  function resize(): void {
    width = window.innerWidth;
    height = window.innerHeight;
    // Decorative glyphs do not need a device-pixel-ratio backing buffer.
    canvas.width = width;
    canvas.height = height;
    paint();
  }

  function schedule(): void {
    window.clearTimeout(timer);
    if (document.hidden || motion.matches) return;
    timer = window.setTimeout(() => {
      phase += 0.025;
      paint();
      schedule();
    }, 125); // Maximum 8 decorative frames per second.
  }

  function refresh(): void {
    paint();
    schedule();
  }

  resize();
  schedule();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", refresh);
  motion.addEventListener("change", refresh);

  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("resize", resize);
    document.removeEventListener("visibilitychange", refresh);
    motion.removeEventListener("change", refresh);
  };
}
