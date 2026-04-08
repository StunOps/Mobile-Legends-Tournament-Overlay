/* ============================================
   ML LIVE — In-Game Overlay Logic
   - Polls /api/data every 2s
   - Renders team info, standings, match info
   - Cycles sponsor logos
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
  renderStandings(ig.team1Wins || 0, ig.team2Wins || 0, ig.bestOf || 3);
  renderMatchInfo(ig);
  renderSponsors(data.sponsors);
}

// --- Team 1 (Left) ---
function renderTeam1(team) {
  if (!team) return;
  setText('igTeam1Name', team.name || 'TEAM 1');
  setImage('igTeam1Logo', team.logo);
  setImage('igTeam1Org', team.orgLogo);

  // Auto-scale font size based on name length
  const el = document.getElementById('igTeam1Name');
  if (el) {
    const len = (team.name || '').length;
    if (len <= 6) el.style.fontSize = '32px';
    else if (len <= 10) el.style.fontSize = '28px';
    else if (len <= 16) el.style.fontSize = '22px';
    else if (len <= 22) el.style.fontSize = '18px';
    else el.style.fontSize = '14px';
  }
}

// --- Team 2 (Right) ---
function renderTeam2(team) {
  if (!team) return;
  setText('igTeam2Name', team.name || 'TEAM 2');
  setImage('igTeam2Logo', team.logo);
  setImage('igTeam2Org', team.orgLogo);

  // Auto-scale font size
  const el = document.getElementById('igTeam2Name');
  if (el) {
    const len = (team.name || '').length;
    if (len <= 6) el.style.fontSize = '32px';
    else if (len <= 10) el.style.fontSize = '28px';
    else if (len <= 16) el.style.fontSize = '22px';
    else if (len <= 22) el.style.fontSize = '18px';
    else el.style.fontSize = '14px';
  }
}

// --- Standings ---
function renderStandings(team1Wins, team2Wins, bestOf) {
  const totalGames = bestOf; // BO3 = 3 circles, BO5 = 5 circles
  renderStandingCircles('igTeam1Standings', team1Wins, totalGames);
  renderStandingCircles('igTeam2Standings', team2Wins, totalGames);
}

function renderStandingCircles(containerId, wins, total) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < total; i++) {
    const circle = document.createElement('span');
    circle.className = 'ig-circle';
    if (i < wins) {
      circle.classList.add('won');
    }
    container.appendChild(circle);
  }
}

// --- Match Info (Round, Day, Best Of) ---
function renderMatchInfo(ig) {
  setText('igRound', ig.round || 'D-PLAYOFFS');
  setText('igDay', ig.day || 'DAY1');
  setText('igBestOf', `BEST OF ${ig.bestOf || 3}`);
}

// --- Sponsors (cycling, reused from initial overlay logic) ---
let sponsorCycleTimer = null;
let currentSponsorIndex = 0;
const SPONSOR_DISPLAY_DURATION = 4000;

function renderSponsors(sponsors) {
  const container = document.getElementById('igSponsors');
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
  const container = document.getElementById('igSponsors');
  const img = container.querySelector('img');
  if (!img) return;

  img.src = s.logo;
  img.alt = s.name || 'Sponsor';

  img.classList.remove('fade-enter', 'fade-exit');
  void img.offsetWidth;
  img.classList.add('fade-enter');
}

function fadeOutSponsor(callback) {
  const container = document.getElementById('igSponsors');
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
