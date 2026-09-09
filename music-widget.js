// ================================
// MUSIC WIDGET
// Hidden YouTube-embedded background track with custom play/pause/mute
// controls and a simulated waveform indicator. Starts on the visitor's
// first interaction with the page -- browsers block audio-with-sound
// from autoplaying on load, no way around that. The waveform animates
// in sync with play state; it is not a real-time analysis of the
// YouTube audio (cross-origin iframe audio isn't readable via the Web
// Audio API), just a visual cue that music is playing.
// ================================
const DEFAULT_YT_VIDEO_ID = 'UGZi9v6TFm4';
const MUSIC_MUTED_KEY = 'musicMuted';
const MUSIC_PAUSED_KEY = 'musicPaused';

const musicWidget = document.getElementById('music-widget');
const musicToggle = document.getElementById('music-toggle');
const musicMute = document.getElementById('music-mute');

// Each page sets its own track via data-video-id on #music-widget;
// falls back to the default if a page forgets to set one.
const YT_VIDEO_ID = (musicWidget && musicWidget.dataset.videoId) || DEFAULT_YT_VIDEO_ID;

let ytPlayer = null;
let hasStartedOnce = false;


function storedMuted() {
  return localStorage.getItem(MUSIC_MUTED_KEY) === 'true';
}

function storedPaused() {
  return localStorage.getItem(MUSIC_PAUSED_KEY) === 'true';
}


function updateUI(playing, muted) {
  if (!musicWidget) return;
  musicWidget.classList.toggle('playing', playing);

  if (musicToggle) {
    musicToggle.textContent = playing ? '❚❚' : '▶';
    musicToggle.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  }
  if (musicMute) {
    musicMute.textContent = muted ? 'unmute' : 'mute';
    musicMute.setAttribute('aria-label', muted ? 'Unmute music' : 'Mute music');
  }
}


function startOnFirstInteraction() {
  function start() {
    if (hasStartedOnce) return;
    hasStartedOnce = true;
    if (ytPlayer && !storedPaused()) {
      ytPlayer.playVideo();
    }
    document.removeEventListener('click', start);
    document.removeEventListener('keydown', start);
    document.removeEventListener('touchstart', start);
  }

  document.addEventListener('click', start);
  document.addEventListener('keydown', start);
  document.addEventListener('touchstart', start);
}


function togglePlay() {
  if (!ytPlayer) return;
  hasStartedOnce = true; // a direct click on the button is itself the interaction gesture

  if (ytPlayer.getPlayerState() === YT.PlayerState.PLAYING) {
    ytPlayer.pauseVideo();
    localStorage.setItem(MUSIC_PAUSED_KEY, 'true');
  } else {
    ytPlayer.playVideo();
    localStorage.setItem(MUSIC_PAUSED_KEY, 'false');
  }
}


function toggleMute() {
  if (!ytPlayer) return;

  // mute()/unMute() are async (postMessage to the iframe), so isMuted()
  // read right after issuing one is unreliable -- decide the target state
  // from the pre-toggle read and trust the command we're about to send,
  // rather than re-querying immediately.
  const nowMuted = !ytPlayer.isMuted();
  if (nowMuted) {
    ytPlayer.mute();
  } else {
    ytPlayer.unMute();
  }
  localStorage.setItem(MUSIC_MUTED_KEY, String(nowMuted));
  updateUI(ytPlayer.getPlayerState() === YT.PlayerState.PLAYING, nowMuted);
}


function onPlayerReady() {
  if (storedMuted()) {
    ytPlayer.mute();
  }
  updateUI(false, storedMuted());

  if (!storedPaused()) {
    startOnFirstInteraction();
  }
}


function onPlayerStateChange(event) {
  updateUI(event.data === YT.PlayerState.PLAYING, ytPlayer.isMuted());
}


function onPlayerError() {
  // embedding disabled, video removed, etc. -- fail quietly, no broken widget
  if (musicWidget) musicWidget.style.display = 'none';
}


window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-audio-player', {
    videoId: YT_VIDEO_ID,
    width: 1,
    height: 1,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
      loop: 1,
      playlist: YT_VIDEO_ID, // YouTube requires this for loop to work on a single video
      playsinline: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  });
};


if (musicWidget) {
  if (musicToggle) musicToggle.addEventListener('click', togglePlay);
  if (musicMute) musicMute.addEventListener('click', toggleMute);

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(tag);
}
