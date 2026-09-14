// ================================
// YEAR — auto-updates the footer
// ================================
document.getElementById('year').textContent = new Date().getFullYear();


// ================================
// SCROLL ANIMATIONS
// Watches for sections entering the viewport
// and adds the 'visible' class to fade them in
// ================================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));


// ================================
// TYPING ANIMATION
// Cycles through terminal commands
// in the hero section
// ================================
const phrases = [
  'python main.py',
  'pip install langchain',
  'git push origin main',
  'node server.js',
  'cd raeng',
  'cd global-mode'
];

let phraseIndex = 0;
let charIndex   = 0;
let isDeleting  = false;

const typingEl = document.getElementById('typing-cmd');
// only present on the hero terminal (home page) -- other pages skip this entirely

function type() {
  const currentPhrase = phrases[phraseIndex];

  if (!isDeleting) {
    // typing forward
    charIndex++;
    typingEl.textContent = currentPhrase.slice(0, charIndex);

    if (charIndex === currentPhrase.length) {
      // finished typing — pause, then start deleting
      isDeleting = true;
      setTimeout(type, 1800);
      return;
    }
  } else {
    // deleting
    charIndex--;
    typingEl.textContent = currentPhrase.slice(0, charIndex);

    if (charIndex === 0) {
      // finished deleting — move to next phrase
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
    }
  }

  setTimeout(type, isDeleting ? 60 : 110);
}

if (typingEl) {
  type();
}


// ================================
// MOBILE NAV TOGGLE
// Hamburger menu shown below the 900px
// desktop breakpoint (see style.css)
// ================================
const navToggle = document.getElementById('nav-toggle');
const navLinks   = document.getElementById('nav-links');

if (navToggle && navLinks) {
  const closeMenu = () => {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
    navLinks.classList.remove('is-open');
  };

  const openMenu = () => {
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Close menu');
    navLinks.classList.add('is-open');
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // tapping a link should close the dropdown, not leave it open
  // behind the page you just navigated to
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') closeMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // reset state if the viewport grows back past the desktop
  // breakpoint while the menu happens to be open
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) closeMenu();
  });
}
