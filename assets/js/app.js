const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function wa(settings, product = '') {
  const text = product
    ? `שלום טל, ראיתי באתר את הפריט "${product}" ואשמח לקבל פרטים.`
    : `שלום טל, הגעתי דרך האתר ואשמח לקבל פרטים.`;
  return `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`;
}

function qr(url) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;
}

function mediaSrc(path = '') {
  // Encode spaces, ampersands and Hebrew in file names, but keep folder slashes.
  return String(path || '').split('/').map(encodeURIComponent).join('/');
}

function isVideo(path = '') {
  return /\.(mp4|webm|mov)$/i.test(path);
}

function videoType(path = '') {
  if (/\.webm$/i.test(path)) return 'video/webm';
  if (/\.mov$/i.test(path)) return 'video/quicktime';
  return 'video/mp4';
}

function mediaHtml(path, alt = '', className = '') {
  if (!path) return '';
  const src = mediaSrc(path);
  const safeAlt = String(alt || '').replace(/"/g, '&quot;');
  if (isVideo(path)) {
    return `<video class="${className}" controls playsinline preload="metadata"><source src="${src}" type="${videoType(path)}">הדפדפן שלך לא תומך בהצגת וידאו.</video>`;
  }
  return `<img class="${className}" src="${src}" alt="${safeAlt}" loading="lazy">`;
}

function bindMediaErrors(root = document) {
  $$('img, video', root).forEach(el => {
    el.addEventListener('error', () => {
      const card = el.closest('.about-media-card,.product-card,.cat-card');
      if (card) card.classList.add('media-error');
    });
  });
}

function setupMobileMenu() {
  const headerInner = $('.header-inner');
  const nav = $('.nav');
  if (!headerInner || !nav || $('.menu-toggle')) return;
  const btn = document.createElement('button');
  btn.className = 'menu-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'פתיחת תפריט');
  btn.innerHTML = '<span></span><span></span><span></span>';
  headerInner.appendChild(btn);
  btn.addEventListener('click', () => {
    nav.classList.toggle('open');
    btn.classList.toggle('open');
  });
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) {
      nav.classList.remove('open');
      btn.classList.remove('open');
    }
  });
}

async function init() {
  setupMobileMenu();
  const d = await fetch('content/site.json', { cache: 'no-cache' }).then(r => r.json());

  document.title = `${d.settings.businessName} | ${d.settings.subtitle}`;
  $('#logoTitle').textContent = d.settings.businessName;
  $('#logoSub').textContent = d.settings.subtitle;
  if (d.settings.logo) $('#logoImg').src = mediaSrc(d.settings.logo);
  $('#heroEyebrow').textContent = d.settings.slogan;
  $('#heroTitle').textContent = d.settings.businessName;
  $('#heroText').textContent = d.heroSlides?.[0]?.text || d.settings.subtitle;
  $('#ctaWhats').href = wa(d.settings);

  const hero = $('#heroSlides');
  (d.heroSlides || []).forEach((s, i) => {
    const div = document.createElement('div');
    div.className = 'hero-slide' + (i === 0 ? ' active' : '');
    div.innerHTML = mediaHtml(s.image, s.title);
    hero.appendChild(div);
  });

  let idx = 0;
  setInterval(() => {
    const slides = $$('.hero-slide');
    if (!slides.length) return;
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
    $('#heroText').textContent = d.heroSlides[idx].text || d.settings.slogan;
  }, 4500);

  d.categories.forEach(c => {
    const a = document.createElement('a');
    a.className = 'card cat-card';
    a.href = `#cat-${c.id}`;
    a.innerHTML = `${mediaHtml(c.cover, c.name, 'cat-media')}<div class="overlay"><strong>${c.name}</strong><span>${c.intro}</span></div>`;
    $('#categoriesGrid').appendChild(a);
  });

  $('#aboutTitle').textContent = d.about.title;
  $('#aboutText').textContent = d.about.text;
  const aboutMedia = [];
  [...(d.about.gallery || []), ...(d.about.videos || [])].forEach(path => {
    if (path && !aboutMedia.includes(path)) aboutMedia.push(path);
  });
  aboutMedia.forEach(path => {
    const wrap = document.createElement('div');
    wrap.className = 'about-media-card';
    wrap.innerHTML = mediaHtml(path, 'אודות טל עברי');
    $('#aboutGallery').appendChild(wrap);
  });

  d.categories.forEach(c => {
    const sec = document.createElement('section');
    sec.className = 'product-section';
    sec.id = `cat-${c.id}`;
    sec.innerHTML = `<div class="container"><div class="section-head"><div><span class="eyebrow">גלריה</span><h2>${c.name}</h2></div><p>${c.intro}</p></div><div class="grid product-grid"></div></div>`;
    const grid = $('.product-grid', sec);

    (c.products || []).forEach(p => {
      const card = document.createElement('article');
      card.className = 'card product-card';
      const mainMedia = p.video || p.image;
      card.innerHTML = `${mediaHtml(mainMedia, p.name, 'product-media')}<div class="body"><h3>${p.name}</h3><span class="price">${p.price || ''}</span><p>${p.description || ''}</p><a class="btn whatsapp" href="${wa(d.settings, p.name)}" target="_blank">שלח הודעה על הפריט הזה</a></div>`;
      grid.appendChild(card);
    });

    (c.gallery || []).forEach((path, i) => {
      const card = document.createElement('article');
      card.className = 'card product-card gallery-only';
      card.innerHTML = mediaHtml(path, `${c.name} ${i + 1}`, 'product-media');
      grid.appendChild(card);
    });

    $('#catSections').appendChild(sec);
  });

  (d.exhibitions || []).filter(e => e.active).forEach(e => {
    const card = document.createElement('article');
    card.className = 'card product-card';
    card.innerHTML = `${mediaHtml(e.video || e.image, e.title, 'product-media')}<div class="body"><span class="badge">${e.date}</span><h3>${e.title}</h3><p>${e.location}</p><p>${e.description}</p></div>`;
    $('#exhibitionsGrid').appendChild(card);
  });

  (d.testimonials || []).forEach(t => {
    const card = document.createElement('article');
    card.className = 'card testimonial';
    card.innerHTML = `<h3>${t.name}</h3><p class="stars">${'★'.repeat(Number(t.rating) || 5)}</p><p>${t.text}</p>`;
    $('#testimonialsGrid').appendChild(card);
  });

  $('#phone').textContent = d.settings.phone;
  $('#email').textContent = d.settings.email;
  $('#location').textContent = d.settings.location;
  $('#footerWhats').href = wa(d.settings);
  $('#instaLink').href = d.settings.instagram;
  $('#facebookLink').href = d.settings.facebook;
  $('#instaQr').src = qr(d.settings.instagram);
  $('#facebookQr').src = qr(d.settings.facebook);

  bindMediaErrors(document);
}

init();
