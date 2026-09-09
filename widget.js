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
// Styled like the music pill. Types/deletes a few short prompts like
// the hero terminal's typing animation, until the visitor opens the
// chat; clicking the pill opens the chat too.
// ================================
const chatHintPhrases = [
  'ask me anything...',
  "what's up?",
  'questions?',
  'check this out...',
  'hey! over here!',
];

let chatHintPhraseIndex = 0;
let chatHintCharIndex   = 0;
let chatHintDeleting    = false;
let chatHintActive      = true;
let chatHintTimer       = null;

function typeChatHint() {
  if (!chatHintText || !chatHintActive) return;
  const current = chatHintPhrases[chatHintPhraseIndex];

  if (!chatHintDeleting) {
    chatHintCharIndex++;
    chatHintText.textContent = current.slice(0, chatHintCharIndex);

    if (chatHintCharIndex === current.length) {
      chatHintDeleting = true;
      chatHintTimer = setTimeout(typeChatHint, 1800);
      return;
    }
  } else {
    chatHintCharIndex--;
    chatHintText.textContent = current.slice(0, chatHintCharIndex);

    if (chatHintCharIndex === 0) {
      chatHintDeleting = false;
      chatHintPhraseIndex = (chatHintPhraseIndex + 1) % chatHintPhrases.length;
    }
  }

  chatHintTimer = setTimeout(typeChatHint, chatHintDeleting ? 45 : 90);
}

if (chatHintText) {
  // start once the pill has faded into view (matches its CSS entrance delay)
  chatHintTimer = setTimeout(typeChatHint, 2000);
}


// ================================
// OPEN / CLOSE
// ================================
function openChat() {
  if (!chatPanel) return;
  chatPanel.classList.add('open');
  chatToggle.setAttribute('aria-expanded', 'true');
  if (chatHint) chatHint.classList.add('chat-hint-dismissed');
  chatHintActive = false;
  if (chatHintTimer) {
    clearTimeout(chatHintTimer);
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
