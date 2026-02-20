// --- CONFIGURATION ---
const HASHED_PASS = "f2c5e56e409c5a1762c95400569769395f1d4408139534606558e24c585c531d";
let chapters = [];
let currentIdx = 0;

// --- AUTHENTICATION GATE ---
async function checkAuth() {
    const sessionAuth = sessionStorage.getItem("reader_auth");
    if (sessionAuth === "true") return true;

    const pass = prompt("Enter password:");
    
    // Convert input to Hash to compare
    const msgUint8 = new TextEncoder().encode(pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    if (hashHex === HASHED_PASS) {
        sessionStorage.setItem("reader_auth", "true");
        return true;
    } else {
        alert("Denied.");
        return false;
    }
}
// --- CORE FUNCTIONALITY ---

async function loadFile() {
    try {
        const res = await fetch('scraped_chapters_cleaned.txt');
        const text = await res.text();
        
        // Split by your CHAPTER marker
        const parts = text.split(/(--- CHAPTER \d+ ---)/);
        
        // Reset chapters array in case of re-load
        chapters = [];

        for (let i = 1; i < parts.length; i += 2) {
            chapters.push({
                title: parts[i].replace(/---/g, '').trim(),
                content: parts[i + 1].trim()
            });
        }

        // AUTO-RESUME: Load progress from browser memory
        const saved = localStorage.getItem("last_chapter");
        if (saved && chapters[parseInt(saved)]) {
            currentIdx = parseInt(saved);
        }

        render();
    } catch (err) {
        console.error("Failed to load novel file:", err);
        document.getElementById('chapter-body').innerText = "Error loading text file. Ensure it is named correctly.";
    }
}

function render() {
    if (chapters.length === 0) return;

    const body = document.getElementById('chapter-body');
    const title = document.getElementById('chapter-title');
    
    title.innerText = chapters[currentIdx].title;
    body.innerText = chapters[currentIdx].content;
    
    // Smooth scroll to top when changing chapters
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveLocalProgress(index) {
    localStorage.setItem("last_chapter", index);
}

// --- UI EVENT LISTENERS ---

// Settings Menu Toggle
const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
if(settingsToggle) {
    settingsToggle.onclick = () => settingsMenu.classList.toggle('hidden');
}

// Customization listeners
document.getElementById('font-family').onchange = (e) => 
    document.getElementById('chapter-body').style.fontFamily = e.target.value;

document.getElementById('font-size').oninput = (e) => 
    document.getElementById('chapter-body').style.fontSize = e.target.value + 'px';

document.getElementById('font-color').oninput = (e) => 
    document.getElementById('chapter-body').style.color = e.target.value;

// Navigation
document.getElementById('next-btn').onclick = () => { 
    if(currentIdx < chapters.length - 1) { 
        currentIdx++; 
        render(); 
        saveLocalProgress(currentIdx); 
    } 
};

document.getElementById('prev-btn').onclick = () => { 
    if(currentIdx > 0) { 
        currentIdx--; 
        render(); 
        saveLocalProgress(currentIdx); 
    } 
};

// --- INITIALIZATION ---
// Start the app only if Auth passes
if (checkAuth()) {
    loadFile();
}