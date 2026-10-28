(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Header: sfondo allo scroll, si nasconde scendendo ---------- */
  const header = $(".header");
  const progress = $(".progress");
  const sticky = $(".sticky-cta");
  const contact = $("#contatti");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 20);
    header.classList.toggle("is-hidden", y > 400 && y > lastY && !nav.classList.contains("is-open"));
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    // barra contatto mobile: visibile dopo l'hero, nascosta sopra il form
    const c = contact.getBoundingClientRect();
    sticky.classList.toggle("is-visible", y > innerHeight * 0.6 && !(c.top < innerHeight && c.bottom > 0));
  };

  /* ---------- Menu mobile ---------- */
  const nav = $("#nav");
  const burger = $(".burger");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("a", nav).forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }));

  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Link attivo nel menu ---------- */
  const links = $$(".nav a[href^='#']:not(.btn)");
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => spy.observe(s));

  /* ---------- Reveal allo scroll (con sfalsamento nei gruppi) ---------- */
  $$(".services, .about__pillars, .stats__grid, .steps, .projects, .press").forEach(g =>
    $$(".reveal", g).forEach((el, i) => el.style.setProperty("--d", `${i * 0.08}s`))
  );
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------- Linea del metodo che si disegna ---------- */
  const steps = $(".steps");
  new IntersectionObserver(([e], o) => {
    if (e.isIntersecting) { steps.style.setProperty("--line", 1); o.disconnect(); }
  }, { threshold: 0.4 }).observe(steps);

  /* ---------- Contatori ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "";
      countIO.unobserve(el);
      if (reduced) { el.textContent = end + suf; return; }
      const t0 = performance.now(), dur = 1600;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(el => countIO.observe(el));

  /* ---------- Parola rotante nell'hero ---------- */
  const words = ["fa impresa.", "innova.", "vuole farsi ascoltare.", "dialoga con le istituzioni.", "ha una storia."];
  const w = $(".rotator__word");
  let wi = 0;
  if (!reduced) setInterval(() => {
    w.classList.add("out");
    setTimeout(() => {
      wi = (wi + 1) % words.length;
      w.textContent = words[wi];
      w.classList.replace("out", "in");
      void w.offsetWidth;
      w.classList.remove("in");
    }, 450);
  }, 2800);

  /* ---------- Effetti al puntatore (solo desktop) ---------- */
  if (finePointer && !reduced) {
    // alone che segue il mouse sulle card servizio
    $$(".service").forEach(c => c.addEventListener("pointermove", e => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", `${e.clientX - r.left}px`);
      c.style.setProperty("--my", `${e.clientY - r.top}px`);
    }));
    // tilt 3D
    $$(".tilt").forEach(c => {
      c.addEventListener("pointermove", e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      c.addEventListener("pointerleave", () => (c.style.transform = ""));
    });
    // bottoni magnetici
    $$(".magnetic").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });
    // parallax leggero dei blob nell'hero
    const blobs = $$(".blob");
    addEventListener("pointermove", e => {
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      blobs.forEach((b, i) => (b.style.translate = `${x * (i + 1) * 20}px ${y * (i + 1) * 20}px`));
    }, { passive: true });
  }

  /* ---------- Click su un servizio: preseleziona il form ---------- */
  const form = $("#contact-form");
  $$(".service").forEach(s => {
    s.tabIndex = 0;
    s.setAttribute("role", "link");
    const go = () => {
      const box = $$("input[name='servizi']", form).find(i => i.value === s.dataset.service);
      if (box) box.checked = true;
      contact.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      setTimeout(() => $("#f-nome").focus({ preventScroll: true }), 700);
    };
    s.addEventListener("click", go);
    s.addEventListener("keydown", e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), go()));
  });

  /* ---------- Invio form ---------- */
  const status = $(".form__status", form);
  form.addEventListener("submit", async e => {
    e.preventDefault();
    let ok = true;
    $$(".field", form).forEach(f => f.classList.remove("is-invalid"));
    ["#f-nome", "#f-email"].forEach(id => {
      const i = $(id, form);
      if (!i.checkValidity()) { i.parentElement.classList.add("is-invalid"); ok = false; }
    });
    const privacy = $(".privacy", form);
    privacy.classList.toggle("is-invalid", !privacy.querySelector("input").checked);
    if (!privacy.querySelector("input").checked) ok = false;
    if (!ok) { status.className = "form__status err"; status.textContent = "Controlla i campi evidenziati."; return; }

    const data = new FormData(form);
    const servizi = data.getAll("servizi").join(", ") || "—";
    const endpoint = form.dataset.endpoint;

    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error();
        form.reset();
        status.className = "form__status ok";
        status.textContent = "Grazie! Ti ricontatteremo entro 24 ore.";
      } catch {
        status.className = "form__status err";
        status.textContent = "Invio non riuscito. Scrivici a info@italcommunications.it";
      }
      return;
    }

    // Nessun backend configurato: apre il client email precompilato
    const body = [
      `Nome: ${data.get("nome")}`,
      `Azienda: ${data.get("azienda") || "—"}`,
      `Email: ${data.get("email")}`,
      `Telefono: ${data.get("telefono") || "—"}`,
      `Servizi: ${servizi}`,
      "",
      data.get("messaggio") || "",
    ].join("\n");
    location.href = `mailto:info@italcommunications.it?subject=${encodeURIComponent("Richiesta consulenza — " + data.get("nome"))}&body=${encodeURIComponent(body)}`;
    status.className = "form__status ok";
    status.textContent = "Si sta aprendo la tua email: premi Invia e ti ricontattiamo entro 24 ore.";
  });
})();
