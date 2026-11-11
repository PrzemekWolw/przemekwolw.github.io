(async function () {
  'use strict';

  const response = await fetch('./content.json');
  if (!response.ok) return;
  const site = await response.json();

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function link(url, text, className) {
    const a = el('a', className, text);
    if (!url) return a;
    a.href = url;
    if (/^https?:/i.test(url)) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    return a;
  }

  function sheetArticle(item) {
    const article = el('article', 'sheet');
    article.setAttribute('data-reveal', '');
    const figure = link(item.url, null, 'sheet-figure');
    figure.setAttribute('data-cycle', '');
    (item.images || []).forEach((src) => {
      const slide = el('div', 'slide cycle-face');
      const img = el('img');
      img.src = src;
      img.alt = item.alt || '';
      slide.appendChild(img);
      figure.appendChild(slide);
    });
    if (item.caption) figure.appendChild(el('span', 'fig-cap', item.caption));
    article.appendChild(figure);

    const copy = el('div', 'sheet-copy');
    if (item.kicker) copy.appendChild(el('p', 'sheet-kicker', item.kicker));
    copy.appendChild(el('h3', null, item.title || ''));
    if (item.text) copy.appendChild(el('p', null, item.text));

    if (item.meta && item.meta.length) {
      const dl = el('dl', 'meta');
      item.meta.forEach((row) => {
        const wrap = el('div');
        wrap.appendChild(el('dt', null, row.label || ''));
        const dd = el('dd');
        dd.appendChild(row.url ? link(row.url, row.value || row.url) : document.createTextNode(row.value || ''));
        wrap.appendChild(dd);
        dl.appendChild(wrap);
      });
      copy.appendChild(dl);
    }

    if (item.repos && item.repos.length) {
      const list = el('ul', 'repo-index');
      item.repos.forEach((repo) => {
        const li = el('li');
        li.appendChild(link(repo.url, repo.name || ''));
        if (repo.note) li.appendChild(el('span', null, repo.note));
        list.appendChild(li);
      });
      copy.appendChild(list);
    }

    article.appendChild(copy);
    return article;
  }

  const theme = site.theme || {};
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function themeMode() {
    let mode = null;
    try { mode = localStorage.getItem('theme'); } catch (e) {}
    if (mode !== 'dark' && mode !== 'light') mode = theme.mode;
    if (mode !== 'dark' && mode !== 'light') mode = systemDark.matches ? 'dark' : 'light';
    return mode;
  }

  function applyTheme(mode) {
    root.setAttribute('data-theme', mode);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.firstChild.className = mode === 'dark' ? 'fa-regular fa-sun' : 'fa-regular fa-moon';
      toggle.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
    }
  }

  if (theme.accent) {
    root.style.setProperty('--accent', theme.accent);
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) icon.href = icon.href.replace(/%23[0-9a-f]{6}/i, encodeURIComponent(theme.accent));
  }
  applyTheme(themeMode());
  systemDark.addEventListener('change', () => applyTheme(themeMode()));

  function build() {
    document.title = site.title || document.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && site.description) desc.setAttribute('content', site.description);

    const header = document.getElementById('topnav');
    const heroId = (site.hero && site.hero.id) || 'hello';
    header.appendChild(link('#' + heroId, site.mark || 'C/K', 'nav-mark'));
    const nav = el('nav', 'nav-links');
    nav.setAttribute('aria-label', 'Sections');
    (site.sections || []).forEach((section) => {
      const a = link('#' + section.id, section.title || section.id);
      a.setAttribute('data-nav', section.id);
      nav.appendChild(a);
    });
    const toggle = el('button', 'theme-toggle');
    toggle.type = 'button';
    toggle.appendChild(el('i'));
    toggle.firstChild.setAttribute('aria-hidden', 'true');
    toggle.addEventListener('click', () => {
      const mode = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', mode); } catch (e) {}
      applyTheme(mode);
    });
    nav.appendChild(toggle);
    header.appendChild(nav);

    const main = document.getElementById('page');
    const hero = site.hero || {};
    const heroSection = el('section', 'hero');
    heroSection.id = heroId;
    const media = el('div', 'hero-media');
    const video = el('video');
    video.className = 'hero-video';
    video.id = 'hero-video';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    if (hero.video) {
      const source = el('source');
      source.src = hero.video;
      source.type = /\.webm$/i.test(hero.video) ? 'video/webm' : 'video/mp4';
      video.appendChild(source);
    }
    media.appendChild(video);
    media.appendChild(el('div', 'hero-shade'));
    heroSection.appendChild(media);
    const copy = el('div', 'hero-copy');
    copy.id = 'hero-copy';
    const name = el('h1', 'hero-name');
    name.id = 'hero-name';
    name.appendChild(el('span', null, hero.name || ''));
    copy.appendChild(name);
    if (hero.hello) copy.appendChild(el('p', 'hero-hello', hero.hello));
    if (hero.roles) copy.appendChild(el('p', 'hero-roles', hero.roles));
    if (hero.place) copy.appendChild(el('p', 'hero-place', hero.place));
    heroSection.appendChild(copy);
    main.appendChild(heroSection);

    (site.sections || []).forEach((section) => {
      const band = el('section', section.links ? 'band contact' : 'band');
      band.id = section.id;
      if (section.background) {
        const bg = el('div', 'band-bg');
        bg.setAttribute('data-parallax', '0.35');
        bg.style.setProperty('--bg-img', 'url("' + String(section.background).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")');
        band.appendChild(bg);
      }
      const head = el('div', 'band-head');
      const word = el('h2', 'pano-word', section.title || section.id);
      word.setAttribute('data-pano', '');
      head.appendChild(word);
      band.appendChild(head);

      if (section.blocks) {
        const body = el('div', 'band-body prose');
        body.setAttribute('data-reveal', '');
        section.blocks.forEach((block) => {
          if (block.heading) body.appendChild(el('h3', 'subhead', block.heading));
          else if (block.lead) body.appendChild(el('p', 'lead', block.lead));
          else if (block.text) body.appendChild(el('p', null, block.text));
        });
        band.appendChild(body);
      }

      if (section.sheets) {
        const wrap = section.sheets.length > 1 ? el('div', 'sheets') : null;
        section.sheets.forEach((item) => {
          const article = sheetArticle(item);
          (wrap || band).appendChild(article);
        });
        if (wrap) band.appendChild(wrap);
      }

      if (section.tools) {
        const row = el('div', 'tool-row');
        section.tools.forEach((tool) => {
          const className = 'tool-block tile-' + (tool.size || 'medium') + (tool.color ? ' tool-' + tool.color : '');
          const card = tool.url ? link(tool.url, null, className) : el('article', className);
          card.setAttribute('data-reveal', '');
          card.setAttribute('data-cycle', '');
          const front = el('div', 'tile-face cycle-face');
          if (tool.icon) {
            const icon = el('i', tool.icon);
            icon.setAttribute('aria-hidden', 'true');
            front.appendChild(icon);
          }
          card.appendChild(front);
          (tool.images || []).forEach((src) => {
            const face = el('div', 'tile-face tile-image cycle-face');
            face.style.backgroundImage = 'url("' + String(src).replace(/"/g, '\\"') + '")';
            card.appendChild(face);
          });
          if (tool.text) {
            const face = el('div', 'tile-face tile-text cycle-face');
            face.appendChild(el('p', null, tool.text));
            card.appendChild(face);
          }
          card.appendChild(el('h3', 'tile-name', tool.title || ''));
          if (tool.text) card.title = tool.text;
          row.appendChild(card);
        });
        band.appendChild(row);
      }

      if (section.links) {
        const list = el('ul', 'contact-links');
        section.links.forEach((item) => {
          const li = el('li');
          li.setAttribute('data-reveal', '');
          li.appendChild(link(item.url, item.label || ''));
          list.appendChild(li);
        });
        band.appendChild(list);
      }

      main.appendChild(band);
    });

    const footer = document.getElementById('footer');
    const foot = site.footer || {};
    const rights = el('p');
    rights.appendChild(document.createTextNode('© '));
    rights.appendChild(el('span', null, String(new Date().getFullYear())));
    rights.lastChild.id = 'current-year';
    rights.appendChild(document.createTextNode(' ' + (foot.name || '') + '. All rights reserved.'));
    footer.appendChild(rights);
    const host = el('p');
    host.appendChild(document.createTextNode('Hosted on '));
    host.appendChild(link(foot.hostUrl, foot.host || 'GitHub Pages'));
    footer.appendChild(host);
  }

  build();
  applyTheme(root.getAttribute('data-theme'));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = 'cubic-bezier(0.1, 0.9, 0.2, 1)';

  const year = document.getElementById('current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  const video = document.getElementById('hero-video');
  if (video) {
    const show = () => video.classList.add('is-in');
    if (video.readyState >= 2) show();
    else video.addEventListener('loadeddata', show, { once: true });
    setTimeout(show, 400);
  }

  const name = document.querySelector('.hero-name span');
  if (name && !reduce && name.animate) {
    name.animate(
      [
        { transform: 'translateX(64px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ],
      { duration: 700, easing: ease, fill: 'forwards', delay: 120 }
    );
  } else if (name) {
    name.style.opacity = '1';
    name.style.transform = 'none';
  }

  function slideIn(nodes, delay, step) {
    if (reduce || !document.body.animate) return;
    nodes.forEach((node, i) => {
      node.animate(
        [
          { opacity: 0, transform: 'translateX(32px)' },
          { transform: 'translateX(0)' }
        ],
        { duration: 600, easing: ease, fill: 'backwards', delay: delay + i * step }
      );
    });
  }

  slideIn(Array.from(document.querySelectorAll('.hero-copy > p')), 300, 90);
  slideIn(Array.from(document.querySelectorAll('.nav-links a')), 200, 50);

  function settle(anim, node, props) {
    anim.onfinish = () => {
      Object.keys(props).forEach((key) => { node.style[key] = props[key]; });
      anim.cancel();
    };
  }

  const reveals = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => { el.style.opacity = '1'; });
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = el.parentElement
          ? Array.from(el.parentElement.querySelectorAll(':scope > [data-reveal]'))
          : [el];
        const index = Math.max(0, siblings.indexOf(el));
        if (el.animate) {
          if (el.classList.contains('tool-block')) {
            const r = el.getBoundingClientRect();
            const origin = -(40 + r.left) + 'px ' + (window.innerHeight / 2 - r.top) + 'px';
            const delay = index * 50;
            el.animate(
              [
                { transformOrigin: origin, transform: 'perspective(600px) rotateY(80deg)' },
                { transformOrigin: origin, transform: 'perspective(600px) rotateY(0)' }
              ],
              { duration: 300, easing: 'cubic-bezier(0.01, 0.975, 0.4775, 0.9775)', fill: 'backwards', delay }
            );
            settle(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'cubic-bezier(0, 2, 0, 2)', fill: 'forwards', delay }), el, { opacity: '1' });
          } else {
            const delay = index * 60;
            el.animate(
              [{ transform: 'translateX(40px)' }, { transform: 'translateX(0)' }],
              { duration: 550, easing: ease, fill: 'backwards', delay }
            );
            settle(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 170, fill: 'forwards', delay }), el, { opacity: '1' });
          }
        }
        el.querySelectorAll('.sheet-figure img').forEach((img) => {
          if (!img.animate) return;
          const anim = img.animate(
            [
              { clipPath: 'inset(0 100% 0 0)' },
              { clipPath: 'inset(0 0 0 0)' }
            ],
            { duration: 800, easing: ease, fill: 'forwards' }
          );
          settle(anim, img, {});
        });
        io.unobserve(el);
      });
    }, { threshold: 0.18 });
    reveals.forEach((el) => io.observe(el));
  }

  function glide(face, from, to) {
    const anim = face.animate(
      [
        { transform: 'translateY(' + from + ')' },
        { transform: 'translateY(' + to + ')' }
      ],
      { duration: 900, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' }
    );
    anim.onfinish = () => {
      face.style.transform = 'translateY(' + to + ')';
      anim.cancel();
    };
  }

  document.querySelectorAll('[data-cycle]').forEach((host) => {
    const faces = Array.from(host.querySelectorAll(':scope > .cycle-face'));
    const park = 'calc(100% + 2px)';
    faces.slice(1).forEach((face) => { face.style.transform = 'translateY(' + park + ')'; });
    if (faces.length < 2 || reduce || !host.animate) return;
    const isTile = host.classList.contains('tool-block');
    let index = 0;
    const step = () => {
      const current = faces[index];
      index = (index + 1) % faces.length;
      const next = faces[index];
      next.style.zIndex = '1';
      glide(next, park, '0px');
      setTimeout(() => {
        current.style.transform = 'translateY(' + park + ')';
        next.style.zIndex = '';
      }, 900);
      const hold = isTile ? (index === 0 ? 5000 : 3000) + Math.random() * 3000 : 4000 + Math.random() * 2000;
      setTimeout(step, hold);
    };
    setTimeout(step, 2500 + Math.random() * 5000);
  });

  document.querySelectorAll('.tool-block, .sheet-figure, .nav-links a, .nav-mark').forEach((node) => { node.draggable = false; });

  if (!reduce) {
    document.querySelectorAll('.tool-block, .sheet-figure, .contact-links a').forEach((node) => {
      const tile = node.classList.contains('tool-block');
      node.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        if (!tile) { node.style.transform = 'scale(0.975)'; return; }
        const r = node.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        node.style.transform = 'perspective(800px) rotateX(' + (-y * 10).toFixed(2) + 'deg) rotateY(' + (x * 10).toFixed(2) + 'deg) scale(0.94)';
      });
      const release = () => { node.style.transform = ''; };
      ['pointerup', 'pointerleave', 'pointercancel'].forEach((type) => node.addEventListener(type, release));
    });
  }

  const sections = Array.from(document.querySelectorAll('#page > section'));
  const links = document.querySelectorAll('[data-nav]');

  let currentIndex = 0;
  const topnav = document.getElementById('topnav');
  const nextButton = el('button', 'next-page');
  nextButton.type = 'button';
  nextButton.setAttribute('aria-label', 'Next section');
  const nextIcon = el('i', 'fa-solid fa-arrow-down');
  nextIcon.setAttribute('aria-hidden', 'true');
  nextButton.appendChild(nextIcon);
  document.body.appendChild(nextButton);

  function setActive() {
    const mark = window.scrollY + window.innerHeight * 0.35;
    const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    currentIndex = 0;
    sections.forEach((section, i) => {
      if (section.offsetTop <= mark) currentIndex = i;
    });
    if (atEnd) currentIndex = sections.length - 1;
    const current = sections[currentIndex];
    links.forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('data-nav') === current.id);
    });
    topnav.classList.toggle('on-hero', window.scrollY < sections[0].offsetHeight - 60);
    const last = currentIndex === sections.length - 1;
    nextButton.classList.toggle('is-up', last);
    nextButton.setAttribute('aria-label', last ? 'Back to top' : 'Next section');
  }

  nextButton.addEventListener('click', () => {
    const target = sections[currentIndex + 1] || sections[0];
    const behavior = reduce ? 'auto' : 'smooth';
    if (target === sections[0]) window.scrollTo({ top: 0, behavior });
    else target.scrollIntoView({ behavior });
    if (reduce || !target.animate) return;
    const parts = target === sections[0]
      ? [target.querySelector('.hero-copy')]
      : [target.querySelector('.band-head')];
    parts.forEach((part) => {
      if (!part) return;
      part.animate(
        [
          { opacity: 0, transform: 'translateX(120px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ],
        { duration: 700, easing: ease, fill: 'backwards', delay: 220 }
      );
    });
  });

  const layers = document.querySelectorAll('[data-parallax]');
  const panos = document.querySelectorAll('[data-pano]');
  const heroMedia = document.querySelector('.hero-media');
  let ticking = false;

  function render() {
    ticking = false;
    if (reduce) return;
    const vh = window.innerHeight || 1;

    layers.forEach((layer) => {
      const rect = layer.parentElement.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      const speed = parseFloat(layer.getAttribute('data-parallax')) || 0.3;
      const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
      layer.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });

    panos.forEach((word) => {
      const top = word.getBoundingClientRect().top;
      if (top < -vh || top > vh * 1.5) return;
      word.style.transform = 'translate3d(' + (top * 0.2).toFixed(1) + 'px,0,0)';
    });

    const y = window.scrollY;
    if (heroMedia && y < vh * 1.2) {
      heroMedia.style.transform = 'translate3d(0,' + (y * 0.45).toFixed(1) + 'px,0)';
    }
  }

  function onScroll() {
    setActive();
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(render);
    }
  }

  setActive();
  render();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();
