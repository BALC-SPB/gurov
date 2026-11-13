// ============================================================
// Премиальный анимированный фон: карта маршрутов с частицами
// ============================================================
(function () {
  const canvas = document.getElementById('logistics-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildNetwork();
  }

  // ===== Города (узлы логистической сети) =====
  // Координаты в процентах от экрана
  const cityDefs = [
    { x: 0.15, y: 0.25, name: 'СПб' },
    { x: 0.35, y: 0.40, name: 'Москва' },
    { x: 0.25, y: 0.65, name: 'Берлин' },
    { x: 0.55, y: 0.30, name: 'Пекин' },
    { x: 0.75, y: 0.50, name: 'Шанхай' },
    { x: 0.85, y: 0.25, name: 'Токио' },
    { x: 0.65, y: 0.75, name: 'Сингапур' },
    { x: 0.45, y: 0.85, name: 'Дубай' },
    { x: 0.10, y: 0.55, name: 'Лондон' },
    { x: 0.90, y: 0.65, name: 'Сидней' },
    { x: 0.50, y: 0.55, name: 'Стамбул' },
    { x: 0.20, y: 0.85, name: 'Мадрид' }
  ];

  let cities = [];
  let routes = [];
  let particles = [];

  function buildNetwork() {
    cities = cityDefs.map(c => ({
      x: c.x * W,
      y: c.y * H,
      baseX: c.x * W,
      baseY: c.y * H,
      pulse: Math.random() * Math.PI * 2,
      size: 2 + Math.random() * 2
    }));

    // Маршруты между случайными парами городов (каждый город — 2-3 связи)
    routes = [];
    const connectionCount = Math.min(20, cities.length * 2);
    for (let i = 0; i < connectionCount; i++) {
      const a = Math.floor(Math.random() * cities.length);
      let b = Math.floor(Math.random() * cities.length);
      if (a === b) b = (b + 1) % cities.length;

      // Точки для дуги (с изгибом наверх)
      const p1 = cities[a];
      const p2 = cities[b];
      const midX = (p1.baseX + p2.baseX) / 2;
      const midY = (p1.baseY + p2.baseY) / 2 - Math.abs(p1.baseX - p2.baseX) * 0.3;

      routes.push({
        from: a,
        to: b,
        cx: midX,
        cy: midY,
        progress: 0,
        speed: 0.002 + Math.random() * 0.003
      });
    }

    // Частицы, летящие по маршрутам
    particles = [];
    for (let i = 0; i < 18; i++) {
      particles.push({
        routeIdx: Math.floor(Math.random() * routes.length),
        t: Math.random(),
        speed: 0.003 + Math.random() * 0.005,
        size: 1.5 + Math.random() * 1.5,
        opacity: 0.5 + Math.random() * 0.5
      });
    }
  }

  // Квадратичная кривая Безье
  function bezier(p1, c, p2, t) {
    const u = 1 - t;
    return {
      x: u * u * p1.x + 2 * u * t * c.x + t * t * p2.x,
      y: u * u * p1.y + 2 * u * t * c.y + t * t * p2.y
    };
  }

  let time = 0;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    time += 0.016;

    // ===== 1. Рисуем маршруты (кривые Безье) =====
    routes.forEach(route => {
      const p1 = cities[route.from];
      const p2 = cities[route.to];
      const c = { x: route.cx, y: route.cy };

      const grad = ctx.createLinearGradient(p1.baseX, p1.baseY, p2.baseX, p2.baseY);
      grad.addColorStop(0, 'rgba(25, 198, 255, 0.15)');
      grad.addColorStop(0.5, 'rgba(47, 124, 246, 0.5)');
      grad.addColorStop(1, 'rgba(25, 198, 255, 0.15)');

      ctx.beginPath();
      ctx.moveTo(p1.baseX, p1.baseY);
      ctx.quadraticCurveTo(c.x, c.y, p2.baseX, p2.baseY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Свечение маршрута
      ctx.beginPath();
      ctx.moveTo(p1.baseX, p1.baseY);
      ctx.quadraticCurveTo(c.x, c.y, p2.baseX, p2.baseY);
      ctx.strokeStyle = 'rgba(25, 198, 255, 0.08)';
      ctx.lineWidth = 4;
      ctx.stroke();
    });

    // ===== 2. Частицы, летящие по маршрутам =====
    particles.forEach(p => {
      p.t += p.speed;
      if (p.t > 1) {
        p.t = 0;
        p.routeIdx = Math.floor(Math.random() * routes.length);
      }

      const route = routes[p.routeIdx];
      if (!route) return;
      const p1 = cities[route.from];
      const p2 = cities[route.to];
      const c = { x: route.cx, y: route.cy };
      const pos = bezier(p1, c, p2, p.t);

      // Хвост частицы
      const prevT = Math.max(0, p.t - 0.08);
      const prevPos = bezier(p1, c, p2, prevT);

      const tailGrad = ctx.createLinearGradient(prevPos.x, prevPos.y, pos.x, pos.y);
      tailGrad.addColorStop(0, 'rgba(25, 198, 255, 0)');
      tailGrad.addColorStop(1, `rgba(100, 220, 255, ${p.opacity})`);

      ctx.beginPath();
      ctx.moveTo(prevPos.x, prevPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Свечение точки
      const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, p.size * 4);
      glow.addColorStop(0, `rgba(120, 230, 255, ${p.opacity})`);
      glow.addColorStop(1, 'rgba(25, 198, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Сама точка
      ctx.fillStyle = `rgba(180, 240, 255, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // ===== 3. Города (пульсирующие узлы) =====
    cities.forEach(city => {
      city.pulse += 0.03;
      const pulse = Math.sin(city.pulse) * 0.5 + 0.5;

      // Внешнее свечение
      const glowSize = 8 + pulse * 8;
      const glow = ctx.createRadialGradient(city.baseX, city.baseY, 0, city.baseX, city.baseY, glowSize);
      glow.addColorStop(0, `rgba(25, 198, 255, ${0.25 + pulse * 0.2})`);
      glow.addColorStop(1, 'rgba(25, 198, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(city.baseX, city.baseY, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Кольцо пульса
      ctx.beginPath();
      ctx.arc(city.baseX, city.baseY, 4 + pulse * 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(120, 220, 255, ${0.3 * (1 - pulse)})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Ядро города
      ctx.fillStyle = '#7fdcff';
      ctx.beginPath();
      ctx.arc(city.baseX, city.baseY, city.size, 0, Math.PI * 2);
      ctx.fill();

      // Яркая точка
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(city.baseX, city.baseY, city.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  // Запуск
  resize();
  window.addEventListener('resize', resize);
  draw();
})();