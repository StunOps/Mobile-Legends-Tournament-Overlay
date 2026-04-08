/* ============================================
   ML LIVE — Interview Overlay Logic
   - Polls /api/data every 2s (same as In-Game)
   - Reads data.ingame for team info & standings
   - Renders sponsors with cycling
   ============================================ */

let currentData = null;
const POLL_INTERVAL = 2000;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  fetchData();
  setInterval(fetchData, POLL_INTERVAL);
});

// --- Data Fetching ---
async function fetchData() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    const dataStr = JSON.stringify(data);
    if (dataStr !== JSON.stringify(currentData)) {
      currentData = data;
      renderAll(data);
    }
  } catch (err) {
    console.warn('Failed to fetch data:', err);
  }
}

// --- Render All ---
function renderAll(data) {
  const ig = data.ingame;
  if (!ig) return;

  renderTeam1(ig.team1);
  renderTeam2(ig.team2);
  renderScore(ig.team1Wins || 0, ig.team2Wins || 0);
  renderSponsors(data.sponsors);
}

// --- Team 1 (Left) ---
function renderTeam1(team) {
  if (!team) return;
  setText('ivTeam1Name', team.name || 'TEAM 1');
  setImage('ivTeam1Logo', team.logo);

// Auto-scale font size is removed. Controlled by CSS instead.
}

// --- Team 2 (Right) ---
function renderTeam2(team) {
  if (!team) return;
  setText('ivTeam2Name', team.name || 'TEAM 2');
  setImage('ivTeam2Logo', team.logo);

// Auto-scale font size is removed. Controlled by CSS instead.
}

// --- Score ---
function renderScore(team1Wins, team2Wins) {
  setText('ivTeam1Score', String(team1Wins));
  setText('ivTeam2Score', String(team2Wins));
}

// --- Sponsors (cycling, same as In-Game) ---
let sponsorCycleTimer = null;
let currentSponsorIndex = 0;
const SPONSOR_DISPLAY_DURATION = 4000;

function renderSponsors(sponsors) {
  const container = document.getElementById('ivSponsors');
  if (!container) return;

  const validSponsors = (sponsors || []).filter(s => s.logo);

  if (validSponsors.length === 0) {
    container.innerHTML = '';
    if (sponsorCycleTimer) clearInterval(sponsorCycleTimer);
    return;
  }

  let img = container.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    container.appendChild(img);
  }

  if (sponsorCycleTimer) clearInterval(sponsorCycleTimer);
  currentSponsorIndex = 0;
  showSponsor(validSponsors[currentSponsorIndex]);

  if (validSponsors.length > 1) {
    sponsorCycleTimer = setInterval(() => {
      fadeOutSponsor(() => {
        currentSponsorIndex = (currentSponsorIndex + 1) % validSponsors.length;
        showSponsor(validSponsors[currentSponsorIndex]);
      });
    }, SPONSOR_DISPLAY_DURATION);
  }
}

function showSponsor(s) {
  const container = document.getElementById('ivSponsors');
  const img = container.querySelector('img');
  if (!img) return;

  img.src = s.logo;
  img.alt = s.name || 'Sponsor';

  img.classList.remove('fade-enter', 'fade-exit');
  void img.offsetWidth;
  img.classList.add('fade-enter');
}

function fadeOutSponsor(callback) {
  const container = document.getElementById('ivSponsors');
  const img = container.querySelector('img');
  if (!img) return callback();

  img.classList.remove('fade-enter');
  img.classList.add('fade-exit');
  setTimeout(() => {
    img.classList.remove('fade-exit');
    callback();
  }, 300);
}

// --- Utilities ---
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (!el) return;
  if (src) {
    el.src = src;
    el.style.display = 'block';
  } else {
    el.src = '';
    el.style.display = 'none';
  }
}
