(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Header, barra di avanzamento, barra contatto mobile ---------- */
  const header = $(".header");
  const nav = $("#nav");
  const burger = $(".burger");
  const progress = $(".progress");
  const sticky = $(".sticky-cta");
  const contact = $("#contatti");
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    header.classList.toggle("is-hidden", y > 500 && y > lastY && !nav.classList.contains("is-open"));
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    const c = contact.getBoundingClientRect();
    sticky.classList.toggle("is-visible", y > innerHeight * 0.7 && !(c.top < innerHeight && c.bottom > 0));
    parallax();
  };

  /* ---------- Menu mobile ---------- */
  const setMenu = open => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    document.body.classList.toggle("lock", open);
  };
  burger.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach(a => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Link attivo nel menu ---------- */
  const links = $$(".nav a[href^='#']:not(.btn)");
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("section[id]").forEach(s => spy.observe(s));

  /* ---------- Reveal allo scroll, sfalsato nei gruppi ---------- */
  $$(".services, .pillars, .stats__grid, .projects, .studies, .press, .team, .events__list").forEach(g =>
    $$(".reveal", g).forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 10) * 0.07}s`))
  );
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal").forEach(el => io.observe(el));

  /* ---------- Parallax leggero sulle foto di "Chi siamo" ---------- */
  const layers = reduced ? [] : $$(".parallax");
  const wide = matchMedia("(min-width: 981px)");
  function parallax() {
    layers.forEach(el => {
      if (!wide.matches) { el.style.translate = ""; return; }
      const r = el.parentElement.getBoundingClientRect();
      const off = (r.top + r.height / 2 - innerHeight / 2) * +el.dataset.speed;
      el.style.translate = `0 ${off.toFixed(1)}px`;
    });
  }

  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Contatori ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suf = el.dataset.suffix || "";
      countIO.unobserve(el);
      if (reduced) { el.textContent = end + suf; return; }
      const t0 = performance.now(), dur = 1800;
      const tick = t => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(el => countIO.observe(el));

  /* ---------- Hero: foto in dissolvenza + parola rotante ---------- */
  if (!reduced) {
    const slides = $$(".hero__slides img");
    let si = 0;
    setInterval(() => {
      slides[si].classList.remove("is-on");
      si = (si + 1) % slides.length;
      slides[si].classList.add("is-on");
    }, 5500);

    const words = ["progetti.", "messaggi.", "valori.", "eventi.", "brand."];
    const w = $(".rotator__word");
    let wi = 0;
    setInterval(() => {
      w.classList.add("out");
      setTimeout(() => {
        wi = (wi + 1) % words.length;
        w.textContent = words[wi];
        w.classList.replace("out", "in");
        void w.offsetWidth;
        w.classList.remove("in");
      }, 450);
    }, 2800);
  }

  /* ---------- Bottoni magnetici (solo desktop) ---------- */
  if (finePointer && !reduced) {
    $$(".magnetic").forEach(b => {
      b.addEventListener("pointermove", e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener("pointerleave", () => (b.style.transform = ""));
    });
  }

  /* ---------- Carosello video ---------- */
  const reel = $(".reel");
  $$("[data-reel]").forEach(b => b.addEventListener("click", () => {
    reel.scrollBy({ left: +b.dataset.reel * reel.clientWidth * 0.9, behavior: reduced ? "auto" : "smooth" });
  }));

  /* ---------- Overlay: pannello servizio e player video ---------- */
  let lastFocus = null;
  const openLayer = el => {
    lastFocus = document.activeElement;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    document.body.classList.add("lock");
    setTimeout(() => $("[data-close].drawer__close, .modal__close", el)?.focus(), 50);
  };
  const closeLayer = el => {
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lock");
    if (el === modal) { video.pause(); video.removeAttribute("src"); video.load(); }
    lastFocus?.focus({ preventScroll: true });
  };

  const drawer = $("#drawer");
  const form = $("#contact-form");
  let currentService = null;
  const openService = key => {
    const tpl = $(`#tpl-${key}`);
    if (!tpl) return;
    currentService = key;
    $(".drawer__title", drawer).innerHTML = tpl.dataset.title;
    $(".drawer__kicker", drawer).textContent = tpl.dataset.kicker;
    $(".drawer__icon", drawer).src = `assets/img/icons/${tpl.dataset.icon}.webp`;
    const body = $(".drawer__body", drawer);
    body.replaceChildren(tpl.content.cloneNode(true));
    $(".drawer__panel", drawer).scrollTop = 0;
    openLayer(drawer);
  };
  $$(".service").forEach(s => s.addEventListener("click", () => openService(s.dataset.service)));
  $$("[data-open]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); openService(a.dataset.open); }));

  // "Richiedi questo servizio": chiude il pannello, preseleziona il servizio e porta al form
  $(".drawer__cta").addEventListener("click", e => {
    e.preventDefault();
    const box = $(`input[data-key="${currentService}"]`, form);
    if (box) box.checked = true;
    closeLayer(drawer);
    contact.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    setTimeout(() => $("#f-nome").focus({ preventScroll: true }), 700);
  });

  const modal = $("#video-modal");
  const video = $("video", modal);
  $$("[data-video]").forEach(b => b.addEventListener("click", () => {
    video.src = b.dataset.video;
    $(".modal__title", modal).textContent = b.dataset.title || "";
    openLayer(modal);
    video.play().catch(() => {});
  }));

  [drawer, modal].forEach(layer => $$("[data-close]", layer).forEach(c => c.addEventListener("click", () => closeLayer(layer))));
  addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    [drawer, modal].forEach(l => l.classList.contains("is-open") && closeLayer(l));
    if (nav.classList.contains("is-open")) setMenu(false);
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
    const accepted = $("input", privacy).checked;
    privacy.classList.toggle("is-invalid", !accepted);
    if (!accepted) ok = false;
    if (!ok) { status.className = "form__status err"; status.textContent = "Controlla i campi evidenziati."; return; }

    const data = new FormData(form);
    const endpoint = form.dataset.endpoint;

    if (endpoint) {
      try {
        const res = await fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error();
        form.reset();
        status.className = "form__status ok";
        status.textContent = "Grazie! Il nostro team ti ricontatterà al più presto.";
      } catch {
        status.className = "form__status err";
        status.textContent = "Invio non riuscito. Scrivici a info@italcommunications.it";
      }
      return;
    }

    // Senza backend: apre il programma di posta con l'email pronta (come sul sito attuale)
    const body = [
      `Nome: ${data.get("nome")}`,
      `Azienda: ${data.get("azienda") || "—"}`,
      `Email: ${data.get("email")}`,
      `Telefono: ${data.get("telefono") || "—"}`,
      `Argomento: ${data.getAll("servizi").join(", ") || "—"}`,
      "",
      data.get("messaggio") || "",
    ].join("\n");
    location.href = `mailto:info@italcommunications.it?subject=${encodeURIComponent("Richiesta dal sito — " + data.get("nome"))}&body=${encodeURIComponent(body)}`;
    status.className = "form__status ok";
    status.textContent = "Si sta aprendo il tuo programma di posta: premi Invia per completare.";
  });
})();
