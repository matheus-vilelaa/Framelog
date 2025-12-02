// Mock Data
const recentScreenshots = [
    { title: "Notion", desc: "A imagem mostra uma página do Notion chamada 'Projeto FrameLog'...", img: "https://via.placeholder.com/300x160/e0e0e0/333333?text=Notion" }
];

const mostVisited = [
    { title: "Arc Browser", desc: "Figma - Design System", img: "https://via.placeholder.com/300x160/e0e0e0/333333?text=Figma" }
];

// DOM Elements
const recentGrid = document.getElementById('recent-screenshots');
const visitedGrid = document.getElementById('most-visited');
const tabs = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const storageDisplay = document.getElementById('storage-display');
const retentionDisplay = document.getElementById('retention-display');
const retentionSelect = document.getElementById('retention-setting');
const saveRetentionBtn = document.getElementById('save-retention');
const backendStatusDot = document.getElementById('backend-status');

// Render Cards
function createCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <img src="${item.img}" alt="${item.title}" class="card-image">
        <div class="card-content">
            <div class="card-title">${item.title}</div>
            <div class="card-desc">${item.desc}</div>
        </div>
    `;
    return card;
}

recentScreenshots.forEach(item => recentGrid.appendChild(createCard(item)));
mostVisited.forEach(item => visitedGrid.appendChild(createCard(item)));

// Tab Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked
        tab.classList.add('active');
        const targetId = tab.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
    });
});


// Data Loading
async function loadData() {
    // Storage
    const bytes = await window.api.getSpaceUsed();
    const gb = (bytes / (1024 * 1024 * 1024)).toFixed(2); // More precision
    storageDisplay.textContent = `${gb} GB`;

    // Retention
    const days = await window.api.getRetentionDays();
    updateRetentionUI(days);

    // Backend Status
    checkBackendStatus();
}

async function checkBackendStatus() {
    const isConnected = await window.api.getBackendStatus();
    if (isConnected) {
        backendStatusDot.classList.add('connected');
        backendStatusDot.classList.remove('disconnected');
        backendStatusDot.title = "Backend: Conectado";
    } else {
        backendStatusDot.classList.add('disconnected');
        backendStatusDot.classList.remove('connected');
        backendStatusDot.title = "Backend: Desconectado";
    }
}

function updateRetentionUI(days) {
    if (days === -1) {
        retentionDisplay.textContent = "Nunca";
    } else {
        retentionDisplay.textContent = `${days} dias`;
    }
    retentionSelect.value = days;
}

// Settings Logic
saveRetentionBtn.addEventListener('click', async () => {
    const days = parseInt(retentionSelect.value);
    const success = await window.api.setRetentionDays(days);
    if (success) {
        updateRetentionUI(days);
        alert('Configuração salva!');
    } else {
        alert('Erro ao salvar configuração.');
    }
});

// Theme Toggle
const themeToggleBtn = document.querySelector('.theme-toggle');
const body = document.body;

// Check for saved theme preference (optional, but good UX)
// For now, default is Dark (no class), so we check if Light was saved
// const savedTheme = localStorage.getItem('theme');
// if (savedTheme === 'light') {
//     body.classList.add('light-mode');
//     themeToggleBtn.textContent = '🌙';
// } else {
//     themeToggleBtn.textContent = '☀️';
// }

// Set initial icon for Dark Mode (Default)
themeToggleBtn.textContent = '☀️'; // Icon to switch TO Light Mode

themeToggleBtn.addEventListener('click', () => {
    body.classList.toggle('light-mode');

    if (body.classList.contains('light-mode')) {
        themeToggleBtn.textContent = '🌙'; // Icon to switch TO Dark Mode
        // localStorage.setItem('theme', 'light');
    } else {
        themeToggleBtn.textContent = '☀️'; // Icon to switch TO Light Mode
        // localStorage.setItem('theme', 'dark');
    }
});

// Initialize
loadData();
// Poll status every 30 seconds
setInterval(checkBackendStatus, 30000);
