(function () {
  'use strict';

  const C = { cone: [] };
  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['bg', 'surface', 'ink', 'ink2', 'muted', 'line', 'grid', 'sp', 'greedy', 'fillR', 'fillT', 'hl']) {
      C[k] = cs.getPropertyValue('--' + k).trim();
    }
    C.cone = [0, 1, 2, 3, 4, 5].map((i) => cs.getPropertyValue('--c' + i).trim());
  }
  readColors();
  const views = [];
  function themeChanged() { readColors(); views.forEach((v) => v.requestDraw()); }
  class View {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({ pad: 28, pan: false, zoom: false, box: { minX: 0, maxX: 1, minY: 0, maxY: 1 } }, opts || {});
      this.cx = 0.5; this.cy = 0.5; this.scale = 100;
     this.w = 1; this.h = 1;
      this.userMoved = false;
      this.draw = this.opts.draw || (() => {});
      this._raf = 0;
      views.push(this);
      const ro = new ResizeObserver(() => this.resize());
      ro.observe(canvas);
      this.resize();
      if (this.opts.zoom) this._wheel();
    }
    resize() {
      const r = this.canvas.getBoundingClientRect();
     if (r.width < 2 || r.height < 2) return;
      const dpr = window.devicePixelRatio || 1;
      this.w = r.width; this.h = r.height;
      this.canvas.width = Math.round(r.width * dpr);
       this.canvas.height = Math.round(r.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!this.userMoved) this.fit(this.opts.box);
      this.requestDraw();
    }
    fit(box) {
      if (box) this.opts.box = box;
      const b = this.opts.box, pad = this.opts.pad;
      const bw = Math.max(1e-9, b.maxX - b.minX), bh = Math.max(1e-9, b.maxY - b.minY);
      this.scale = Math.min((this.w - 2 * pad) / bw, (this.h - 2 * pad) / bh);
      this.cx = (b.minX + b.maxX) / 2; this.cy = (b.minY + b.maxY) / 2;
      this.requestDraw();
    }
    sx(x) { return this.w / 2 + (x - this.cx) * this.scale; }
    sy(y) { return this.h / 2 - (y - this.cy) * this.scale; }
    wx(px) { return this.cx + (px - this.w / 2) / this.scale; }
    wy(py) { return this.cy - (py - this.h / 2) / this.scale; }
   worldOf(ev) {
      const r = this.canvas.getBoundingClientRect();
      return { x: this.wx(ev.clientX - r.left), y: this.wy(ev.clientY - r.top) };
    }
    requestDraw() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.w, this.h);
          this.draw(ctx, this);
      });
    }
    zoomAt(px, py, f) {
      const wx = this.wx(px), wy = this.wy(py);
      this.scale *= f;
      this.cx = wx - (px - this.w / 2) / this.scale;
      this.cy = wy + (py - this.h / 2) / this.scale;
      this.userMoved = true;
      this.requestDraw();
    }
   _wheel() {
      this.canvas.addEventListener('wheel', (ev) => {
        if (!ev.ctrlKey && !ev.metaKey && !this.opts.wheelAlways) return;
        ev.preventDefault();
        const r = this.canvas.getBoundingClientRect();  
        this.zoomAt(ev.clientX - r.left, ev.clientY - r.top, Math.exp(-ev.deltaY * 0.0015));
      }, { passive: false });
    }
    bounds() { return { minX: this.wx(0), maxX: this.wx(this.w), minY: this.wy(this.h), maxY: this.wy(0) }; }
  }
  function interact(view, h) {
    const cv = view.canvas;
    let drag = null, start = null, moved = false, panning = false;
    cv.addEventListener('pointerdown', (ev) => {
      if (ev.button === 2) return;
      const w = view.worldOf(ev);
      start = { x: ev.clientX, y: ev.clientY, cx: view.cx, cy: view.cy };
      moved = false;
        drag = h.hit ? h.hit(w, ev) : null;
       panning = drag == null && view.opts.pan;
      if (drag != null || panning) cv.setPointerCapture(ev.pointerId);
      if (drag != null && h.down) h.down(drag, w, ev);  
    });
    cv.addEventListener('pointermove', (ev) => {
      const w = view.worldOf(ev);
      if (start && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 3) moved = true;
      if (drag != null && moved) { h.move && h.move(drag, w, ev); return; }
      if (panning && moved) {
        view.cx = start.cx - (ev.clientX - start.x) / view.scale;  
          view.cy = start.cy + (ev.clientY - start.y) / view.scale;
        view.userMoved = true;
        view.requestDraw();
        return;
      }
      if (!start && h.hover) h.hover(h.hit ? h.hit(w, ev) : null, w);
    });
    const up = (ev) => {
      if (!start) return;
      const w = view.worldOf(ev);
      if (!moved) {
        if (drag != null) h.click && h.click(drag, w, ev);
        else h.empty && h.empty(w, ev);
      }
      if (drag != null && h.up) h.up(drag, w, ev);
      drag = null; start = null; panning = false;
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', () => { drag = null; start = null; panning = false; });
    cv.addEventListener('pointerleave', () => { if (!start && h.hover) h.hover(null, null); });
    cv.addEventListener('contextmenu', (ev) => {
      if (!h.context) return;
      ev.preventDefault();
      const w = view.worldOf(ev);
      h.context(h.hit ? h.hit(w, ev) : null, w);
    });
  }

  function pick(view, pts, w, px) {
    let best = null, bd = (px || 12) / view.scale;
      for (let i = 0; i < pts.length; i++) {
      const d = Math.hypot(pts[i].x - w.x, pts[i].y - w.y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  // drawing
  const D = {
    line(ctx, v, a, b, color, width, dash) {
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width || 1;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(v.sx(a.x), v.sy(a.y)); ctx.lineTo(v.sx(b.x), v.sy(b.y)); ctx.stroke(); ctx.restore();
    },
    arrow(ctx, v, a, b, color, width, shrink, head) {
      const ax = v.sx(a.x), ay = v.sy(a.y), bx = v.sx(b.x), by = v.sy(b.y);
      const L = Math.hypot(bx - ax, by - ay);
      if (L < 1) return;
      const ux = (bx - ax) / L, uy = (by - ay) / L;
      shrink = shrink == null ? 6 : shrink;
      head = head == null ? 7 : head;
      const ex = bx - ux * shrink, ey = by - uy * shrink; 
      ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width || 1.5; ctx.lineCap = 'round'; 
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex - ux * head * 0.6, ey - uy * head * 0.6); ctx.stroke();
      if (L > shrink + head) {
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - ux * head - uy * head * 0.45, ey - uy * head + ux * head * 0.45); 
        ctx.lineTo(ex - ux * head + uy * head * 0.45, ey - uy * head - ux * head * 0.45);
        ctx.closePath(); ctx.fill(); 
      }
      ctx.restore();
    },
    dot(ctx, v, p, r, fill, stroke, sw) {
      ctx.save(); ctx.beginPath(); ctx.arc(v.sx(p.x), v.sy(p.y), r, 0, 2 * Math.PI);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 1.5; ctx.stroke(); }
      ctx.restore();
    },
    poly(ctx, v, pts, fill, stroke, sw, dash) {
      ctx.save(); ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(v.sx(p.x), v.sy(p.y)) : ctx.moveTo(v.sx(p.x), v.sy(p.y))));
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 1; if (dash) ctx.setLineDash(dash); ctx.stroke(); }
       ctx.restore();
    },
    text(ctx, v, p, s, color, opts) {
      opts = opts || {};
        ctx.save(); ctx.fillStyle = color;
      ctx.font = (opts.weight || '500') + ' ' + (opts.size || 12) + 'px ' + (opts.mono ? '"Source Code Pro", ui-monospace, monospace' : '"Public Sans", system-ui, sans-serif');  
      ctx.textAlign = opts.align || 'left'; ctx.textBaseline = opts.baseline || 'middle';
      if (opts.halo) { ctx.lineWidth = 4; ctx.strokeStyle = opts.halo; ctx.lineJoin = 'round'; ctx.strokeText(s, v.sx(p.x) + (opts.dx || 0), v.sy(p.y) + (opts.dy || 0)); }
      ctx.fillText(s, v.sx(p.x) + (opts.dx || 0), v.sy(p.y) + (opts.dy || 0));
      ctx.restore();
    },
    cones(ctx, v, u, alpha, labels) {
      const T = window.Theta6;
      const b = v.bounds();
      const R = 2 * Math.hypot(b.maxX - b.minX, b.maxY - b.minY);
      for (let i = 0; i < 6; i++) {
        const [r0, r1] = T.BND[i]; 
        D.poly(ctx, v, [u, { x: u.x + R * r0[0], y: u.y + R * r0[1] }, { x: u.x + R * r1[0], y: u.y + R * r1[1] }], withAlpha(C.cone[i], alpha == null ? 0.07 : alpha));
      }
      for (let i = 0; i < 3; i++) {
        const [r] = T.BND[i];
        D.line(ctx, v, { x: u.x - R * r[0], y: u.y - R * r[1] }, { x: u.x + R * r[0], y: u.y + R * r[1] }, C.muted, 0.8, [3, 4]);
      }
      if (labels) {
        const rr = (labels === true ? 46 : labels) / v.scale;
        for (let i = 0; i < 6; i++) {
          const p = { x: u.x + rr * T.BIS[i][0], y: u.y + rr * T.BIS[i][1] };
          D.text(ctx, v, p, 'C' + i, C.cone[i], { align: 'center', size: 12, weight: '600', mono: true, halo: C.surface });
        }
      }
    },
  };

  function withAlpha(color, a) {
    if (!color) return 'transparent';
    if (color.startsWith('#')) {
      let h = color.slice(1);
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      const n = parseInt(h, 16); 
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }
    return color;
  }

  window.Viz = { View, interact, pick, D, C, withAlpha, themeChanged };
})();
