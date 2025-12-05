// Mock Data
const recentScreenshots = [
    { title: "Notion", desc: "A imagem mostra uma página do Notion chamada 'Projeto FrameLog'...", img: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%2Fid%2FOIP.ru1L75o7VDbsP9ejEYOnvwHaEg%3Fpid%3DApi&f=1&ipt=f676bca4cb85907726a7d7ed7b1b541286dacf4c2f165f2871d09a99500518b3&ipo=images" }
];

const mostVisited = [
    { title: "Arc Browser", desc: "Figma - Design System", img: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse3.mm.bing.net%2Fth%2Fid%2FOIP.AwI7pgj78kSUHtEXGvjQngHaEK%3Fpid%3DApi&f=1&ipt=ba191dcbee3797fdb3836a5f9f373e0a57429d1f60321e6e8500d8aeb7d27ba2&ipo=images" }
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

// Window Controls
document.getElementById('min-btn').addEventListener('click', () => {
    window.api.minimizeWindow();
});

document.getElementById('max-btn').addEventListener('click', () => {
    window.api.maximizeWindow();
});

document.getElementById('close-btn').addEventListener('click', () => {
    window.api.closeWindow();
});

// Mobile Menu Toggle
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
});

// Close mobile menu when a nav link is clicked
document.querySelectorAll('.mobile-nav-links .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
    });
});

// Initialize
loadData();
// Poll status every 30 seconds
setInterval(checkBackendStatus, 30000);
