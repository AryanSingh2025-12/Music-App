// ================= VARIABLES =================
let player;
let playlist = [];
let currentIndex = 0;
let isPlaying = false;
let playerReady = false;

const API_KEY = "AIzaSyBrqnMid4-06CT3eqBI3nu3o89MnhBfQVU";


// ================= YOUTUBE PLAYER =================
function onYouTubeIframeAPIReady() {
  console.log("YouTube API Loaded");

  player = new YT.Player("player", {
    height: "0",
    width: "0",
    videoId: "",
    playerVars: {
      autoplay: 1,
      controls: 0,
      mute: 1
    },
    events: {
      onReady: function () {
        playerReady = true;
        console.log("✅ Player Ready");
      },

      onStateChange: function (event) {
        // 🔥 Auto next when song ends
        if (event.data === YT.PlayerState.ENDED) {
          nextSong();
        }
      },

      onError: function (e) {
        console.log("❌ Video error:", e.data);
        nextSong(); // skip broken video
      }
    }
  });
}


// ================= SEARCH =================
async function searchSongs() {
  const query = document.getElementById("searchInput").value;

  if (!query) {
    alert("Enter song name");
    return;
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=10&q=${query}&key=${API_KEY}`
    );

    const data = await res.json();

    if (!data.items) {
      alert("API error. Check key.");
      return;
    }

    playlist = data.items;
    currentIndex = 0;

    displayResults(playlist);

  } catch (err) {
    console.log("Search error:", err);
  }
}


// ================= DISPLAY =================
function displayResults(items) {
  const results = document.getElementById("results");
  results.innerHTML = "";

  items.forEach((item, index) => {
    if (!item.id.videoId) return;

    const div = document.createElement("div");
    div.className = "song-card";

    div.innerHTML = `
      <strong>${item.snippet.title}</strong><br>
      <small>${item.snippet.channelTitle}</small>
    `;

    div.onclick = () => playSong(index);

    results.appendChild(div);
  });
}


// ================= PLAY =================
function playSong(index) {
  currentIndex = index;

  const item = playlist[index];
  if (!item || !item.id.videoId) return;

  const videoId = item.id.videoId;
  const title = item.snippet.title;
  const thumbnail = item.snippet.thumbnails.high.url;

  document.getElementById("songTitle").innerText = title;
  document.getElementById("albumImage").src = thumbnail;
  document.getElementById("miniImg").src = thumbnail;
  document.getElementById("miniTitle").innerText = title;

  if (!playerReady) {
    alert("Player not ready. Refresh once.");
    return;
  }

  // 🔥 Load muted first
  player.loadVideoById(videoId);

  // 🔥 THEN force play + sound
  setTimeout(() => {
    try {
      player.playVideo();     // required
      player.unMute();        // 🔊 enable sound
      player.setVolume(100);  // max volume
    } catch (e) {
      console.log("Play error", e);
    }
  }, 800);
}


// ================= PLAY / PAUSE =================
function togglePlay() {
  if (!playerReady) return;

  if (isPlaying) {
    player.pauseVideo();
    isPlaying = false;
  } else {
    player.playVideo();
    player.unMute();
    isPlaying = true;
  }

  updatePlayIcon();
}


// ================= UPDATE BUTTON =================
function updatePlayIcon() {
  const btn = document.querySelector(".inner-circle");
  if (btn) {
    btn.innerHTML = isPlaying ? "⏸" : "▶";
  }
}


// ================= NEXT / PREVIOUS =================
function nextSong() {
  currentIndex = (currentIndex + 1) % playlist.length;
  playSong(currentIndex);
}

function prevSong() {
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  playSong(currentIndex);
}


// ================= SEEK =================
function seek(e) {
  if (!playerReady) return;

  const bar = document.querySelector(".progress-bar");
  const rect = bar.getBoundingClientRect();

  const percent = (e.clientX - rect.left) / rect.width;
  const duration = player.getDuration();

  player.seekTo(duration * percent, true);
}


// ================= VOLUME =================
function setVolume(value) {
  if (playerReady) {
    player.setVolume(value);
  }
}


// ================= TIME FORMAT =================
function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ":" + (s < 10 ? "0" + s : s);
}


// ================= PROGRESS =================
setInterval(() => {
  if (playerReady && player.getCurrentTime) {
    const current = player.getCurrentTime();
    const duration = player.getDuration();

    if (duration > 0) {
      const percent = (current / duration) * 100;

      document.getElementById("progress").style.width = percent + "%";
      document.getElementById("currentTime").innerText = formatTime(current);
      document.getElementById("duration").innerText = formatTime(duration);
    }
  }
}, 1000);


// ================= USER CLICK FIX =================
document.body.addEventListener("click", () => {
  if (player && player.unMute) {
    player.unMute();
  }
}, { once: true });