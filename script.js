// ================= VARIABLES =================
let player;
let playlist = [];
let recentlyPlayed = [];
let queue = [];
let currentIndex = 0;
let isPlaying = false;
let playerReady = false;
let playerState = "paused";

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
    loadSuggestions();

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
// ================= DISPLAY SUGGESTIONS =================

function displaySuggestions(items) {

  const suggestions = document.getElementById("suggestions");

  if (!suggestions) return;

  suggestions.innerHTML = "";

  items.forEach((item, index) => {

    if (!item.id.videoId) return;

    const div = document.createElement("div");

    div.className = "suggestion-card";

    div.innerHTML = `
      <img src="${item.snippet.thumbnails.high.url}">

      <div class="suggestion-info">
        <h4>${item.snippet.title}</h4>
        <p>${item.snippet.channelTitle}</p>
      </div>
    `;

    div.onclick = () => playSong(index);

    suggestions.appendChild(div);

  });
}

// ================= SMART MUSIC SUGGESTIONS =================
async function loadSuggestions(title, artist) {

  try {

    // 🔥 Create smart search query
    const query =
      `${title} ${artist} similar songs playlist`;

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&maxResults=8&q=${query}&key=${API_KEY}`
    );

    const data = await res.json();

    if (data.items) {

      displaySuggestions(data.items);

    }

  } catch (err) {

    console.log("Suggestion Error:", err);

  }

}

function renderRecentlyPlayed() {

  const container =
    document.getElementById("recentlyPlayed");

  if (!container) return;

  container.innerHTML = "";

  recentlyPlayed.forEach(song => {

    const div = document.createElement("div");

    div.className = "recent-card";

    div.innerHTML = `
      <img src="${song.thumbnail}">
      <p>${song.title}</p>
    `;

    container.appendChild(div);

  });
}

function renderQueue() {

  const container =
    document.getElementById("queueList");

  if (!container) return;

  container.innerHTML = "";

  queue.forEach(song => {

    const div = document.createElement("div");

    div.className = "queue-item";

    div.innerHTML = `
      <p>${song.snippet.title}</p>
    `;

    container.appendChild(div);

  });
}

// ================= PLAY =================
function playSong(index) {

  currentIndex = index;

  const item = playlist[index];

  if (!item || !item.id.videoId) {
    nextSong();
    return;
  }

  const videoId = item.id.videoId;

  const title = item.snippet.title;

  const mood = detectMood(title);
  document.getElementById("songMood").innerText = mood;

  const artist = item.snippet.channelTitle;

  const thumbnail = item.snippet.thumbnails.high.url;



  openPlayer();


  // ===== UPDATE UI =====
  document.getElementById("songTitle").innerText = title;

  document.getElementById("topSongTitle").innerText = title;

  document.getElementById("artistName").innerText =
    item.snippet.channelTitle;

  document.getElementById("miniAlbum").src = thumbnail;

  document.getElementById("albumImage").src = thumbnail;

  document.getElementById("miniImg").src = thumbnail;

  document.getElementById("miniTitle").innerText = title;


  // ===== PLAYER CHECK =====
  if (!playerReady) {
    alert("Player not ready. Refresh once.");
    return;
  }


  // ===== LOAD SONG =====
  player.loadVideoById(videoId);


  // ===== SOUND FIX =====
  setTimeout(() => {

    player.unMute();

    player.setVolume(100);

  }, 500);

  loadSuggestions(title, artist);
  isPlaying = true;

  updatePlayIcon();

  // change 

  recentlyPlayed.unshift({
    title,
    thumbnail
  });

  recentlyPlayed = recentlyPlayed.slice(0, 5);

  renderRecentlyPlayed();

  const colors = [
    "#3b1d1d",
    "#0b2b3b",
    "#1f3b0b",
    "#3b0b33",
    "#2d1b0f"
  ];

  const randomColor =
    colors[Math.floor(Math.random() * colors.length)];

  document.querySelector(".player-screen").style.background =
    `linear-gradient(to bottom, ${randomColor}, #000)`;

  queue = playlist.slice(index + 1);

  renderQueue();

}


// ================= PLAY / PAUSE =================
function togglePlay(event) {

  if (event) {
    event.stopPropagation();
  }

  const playBtn = document.getElementById("playBtn");
  const miniPlayBtn = document.getElementById("miniPlayBtn");

  if (playerState === "playing") {

    player.pauseVideo();

    playerState = "paused";

    playBtn.innerHTML = "▶";
    miniPlayBtn.innerHTML = "▶";

  } else {

    player.playVideo();

    playerState = "playing";

    playBtn.innerHTML = "⏸";
    miniPlayBtn.innerHTML = "⏸";

  }

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

  if (playlist.length === 0) return;

  currentIndex =
    (currentIndex + 1) % playlist.length;

  playSong(currentIndex);

}

function prevSong() {

  if (playlist.length === 0) return;

  currentIndex =
    (currentIndex - 1 + playlist.length) %
    playlist.length;

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


// ================= OPEN PLAYER =================
function openPlayer() {

  // Hide home
  document
    .getElementById("homeScreen")
    .classList.add("hidden");

  // Show player
  document
    .getElementById("playerScreen")
    .classList.remove("hidden");


  document
    .querySelector(".mini-player")
    .classList.add("hidden");

}


// ================= CLOSE PLAYER =================
function closePlayer() {

  // Hide player
  document
    .getElementById("playerScreen")
    .classList.add("hidden");

  // Show home
  document
    .getElementById("homeScreen")
    .classList.remove("hidden");


  document
    .querySelector(".mini-player")
    .classList.remove("hidden");

}


function detectMood(title) {

  title = title.toLowerCase();

  if (
    title.includes("sad") ||
    title.includes("alone") ||
    title.includes("broken")
  ) {
    return "Sad 😔";
  }

  if (
    title.includes("love") ||
    title.includes("romantic")
  ) {
    return "Romantic ❤️";
  }

  if (
    title.includes("party") ||
    title.includes("dance")
  ) {
    return "Party 🔥";
  }

  if (
    title.includes("lofi") ||
    title.includes("chill")
  ) {
    return "Chill 🌙";
  }

  return "Music 🎵";
}