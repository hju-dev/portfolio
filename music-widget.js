// ================================
// MUSIC WIDGET
// Hidden YouTube-embedded background track with custom play/pause/mute
// controls, a soundscape picker, and a simulated waveform indicator.
// Starts on the visitor's first interaction with the page -- browsers
// block audio-with-sound from autoplaying on load, no way around that.
// The waveform animates in sync with play state; it is not a real-time
// analysis of the YouTube audio (cross-origin iframe audio isn't
// readable via the Web Audio API), just a visual cue that music is
// playing.
// ================================
const DEFAULT_YT_VIDEO_ID = 'UGZi9v6TFm4';
const MUSIC_MUTED_KEY = 'musicMuted';
const MUSIC_PAUSED_KEY = 'musicPaused';
const MUSIC_TRACK_KEY = 'musicTrackId';

// The full soundscape catalog, selectable from the dropdown on every
// page regardless of that page's own default track below.
const TRACKS = [
  { id: 'UGZi9v6TFm4', name: 'plaza' },
  { id: 'oxz0XHd8Rfw', name: 'pyramid' },
  { id: 'yw4WXw9kiDg', name: 'rogue' },
  { id: 'kzL0dEQzfz4', name: 'depths' },
  { id: '9y7989LAITY', name: 'rain' },
];

const musicWidget = document.getElementById('music-widget');
const musicToggle = document.getElementById('music-toggle');
const musicMute = document.getElementById('music-mute');
const musicTrackToggle = document.getElementById('music-track-toggle');
const musicTrackMenu = document.getElementById('music-track-menu');
const musicTrackOptions = document.querySelectorAll('.music-track-option');

let ytPlayer = null;
let hasStartedOnce = false;

// A track picked from the dropdown persists across page loads; a page's
// own data-video-id is only the fallback for a first-ever visit.
const storedTrackId = localStorage.getItem(MUSIC_TRACK_KEY);
const isKnownTrack = TRACKS.some((t) => t.id === storedTrackId);
let currentVideoId = isKnownTrack
  ? storedTrackId
  : (musicWidget && musicWidget.dataset.videoId) || DEFAULT_YT_VIDEO_ID;


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


function updateActiveTrackOption() {
  musicTrackOptions.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.videoId === currentVideoId);
  });
}


// ================================
// SOUNDSCAPE DROPDOWN
// Drops upward, since the widget is pinned to the bottom of the page.
// ================================
function openTrackMenu() {
  if (!musicTrackMenu) return;
  musicTrackMenu.classList.add('open');
  if (musicTrackToggle) musicTrackToggle.setAttribute('aria-expanded', 'true');
}

function closeTrackMenu() {
  if (!musicTrackMenu) return;
  musicTrackMenu.classList.remove('open');
  if (musicTrackToggle) musicTrackToggle.setAttribute('aria-expanded', 'false');
}

function toggleTrackMenu() {
  if (!musicTrackMenu) return;
  if (musicTrackMenu.classList.contains('open')) {
    closeTrackMenu();
  } else {
    openTrackMenu();
  }
}

function selectTrack(videoId) {
  closeTrackMenu();
  if (videoId === currentVideoId) return;

  currentVideoId = videoId;
  localStorage.setItem(MUSIC_TRACK_KEY, videoId);
  updateActiveTrackOption();

  hasStartedOnce = true; // picking a track from the menu is itself the interaction gesture
  localStorage.setItem(MUSIC_PAUSED_KEY, 'false');
  if (ytPlayer) ytPlayer.loadVideoById(videoId);
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

  // Looping is handled manually (rather than the loop/playlist player
  // vars) so it keeps working correctly after the visitor switches
  // tracks via the dropdown, not just for the video the player started
  // with.
  if (event.data === YT.PlayerState.ENDED) {
    ytPlayer.seekTo(0);
    ytPlayer.playVideo();
  }
}


let triedFallbackTrack = false;

function onPlayerError() {
  // embedding disabled, video removed, etc. Fall back to the default
  // track once (a single broken soundscape shouldn't take the whole
  // widget down); only hide the widget if even that fails.
  if (!triedFallbackTrack && currentVideoId !== DEFAULT_YT_VIDEO_ID) {
    triedFallbackTrack = true;
    currentVideoId = DEFAULT_YT_VIDEO_ID;
    localStorage.setItem(MUSIC_TRACK_KEY, DEFAULT_YT_VIDEO_ID);
    updateActiveTrackOption();
    if (ytPlayer) ytPlayer.loadVideoById(DEFAULT_YT_VIDEO_ID);
    return;
  }
  if (musicWidget) musicWidget.style.display = 'none';
}


window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('yt-audio-player', {
    videoId: currentVideoId,
    width: 1,
    height: 1,
    playerVars: {
      autoplay: 0,
      controls: 0,
      disablekb: 1,
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
  updateActiveTrackOption();

  if (musicToggle) musicToggle.addEventListener('click', togglePlay);
  if (musicMute) musicMute.addEventListener('click', toggleMute);
  if (musicTrackToggle) musicTrackToggle.addEventListener('click', toggleTrackMenu);

  musicTrackOptions.forEach((btn) => {
    btn.addEventListener('click', () => selectTrack(btn.dataset.videoId));
  });

  document.addEventListener('click', (e) => {
    if (!musicWidget.contains(e.target)) closeTrackMenu();
  });

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(tag);
}
