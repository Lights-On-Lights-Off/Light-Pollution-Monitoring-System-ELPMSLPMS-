// NBSC Admin Dashboard — manager.js

// Animated Background Canvas
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x     = Math.random() * W;
      this.y     = init ? Math.random() * H : H + 10;
      this.r     = Math.random() * 1.4 + 0.3;
      this.vy    = -(Math.random() * 0.35 + 0.08);
      this.vx    = (Math.random() - 0.5) * 0.12;
      this.alpha = Math.random() * 0.45 + 0.08;
      this.color = Math.random() > 0.6
        ? `rgba(13,110,253,${this.alpha})`
        : `rgba(255,255,255,${this.alpha * 0.5})`;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.y < -10) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let i = 0; i < 100; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#252324';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.5);
    g.addColorStop(0, 'rgba(13,110,253,0.05)');
    g.addColorStop(1, 'rgba(37,35,36,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();