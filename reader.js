// --- CONFIGURATION ---
let chapters = [];
let currentIdx = 0;
// SHA-256 fingerprint of "Brood123"
const HASHED_PASS = "0b287101e180acd0f2b3ace09bea6639ebd00aa6b16728e8251430e05971a57c";

// --- AUTHENTICATION GATE ---
async function checkAuth() {
    const sessionAuth = sessionStorage.getItem("reader_auth");
    const container = document.getElementById('reader-container');
    
    // 1. If already logged in, just show the reader and load the file
    if (sessionAuth === "true") {
        if (container) container.style.display = "block";
        await loadFile();
        return true;
    }

    // 2. Ask for password
    const pass = prompt("Enter password to read:");
    if (!pass) return false;

    // HASHING LOGIC
    const msgUint8 = new TextEncoder().encode(pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 3. Compare Hash
    if (hashHex === HASHED_PASS) {
        sessionStorage.setItem("reader_auth", "true");
        if (container) container.style.display = "block";
        await loadFile(); // Load the file only after success
        return true;
    } else {
        alert("Wrong password.");
        document.body.innerHTML = "<h1 style='color:white; text-align:center; margin-top:50px;'>Access Denied</h1>";
        return false;
    }
}

// --- CORE FUNCTIONALITY ---

async function loadFile() {
    try {
        const res = await fetch('scraped_chapters_cleaned.txt');
        const text = await res.text();
        
        const parts = text.split(/(--- CHAPTER\s+\d+\s+---)/i);
        chapters = [];

        if (parts.length < 2) {
            chapters.push({ title: "Full Story", content: text.trim() });
        } else {
            for (let i = 1; i < parts.length; i += 2) {
                chapters.push({
                    title: parts[i].replace(/---/g, '').trim(),
                    content: parts[i + 1].trim()
                });
            }
        }

        const saved = localStorage.getItem("last_chapter");
        if (saved && chapters[parseInt(saved)]) {
            currentIdx = parseInt(saved);
        }

        render();
    } catch (err) {
        console.error("Fetch error:", err);
    }
}

function render() {
    if (chapters.length === 0) return;
    const body = document.getElementById('chapter-body');
    const title = document.getElementById('chapter-title');
    title.innerText = chapters[currentIdx].title;
    body.innerText = chapters[currentIdx].content;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveLocalProgress(index) {
    localStorage.setItem("last_chapter", index);
}

// --- UI EVENT LISTENERS ---

const settingsToggle = document.getElementById('settings-toggle');
const settingsMenu = document.getElementById('settings-menu');
if(settingsToggle) {
    settingsToggle.onclick = () => settingsMenu.classList.toggle('hidden');
}

document.getElementById('font-family').onchange = (e) => 
    document.getElementById('chapter-body').style.fontFamily = e.target.value;

document.getElementById('font-size').oninput = (e) => 
    document.getElementById('chapter-body').style.fontSize = e.target.value + 'px';

document.getElementById('font-color').oninput = (e) => 
    document.getElementById('chapter-body').style.color = e.target.value;

document.getElementById('next-btn').onclick = () => { 
    if(currentIdx < chapters.length - 1) { currentIdx++; render(); saveLocalProgress(currentIdx); } 
};

document.getElementById('prev-btn').onclick = () => { 
    if(currentIdx > 0) { currentIdx--; render(); saveLocalProgress(currentIdx); } 
};

// --- INITIALIZATION ---
// SINGLE CALL: This handles everything correctly
checkAuth();