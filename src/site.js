document.getElementById('yr').textContent = new Date().getFullYear();

  // Orphan control fallback: bind the last two words of each text block with a non-breaking space
  document.querySelectorAll('h1,h2,h3,h4,p,.lead,.quote-card .q,.panel-intro,.open-tag').forEach(el => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last = null, n;
    while ((n = walker.nextNode())) if (n.nodeValue.trim()) last = n;
    if (!last) return;
    const words = el.textContent.trim().split(/\s+/);
    if (words.length < 4) return;
    last.nodeValue = last.nodeValue.replace(/\s+(\S+\s*)$/, ' $1');
  });

  // Header state
  const header = document.querySelector('header');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // Mobile menu
  const menuBtn = document.querySelector('.menu-btn');
  const links = document.getElementById('nav-links');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    header.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open);
  });
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open'); header.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', false);
  }));

  // Tabs
  const tabs = document.querySelectorAll('.tab');
  const selectTab = (id) => {
    tabs.forEach(t => {
      const on = t.id === 't-' + id;
      t.setAttribute('aria-selected', on);
      document.getElementById(t.getAttribute('aria-controls')).classList.toggle('active', on);
    });
  };
  tabs.forEach(t => t.addEventListener('click', () => selectTab(t.id.replace('t-',''))));
  // Links like #tab-filters open that resource tab and scroll to Resources
  document.querySelectorAll('a[href^="#tab-"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    selectTab(a.getAttribute('href').slice(5));
    document.getElementById('resources').scrollIntoView({ behavior: 'smooth' });
  }));

  // Custom HLS player for Jim's Story
  (() => {
    const playerEl = document.getElementById('player');
    if (!playerEl) return;
    const HLS_SRC = playerEl.dataset.hls || '';
    const FALLBACK_EMBED = `https://player.vimeo.com/video/${playerEl.dataset.vimeo}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
    const HLS_LIB = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';

    const player = document.getElementById('player');
    const vid = document.getElementById('vid');
    const cover = document.getElementById('cover');
    const btnPlay = document.getElementById('btn-play');
    const btnMute = document.getElementById('btn-mute');
    const btnFs = document.getElementById('btn-fs');
    const scrub = document.getElementById('scrub');
    const fill = document.getElementById('scrub-fill');
    const buf = document.getElementById('scrub-buf');
    const tCur = document.getElementById('t-cur');
    const tDur = document.getElementById('t-dur');
    let started = false, hls = null, hideTimer = null;

    const setState = s => player.dataset.state = s;
    const fmt = s => {
      if (!isFinite(s)) return '0:00';
      s = Math.floor(s);
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = String(s % 60).padStart(2, '0');
      return h ? `${h}:${String(m).padStart(2,'0')}:${sec}` : `${m}:${sec}`;
    };

    // If the stream can't load, fall back to the standard Vimeo embed
    const fallback = () => {
      if (hls) { hls.destroy(); hls = null; }
      player.innerHTML = `<iframe src="${FALLBACK_EMBED}" title="${playerEl.dataset.title || 'Video'}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
      player.dataset.state = 'embed';
    };

    const loadScript = src => new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });

    const start = async () => {
      if (started) return togglePlay();
      started = true;
      if (!HLS_SRC) return fallback();
      setState('loading');
      try {
        if (vid.canPlayType('application/vnd.apple.mpegurl')) {
          vid.src = HLS_SRC; // Safari / iOS native HLS
        } else {
          await loadScript(HLS_LIB);
          if (!window.Hls || !Hls.isSupported()) return fallback();
          hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1 });
          hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) fallback(); });
          hls.loadSource(HLS_SRC);
          hls.attachMedia(vid);
        }
        vid.addEventListener('error', fallback, { once: true });
        await vid.play();
      } catch (e) {
        if (e && e.name === 'NotAllowedError') setState('paused'); else fallback();
      }
    };

    const togglePlay = () => vid.paused ? vid.play() : vid.pause();

    cover.addEventListener('click', start);
    btnPlay.addEventListener('click', togglePlay);
    vid.addEventListener('click', togglePlay);

    vid.addEventListener('playing', () => { setState('playing'); btnPlay.setAttribute('aria-label', 'Pause'); pokeUI(); });
    vid.addEventListener('pause', () => { if (started) setState('paused'); btnPlay.setAttribute('aria-label', 'Play'); });
    vid.addEventListener('waiting', () => setState('loading'));
    vid.addEventListener('ended', () => { setState('paused'); });
    vid.addEventListener('loadedmetadata', () => tDur.textContent = fmt(vid.duration));
    vid.addEventListener('timeupdate', () => {
      const p = vid.duration ? (vid.currentTime / vid.duration) * 100 : 0;
      fill.style.width = p + '%';
      tCur.textContent = fmt(vid.currentTime);
      scrub.setAttribute('aria-valuenow', Math.round(p));
    });
    vid.addEventListener('progress', () => {
      if (vid.buffered.length && vid.duration) buf.style.width = (vid.buffered.end(vid.buffered.length - 1) / vid.duration) * 100 + '%';
    });

    // Mute
    btnMute.addEventListener('click', () => {
      vid.muted = !vid.muted;
      player.classList.toggle('muted', vid.muted);
      btnMute.setAttribute('aria-label', vid.muted ? 'Unmute' : 'Mute');
    });

    // Fullscreen (iOS uses the native video fullscreen)
    btnFs.addEventListener('click', () => {
      if (document.fullscreenElement) return document.exitFullscreen();
      if (player.requestFullscreen) player.requestFullscreen();
      else if (vid.webkitEnterFullscreen) vid.webkitEnterFullscreen();
    });
    vid.addEventListener('dblclick', () => btnFs.click());

    // Scrubbing
    const seekTo = x => {
      const r = scrub.getBoundingClientRect();
      const p = Math.min(Math.max((x - r.left) / r.width, 0), 1);
      if (vid.duration) vid.currentTime = p * vid.duration;
    };
    scrub.addEventListener('pointerdown', e => {
      scrub.classList.add('dragging'); scrub.setPointerCapture(e.pointerId); seekTo(e.clientX);
    });
    scrub.addEventListener('pointermove', e => { if (scrub.classList.contains('dragging')) seekTo(e.clientX); });
    scrub.addEventListener('pointerup', () => scrub.classList.remove('dragging'));
    scrub.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { vid.currentTime += 5; e.preventDefault(); }
      if (e.key === 'ArrowLeft') { vid.currentTime -= 5; e.preventDefault(); }
    });

    // Keyboard shortcuts when the player has focus
    player.addEventListener('keydown', e => {
      if (!started || e.target === scrub) return;
      if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
      if (e.key === 'm') btnMute.click();
      if (e.key === 'f') btnFs.click();
    });

    // Auto-hide controls while playing
    const pokeUI = () => {
      player.classList.add('show-ui'); player.classList.remove('no-cursor');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        if (!vid.paused) { player.classList.remove('show-ui'); player.classList.add('no-cursor'); }
      }, 2500);
    };
    ['pointermove', 'touchstart'].forEach(ev => player.addEventListener(ev, pokeUI, { passive: true }));
  })();

  // Reveal on scroll
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold:.12});
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
