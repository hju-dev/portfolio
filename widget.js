// ================================
// CHAT WIDGET
// Floating toggle button + panel. Talks to POST /api/chat.
// Single-session, no history persisted across page loads.
// ================================
const chatToggle  = document.getElementById('chat-toggle');
const chatPanel    = document.getElementById('chat-panel');
const chatClose    = document.getElementById('chat-close');
const chatLog      = document.getElementById('chat-log');
const chatForm     = document.getElementById('chat-form');
const chatInput    = document.getElementById('chat-input');
const chatSubmit   = document.getElementById('chat-submit');

let chatOpened = false;


// ================================
// OPEN / CLOSE
// ================================
function openChat() {
  if (!chatPanel) return;
  chatPanel.classList.add('open');
  chatToggle.setAttribute('aria-expanded', 'true');

  if (!chatOpened) {
    // first open — greet once
    appendMessage('assistant', "Hi, I'm Henry's site assistant. Ask me about his projects, skills, or client work.");
    chatOpened = true;
  }

  chatInput.focus();
}

function closeChat() {
  if (!chatPanel) return;
  chatPanel.classList.remove('open');
  chatToggle.setAttribute('aria-expanded', 'false');
}

function toggleChat() {
  if (chatPanel.classList.contains('open')) {
    closeChat();
  } else {
    openChat();
  }
}


// ================================
// MESSAGE LOG
// ================================
function appendMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble chat-bubble-' + role;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
  return bubble;
}


// ================================
// SEND
// ================================
async function sendMessage(message) {
  chatInput.disabled = true;
  chatSubmit.disabled = true;

  appendMessage('user', message);
  const pending = appendMessage('assistant', 'Thinking…');
  pending.classList.add('chat-bubble-pending');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message }),
    });

    const data = await res.json();

    if (res.ok) {
      pending.textContent = data.answer;
    } else if (res.status === 429) {
      pending.textContent = data.message || "You've hit the question limit — try again later, or reach out via email/GitHub.";
    } else {
      pending.textContent = "Something went wrong. Try again in a moment, or reach out via email/GitHub.";
    }
  } catch (err) {
    pending.textContent = "Couldn't reach the server. Try again in a moment, or reach out via email/GitHub.";
  }

  pending.classList.remove('chat-bubble-pending');
  chatInput.disabled = false;
  chatSubmit.disabled = false;
  chatInput.focus();
}


// ================================
// INIT
// ================================
document.addEventListener('DOMContentLoaded', () => {
  if (!chatToggle || !chatPanel || !chatForm) return;

  chatToggle.addEventListener('click', toggleChat);
  chatClose.addEventListener('click', closeChat);

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = '';
    sendMessage(message);
  });
});
