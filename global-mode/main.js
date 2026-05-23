/* ─────────────────────────────────────────
   GLOBAL MODE — main.js
   ───────────────────────────────────────── */

/* ── STARS ── */
function initStars() {
  const starsEl = document.getElementById('stars');
  if (!starsEl) return;

  for (let i = 0; i < 120; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const size = Math.random() * 2.5 + 0.5;
    s.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      top: ${Math.random() * 100}%;
      left: ${Math.random() * 100}%;
      --dur: ${(Math.random() * 4 + 2).toFixed(1)}s;
      --delay: ${(Math.random() * -4).toFixed(1)}s;
      --min-op: ${(Math.random() * 0.15 + 0.05).toFixed(2)};
      --max-op: ${(Math.random() * 0.6 + 0.3).toFixed(2)};
    `;
    starsEl.appendChild(s);
  }
}


/* ── SCROLL REVEAL ── */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}


/* ── WISHLIST TOGGLE ── */
function toggleWish() {
  const btn = document.getElementById('wishBtn');
  if (!btn) return;

  if (btn.classList.contains('saved')) {
    btn.classList.remove('saved');
    btn.textContent = '+ Wanderlist';
  } else {
    btn.classList.add('saved');
    btn.textContent = '✓ Saved';
  }
}


/* ── WAITLIST SUBMIT ── */
function submitWaitlist() {
  const input   = document.getElementById('emailInput');
  const success = document.getElementById('successMsg');
  const form    = document.querySelector('.waitlist-form');
  const note    = document.querySelector('.waitlist-note');

  if (!input) return;

  const email = input.value.trim();
  const valid = email.length > 0 && email.includes('@') && email.includes('.');

  if (valid) {
    if (form)    form.style.display    = 'none';
    if (note)    note.style.display    = 'none';
    if (success) success.style.display = 'block';
  } else {
    input.classList.add('error');
    input.focus();
    setTimeout(() => input.classList.remove('error'), 1200);
  }
}


/* ── ENTER KEY ON WAITLIST ── */
function initWaitlistEnter() {
  const input = document.getElementById('emailInput');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitWaitlist();
  });
}


/* ── NAV SCROLL EFFECT ── */
function initNavScroll() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
      nav.style.background = 'rgba(10,14,26,0.97)';
    } else {
      nav.style.background = 'linear-gradient(to bottom, rgba(10,14,26,0.95), transparent)';
    }
  }, { passive: true });
}


/* ── INIT ALL ── */
document.addEventListener('DOMContentLoaded', () => {
  initStars();
  initScrollReveal();
  initWaitlistEnter();
  initNavScroll();
});

/* Expose click handlers to HTML */
window.toggleWish      = toggleWish;
window.submitWaitlist  = submitWaitlist;
