/* ============================================
   ML LIVE — Admin Control Panel Logic
   ============================================ */

let appData = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupTabs();
  setupIgUploads();
});

// --- Tabs ---
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// --- Load Data ---
async function loadData() {
  try {
    const res = await fetch('/api/data');
    appData = await res.json();
    // Ensure ingame object exists
    if (!appData.ingame) {
      appData.ingame = {
        team1: { name: '', logo: '', orgLogo: '' },
        team2: { name: '', logo: '', orgLogo: '' },
        team1Wins: 0, team2Wins: 0,
        round: 'D-PLAYOFFS', day: 'DAY1', bestOf: 3
      };
    }
    populateForm(appData);
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// --- Populate Form ---
function populateForm(data) {
  // Initial overlay fields
  document.getElementById('inp-day').value = data.event?.day || '';
  document.getElementById('inp-round').value = data.event?.round || '';

  renderTeamCards(data.teams || []);
  renderMatchCards(data.upcomingMatches || []);
  renderSponsors(data.sponsors || []);

  // In-game fields
  populateIgForm(data);
}

// --- Teams ---
function renderTeamCards(teams) {
  const container = document.getElementById('teams-container');
  container.innerHTML = '';

  teams.forEach((team, i) => {
    const card = document.createElement('div');
    card.className = 'team-card-admin';
    card.innerHTML = `
      <button class="btn-remove" onclick="removeTeam(${i})">✕ REMOVE</button>
      <h4>TEAM ${i + 1}</h4>
      <div class="form-row">
        <div class="form-field">
          <label>Team Name</label>
          <input type="text" class="team-name" data-idx="${i}" value="${team.name || ''}">
        </div>
        <div class="form-field">
          <label>Team Logo</label>
          <input type="file" class="team-logo-file" data-idx="${i}" accept="image/*">
          ${team.logo ? `<img src="${team.logo}" class="preview-img" id="preview-logo-${i}">` : ''}
        </div>
        <div class="form-field">
          <label>Organization Logo</label>
          <input type="file" class="team-org-file" data-idx="${i}" accept="image/*">
          ${team.orgLogo ? `<img src="${team.orgLogo}" class="preview-img" id="preview-org-${i}">` : ''}
        </div>
      </div>
      <label style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:6px;display:block;">Members</label>
      <div class="members-grid">
        ${[0,1,2,3,4,5].map(j => `
          <div class="form-field">
            <input type="text" class="team-member" data-team="${i}" data-member="${j}"
              value="${(team.members && team.members[j]) || ''}" placeholder="Player ${j+1}">
          </div>
        `).join('')}
      </div>
    `;
    container.appendChild(card);
  });

  // Attach upload listeners
  container.querySelectorAll('.team-logo-file').forEach(input => {
    input.addEventListener('change', (e) => uploadTeamFile(e, 'logo'));
  });
  container.querySelectorAll('.team-org-file').forEach(input => {
    input.addEventListener('change', (e) => uploadTeamFile(e, 'orgLogo'));
  });
}

function addTeam() {
  if (!appData.teams) appData.teams = [];
  appData.teams.push({
    name: '', logo: '', orgLogo: '',
    members: ['', '', '', '', '', '']
  });
  renderTeamCards(appData.teams);
}

function removeTeam(idx) {
  appData.teams.splice(idx, 1);
  renderTeamCards(appData.teams);
}

async function uploadTeamFile(e, field) {
  const idx = parseInt(e.target.dataset.idx);
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload?type=logos', { method: 'POST', body: formData });
    const result = await res.json();
    if (result.success) {
      appData.teams[idx][field] = result.path;
      renderTeamCards(appData.teams);
      showToast('Logo uploaded!');
    }
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

// --- Matches ---
function renderMatchCards(matches) {
  const container = document.getElementById('matches-container');
  container.innerHTML = '';

  for (let i = 0; i < 3; i++) {
    const match = matches[i] || { matchNumber: i + 1, teamA: { name: '', logo: '' }, teamB: { name: '', logo: '' } };
    if (!matches[i]) matches[i] = match;

    const card = document.createElement('div');
    card.className = 'team-card-admin';
    card.innerHTML = `
      <h4>MATCH SLOT ${i + 1}</h4>
      <div class="form-row">
        <div class="form-field">
          <label>Match Number</label>
          <select class="match-number" data-idx="${i}">
            ${[1,2,3].map(n => `<option value="${n}" ${match.matchNumber === n ? 'selected' : ''}>Match ${n}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-field">
          <label>Team A Name</label>
          <input type="text" class="match-teamA-name" data-idx="${i}" value="${match.teamA.name || ''}">
        </div>
        <div class="form-field">
          <label>Team A Logo</label>
          <input type="file" class="match-teamA-logo" data-idx="${i}" accept="image/*">
          ${match.teamA.logo ? `<img src="${match.teamA.logo}" class="preview-img">` : ''}
        </div>
        <div class="form-field">
          <label>Team B Name</label>
          <input type="text" class="match-teamB-name" data-idx="${i}" value="${match.teamB.name || ''}">
        </div>
        <div class="form-field">
          <label>Team B Logo</label>
          <input type="file" class="match-teamB-logo" data-idx="${i}" accept="image/*">
          ${match.teamB.logo ? `<img src="${match.teamB.logo}" class="preview-img">` : ''}
        </div>
      </div>
    `;
    container.appendChild(card);
  }

  container.querySelectorAll('.match-teamA-logo').forEach(input => {
    input.addEventListener('change', (e) => uploadMatchLogo(e, 'teamA'));
  });
  container.querySelectorAll('.match-teamB-logo').forEach(input => {
    input.addEventListener('change', (e) => uploadMatchLogo(e, 'teamB'));
  });
}

async function uploadMatchLogo(e, side) {
  const idx = parseInt(e.target.dataset.idx);
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload?type=logos', { method: 'POST', body: formData });
    const result = await res.json();
    if (result.success) {
      appData.upcomingMatches[idx][side].logo = result.path;
      renderMatchCards(appData.upcomingMatches);
      showToast('Logo uploaded!');
    }
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

// --- Sponsors ---
function renderSponsors(sponsors) {
  const container = document.getElementById('sponsors-container');
  container.innerHTML = '';

  sponsors.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = 'sponsor-item';
    item.innerHTML = `
      ${s.logo ? `<img src="${s.logo}" alt="${s.name || 'Sponsor'}">` : ''}
      <span>${s.name || 'Sponsor ' + (i + 1)}</span>
      <button class="btn-remove" onclick="removeSponsor(${i})">✕</button>
    `;
    container.appendChild(item);
  });
}

async function uploadSponsor() {
  const input = document.getElementById('sponsor-upload');
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload?type=sponsors', { method: 'POST', body: formData });
    const result = await res.json();
    if (result.success) {
      if (!appData.sponsors) appData.sponsors = [];
      appData.sponsors.push({ name: file.name.replace(/\.[^.]+$/, ''), logo: result.path });
      renderSponsors(appData.sponsors);
      input.value = '';
      showToast('Sponsor added!');
    }
  } catch (err) {
    console.error('Upload failed:', err);
  }
}

function removeSponsor(idx) {
  const sponsor = appData.sponsors[idx];
  if (sponsor && sponsor.logo) {
    fetch('/api/file', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: sponsor.logo })
    }).catch(() => {});
  }
  appData.sponsors.splice(idx, 1);
  renderSponsors(appData.sponsors);
}

// ============================================================
//  IN-GAME OVERLAY ADMIN FUNCTIONS
// ============================================================

// --- Populate In-Game Form ---
function populateIgForm(data) {
  const ig = data.ingame || {};

  // Match settings
  document.getElementById('ig-inp-round').value = ig.round || 'D-PLAYOFFS';
  document.getElementById('ig-inp-day').value = ig.day || 'DAY1';
  document.getElementById('ig-inp-bestof').value = String(ig.bestOf || 3);

  // Team 1
  document.getElementById('ig-team1-name').value = ig.team1?.name || '';
  document.getElementById('ig-team1-wins').textContent = ig.team1Wins || 0;
  setPreviewImg('ig-team1-logo-preview', ig.team1?.logo);
  setPreviewImg('ig-team1-org-preview', ig.team1?.orgLogo);

  // Team 2
  document.getElementById('ig-team2-name').value = ig.team2?.name || '';
  document.getElementById('ig-team2-wins').textContent = ig.team2Wins || 0;
  setPreviewImg('ig-team2-logo-preview', ig.team2?.logo);
  setPreviewImg('ig-team2-org-preview', ig.team2?.orgLogo);

  // Populate team dropdowns from the master teams list
  populateTeamDropdowns(data.teams || []);
}

function setPreviewImg(id, src) {
  const img = document.getElementById(id);
  if (!img) return;
  if (src) {
    img.src = src;
    img.style.display = 'block';
  } else {
    img.src = '';
    img.style.display = 'none';
  }
}

// --- Populate Team Dropdowns ---
function populateTeamDropdowns(teams) {
  ['ig-team1-select', 'ig-team2-select'].forEach(selectId => {
    const select = document.getElementById(selectId);
    if (!select) return;
    select.innerHTML = '<option value="">-- Pick a team --</option>';
    teams.forEach((team, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = team.name || `Team ${i + 1}`;
      select.appendChild(opt);
    });
  });
}

// --- Select Team from Dropdown ---
function igSelectTeam(teamNum) {
  const selectId = teamNum === 1 ? 'ig-team1-select' : 'ig-team2-select';
  const idx = parseInt(document.getElementById(selectId).value);
  if (isNaN(idx) || !appData.teams[idx]) return;

  const team = appData.teams[idx];
  const prefix = teamNum === 1 ? 'team1' : 'team2';

  appData.ingame[prefix] = {
    name: team.name || '',
    logo: team.logo || '',
    orgLogo: team.orgLogo || ''
  };

  document.getElementById(`ig-${prefix}-name`).value = team.name || '';
  setPreviewImg(`ig-${prefix}-logo-preview`, team.logo);
  setPreviewImg(`ig-${prefix}-org-preview`, team.orgLogo);
}

// --- Adjust Wins (+/-) ---
function igAdjustWins(teamNum, delta) {
  const key = teamNum === 1 ? 'team1Wins' : 'team2Wins';
  const bestOf = parseInt(document.getElementById('ig-inp-bestof').value) || 3;
  const maxWins = Math.ceil(bestOf / 2);

  let current = appData.ingame[key] || 0;
  current = Math.max(0, Math.min(maxWins, current + delta));
  appData.ingame[key] = current;

  document.getElementById(`ig-team${teamNum}-wins`).textContent = current;
}

// --- Reset Wins ---
function igResetWins() {
  appData.ingame.team1Wins = 0;
  appData.ingame.team2Wins = 0;
  document.getElementById('ig-team1-wins').textContent = '0';
  document.getElementById('ig-team2-wins').textContent = '0';
  showToast('Wins reset!');
}

// --- Swap Teams ---
function igSwapTeams() {
  const ig = appData.ingame;
  const tempTeam = { ...ig.team1 };
  ig.team1 = { ...ig.team2 };
  ig.team2 = tempTeam;

  const tempWins = ig.team1Wins;
  ig.team1Wins = ig.team2Wins;
  ig.team2Wins = tempWins;

  populateIgForm(appData);
  showToast('Teams swapped!');
}

// --- Setup In-Game Upload Listeners ---
function setupIgUploads() {
  document.getElementById('ig-team1-logo-file')?.addEventListener('change', async (e) => {
    const path = await igUploadFile(e.target.files[0], 'logos');
    if (path) {
      appData.ingame.team1.logo = path;
      setPreviewImg('ig-team1-logo-preview', path);
    }
  });
  document.getElementById('ig-team1-org-file')?.addEventListener('change', async (e) => {
    const path = await igUploadFile(e.target.files[0], 'logos');
    if (path) {
      appData.ingame.team1.orgLogo = path;
      setPreviewImg('ig-team1-org-preview', path);
    }
  });
  document.getElementById('ig-team2-logo-file')?.addEventListener('change', async (e) => {
    const path = await igUploadFile(e.target.files[0], 'logos');
    if (path) {
      appData.ingame.team2.logo = path;
      setPreviewImg('ig-team2-logo-preview', path);
    }
  });
  document.getElementById('ig-team2-org-file')?.addEventListener('change', async (e) => {
    const path = await igUploadFile(e.target.files[0], 'logos');
    if (path) {
      appData.ingame.team2.orgLogo = path;
      setPreviewImg('ig-team2-org-preview', path);
    }
  });
}

async function igUploadFile(file, type) {
  if (!file) return null;
  const formData = new FormData();
  formData.append('file', file);
  try {
    const res = await fetch(`/api/upload?type=${type}`, { method: 'POST', body: formData });
    const result = await res.json();
    if (result.success) {
      showToast('Uploaded!');
      return result.path;
    }
  } catch (err) {
    console.error('Upload failed:', err);
  }
  return null;
}

// ============================================================
//  SAVE ALL (both initial + in-game)
// ============================================================
async function saveAll() {
  // --- Initial overlay data ---
  appData.event = {
    day: document.getElementById('inp-day').value,
    round: document.getElementById('inp-round').value
  };

  // Teams
  document.querySelectorAll('.team-name').forEach(input => {
    const idx = parseInt(input.dataset.idx);
    if (appData.teams[idx]) appData.teams[idx].name = input.value;
  });
  document.querySelectorAll('.team-member').forEach(input => {
    const teamIdx = parseInt(input.dataset.team);
    const memberIdx = parseInt(input.dataset.member);
    if (appData.teams[teamIdx]) {
      if (!appData.teams[teamIdx].members) appData.teams[teamIdx].members = [];
      appData.teams[teamIdx].members[memberIdx] = input.value;
    }
  });

  // Matches
  document.querySelectorAll('.match-number').forEach(input => {
    const idx = parseInt(input.dataset.idx);
    if (appData.upcomingMatches[idx]) appData.upcomingMatches[idx].matchNumber = parseInt(input.value);
  });
  document.querySelectorAll('.match-teamA-name').forEach(input => {
    const idx = parseInt(input.dataset.idx);
    if (appData.upcomingMatches[idx]) appData.upcomingMatches[idx].teamA.name = input.value;
  });
  document.querySelectorAll('.match-teamB-name').forEach(input => {
    const idx = parseInt(input.dataset.idx);
    if (appData.upcomingMatches[idx]) appData.upcomingMatches[idx].teamB.name = input.value;
  });

  // --- In-Game overlay data ---
  appData.ingame.round = document.getElementById('ig-inp-round').value;
  appData.ingame.day = document.getElementById('ig-inp-day').value;
  appData.ingame.bestOf = parseInt(document.getElementById('ig-inp-bestof').value) || 3;
  appData.ingame.team1.name = document.getElementById('ig-team1-name').value;
  appData.ingame.team2.name = document.getElementById('ig-team2-name').value;

  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    const result = await res.json();
    if (result.success) {
      showToast('SAVED & UPDATED!');
      const iframe1 = document.getElementById('previewFrame');
      if (iframe1) iframe1.src = iframe1.src;
      const iframe2 = document.getElementById('igPreviewFrame');
      if (iframe2) iframe2.src = iframe2.src;
      const iframe3 = document.getElementById('ivPreviewFrame');
      if (iframe3) iframe3.src = iframe3.src;
    }
  } catch (err) {
    console.error('Save failed:', err);
    showToast('SAVE FAILED!');
  }
}

// --- Toast ---
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}
