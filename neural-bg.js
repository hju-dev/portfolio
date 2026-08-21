// ================================
// NEURAL BACKGROUND
// Ambient node/connection network animation for the hero section.
// Nodes drift slowly and connect to nearby nodes; occasional pulses
// travel along connections like a signal firing. Nodes near the mouse
// slow down and drift more gently.
// ================================
const canvas = document.getElementById('neural-canvas');

if (canvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ctx = canvas.getContext('2d');

  const NODE_COLOR = '0, 255, 136';
  const NODE_SPACING = 90;       // px per node, scales node count to canvas area
  const MAX_NODES = 70;
  const CONNECT_DIST = 120;      // px, nodes closer than this get a line drawn between them
  const MOUSE_RADIUS = 140;      // px, nodes within this of the cursor slow down
  const MOUSE_DAMPING = 0.2;     // fraction of normal speed near the cursor
  const PULSE_SPEED = 0.02;      // fraction of edge length per frame
  const PULSE_SPAWN_MS = 600;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let nodes = [];
  let pulses = [];
  let mouseX = -9999;
  let mouseY = -9999;
  let lastPulseSpawn = 0;


  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = Math.min(MAX_NODES, Math.floor((width * height) / (NODE_SPACING * NODE_SPACING)));
    nodes = Array.from({ length: targetCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: 1.5 + Math.random() * 1,
    }));
    pulses = [];
  }


  function spawnPulse(edges) {
    if (edges.length === 0) return;
    const edge = edges[Math.floor(Math.random() * edges.length)];
    pulses.push({ from: edge.a, to: edge.b, t: 0 });
  }


  function step(timestamp) {
    ctx.clearRect(0, 0, width, height);

    const edges = [];

    // update + draw nodes
    for (const node of nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const damping = dist < MOUSE_RADIUS ? MOUSE_DAMPING : 1;

      node.x += node.vx * damping;
      node.y += node.vy * damping;

      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      node.x = Math.max(0, Math.min(width, node.x));
      node.y = Math.max(0, Math.min(height, node.y));

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${NODE_COLOR}, 0.45)`;
      ctx.fill();
    }

    // connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECT_DIST) {
          edges.push({ a, b });
          const alpha = 0.14 * (1 - dist / CONNECT_DIST);
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(${NODE_COLOR}, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    // pulses (signal traveling along an edge)
    pulses = pulses.filter((pulse) => pulse.t <= 1);
    for (const pulse of pulses) {
      const x = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.t;
      const y = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.t;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${NODE_COLOR}, 0.8)`;
      ctx.fill();
      pulse.t += PULSE_SPEED;
    }

    if (timestamp - lastPulseSpawn > PULSE_SPAWN_MS) {
      spawnPulse(edges);
      lastPulseSpawn = timestamp;
    }

    if (!document.hidden) {
      requestAnimationFrame(step);
    }
  }


  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }

  function handleMouseLeave() {
    mouseX = -9999;
    mouseY = -9999;
  }


  document.addEventListener('mousemove', handleMouseMove);
  document.getElementById('hero').addEventListener('mouseleave', handleMouseLeave);
  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      requestAnimationFrame(step);
    }
  });

  resize();
  requestAnimationFrame(step);
}
