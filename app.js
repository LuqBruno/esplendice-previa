/* Esplêndice — prévia · "O ritmo do cuidado" (sem dependências) */
(() => {
  'use strict';
  const doc = document.documentElement;
  const reduz = matchMedia('(prefers-reduced-motion: reduce)');
  const WA = 'https://wa.me/5548999364181?text=';
  const msg = {
    consulta: 'Olá! Vim pelo site e gostaria de agendar uma consulta.',
    exame: 'Olá! Vim pelo site e gostaria de agendar um exame.',
    checkup: 'Olá! Vim pelo site e gostaria de montar um check-up.'
  };
  const wa = (t) => WA + encodeURIComponent(t);
  document.querySelectorAll('[data-wa]').forEach((a) => { a.href = wa(msg[a.dataset.wa] || msg.consulta); });

  /* ---------- Traçado de ECG em SVG (path--sereno adaptado) ---------- */
  function batimento(x0, base, r) {
    const p = [[0, 0], [12, 0], [18, -.07], [24, -.1], [30, -.07], [36, 0], [46, 0], [50, .06], [56, -1], [62, .3], [68, 0], [80, 0], [88, -.13], [98, -.18], [108, -.13], [116, 0]];
    return p.map(([dx, dy]) => `L${(x0 + dx).toFixed(1)} ${(base + dy * r).toFixed(1)}`).join(' ');
  }
  function caminhoECG(w, base, r, xs) {
    let d = `M0 ${base}`;
    xs.forEach((x) => { d += ` L${x} ${base} ` + batimento(x, base, r); });
    return d + ` L${w} ${base}`;
  }
  function medir(path) {
    const len = Math.ceil(path.getTotalLength());
    path.style.setProperty('--len', len);
    return len;
  }

  const heroBase = document.getElementById('tracoHero');
  if (heroBase) {
    const xs = [70, 330, 610, 870, 1150, 1400 - 120];
    const d = caminhoECG(1440, 112, 96, xs);
    const svg = heroBase.ownerSVGElement;
    svg.querySelectorAll('path').forEach((p) => { p.setAttribute('d', d); medir(p); });
  }
  document.querySelectorAll('.divisor .traco').forEach((p) => {
    const n = +p.dataset.ecg || 1;
    const xs = n === 2 ? [380, 980] : [690];
    p.setAttribute('d', caminhoECG(1440, 40, 34, xs));
    medir(p);
  });
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('is-ready')));

  /* ---------- Topo, menu e barra fixa ---------- */
  const topo = document.getElementById('topo');
  const onScroll = () => topo.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const botaoMenu = document.querySelector('.topo__menu');
  const setMenu = (aberto) => {
    doc.classList.toggle('menu-aberto', aberto);
    botaoMenu.setAttribute('aria-expanded', String(aberto));
    botaoMenu.querySelector('.sr').textContent = aberto ? 'Fechar menu' : 'Abrir menu';
  };
  botaoMenu.addEventListener('click', () => setMenu(!doc.classList.contains('menu-aberto')));
  document.querySelectorAll('#menu a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && doc.classList.contains('menu-aberto')) { setMenu(false); botaoMenu.focus(); } });
  matchMedia('(min-width: 1121px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Revelações ---------- */
  const alvos = document.querySelectorAll('.mascara, .divisor, [data-revela]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -12% 0px' });
    alvos.forEach((el) => io.observe(el));

    const barra = document.querySelector('.barra-wa');
    // A barra fixa só aparece depois que os botões do hero saem da tela (evita CTA duplicado na primeira dobra).
    const acoesHero = document.querySelector('.hero__acoes');
    barra.classList.add('is-oculta');
    new IntersectionObserver(([en]) => barra.classList.toggle('is-oculta', en.isIntersecting || en.boundingClientRect.top > 0)).observe(acoesHero);
  } else {
    alvos.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Contadores ---------- */
  const nums = document.querySelectorAll('[data-conta]');
  if (!reduz.matches && 'IntersectionObserver' in window) {
    const ioN = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (!en.isIntersecting) return;
      ioN.unobserve(en.target);
      const el = en.target, alvo = +el.dataset.conta, t0 = performance.now(), dur = 1100;
      const passo = (now) => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(alvo * e);
        if (k < 1) requestAnimationFrame(passo);
      };
      el.textContent = '0';
      requestAnimationFrame(passo);
    }), { threshold: .6 });
    nums.forEach((n) => ioN.observe(n));
  }

  /* ---------- Médicos: dados, ficha e filtros ---------- */
  const medicos = {};
  document.querySelectorAll('.medico').forEach((li) => {
    const id = li.dataset.id;
    const bio = document.getElementById('bios').content.querySelector(`[data-id="${id}"]`);
    medicos[id] = {
      id,
      nome: li.querySelector('.medico__nome').textContent,
      papel: bio.dataset.papel,
      reg: bio.dataset.reg,
      bio: bio.innerHTML,
      foto: `assets/img/${id}-720.webp`,
      mini: `assets/img/${id}-400.webp`
    };
    li.querySelector('.medico__btn').addEventListener('click', (e) => abrirFicha(id, e.currentTarget));
  });

  const ficha = document.querySelector('.ficha');
  let origemFoco = null;
  function abrirFicha(id, origem) {
    const m = medicos[id];
    if (!m) return;
    origemFoco = origem || document.activeElement;
    ficha.querySelector('.ficha__foto img').src = m.foto;
    ficha.querySelector('[data-f="papel"]').textContent = m.papel;
    ficha.querySelector('[data-f="nome"]').textContent = m.nome;
    ficha.querySelector('[data-f="reg"]').textContent = m.reg;
    ficha.querySelector('[data-f="bio"]').innerHTML = m.bio;
    const a = ficha.querySelector('[data-f="wa"]');
    a.href = wa(`Olá! Vim pelo site e gostaria de agendar uma consulta com ${m.nome}.`);
    a.textContent = `Agendar com ${m.nome.split(' ').slice(0, 2).join(' ')}`;
    if (typeof ficha.showModal === 'function') ficha.showModal(); else ficha.setAttribute('open', '');
    ficha.querySelector('.ficha__fechar').focus();
  }
  const fecharFicha = () => { if (ficha.close) ficha.close(); else ficha.removeAttribute('open'); };
  ficha.querySelector('.ficha__fechar').addEventListener('click', fecharFicha);
  ficha.addEventListener('click', (e) => { if (e.target === ficha) fecharFicha(); });
  ficha.addEventListener('close', () => { if (origemFoco) origemFoco.focus(); });

  const filtros = document.querySelectorAll('.filtros button');
  filtros.forEach((b) => b.addEventListener('click', () => {
    filtros.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
    const f = b.dataset.filtro;
    document.querySelectorAll('.medico').forEach((li) => {
      const ok = f === 'todos' || li.dataset.tags.split(' ').includes(f);
      li.classList.toggle('is-fora', !ok);
      li.querySelector('.medico__btn').tabIndex = ok ? 0 : -1;
    });
  }));

  /* ---------- Monitor de exames (canvas) ---------- */
  const g = (p, c, w) => Math.exp(-Math.pow((p - c) / w, 2));
  const beat = (p) => .12 * g(p, .14, .03) - .12 * g(p, .255, .009) + 1 * g(p, .28, .011) - .28 * g(p, .305, .011) + .26 * g(p, .5, .05);
  const avanca = (s, dt, bpm) => { s.fase = ((s.fase || 0) + dt * bpm / 60) % 1; return s.fase; };
  const hh = (h) => `${String(Math.floor(h)).padStart(2, '0')}h`;

  const EXAMES = {
    ecg: {
      nome: 'Eletrocardiograma', cod: 'ECG', vel: 150,
      desc: 'Registra a atividade elétrica do coração em poucos minutos, sem dor. Avalia ritmo e frequência e costuma ser o primeiro passo da avaliação cardiológica.',
      quem: 'Realizado na clínica.', equipe: [],
      fn(dt, s) { const p = avanca(s, dt, 72); s.t = (s.t || 0) + dt; return [beat(p) * .9 + .02 * Math.sin(s.t * 1.3)]; },
      hud() { return '72<small>bpm</small>'; }
    },
    mapa: {
      nome: 'MAPA 24 horas', cod: 'MAPA', vel: 70,
      desc: 'Monitorização Ambulatorial da Pressão Arterial: um aparelho leve mede a pressão em intervalos ao longo de 24 horas, durante a sua rotina e também no sono.',
      quem: 'Laudo da Dra. Marcia Regina Pereira.', equipe: ['marcia'],
      fn(dt, s, larg) {
        s.t = (s.t || 0) + dt;
        const dur = larg / this.vel, h = (8 + (s.t % dur) / dur * 24) % 24; s.h = h;
        const alvo = h >= 7 && h < 22.5 ? 1 : 0;
        s.d = s.d === undefined ? alvo : s.d + (alvo - s.d) * Math.min(1, dt * 1.6);
        const dia = s.d;
        return [.15 + .38 * dia + .05 * Math.sin(s.t * 2.7), -.45 + .24 * dia + .04 * Math.sin(s.t * 2.1 + 1)];
      },
      hud(s) { return `${hh(s.h || 8)}<small>${(s.h >= 22.5 || s.h < 7) ? 'sono' : 'rotina'}</small>`; }
    },
    holter: {
      nome: 'Holter 24 horas', cod: 'HOLTER', vel: 330,
      desc: 'Um pequeno gravador registra todos os batimentos por 24 horas enquanto você segue a rotina. Ajuda a identificar arritmias que não aparecem numa consulta.',
      quem: 'Laudo da Dra. Ana Claudia Duarte Rodrigues.', equipe: ['ana-claudia'],
      fn(dt, s) { s.t = (s.t || 0) + dt; s.bpm = 70 + 10 * Math.sin(s.t * .35); const p = avanca(s, dt, s.bpm); return [beat(p) * .8]; },
      hud(s) { return `${hh((8 + (s.t || 0) * 1.6) % 24)}<small>gravando</small>`; }
    },
    eco: {
      nome: 'Ecocardiograma', cod: 'ECO', vel: 110,
      desc: 'Ultrassom do coração, sem radiação. Mostra câmaras, paredes e válvulas em movimento e avalia a força com que o coração bombeia.',
      quem: 'Realizado pelo Dr. Maurício Pucineli Parada e pelo Dr. Ricardo Abrão Wyse.', equipe: ['mauricio', 'ricardo-wyse'],
      fn(dt, s) {
        const p = avanca(s, dt, 66), c = g(p, .32, .13);
        const valva = .5 * g(p, .62, .035) + .3 * g(p, .84, .035);
        return [.62 - .22 * c, -.62 + .22 * c, -.08 + valva * .55];
      },
      hud() { return ''; }
    },
    doppler: {
      nome: 'Doppler de carótidas e vertebrais', cod: 'DOPPLER', vel: 120, fill: true,
      desc: 'Ultrassom das artérias do pescoço que levam sangue ao cérebro. Avalia o fluxo e a presença de placas nas carótidas e vertebrais.',
      quem: 'Realizado pelo Dr. Maurício Pucineli Parada e pelo Dr. Ricardo Abrão Wyse.', equipe: ['mauricio', 'ricardo-wyse'],
      fn(dt, s) {
        const p = avanca(s, dt, 68);
        const v = .95 * g(p, .1, .04) + .32 * g(p, .2, .06) + .22 - .1 * p;
        return [-.72 + v * 1.45];
      },
      hud() { return ''; }
    },
    ergo: {
      nome: 'Teste ergométrico em esteira', cod: 'ERGO', vel: 170,
      desc: 'O coração é avaliado durante esforço físico controlado na esteira, com eletrocardiograma e pressão acompanhados a cada estágio.',
      quem: 'Realizado pelo Dr. Ricardo Pereira da Silva e pelo Dr. Nathan de Farias Faraco.', equipe: ['ricardo-pereira', 'nathan'],
      fn(dt, s) {
        s.t = ((s.t || 0) + dt) % 15;
        s.bpm = 76 + 78 * Math.min(1, s.t / 12);
        const p = avanca(s, dt, s.bpm);
        return [beat(p) * .85];
      },
      hud(s) { return `${Math.round(s.bpm || 76)}<small>bpm · estágio ${1 + Math.min(3, Math.floor((s.t || 0) / 3.6))}</small>`; }
    }
  };

  const painel = document.getElementById('painel-exame');
  const canvas = document.querySelector('.monitor__canvas');
  const info = document.querySelector('.monitor__info');
  const abas = [...document.querySelectorAll('[role="tab"]')];
  const ctx = canvas.getContext('2d');
  const CORES = ['#9BE3CC', '#E9C7A1', '#CFEDE3'];
  let atual = 'ecg', estado = {}, x = 0, ultimo = null, W = 0, H = 0, dpr = 1, raf = 0, tAnt = 0, visivel = false, hudT = 0;

  function dimensionar() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    reiniciar();
  }
  function reiniciar() {
    ctx.clearRect(0, 0, W, H);
    estado = {}; x = 0; ultimo = null;
    if (reduz.matches) estatico();
  }
  const yPx = (v) => H / 2 - v * H * .4;

  function desenhar(dt) {
    const ex = EXAMES[atual];
    const sub = 1 / 300;
    let resto = dt;
    ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    while (resto > 0) {
      const d = Math.min(sub, resto); resto -= d;
      const ys = ex.fn(d, estado, W);
      const nx = x + ex.vel * d;
      if (nx >= W) { x = 0; ultimo = null; ctx.clearRect(0, 0, 24, H); continue; }
      ys.forEach((v, i) => {
        const py = yPx(v);
        if (ex.fill) {
          ctx.strokeStyle = 'rgba(155, 227, 204, .22)';
          ctx.lineWidth = Math.max(1, nx - x + .6);
          ctx.beginPath(); ctx.moveTo(nx, yPx(-.72)); ctx.lineTo(nx, py); ctx.stroke();
          ctx.lineWidth = 2;
        }
        if (ultimo) {
          ctx.strokeStyle = CORES[i % CORES.length];
          ctx.shadowColor = 'rgba(143, 214, 192, .6)'; ctx.shadowBlur = 6;
          ctx.beginPath(); ctx.moveTo(x, ultimo[i]); ctx.lineTo(nx, py); ctx.stroke();
          ctx.shadowBlur = 0;
        }
      });
      ultimo = ys.map(yPx);
      ctx.clearRect(nx + 2, 0, 26, H);
      x = nx;
    }
  }
  function estatico() {
    ctx.clearRect(0, 0, W, H);
    estado = {}; x = 0; ultimo = null;
    let guarda = 0;
    while (x < W - 30 && guarda++ < 20000) desenhar(1 / 120);
    ctx.clearRect(x + 2, 0, W, H);
    atualizarHud(true);
  }
  function atualizarHud(forcar) {
    const now = performance.now();
    if (!forcar && now - hudT < 250) return;
    hudT = now;
    painel.querySelector('[data-campo="valor"]').innerHTML = EXAMES[atual].hud(estado);
  }
  function quadro(now) {
    raf = 0;
    if (!visivel || document.hidden || reduz.matches) return;
    const dt = Math.min(.05, tAnt ? (now - tAnt) / 1000 : 0);
    tAnt = now;
    desenhar(dt);
    atualizarHud();
    raf = requestAnimationFrame(quadro);
  }
  function tocar() { if (!raf && visivel && !document.hidden && !reduz.matches) { tAnt = 0; raf = requestAnimationFrame(quadro); } }
  function parar() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  function selecionar(id, foco) {
    if (!EXAMES[id]) return;
    abas.forEach((a) => {
      const on = a.dataset.exame === id;
      a.setAttribute('aria-selected', String(on));
      a.tabIndex = on ? 0 : -1;
      if (on) {
        painel.setAttribute('aria-labelledby', a.id);
        if (foco === true) a.focus();
        if (foco !== 'init') { const t = a.parentElement; t.scrollTo({ left: a.offsetLeft - 16, behavior: reduz.matches ? 'auto' : 'smooth' }); }
      }
    });
    if (id === atual && foco !== 'init') return;
    atual = id;
    const ex = EXAMES[id];
    const aplicar = () => {
      painel.querySelector('[data-campo="cod"]').textContent = ex.cod;
      info.querySelector('[data-campo="nome"]').textContent = ex.nome;
      info.querySelector('[data-campo="desc"]').textContent = ex.desc;
      info.querySelector('[data-campo="quem"]').textContent = ex.quem;
      const eq = info.querySelector('[data-campo="equipe"]');
      eq.innerHTML = '';
      ex.equipe.forEach((mid) => {
        const m = medicos[mid];
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = `<img src="${m.mini}" alt="" width="34" height="34" loading="lazy"><span>${m.nome}</span>`;
        b.setAttribute('aria-haspopup', 'dialog');
        b.addEventListener('click', () => abrirFicha(mid, b));
        eq.appendChild(b);
      });
      info.querySelector('[data-wa-exame]').href = wa(`Olá! Vim pelo site e gostaria de agendar o exame: ${ex.nome}.`);
      reiniciar();
      atualizarHud(true);
      info.classList.remove('is-trocando');
    };
    if (reduz.matches || foco === 'init') aplicar();
    else { info.classList.add('is-trocando'); setTimeout(aplicar, 180); }
  }

  abas.forEach((a, i) => {
    a.addEventListener('click', () => selecionar(a.dataset.exame));
    a.addEventListener('keydown', (e) => {
      const mapa = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let j = null;
      if (e.key in mapa) j = (i + mapa[e.key] + abas.length) % abas.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = abas.length - 1;
      if (j !== null) { e.preventDefault(); selecionar(abas[j].dataset.exame, true); }
    });
  });

  if ('ResizeObserver' in window) new ResizeObserver(dimensionar).observe(canvas); else { dimensionar(); addEventListener('resize', dimensionar); }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => { visivel = en.isIntersecting; visivel ? tocar() : parar(); }).observe(canvas);
  } else { visivel = true; }
  document.addEventListener('visibilitychange', () => (document.hidden ? parar() : tocar()));
  reduz.addEventListener('change', () => { parar(); reiniciar(); tocar(); });
  selecionar('ecg', 'init');
  tocar();

  /* ---------- Formulário → WhatsApp ---------- */
  const form = document.getElementById('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const erro = document.getElementById('e-nome');
    if (nome.length < 2) {
      form.nome.setAttribute('aria-invalid', 'true');
      form.nome.setAttribute('aria-describedby', 'e-nome');
      erro.textContent = 'Informe seu nome para a recepção saber com quem fala.';
      form.nome.focus();
      return;
    }
    form.nome.removeAttribute('aria-invalid');
    erro.textContent = '';
    const texto = `Olá! Meu nome é ${nome}. Assunto: ${form.assunto.value}.` + (form.mensagem.value.trim() ? `\n${form.mensagem.value.trim()}` : '');
    window.open(wa(texto), '_blank', 'noopener');
  });
  form.nome.addEventListener('input', () => {
    if (form.nome.value.trim().length >= 2) { form.nome.removeAttribute('aria-invalid'); document.getElementById('e-nome').textContent = ''; }
  });
})();
