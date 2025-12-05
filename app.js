// ========================
// GLOBAL UTILITIES
// ========================
function getData() {
    try {
        return JSON.parse(localStorage.getItem("gymData")) || { 
            folders: {},
            history: {},
            settings: {
                restTimer: 90,
                theme: 'dark'
            }
        };
    } catch (error) {
        console.error("Error loading data:", error);
        return { folders: {}, history: {}, settings: {} };
    }
}

window.saveData = function(data) {
    try {
        localStorage.setItem("gymData", JSON.stringify(data));
    } catch (error) {
        console.error("Error saving data:", error);
        showMessage("Error saving data", "error");
    }
};

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function showMessage(message, type = "success") {
    const div = document.createElement('div');
    div.className = `${type}-message`;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 3000);
}

// Navigation
window.goBack = function() {
    history.back();
};

window.goHome = function() {
    location.href = "index.html";
};

// ========================
// PAGE ROUTING
// ========================
const page = location.pathname.split("/").pop();

// ========================
// 1) INDEX.HTML - FOLDERS PAGE
// ========================
if (page === "index.html" || page === "") {
    document.addEventListener('DOMContentLoaded', function() {
        const folderName = document.getElementById("folderName");
        const addFolder = document.getElementById("addFolder");
        const folderList = document.getElementById("folderList");
        const folderCount = document.getElementById("folderCount");

        loadFolders();

        addFolder.onclick = () => {
            if (folderName.value.trim() === "") {
                showMessage("Please enter a folder name", "error");
                return;
            }

            try {
                let data = getData();
                let id = uid();

                data.folders[id] = {
                    name: folderName.value,
                    exercises: {},
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                saveData(data);
                folderName.value = "";
                loadFolders();
                showMessage("Folder created successfully!");
                
                // Focus back to input
                folderName.focus();
            } catch (error) {
                console.error("Error creating folder:", error);
                showMessage("Error creating folder", "error");
            }
        };

        // Enter key support
        folderName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addFolder.click();
            }
        });

        function loadFolders() {
            try {
                let data = getData();
                folderList.innerHTML = "";
                
                const folders = data.folders;
                const folderIds = Object.keys(folders);
                
                folderCount.textContent = `${folderIds.length} folder${folderIds.length !== 1 ? 's' : ''}`;
                
                if (folderIds.length === 0) {
                    folderList.innerHTML = `
                        <li class="empty-state">
                            No folders yet. Create your first workout folder!
                        </li>
                    `;
                    return;
                }

                folderIds.forEach(id => {
                    const folder = folders[id];
                    const exerciseCount = Object.keys(folder.exercises).length;
                    
                    let li = document.createElement("li");
                    li.innerHTML = `
                        <div class="folder-info">
                            <strong>${folder.name}</strong>
                            <span class="folder-meta">${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}</span>
                        </div>
                        <div class="folder-actions">
                            <button onclick="openFolder('${id}')" class="action-btn open-btn">Open</button>
                            <button onclick="deleteFolder('${id}')" class="action-btn delete-btn">Delete</button>
                        </div>
                    `;
                    folderList.appendChild(li);
                });
            } catch (error) {
                console.error("Error loading folders:", error);
                showMessage("Error loading folders", "error");
            }
        }

        window.openFolder = function(id) {
            location.href = `exercises.html?folder=${id}`;
        };

        window.deleteFolder = function(id) {
            if (!confirm("Are you sure you want to delete this folder? All exercises inside will be lost.")) {
                return;
            }
            
            try {
                let data = getData();
                delete data.folders[id];
                saveData(data);
                loadFolders();
                showMessage("Folder deleted");
            } catch (error) {
                console.error("Error deleting folder:", error);
                showMessage("Error deleting folder", "error");
            }
        };
    });
}

// ========================
// 2) EXERCISES.HTML - EXERCISES IN FOLDER
// ========================
if (page === "exercises.html") {
    document.addEventListener('DOMContentLoaded', function() {
        try {
            const params = new URLSearchParams(location.search);
            const folderId = params.get("folder");
            
            if (!folderId) {
                showMessage("No folder specified", "error");
                setTimeout(() => goHome(), 2000);
                return;
            }

            const data = getData();
            const folder = data.folders[folderId];
            
            if (!folder) {
                showMessage("Folder not found", "error");
                setTimeout(() => goHome(), 2000);
                return;
            }

            const folderTitle = document.getElementById("folderTitle");
            const exerciseCount = document.getElementById("exerciseCount");
            const exerciseName = document.getElementById("exerciseName");
            const addExercise = document.getElementById("addExercise");
            const exerciseList = document.getElementById("exerciseList");

            folderTitle.textContent = folder.name;
            updateExerciseCount();

            loadExercises();

            addExercise.onclick = () => {
                if (exerciseName.value.trim() === "") {
                    showMessage("Please enter an exercise name", "error");
                    return;
                }

                try {
                    const exId = uid();
                    const now = new Date().toISOString();
                    
                    folder.exercises[exId] = {
                        name: exerciseName.value,
                        sets: 0,
                        reps: 0,
                        weight: 0,
                        notes: "",
                        history: [],
                        createdAt: now,
                        updatedAt: now
                    };

                    saveData(data);
                    exerciseName.value = "";
                    loadExercises();
                    updateExerciseCount();
                    showMessage("Exercise added!");
                    
                    exerciseName.focus();
                } catch (error) {
                    console.error("Error adding exercise:", error);
                    showMessage("Error adding exercise", "error");
                }
            };

            // Enter key support
            exerciseName.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addExercise.click();
                }
            });

            function loadExercises() {
                try {
                    exerciseList.innerHTML = "";
                    const exercises = folder.exercises;
                    const exerciseIds = Object.keys(exercises);
                    
                    if (exerciseIds.length === 0) {
                        exerciseList.innerHTML = `
                            <li class="empty-state">
                                No exercises yet. Add your first exercise!
                            </li>
                        `;
                        return;
                    }

                    exerciseIds.forEach(exId => {
                        const exercise = exercises[exId];
                        const lastDone = exercise.history && exercise.history.length > 0 
                            ? new Date(exercise.history[exercise.history.length - 1].date).toLocaleDateString()
                            : "Never";
                        
                        let li = document.createElement("li");
                        li.innerHTML = `
                            <div class="exercise-info">
                                <strong>${exercise.name}</strong>
                                <span class="exercise-meta">
                                    Last: ${lastDone} | 
                                    Best: ${exercise.bestWeight || 0}kg
                                </span>
                            </div>
                            <div class="exercise-actions">
                                <button onclick="openExercise('${folderId}', '${exId}')" class="action-btn open-btn">Open</button>
                                <button onclick="deleteExercise('${folderId}', '${exId}')" class="action-btn delete-btn">Delete</button>
                            </div>
                        `;
                        exerciseList.appendChild(li);
                    });
                } catch (error) {
                    console.error("Error loading exercises:", error);
                    showMessage("Error loading exercises", "error");
                }
            }

            function updateExerciseCount() {
                const count = Object.keys(folder.exercises).length;
                exerciseCount.textContent = `${count} exercise${count !== 1 ? 's' : ''}`;
            }

            window.openExercise = function(folderId, exId) {
                location.href = `exercise.html?folder=${folderId}&ex=${exId}`;
            };

            window.deleteExercise = function(folderId, exId) {
                if (!confirm("Are you sure you want to delete this exercise? All data will be lost.")) {
                    return;
                }
                
                try {
                    delete folder.exercises[exId];
                    folder.updatedAt = new Date().toISOString();
                    saveData(data);
                    loadExercises();
                    updateExerciseCount();
                    showMessage("Exercise deleted");
                } catch (error) {
                    console.error("Error deleting exercise:", error);
                    showMessage("Error deleting exercise", "error");
                }
            };

        } catch (error) {
            console.error("Error initializing exercises page:", error);
            showMessage("Error loading page", "error");
        }
    });
}

// ========================
// 3) EXERCISE.HTML - SINGLE EXERCISE PAGE
// ========================
if (page === "exercise.html") {
    document.addEventListener('DOMContentLoaded', function() {
        try {
            // Get IDs from URL
            const url = new URL(window.location.href);
            const folderId = url.searchParams.get("folder");
            const exerciseId = url.searchParams.get("ex");
            
            if (!folderId || !exerciseId) {
                showMessage("Invalid exercise link", "error");
                setTimeout(() => goHome(), 2000);
                return;
            }

            // Load data
            let data = getData();
            let folder = data.folders[folderId];
            
            if (!folder) {
                showMessage("Folder not found", "error");
                setTimeout(() => goHome(), 2000);
                return;
            }
            
            let ex = folder.exercises[exerciseId];
            
            if (!ex) {
                showMessage("Exercise not found", "error");
                setTimeout(() => goHome(), 2000);
                return;
            }

            // Initialize exercise if needed
            if (!ex.history) ex.history = [];
            if (!ex.bestWeight) ex.bestWeight = 0;
            if (!ex.totalSets) ex.totalSets = 0;
            if (!ex.totalReps) ex.totalReps = 0;

            // Timer Variables
            let timerInterval;
            let timerSeconds = data.settings?.restTimer || 90;
            let isTimerRunning = false;

            // Elements
            const elements = {
                exerciseTitle: document.getElementById("exerciseTitle"),
                editNameBtn: document.getElementById("editName"),
                setValue: document.getElementById("set-value"),
                repValue: document.getElementById("rep-value"),
                setInc: document.getElementById("set-inc"),
                setDec: document.getElementById("set-dec"),
                repInc: document.getElementById("rep-inc"),
                repDec: document.getElementById("rep-dec"),
                weightInput: document.getElementById("weight-input"),
                exerciseNotes: document.getElementById("exerciseNotes"),
                resetBtn: document.getElementById("reset"),
                saveSessionBtn: document.getElementById("saveSession"),
                viewHistoryBtn: document.getElementById("viewHistory"),
                timerDisplay: document.getElementById("timerDisplay"),
                timerStart: document.getElementById("timerStart"),
                timerPause: document.getElementById("timerPause"),
                timerReset: document.getElementById("timerReset"),
                todaySets: document.getElementById("todaySets"),
                todayReps: document.getElementById("todayReps"),
                totalSets: document.getElementById("totalSets"),
                totalReps: document.getElementById("totalReps"),
                lastWeight: document.getElementById("lastWeight"),
                bestWeight: document.getElementById("bestWeight"),
                volumeStat: document.getElementById("volumeStat"),
                totalRepsStat: document.getElementById("totalRepsStat"),
                timeStat: document.getElementById("timeStat"),
                statsBox: document.getElementById("statsBox")
            };

            // Initialize UI
            updateUI();

            // ===============================
            // TIMER FUNCTIONS
            // ===============================
            function updateTimerDisplay() {
                const minutes = Math.floor(timerSeconds / 60);
                const seconds = timerSeconds % 60;
                elements.timerDisplay.textContent = 
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            function startTimer() {
                if (isTimerRunning) return;
                
                isTimerRunning = true;
                timerInterval = setInterval(() => {
                    if (timerSeconds > 0) {
                        timerSeconds--;
                        updateTimerDisplay();
                        
                        // Play sound when timer reaches 0
                        if (timerSeconds === 0) {
                            playTimerSound();
                        }
                    } else {
                        stopTimer();
                    }
                }, 1000);
                
                elements.timerStart.disabled = true;
                elements.timerPause.disabled = false;
            }

            function pauseTimer() {
                if (!isTimerRunning) return;
                
                isTimerRunning = false;
                clearInterval(timerInterval);
                
                elements.timerStart.disabled = false;
                elements.timerPause.disabled = true;
            }

            function stopTimer() {
                isTimerRunning = false;
                clearInterval(timerInterval);
                timerSeconds = data.settings?.restTimer || 90;
                updateTimerDisplay();
                
                elements.timerStart.disabled = false;
                elements.timerPause.disabled = true;
            }

            function playTimerSound() {
                // Create a simple beep sound
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = 800;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.5);
                } catch (error) {
                    console.log("Audio not supported");
                }
            }

            // Timer Event Listeners
            elements.timerStart.addEventListener('click', startTimer);
            elements.timerPause.addEventListener('click', pauseTimer);
            elements.timerReset.addEventListener('click', stopTimer);

            // Timer Presets
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    timerSeconds = parseInt(this.dataset.time);
                    updateTimerDisplay();
                    if (isTimerRunning) {
                        pauseTimer();
                        startTimer();
                    }
                });
            });

            // ===============================
            // UPDATE UI FUNCTION
            // ===============================
            function updateUI() {
                try {
                    // Update main title
                    elements.exerciseTitle.textContent = ex.name;
                    
                    // Update counters
                    elements.setValue.textContent = ex.sets || 0;
                    elements.repValue.textContent = ex.reps || 0;
                    
                    // Update weight input
                    elements.weightInput.value = ex.weight > 0 ? ex.weight : "";
                    
                    // Update notes
                    elements.exerciseNotes.value = ex.notes || "";
                    
                    // Calculate today's stats
                    const today = new Date().toDateString();
                    const todayHistory = ex.history.filter(h => 
                        new Date(h.date).toDateString() === today
                    );
                    
                    const todaySets = todayHistory.reduce((sum, h) => sum + (h.sets || 0), 0);
                    const todayReps = todayHistory.reduce((sum, h) => sum + (h.reps || 0), 0);
                    
                    elements.todaySets.textContent = todaySets;
                    elements.todayReps.textContent = todayReps;
                    
                    // Update totals
                    elements.totalSets.textContent = ex.totalSets || 0;
                    elements.totalReps.textContent = ex.totalReps || 0;
                    
                    // Update weight history
                    const lastSession = ex.history.length > 0 ? ex.history[ex.history.length - 1] : null;
                    elements.lastWeight.textContent = lastSession ? `${lastSession.weight || 0}kg` : "0kg";
                    elements.bestWeight.textContent = `${ex.bestWeight || 0}kg`;
                    
                    // Update session stats
                    const volume = (ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0);
                    elements.volumeStat.textContent = `${volume}kg`;
                    elements.totalRepsStat.textContent = (ex.sets || 0) * (ex.reps || 0);
                    
                    // Save data
                    saveData(data);
                    
                } catch (error) {
                    console.error("Error updating UI:", error);
                }
            }

            // ===============================
            // EDIT EXERCISE NAME
            // ===============================
            elements.editNameBtn.addEventListener('click', () => {
                let newName = prompt("Enter new exercise name:", ex.name);
                if (newName && newName.trim() !== "") {
                    ex.name = newName.trim();
                    ex.updatedAt = new Date().toISOString();
                    updateUI();
                    showMessage("Exercise name updated");
                }
            });

            // ===============================
            // SETS CONTROLS
            // ===============================
            elements.setInc.addEventListener('click', () => {
                ex.sets = (ex.sets || 0) + 1;
                ex.updatedAt = new Date().toISOString();
                updateUI();
            });

            elements.setDec.addEventListener('click', () => {
                if ((ex.sets || 0) > 0) {
                    ex.sets--;
                    ex.updatedAt = new Date().toISOString();
                    updateUI();
                }
            });

            // ===============================
            // REPS CONTROLS
            // ===============================
            elements.repInc.addEventListener('click', () => {
                ex.reps = (ex.reps || 0) + 1;
                ex.updatedAt = new Date().toISOString();
                updateUI();
            });

            elements.repDec.addEventListener('click', () => {
                if ((ex.reps || 0) > 0) {
                    ex.reps--;
                    ex.updatedAt = new Date().toISOString();
                    updateUI();
                }
            });

            // ===============================
            // WEIGHT INPUT
            // ===============================
            elements.weightInput.addEventListener('input', () => {
                let v = parseFloat(elements.weightInput.value);
                
                if (!isNaN(v) && v >= 0) {
                    ex.weight = v;
                    
                    // Update best weight if this is higher
                    if (v > (ex.bestWeight || 0)) {
                        ex.bestWeight = v;
                    }
                } else {
                    ex.weight = 0;
                }
                
                ex.updatedAt = new Date().toISOString();
                saveData(data);
            });

            // ===============================
            // NOTES
            // ===============================
            elements.exerciseNotes.addEventListener('input', () => {
                ex.notes = elements.exerciseNotes.value;
                ex.updatedAt = new Date().toISOString();
                saveData(data);
            });

            // ===============================
            // SAVE SESSION
            // ===============================
            elements.saveSessionBtn.addEventListener('click', () => {
                if ((ex.sets || 0) === 0 && (ex.reps || 0) === 0) {
                    showMessage("No sets or reps to save", "error");
                    return;
                }

                const session = {
                    date: new Date().toISOString(),
                    sets: ex.sets || 0,
                    reps: ex.reps || 0,
                    weight: ex.weight || 0,
                    notes: ex.notes || "",
                    volume: (ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0)
                };

                ex.history.push(session);
                
                // Update totals
                ex.totalSets = (ex.totalSets || 0) + (ex.sets || 0);
                ex.totalReps = (ex.totalReps || 0) + (ex.reps || 0);
                
                // Reset current counters
                ex.sets = 0;
                ex.reps = 0;
                
                ex.updatedAt = new Date().toISOString();
                
                updateUI();
                showMessage("Session saved successfully!");
                
                // Reset timer
                stopTimer();
            });

            // ===============================
            // RESET BUTTON
            // ===============================
            elements.resetBtn.addEventListener('click', () => {
                if (!confirm("Reset all counters to zero?")) return;
                
                ex.sets = 0;
                ex.reps = 0;
                ex.weight = 0;
                ex.updatedAt = new Date().toISOString();
                
                elements.weightInput.value = "";
                updateUI();
                showMessage("Counters reset");
            });

            // ===============================
            // VIEW HISTORY
            // ===============================
            elements.viewHistoryBtn.addEventListener('click', () => {
                if (ex.history.length === 0) {
                    showMessage("No history available yet", "error");
                    return;
                }
                
                let historyText = "📊 Exercise History:\n\n";
                ex.history.slice(-10).reverse().forEach((session, index) => {
                    const date = new Date(session.date).toLocaleDateString();
                    historyText += `${index + 1}. ${date}: ${session.sets}×${session.reps} @ ${session.weight}kg\n`;
                    if (session.notes) {
                        historyText += `   Notes: ${session.notes}\n`;
                    }
                    historyText += "\n";
                });
                
                alert(historyText);
            });

            // Initialize timer display
            updateTimerDisplay();

            // Auto-save notes on blur
            elements.exerciseNotes.addEventListener('blur', () => {
                saveData(data);
            });

        } catch (error) {
            console.error("Error initializing exercise page:", error);
            showMessage("Error loading exercise", "error");
        }
    });
}

// ========================
// INITIALIZE APP
// ========================
document.addEventListener('DOMContentLoaded', function() {
    // Check if data structure exists
    if (!localStorage.getItem("gymData")) {
        const initialData = {
            folders: {},
            history: {},
            settings: {
                restTimer: 90,
                theme: 'dark',
                soundEnabled: true
            },
            createdAt: new Date().toISOString()
        };
        saveData(initialData);
    }
    
    // Update page title with app name
    if (document.title === "Workout Folders" || !document.title.includes("Gym")) {
        document.title = "🏋️‍♂️ Gym Tracker - " + document.title;
    }
});
// ========================
// MOBILE SCROLLING FIXES
// ========================

// Prevent unwanted scrolling
function preventPullToRefresh() {
    let lastTouchY = 0;
    const body = document.body;
    
    body.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) return;
        lastTouchY = e.touches[0].clientY;
    }, { passive: false });
    
    body.addEventListener('touchmove', function(e) {
        let touchY = e.touches[0].clientY;
        let touchYDelta = touchY - lastTouchY;
        
        // At the top of the page and trying to scroll down
        if (window.scrollY === 0 && touchYDelta > 0) {
            e.preventDefault();
        }
        
        lastTouchY = touchY;
    }, { passive: false });
}

// Fix iOS 100vh issue
function setRealViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Use vh units
    const elements = document.querySelectorAll('.full-height');
    elements.forEach(el => {
        el.style.height = `calc(var(--vh, 1vh) * 100)`;
    });
}

// Handle keyboard appearance on mobile
function handleKeyboard() {
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            setTimeout(() => {
                input.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 300);
        });
    });
}

// Disable zoom on mobile
function disableZoom() {
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// Initialize all mobile fixes
function initMobileFixes() {
    if ('ontouchstart' in window) {
        preventPullToRefresh();
        setRealViewportHeight();
        handleKeyboard();
        disableZoom();
        
        // Recalculate on resize
        window.addEventListener('resize', setRealViewportHeight);
        window.addEventListener('orientationchange', setRealViewportHeight);
    }
}

// Add CSS class for mobile detection
function detectMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('is-mobile');
    } else {
        document.body.classList.add('is-desktop');
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', function() {
    initMobileFixes();
    detectMobile();
    setRealViewportHeight();
    
    // Update CSS variable on resize
    window.addEventListener('resize', setRealViewportHeight);
    
    // Prevent context menu on long press for buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('contextmenu', e => e.preventDefault());
    });
});

// Handle page visibility (for returning from background on mobile)
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        setRealViewportHeight();
    }
});
// ========================
// PWA & OFFLINE FEATURES
// ========================

// Check if app is installed
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone ||
           document.referrer.includes('android-app://');
}

// Install app function
function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                console.log('App installed');
                showMessage('App installed successfully! 🎉');
            }
            deferredPrompt = null;
        });
    }
}

// Detect online/offline status
function setupNetworkDetection() {
    const updateOnlineStatus = () => {
        if (navigator.onLine) {
            console.log('App is online');
            document.body.classList.remove('offline');
        } else {
            console.log('App is offline');
            document.body.classList.add('offline');
            showMessage('You are offline. Some features may be limited.', 'warning');
        }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        });
    }
}

// Send notification
function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'icons/icon-96x96.png'
        });
    }
}

// Badge notification (for newer browsers)
function updateBadge(count) {
    if ('setAppBadge' in navigator) {
        navigator.setAppBadge(count);
    }
}

// Initialize PWA features
function initPWA() {
    if (isAppInstalled()) {
        console.log('Running as installed app');
        document.body.classList.add('installed-app');
    } else {
        console.log('Running in browser');
    }
    
    setupNetworkDetection();
    requestNotificationPermission();
    
    // Check for updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }
}

// Run on startup
document.addEventListener('DOMContentLoaded', initPWA);