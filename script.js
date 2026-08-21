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
