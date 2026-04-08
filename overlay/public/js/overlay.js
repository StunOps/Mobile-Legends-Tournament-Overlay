/* ============================================
   ML LIVE — Overlay Logic (Template-Based)
   - Polls /api/data every 2s
   - Cycles participating teams with fill/fade
   - Spawns animated background objects
   - Renders upcoming matches & sponsors
   ============================================ */

let currentData = null;
let currentTeamIndex = 0;
let teamCycleTimer = null;
const POLL_INTERVAL = 2000;
const TEAM_DISPLAY_DURATION = 6000;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  spawnBackgroundObjects();
  startTextFlip();
  fetchData();
  setInterval(fetchData, POLL_INTERVAL);
});

// --- Text Flip (Tagline) ---
const FLIP_INTERVAL = 3000; // Change word every 3 seconds

function startTextFlip() {
  const words = document.querySelectorAll('.flip-word');
  if (!words || words.length <= 1) return;

  let currentIndex = 0;

  setInterval(() => {
    const current = words[currentIndex];

    // Slide current word up and out
    current.classList.remove('active');
    current.classList.add('exit');

    // Move to next word
    currentIndex = (currentIndex + 1) % words.length;
    const next = words[currentIndex];

    // After exit animation finishes, reset the old word and show the new one
    setTimeout(() => {
      current.classList.remove('exit');
      next.classList.add('active');
    }, 300);

  }, FLIP_INTERVAL);
}

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
  renderEventInfo(data.event);
  renderUpcomingMatches(data.upcomingMatches);
  renderSponsors(data.sponsors);
  startTeamCycle(data.teams);
}

// --- Event Info ---
function renderEventInfo(event) {
  if (!event) return;
  setText('eventDay', event.day || 'DAY 1');
  setText('eventRound', event.round || 'PLAYOFFS');
}

// --- Team Cycling ---
function startTeamCycle(teams) {
  if (!teams || teams.length === 0) return;
  if (teamCycleTimer) clearInterval(teamCycleTimer);

  currentTeamIndex = 0;
  showTeam(teams[currentTeamIndex]);

  if (teams.length > 1) {
    teamCycleTimer = setInterval(() => {
      fadeOutTeam(() => {
        currentTeamIndex = (currentTeamIndex + 1) % teams.length;
        showTeam(teams[currentTeamIndex]);
      });
    }, TEAM_DISPLAY_DURATION);
  }
}

function showTeam(team) {
  const card = document.getElementById('teamShowcase');
  const logo = document.getElementById('teamLogo');
  const name = document.getElementById('teamName');
  const org = document.getElementById('teamOrg');
  const members = document.getElementById('teamMembers');
  if (!card) return;

  // Name (auto-scale font size based on length)
  name.textContent = team.name || 'TEAM';
  const len = name.textContent.length;
  if (len <= 4) name.style.fontSize = '36px';
  else if (len <= 8) name.style.fontSize = '28px';
  else if (len <= 12) name.style.fontSize = '22px';
  else if (len <= 16) name.style.fontSize = '18px';
  else name.style.fontSize = '15px';

  // Logo
  if (team.logo) { logo.src = team.logo; logo.style.display = 'block'; }
  else { logo.style.display = 'none'; }

  // Org/Banner
  if (team.orgLogo) { org.src = team.orgLogo; org.style.display = 'block'; }
  else { org.style.display = 'none'; }

  // Members
  members.innerHTML = '';
  (team.members || []).forEach(m => {
    if (m && m.trim()) {
      const span = document.createElement('span');
      span.textContent = m;
      members.appendChild(span);
    }
  });

  // Trigger fill-in animation
  card.classList.remove('reveal-enter', 'reveal-exit');
  void card.offsetWidth;
  card.classList.add('reveal-enter');
}

function fadeOutTeam(callback) {
  const card = document.getElementById('teamShowcase');
  if (!card) return callback();

  card.classList.remove('reveal-enter');
  card.classList.add('reveal-exit');
  setTimeout(() => {
    card.classList.remove('reveal-exit');
    callback();
  }, 500);
}

// --- Upcoming Matches ---
function renderUpcomingMatches(matches) {
  const container = document.getElementById('upcomingMatches');
  if (!container || !matches) return;
  container.innerHTML = '';

  matches.forEach((match, i) => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.style.animationDelay = `${i * 0.5}s`;

    const logoA = match.teamA.logo
      ? `<img src="${match.teamA.logo}" alt="${match.teamA.name}">`
      : `<div class="match-team-placeholder"></div>`;
    const logoB = match.teamB.logo
      ? `<img src="${match.teamB.logo}" alt="${match.teamB.name}">`
      : `<div class="match-team-placeholder"></div>`;

    card.innerHTML = `
      <div class="match-label">MATCH ${match.matchNumber}</div>
      <div class="match-teams">
        <div class="match-team">
          ${logoA}
          <span class="match-team-name">${match.teamA.name}</span>
        </div>
        <div class="match-vs">VS</div>
        <div class="match-team">
          ${logoB}
          <span class="match-team-name">${match.teamB.name}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Sponsors ---
let sponsorCycleTimer = null;
let currentSponsorIndex = 0;
const SPONSOR_DISPLAY_DURATION = 4000; // Stays on screen for 3 seconds

function renderSponsors(sponsors) {
  const container = document.getElementById('sponsorLogos');
  if (!container) return;

  const validSponsors = (sponsors || []).filter(s => s.logo);

  if (validSponsors.length === 0) {
    container.innerHTML = '';
    if (sponsorCycleTimer) clearInterval(sponsorCycleTimer);
    return;
  }

  // We just need one img tag to cycle through
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
  const container = document.getElementById('sponsorLogos');
  const img = container.querySelector('img');
  if (!img) return;

  img.src = s.logo;
  img.alt = s.name || 'Sponsor';

  img.classList.remove('fade-enter', 'fade-exit');
  void img.offsetWidth; // trigger reflow
  img.classList.add('fade-enter');
}

function fadeOutSponsor(callback) {
  const container = document.getElementById('sponsorLogos');
  const img = container.querySelector('img');
  if (!img) return callback();

  img.classList.remove('fade-enter');
  img.classList.add('fade-exit');
  setTimeout(() => {
    img.classList.remove('fade-exit');
    callback();
  }, 300); // 300ms fade out transition
}

// --- Background Animated Objects ---
function spawnBackgroundObjects() {
  const container = document.getElementById('bgObjects');
  if (!container) return;

  const types = ['bg-obj--tri', 'bg-obj--diamond', 'bg-obj--hex', 'bg-obj--circle'];

  for (let i = 0; i < 15; i++) {
    const obj = document.createElement('div');
    obj.className = `bg-obj ${types[Math.floor(Math.random() * types.length)]}`;
    obj.style.left = Math.random() * 1920 + 'px';
    obj.style.top = (Math.random() * 1080 + 200) + 'px';
    obj.style.animationName = 'floatDrift';
    obj.style.animationDuration = (14 + Math.random() * 18) + 's';
    obj.style.animationDelay = (Math.random() * 10) + 's';
    obj.style.animationIterationCount = 'infinite';
    obj.style.animationTimingFunction = 'linear';
    obj.style.opacity = (0.03 + Math.random() * 0.05).toFixed(2);
    container.appendChild(obj);
  }
}

// --- Utility ---
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
