// A scene is pure: `update(state, t)` must set every animated property from
// `t` alone so frames can be rendered out of order by parallel workers.
export function defineScene({ name, span, z, sfx = [], build, update }) {
  return { name, span, z, sfx, build, update };
}

// Rect of `el` relative to `ancestor`, in unscaled layout pixels.
export function rectIn(el, ancestor) {
  const a = ancestor.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const k = ancestor.offsetWidth ? a.width / ancestor.offsetWidth : 1;
  return {
    x: (r.left - a.left) / k,
    y: (r.top - a.top) / k,
    w: r.width / k,
    h: r.height / k,
    get cx() {
      return this.x + this.w / 2;
    },
    get cy() {
      return this.y + this.h / 2;
    },
  };
}
