(function () {
  const toggle = document.querySelector("[data-space-mode-toggle]");
  const root = document.querySelector("[data-space-mode-root]");
  const canvas = document.getElementById("space-mode-canvas");
  const exitButton = document.querySelector("[data-space-mode-exit]");
  const menuToggle = document.querySelector("[data-space-menu-toggle]");
  const menuList = document.querySelector("[data-space-menu-list]");
  const cardTitle = document.querySelector("[data-space-card-title]");
  const cardBody = document.querySelector("[data-space-card-body]");
  const cardActions = document.querySelector("[data-space-card-actions]");

  if (!toggle || !root || !canvas || !cardTitle || !cardBody || !cardActions) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const world = { width: 2200, height: 1500 };
  const state = {
    active: false,
    width: 0,
    height: 0,
    dpr: 1,
    cameraX: 0,
    cameraY: 0,
    focusId: "",
    target: null,
    keys: new Set(),
    lastTime: 0,
    astronaut: {
      x: 360,
      y: 760,
      vx: 0,
      vy: 0,
      angle: 0
    }
  };

  const destinations = [
    {
      id: "home",
      label: "Home Planet",
      type: "planet",
      x: 360,
      y: 760,
      radius: 88,
      colors: ["#2f9cff", "#0a2d66"],
      title: "David Lifschitz",
      body: "Operator tooling, mobile utilities, and research surfaces connected into one ecosystem.",
      links: [
        { label: "Ecosystem", href: "ecosystem.html" },
        { label: "GitHub", href: "https://github.com/davidlifschitz", external: true }
      ]
    },
    {
      id: "about",
      label: "About Moon",
      type: "moon",
      x: 760,
      y: 430,
      radius: 58,
      colors: ["#dce9ff", "#7f91a8"],
      title: "About orbit",
      body: "I build practical systems for research, automation, operator workflows, and fast product loops.",
      links: [
        { label: "Book a call", href: "booking.html" }
      ]
    },
    {
      id: "projects",
      label: "Projects Belt",
      type: "planet",
      x: 1240,
      y: 760,
      radius: 78,
      colors: ["#ff775c", "#6b1d2b"],
      title: "Projects belt",
      body: "ScheduleOS, ShortcutForge, the ecosystem dashboard, and experiment surfaces live in this cluster.",
      links: [
        { label: "ShortcutForge", href: "shortcutforge/index.html" },
        { label: "ScheduleOS", href: "https://github.com/davidlifschitz/ScheduleOS", external: true }
      ]
    },
    {
      id: "station",
      label: "Ecosystem Station",
      type: "station",
      x: 1580,
      y: 470,
      radius: 76,
      colors: ["#c9f0ff", "#3856ff"],
      title: "Ecosystem station",
      body: "A map of the current tools, repositories, dashboards, and launch surfaces.",
      links: [
        { label: "Open ecosystem", href: "ecosystem.html" },
        { label: "Activity dashboard", href: "dashboard.html" }
      ]
    },
    {
      id: "dashboard",
      label: "Telemetry Satellite",
      type: "satellite",
      x: 1710,
      y: 980,
      radius: 58,
      colors: ["#b7ffd8", "#118c65"],
      title: "Telemetry satellite",
      body: "The dashboard tracks ecosystem activity and repository movement over time.",
      links: [
        { label: "Open dashboard", href: "dashboard.html" }
      ]
    },
    {
      id: "booking",
      label: "Docking Bay 42",
      type: "ship",
      x: 990,
      y: 1120,
      radius: 70,
      colors: ["#fff1a8", "#d68a00"],
      title: "Docking Bay 42",
      body: "A practical airlock for consulting calls, architecture reviews, and focused product sessions.",
      links: [
        { label: "Book a session", href: "booking.html" }
      ]
    },
    {
      id: "writing",
      label: "Writing Station",
      type: "station",
      x: 520,
      y: 1120,
      radius: 64,
      colors: ["#f0f0f0", "#333333"],
      title: "Writing station",
      body: "Unwrapping the Stack — a research series on files, apps, browsers, OS, hardware, and identity.",
      links: [
        { label: "Read the series", href: "blog/index.html" }
      ]
    },
    {
      id: "monolith",
      label: "Quiet Monolith",
      type: "monolith",
      x: 1960,
      y: 310,
      radius: 52,
      colors: ["#111827", "#02040b"],
      title: "Quiet monolith",
      body: "A small space-movie signal: the best tools feel mysterious only until the interface gets clear.",
      links: []
    },
    {
      id: "buoy",
      label: "Don't Panic Buoy",
      type: "buoy",
      x: 1930,
      y: 1270,
      radius: 50,
      colors: ["#ff4fd8", "#43125d"],
      title: "Deep-space buoy",
      body: "The emergency panel says: Don't Panic. Then it points you back to shipping.",
      links: [
        { label: "Home", href: "index.html" }
      ]
    }
  ];

  const stars = makeStars(180);

  function makeStars(count) {
    let seed = 42;
    const next = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    return Array.from({ length: count }, () => ({
      x: next() * world.width,
      y: next() * world.height,
      size: 0.8 + next() * 2.4,
      depth: 0.25 + next() * 0.75,
      twinkle: next() * Math.PI * 2
    }));
  }

  function resize() {
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.round(state.width * state.dpr);
    canvas.height = Math.round(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function setActive(nextActive) {
    state.active = nextActive;
    document.body.classList.toggle("space-mode-active", nextActive);
    root.classList.toggle("is-active", nextActive);
    root.setAttribute("aria-hidden", String(!nextActive));
    toggle.setAttribute("aria-pressed", String(nextActive));
    writeSavedMode(nextActive);
    if (nextActive) {
      resize();
      updateFocus(true);
      requestAnimationFrame(frame);
    }
  }

  function writeSavedMode(nextActive) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem("david-space-mode", nextActive ? "1" : "0");
      }
    } catch (error) {
      return false;
    }
    return true;
  }

  function populateMenu() {
    if (!menuList) {
      return;
    }
    menuList.textContent = "";
    destinations.forEach((destination) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = destination.label;
      button.addEventListener("click", () => {
        state.target = { x: destination.x, y: destination.y };
        menuList.hidden = true;
        menuToggle?.setAttribute("aria-expanded", "false");
      });
      menuList.appendChild(button);
    });
  }

  function updateFocus(force) {
    const nearest = destinations
      .map((destination) => ({
        destination,
        distance: Math.hypot(state.astronaut.x - destination.x, state.astronaut.y - destination.y)
      }))
      .sort((a, b) => a.distance - b.distance)[0];

    const focused = nearest && nearest.distance < nearest.destination.radius + 150
      ? nearest.destination
      : null;
    const focusId = focused ? focused.id : "";

    if (!force && state.focusId === focusId) {
      return;
    }

    state.focusId = focusId;
    if (!focused) {
      cardTitle.textContent = "Flight deck";
      cardBody.textContent = "Click a destination or steer with WASD/Arrows. Drift close to planets, stations, and signals to reveal links.";
      renderActions([]);
      return;
    }

    cardTitle.textContent = focused.title;
    cardBody.textContent = focused.body;
    renderActions(focused.links);
  }

  function renderActions(links) {
    cardActions.textContent = "";
    links.forEach((link) => {
      const anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (link.external) {
        anchor.target = "_blank";
        anchor.rel = "noreferrer";
      }
      cardActions.appendChild(anchor);
    });
  }

  function screenToWorld(clientX, clientY) {
    return {
      x: clientX + state.cameraX,
      y: clientY + state.cameraY
    };
  }

  function step(dt) {
    const astronaut = state.astronaut;
    let ax = 0;
    let ay = 0;
    const thrust = 760;
    if (state.keys.has("ArrowLeft") || state.keys.has("KeyA")) ax -= thrust;
    if (state.keys.has("ArrowRight") || state.keys.has("KeyD")) ax += thrust;
    if (state.keys.has("ArrowUp") || state.keys.has("KeyW")) ay -= thrust;
    if (state.keys.has("ArrowDown") || state.keys.has("KeyS")) ay += thrust;

    if (state.target) {
      const dx = state.target.x - astronaut.x;
      const dy = state.target.y - astronaut.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 18) {
        state.target = null;
      } else {
        ax += (dx / distance) * thrust * 0.78;
        ay += (dy / distance) * thrust * 0.78;
      }
    }

    astronaut.vx = (astronaut.vx + ax * dt) * 0.88;
    astronaut.vy = (astronaut.vy + ay * dt) * 0.88;
    const speed = Math.hypot(astronaut.vx, astronaut.vy);
    const maxSpeed = 420;
    if (speed > maxSpeed) {
      astronaut.vx = (astronaut.vx / speed) * maxSpeed;
      astronaut.vy = (astronaut.vy / speed) * maxSpeed;
    }
    astronaut.x = clamp(astronaut.x + astronaut.vx * dt, 80, world.width - 80);
    astronaut.y = clamp(astronaut.y + astronaut.vy * dt, 80, world.height - 80);
    if (speed > 8) {
      astronaut.angle = Math.atan2(astronaut.vy, astronaut.vx);
    }

    state.cameraX = clamp(astronaut.x - state.width / 2, 0, world.width - state.width);
    state.cameraY = clamp(astronaut.y - state.height / 2, 0, world.height - state.height);
    updateFocus(false);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function frame(time) {
    if (!state.active) {
      return;
    }
    const dt = Math.min((time - (state.lastTime || time)) / 1000, 0.033);
    state.lastTime = time;
    step(dt);
    draw(time / 1000);
    requestAnimationFrame(frame);
  }

  function draw(time) {
    ctx.clearRect(0, 0, state.width, state.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, "#02040b");
    gradient.addColorStop(0.55, "#061334");
    gradient.addColorStop(1, "#14051f");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    drawStars(time);
    drawNebula();
    drawRoutes();
    destinations.forEach((destination) => drawDestination(destination, time));
    drawAstronaut(time);
    drawTarget();
  }

  function toScreen(x, y, depth = 1) {
    return {
      x: x - state.cameraX * depth,
      y: y - state.cameraY * depth
    };
  }

  function drawStars(time) {
    stars.forEach((star) => {
      const position = toScreen(star.x, star.y, star.depth);
      const x = ((position.x % state.width) + state.width) % state.width;
      const y = ((position.y % state.height) + state.height) % state.height;
      const alpha = 0.4 + Math.sin(time * 1.4 + star.twinkle) * 0.22 + star.depth * 0.3;
      ctx.fillStyle = `rgba(248, 251, 255, ${alpha})`;
      ctx.fillRect(x, y, star.size, star.size);
    });
  }

  function drawNebula() {
    const clouds = [
      { x: 720, y: 1020, r: 360, color: "rgba(61, 96, 255, 0.16)" },
      { x: 1540, y: 330, r: 300, color: "rgba(255, 79, 216, 0.12)" },
      { x: 1850, y: 1180, r: 260, color: "rgba(143, 211, 255, 0.12)" }
    ];
    clouds.forEach((cloud) => {
      const position = toScreen(cloud.x, cloud.y, 0.72);
      const gradient = ctx.createRadialGradient(position.x, position.y, 0, position.x, position.y, cloud.r);
      gradient.addColorStop(0, cloud.color);
      gradient.addColorStop(1, "rgba(2, 4, 11, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(position.x, position.y, cloud.r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawRoutes() {
    ctx.save();
    ctx.translate(-state.cameraX, -state.cameraY);
    ctx.strokeStyle = "rgba(143, 211, 255, 0.18)";
    ctx.setLineDash([10, 16]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    destinations.forEach((destination, index) => {
      if (index === 0) {
        ctx.moveTo(destination.x, destination.y);
      } else {
        ctx.lineTo(destination.x, destination.y);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawDestination(destination, time) {
    ctx.save();
    ctx.translate(destination.x - state.cameraX, destination.y - state.cameraY);
    const pulse = Math.sin(time * 2 + destination.x * 0.01) * 0.08 + 1;
    drawHalo(destination.radius * pulse, destination.colors[0]);

    if (destination.type === "station") drawStation(destination);
    else if (destination.type === "satellite") drawSatellite(destination);
    else if (destination.type === "ship") drawShip(destination);
    else if (destination.type === "monolith") drawMonolith(destination, time);
    else if (destination.type === "buoy") drawBuoy(destination, time);
    else drawPlanet(destination);

    drawLabel(destination);
    ctx.restore();
  }

  function drawHalo(radius, color) {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.9);
    gradient.addColorStop(0, `${color}55`);
    gradient.addColorStop(1, "rgba(2, 4, 11, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlanet(destination) {
    const gradient = ctx.createRadialGradient(-destination.radius * 0.28, -destination.radius * 0.35, 8, 0, 0, destination.radius);
    gradient.addColorStop(0, destination.colors[0]);
    gradient.addColorStop(1, destination.colors[1]);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, destination.radius, 0, Math.PI * 2);
    ctx.fill();
    if (destination.id === "projects") {
      ctx.strokeStyle = "rgba(255, 241, 168, 0.72)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, destination.radius * 1.55, destination.radius * 0.42, -0.16, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (destination.type === "moon") {
      ctx.fillStyle = "rgba(70, 86, 108, 0.34)";
      [[-18, -12, 10], [20, 14, 8], [8, -28, 6]].forEach(([x, y, r]) => {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function drawStation(destination) {
    ctx.fillStyle = destination.colors[0];
    ctx.fillRect(-54, -22, 108, 44);
    ctx.fillStyle = destination.colors[1];
    ctx.fillRect(-18, -48, 36, 96);
    ctx.strokeStyle = "rgba(248, 251, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.strokeRect(-54, -22, 108, 44);
    ctx.strokeRect(-18, -48, 36, 96);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawSatellite(destination) {
    ctx.fillStyle = destination.colors[0];
    ctx.fillRect(-18, -14, 36, 28);
    ctx.fillStyle = destination.colors[1];
    ctx.fillRect(-68, -18, 38, 36);
    ctx.fillRect(30, -18, 38, 36);
    ctx.strokeStyle = "rgba(248, 251, 255, 0.76)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-68, -18, 38, 36);
    ctx.strokeRect(30, -18, 38, 36);
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -52);
    ctx.stroke();
  }

  function drawShip(destination) {
    ctx.fillStyle = destination.colors[0];
    ctx.beginPath();
    ctx.moveTo(68, 0);
    ctx.lineTo(-42, -34);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-42, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = destination.colors[1];
    ctx.fillRect(-56, -14, 30, 28);
    ctx.fillStyle = "rgba(143, 211, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(16, 0, 13, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawMonolith(destination, time) {
    ctx.rotate(Math.sin(time * 0.7) * 0.08);
    ctx.fillStyle = destination.colors[1];
    ctx.fillRect(-18, -64, 36, 128);
    ctx.strokeStyle = "rgba(248, 251, 255, 0.34)";
    ctx.strokeRect(-18, -64, 36, 128);
  }

  function drawBuoy(destination, time) {
    ctx.rotate(Math.sin(time * 1.8) * 0.12);
    ctx.fillStyle = destination.colors[0];
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = destination.colors[1];
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#02040b";
    ctx.font = "900 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("OK", 0, 4);
  }

  function drawLabel(destination) {
    ctx.font = "800 14px Inter, sans-serif";
    ctx.textAlign = "center";
    const textWidth = ctx.measureText(destination.label).width + 28;
    const y = -destination.radius - 54;
    ctx.fillStyle = "rgba(248, 251, 255, 0.93)";
    roundRect(-textWidth / 2, y, textWidth, 34, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(2, 4, 11, 0.9)";
    ctx.lineWidth = 2;
    roundRect(-textWidth / 2, y, textWidth, 34, 6);
    ctx.stroke();
    ctx.fillStyle = "#02040b";
    ctx.fillText(destination.label, 0, y + 22);
  }

  function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function drawAstronaut(time) {
    const astronaut = state.astronaut;
    ctx.save();
    ctx.translate(astronaut.x - state.cameraX, astronaut.y - state.cameraY);
    ctx.rotate(astronaut.angle);
    const flame = 1 + Math.sin(time * 16) * 0.2;
    ctx.fillStyle = "rgba(143, 211, 255, 0.48)";
    ctx.beginPath();
    ctx.moveTo(-26, -7);
    ctx.lineTo(-58 * flame, 0);
    ctx.lineTo(-26, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(-22, -15, 34, 30);
    ctx.fillStyle = "#cfd8e8";
    ctx.fillRect(-30, -11, 12, 22);
    ctx.fillStyle = "#f8fbff";
    ctx.beginPath();
    ctx.arc(20, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8fd3ff";
    ctx.beginPath();
    ctx.arc(25, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#02040b";
    ctx.lineWidth = 3;
    ctx.strokeRect(-22, -15, 34, 30);
    ctx.beginPath();
    ctx.arc(20, 0, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawTarget() {
    if (!state.target) {
      return;
    }
    const x = state.target.x - state.cameraX;
    const y = state.target.y - state.cameraY;
    ctx.strokeStyle = "rgba(255, 241, 168, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.moveTo(x - 28, y);
    ctx.lineTo(x + 28, y);
    ctx.moveTo(x, y - 28);
    ctx.lineTo(x, y + 28);
    ctx.stroke();
  }

  toggle.addEventListener("click", () => setActive(!state.active));
  exitButton?.addEventListener("click", () => setActive(false));
  menuToggle?.addEventListener("click", () => {
    if (!menuList) {
      return;
    }
    const expanded = menuList.hidden;
    menuList.hidden = !expanded;
    menuToggle.setAttribute("aria-expanded", String(expanded));
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (!state.active) {
      return;
    }
    const nextTarget = screenToWorld(event.clientX, event.clientY);
    state.target = {
      x: clamp(nextTarget.x, 80, world.width - 80),
      y: clamp(nextTarget.y, 80, world.height - 80)
    };
  });

  window.addEventListener("keydown", (event) => {
    if (!state.active) {
      return;
    }
    const allowed = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS"];
    if (allowed.includes(event.code)) {
      state.keys.add(event.code);
      event.preventDefault();
    }
    if (event.code === "Escape") {
      setActive(false);
    }
  });

  window.addEventListener("keyup", (event) => {
    state.keys.delete(event.code);
  });
  window.addEventListener("resize", resize);

  populateMenu();
  resize();
})();
