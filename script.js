/**
 * LifeOS — Core System Driver
 * Architecture: Local-First, Vanilla Component-State Mapping
 */

// --- Centralized Seed & LocalStorage Engine ---
const DEFAULT_STORAGE = {
    tasks: ["Buy groceries", "Finish LifeOS prototype", "Gym at 6pm"],
    calendar: ["Morning meeting 9:00 AM", "Work block 1:00 PM", "Evening walk 7:00 PM"],
    notes: ["Ideas for startup", "Books to read"],
    boards: ["Vision 2026", "Travel Log: Kyoto Blueprint"]
};

// LocalStorage check and seed
if (!localStorage.getItem('LifeOS_Data')) {
    localStorage.setItem('LifeOS_Data', JSON.stringify(DEFAULT_STORAGE));
}

function getData() {
    return JSON.parse(localStorage.getItem('LifeOS_Data'));
}

function saveData(data) {
    localStorage.setItem('LifeOS_Data', JSON.stringify(data));
}

// --- DOM References ---
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const menuTrigger = document.getElementById('menuTrigger');
const menuContainer = document.getElementById('radialMenuContainer');
const workspaceCard = document.getElementById('workspaceCard');
const universalBoardBtn = document.getElementById('universalBoardBtn');
const universalModal = document.getElementById('universalModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const boardGrid = document.getElementById('boardGrid');
const voiceBtn = document.getElementById('voiceBtn');
const voiceContainer = document.getElementById('draggableVoiceContainer');
const voiceStatus = document.getElementById('voiceStatus');
const commandBody = document.getElementById('commandBody');
const fallbackModal = document.getElementById('fallbackModal');
const fallbackInput = document.getElementById('fallbackInput');
const submitFallbackBtn = document.getElementById('submitFallbackBtn');
const closeFallbackBtn = document.getElementById('closeFallbackBtn');

// --- 1. System Clock & Date Routine ---
function updateTime() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
}
setInterval(updateTime, 1000);
updateTime();

// --- 2. Micro Interaction: Radial Dock Switcher ---
menuTrigger.addEventListener('click', () => {
    menuContainer.classList.toggle('open');
});

// App routing selection click binding
document.querySelectorAll('.menu-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const appTarget = e.currentTarget.getAttribute('data-tool');
        switchAppView(appTarget);
        menuContainer.classList.remove('open');
    });
});

// --- 3. Dynamic Application Template Views ---
function switchAppView(appKey) {
    const store = getData();
    let dynamicHtml = '';

    switch(appKey) {
        case 'taskly':
            dynamicHtml = `
                <div class="app-view-title">✅ Taskly Workspace</div>
                <ul class="app-items-list">
                    ${store.tasks.map(t => `<li class="app-item-row"><span>${t}</span><span style="color:var(--text-secondary); font-size:0.8rem;">Pending</span></li>`).join('')}
                </ul>`;
            break;
        case 'brainly':
            dynamicHtml = `
                <div class="app-view-title">🧠 Brainly Node Repository</div>
                <ul class="app-items-list">
                    ${store.notes.map(n => `<li class="app-item-row"><span><strong>${n}</strong></span><span style="color:var(--accent-purple)">★ Read-only</span></li>`).join('')}
                </ul>`;
            break;
        case 'timely':
            dynamicHtml = `
                <div class="app-view-title">⏳ Timely Core Engine</div>
                <ul class="app-items-list">
                    ${store.calendar.map(c => `<li class="app-item-row"><span>${c}</span><span style="background:rgba(0,0,0,0.05); padding: 4px 8px; border-radius:6px; font-size:0.75rem;">Event</span></li>`).join('')}
                </ul>`;
            break;
        case 'boardly':
            dynamicHtml = `
                <div class="app-view-title">📋 Boardly Visual Space</div>
                <ul class="app-items-list">
                    ${store.boards.map(b => `<li class="app-item-row"><span>📌 ${b}</span></li>`).join('')}
                </ul>`;
            break;
    }
    
    // Add visual crossfade step
    workspaceCard.style.opacity = 0;
    setTimeout(() => {
        workspaceCard.innerHTML = dynamicHtml;
        workspaceCard.style.opacity = 1;
    }, 200);
}

// --- 4. Universal Board (Dynamic Sync Hub Matrix) ---
universalBoardBtn.addEventListener('click', () => {
    renderUniversalHub();
    universalModal.classList.add('open');
});

closeModalBtn.addEventListener('click', () => {
    universalModal.classList.remove('open');
});

function renderUniversalHub() {
    const store = getData();
    boardGrid.innerHTML = ''; // Wipe matrix fresh
    
    // Build multi-context cards mapping down tool channels
    const cardData = [
        ...store.tasks.map(t => ({text: t, type: 'taskly'})),
        ...store.notes.map(n => ({text: n, type: 'brainly'})),
        ...store.calendar.map(c => ({text: c, type: 'timely'})),
        ...store.boards.map(b => ({text: b, type: 'boardly'}))
    ];

    cardData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'hub-card';
        card.innerHTML = `
            <div>
                <span class="card-tag tag-${item.type}">${item.type}</span>
                <div class="card-text">${item.text}</div>
            </div>
            <select class="card-route" data-index="${index}" data-origin="${item.type}">
                <option value="" disabled selected>Send to alternate tool...</option>
                <option value="brainly">Brainly (Notes)</option>
                <option value="boardly">Boardly (Planning)</option>
                <option value="timely">Timely (Calendar)</option>
                <option value="taskly">Taskly (Tasks)</option>
            </select>
        `;
        
        // Listen to active internal tool migrations
        card.querySelector('.card-route').addEventListener('change', (e) => {
            const targetApp = e.target.value;
            executeInternalMigration(item.text, item.type, targetApp);
        });

        boardGrid.appendChild(card);
    });
}

function executeInternalMigration(text, origin, target) {
    if(origin === target) return;
    let store = getData();
    
    // Drop item allocation out of old stack
    const originKey = origin === 'taskly' ? 'tasks' : origin === 'brainly' ? 'notes' : origin === 'timely' ? 'calendar' : 'boards';
    store[originKey] = store[originKey].filter(x => x !== text);

    // Push item allocation into new context stack
    const targetKey = target === 'taskly' ? 'tasks' : target === 'brainly' ? 'notes' : target === 'timely' ? 'calendar' : 'boards';
    store[targetKey].push(text);

    saveData(store);
    renderUniversalHub(); // Hot reload canvas cards
    logInterpreter(`Migrated "${text}" from ${origin} → ${target}`);
}

// --- 5. Natural Language Processing (NLP) Interpreter & Voice Controller ---
let voiceRecognition;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = false;
    voiceRecognition.lang = 'en-US';
    voiceRecognition.interimResults = false;

    voiceRecognition.onstart = () => {
        voiceContainer.classList.add('listening');
        voiceStatus.textContent = "Listening closely...";
    };

    voiceRecognition.onerror = (e) => {
        console.error("Speech parsing block encountered", e);
        voiceContainer.classList.remove('listening');
        voiceStatus.textContent = "Error capturing voice.";
    };

    voiceRecognition.onend = () => {
        voiceContainer.classList.remove('listening');
        voiceStatus.textContent = "Click to talk to LifeOS";
    };

    voiceRecognition.onresult = (event) => {
        const spokenOutput = event.results[0][0].transcript;
        processNaturalLanguageString(spokenOutput);
    };
}

voiceBtn.addEventListener('click', () => {
    if (voiceRecognition) {
        voiceRecognition.start();
    } else {
        // Drop down terminal screen fallback input for lack of Web Speech runtime engine
        fallbackModal.classList.add('open');
        fallbackInput.focus();
    }
});

// Fallback execution hooks
submitFallbackBtn.addEventListener('click', () => {
    if(fallbackInput.value.trim() !== '') {
        processNaturalLanguageString(fallbackInput.value);
        fallbackInput.value = '';
        fallbackModal.classList.remove('open');
    }
});

closeFallbackBtn.addEventListener('click', () => fallbackModal.classList.remove('open'));

function logInterpreter(msg) {
    commandBody.textContent = `⚡ [Parsed]: ${msg}`;
}

// --- 6. Mock NLP Pipeline Core ---
function processNaturalLanguageString(phrase) {
    const cleanStr = phrase.toLowerCase().trim();
    let store = getData();

    // Mapping Command Strings
    if (cleanStr.includes('add task')) {
        const taskContent = phrase.replace(/add task/i, '').trim();
        store.tasks.push(taskContent);
        saveData(store);
        switchAppView('taskly');
        logInterpreter(`Added task: "${taskContent}" to Taskly`);
    } else if (cleanStr.includes('show my tasks') || cleanStr.includes('open taskly')) {
        switchAppView('taskly');
        logInterpreter(`Opened App Panel Workspace: Taskly`);
    } else if (cleanStr.includes('open brainly') || cleanStr.includes('show notes')) {
        switchAppView('brainly');
        logInterpreter(`Opened App Panel Workspace: Brainly`);
    } else if (cleanStr.includes('add note')) {
        const noteContent = phrase.replace(/add note to brainly|add note/i, '').trim();
        store.notes.push(noteContent);
        saveData(store);
        switchAppView('brainly');
        logInterpreter(`Added note: "${noteContent}" to Brainly`);
    } else if (cleanStr.includes('show schedule') || cleanStr.includes('open timely')) {
        switchAppView('timely');
        logInterpreter(`Opened App Panel Workspace: Timely`);
    } else if (cleanStr.includes('open boardly')) {
        switchAppView('boardly');
        logInterpreter(`Opened App Panel Workspace: Boardly`);
    } else {
        logInterpreter(`Unrecognized string vector: "${phrase}". Try "add task..." or "open..."`);
    }
}

// --- 7. UX Feature: Absolute Bound Fluid Draggable Voice Button Container ---
let dragActive = false;
let currentX; let currentY; let initialX; let initialY;
let xOffset = 0; let yOffset = 0;

voiceContainer.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', dragMove);
document.addEventListener('mouseup', dragEnd);

function dragStart(e) {
    if (e.target === voiceBtn || voiceBtn.contains(e.target)) {
        // Allow button click to pass without activating sticky layout displacement lock
        if(e.type === 'mousedown') return; 
    }
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.currentTarget === voiceContainer) { dragActive = true; }
}

function dragMove(e) {
    if (dragActive) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        setTranslate(currentX, currentY, voiceContainer);
    }
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    dragActive = false;
}

function setTranslate(xPos, yPos, el) {
    // Retain default CSS centering rules when compounding transform matrix properties
    el.style.transform = `translate(calc(-50% + ${xPos}px), ${yPos}px)`;
}

// Boot View State Initializer
switchAppView('taskly');
