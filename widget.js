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
const chatHint     = document.getElementById('chat-hint');
const chatHintText = document.getElementById('chat-hint-text');

let chatOpened = false;


// ================================
// HINT PILL
// Styled like the music pill. Cycles a few short prompts with a fade
// until the visitor opens the chat; clicking it opens the chat too.
// ================================
const chatHintPhrases = [
  'Ask me anything',
  'Do you have a question?',
  'What would you like to know?',
  'Curious about my work?',
  'Got a project in mind?',
];

let chatHintIndex = 0;
let chatHintTimer = null;

function cycleChatHint() {
  if (!chatHintText) return;
  chatHintText.classList.add('chat-hint-fading');
  setTimeout(() => {
    chatHintIndex = (chatHintIndex + 1) % chatHintPhrases.length;
    chatHintText.textContent = chatHintPhrases[chatHintIndex];
    chatHintText.classList.remove('chat-hint-fading');
  }, 400);
}

if (chatHintText && chatHintPhrases.length > 1) {
  chatHintTimer = setInterval(cycleChatHint, 4000);
}


// ================================
// OPEN / CLOSE
// ================================
function openChat() {
  if (!chatPanel) return;
  chatPanel.classList.add('open');
  chatToggle.setAttribute('aria-expanded', 'true');
  if (chatHint) chatHint.classList.add('chat-hint-dismissed');
  if (chatHintTimer) {
    clearInterval(chatHintTimer);
    chatHintTimer = null;
  }

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
// STREAM
// Reads the response body as it arrives and writes it into the bubble
// progressively, instead of waiting for the full answer. Falls back to a
// plain read if the browser doesn't support streaming response bodies.
// ================================
async function streamAnswerIntoBubble(res, bubble) {
  if (!res.body || !res.body.getReader) {
    bubble.textContent = await res.text();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    bubble.textContent = full;
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  if (!full) {
    bubble.textContent = "Didn't get a response. Try again in a moment, or reach out via email/GitHub.";
    bubble.classList.add('chat-bubble-error');
  }
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

    if (res.ok) {
      await streamAnswerIntoBubble(res, pending);
    } else {
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        pending.textContent = data.message || "You've hit the question limit — try again later, or reach out via email/GitHub.";
      } else {
        pending.textContent = "Something went wrong. Try again in a moment, or reach out via email/GitHub.";
      }
      pending.classList.add('chat-bubble-error');
    }
  } catch (err) {
    pending.textContent = "Couldn't reach the server. Try again in a moment, or reach out via email/GitHub.";
    pending.classList.add('chat-bubble-error');
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
  if (chatHint) chatHint.addEventListener('click', openChat);

  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;
    chatInput.value = '';
    sendMessage(message);
  });
});
