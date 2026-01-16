let playlist = [];
let currentSongIndex = -1;
const audio = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const progressBar = document.getElementById('progressBar');
const currentTimeDisplay = document.getElementById('currentTime');
const durationDisplay = document.getElementById('duration');
const currentSongDisplay = document.getElementById('currentSongDisplay');

// Sample songs (replace with real URLs or local files)
playlist = [
    { title: "Sample Song 1", artist: "Artist A", category: "Pop", url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" }, // Placeholder; use MP3
    { title: "Sample Song 2", artist: "Artist B", category: "Rock", url: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav" }
];
updatePlaylistDisplay();

function addSong() {
    const title = document.getElementById('songTitle').value.trim();
    const artist = document.getElementById('songArtist').value.trim();
    const category = document.getElementById('songCategory').value;
    const url = document.getElementById('songUrl').value.trim();
    
    if (!title || !artist || !url) {
        alert('Please fill in all fields.');
        return;
    }
    
    playlist.push({ title, artist, category, url });
    updatePlaylistDisplay();
    // Clear inputs
    document.getElementById('songTitle').value = '';
    document.getElementById('songArtist').value = '';
    document.getElementById('songUrl').value = '';
}

function updatePlaylistDisplay(filtered = playlist) {
    const playlistDiv = document.getElementById('playlist');
    playlistDiv.innerHTML = filtered.map((song, index) => 
        `<div class="playlist-item ${index === currentSongIndex ? 'active' : ''}" onclick="playSong(${index})">
            <strong>${song.title}</strong> by ${song.artist} (${song.category})
            <button class="btn btn-danger btn-sm float-end" onclick="removeSong(${index}); event.stopPropagation();">Remove</button>
        </div>`
    ).join('');
}

function filterPlaylist() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const filtered = playlist.filter(song => 
        (song.title.toLowerCase().includes(search) || song.artist.toLowerCase().includes(search)) &&
        (!category || song.category === category)
    );
    updatePlaylistDisplay(filtered);
}

function playSong(index) {
    if (index < 0 || index >= playlist.length) return;
    currentSongIndex = index;
    const song = playlist[index];
    audio.src = song.url;
    audio.play();
    playPauseBtn.textContent = '⏸️ Pause';
    currentSongDisplay.textContent = `${song.title} by ${song.artist}`;
    updatePlaylistDisplay();
}

function togglePlayPause() {
    if (audio.paused) {
        audio.play();
        playPauseBtn.textContent = '⏸️ Pause';
    } else {
        audio.pause();
        playPauseBtn.textContent = '▶️ Play';
    }
}

function nextSong() {
    playSong((currentSongIndex + 1) % playlist.length);
}

function previousSong() {
    playSong((currentSongIndex - 1 + playlist.length) % playlist.length);
}

function setVolume() {
    audio.volume = document.getElementById('volumeSlider').value;
}

function seek() {
    const seekTime = (progressBar.value / 100) * audio.duration;
    audio.currentTime = seekTime;
}

function removeSong(index) {
    playlist.splice(index, 1);
    if (currentSongIndex === index) {
        audio.pause();
        currentSongIndex = -1;
        currentSongDisplay.textContent = 'No song playing';
    } else if (currentSongIndex > index) {
        currentSongIndex--;
    }
    updatePlaylistDisplay();
}

// Update progress bar and time displays
audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
        durationDisplay.textContent = formatTime(audio.duration);
    }
});

audio.addEventListener('ended', nextSong);

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}