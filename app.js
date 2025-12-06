// ========================
// GLOBAL UTILITIES
// ========================
function getData() {
    return JSON.parse(localStorage.getItem("gymData")) || { folders: {} };
}

window.saveData = function(data) {
    localStorage.setItem("gymData", JSON.stringify(data));
};

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function showMessage(message, type = "success") {
    const div = document.createElement('div');
    div.className = type === 'error' ? 'error-message' : 'success-message';
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.remove();
    }, 2000);
}

// Navigation
window.goBack = function() {
    history.back();
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

            let data = getData();
            let id = uid();

            data.folders[id] = {
                name: folderName.value,
                exercises: {},
                createdAt: new Date().toISOString()
            };

            saveData(data);
            folderName.value = "";
            loadFolders();
            showMessage("Folder created!");
        };

        // Enter key support
        folderName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addFolder.click();
            }
        });

        function loadFolders() {
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
        }

        window.openFolder = function(id) {
            location.href = `exercises.html?folder=${id}`;
        };

        window.deleteFolder = function(id) {
            if (!confirm("Are you sure you want to delete this folder? All exercises inside will be lost.")) {
                return;
            }
            
            let data = getData();
            delete data.folders[id];
            saveData(data);
            loadFolders();
            showMessage("Folder deleted");
        };
    });
}

// ========================
// 2) EXERCISES.HTML - EXERCISES IN FOLDER
// ========================
if (page === "exercises.html") {
    document.addEventListener('DOMContentLoaded', function() {
        const params = new URLSearchParams(location.search);
        const folderId = params.get("folder");
        
        if (!folderId) {
            showMessage("No folder specified", "error");
            setTimeout(() => location.href = "index.html", 2000);
            return;
        }

        const data = getData();
        const folder = data.folders[folderId];
        
        if (!folder) {
            showMessage("Folder not found", "error");
            setTimeout(() => location.href = "index.html", 2000);
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

            const exId = uid();
            
            folder.exercises[exId] = {
                name: exerciseName.value,
                sets: 0,
                reps: 0,
                weight: 0,
                notes: "",
                createdAt: new Date().toISOString()
            };

            saveData(data);
            exerciseName.value = "";
            loadExercises();
            updateExerciseCount();
            showMessage("Exercise added!");
        };

        // Enter key support
        exerciseName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addExercise.click();
            }
        });

        function loadExercises() {
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
                
                let li = document.createElement("li");
                li.innerHTML = `
                    <div class="exercise-info">
                        <strong>${exercise.name}</strong>
                        <span class="exercise-meta">
                            Sets: ${exercise.sets || 0} | Reps: ${exercise.reps || 0} | Weight: ${exercise.weight || 0}kg
                        </span>
                    </div>
                    <div class="exercise-actions">
                        <button onclick="openExercise('${folderId}', '${exId}')" class="action-btn open-btn">Open</button>
                        <button onclick="deleteExercise('${folderId}', '${exId}')" class="action-btn delete-btn">Delete</button>
                    </div>
                `;
                exerciseList.appendChild(li);
            });
        }

        function updateExerciseCount() {
            const count = Object.keys(folder.exercises).length;
            exerciseCount.textContent = `${count} exercise${count !== 1 ? 's' : ''}`;
        }

        window.openExercise = function(folderId, exId) {
            location.href = `exercise.html?folder=${folderId}&ex=${exId}`;
        };

        window.deleteExercise = function(folderId, exId) {
            if (!confirm("Are you sure you want to delete this exercise?")) {
                return;
            }
            
            delete folder.exercises[exId];
            saveData(data);
            loadExercises();
            updateExerciseCount();
            showMessage("Exercise deleted");
        };
    });
}

// ========================
// 3) EXERCISE.HTML - SINGLE EXERCISE PAGE
// ========================
if (page === "exercise.html") {
    document.addEventListener('DOMContentLoaded', function() {
        // Get IDs from URL
        const url = new URL(window.location.href);
        const folderId = url.searchParams.get("folder");
        const exerciseId = url.searchParams.get("ex");
        
        if (!folderId || !exerciseId) {
            showMessage("Invalid exercise link", "error");
            setTimeout(() => location.href = "index.html", 2000);
            return;
        }

        // Load data
        let data = getData();
        let folder = data.folders[folderId];
        
        if (!folder) {
            showMessage("Folder not found", "error");
            setTimeout(() => location.href = "index.html", 2000);
            return;
        }
        
        let ex = folder.exercises[exerciseId];
        
        if (!ex) {
            showMessage("Exercise not found", "error");
            setTimeout(() => location.href = "index.html", 2000);
            return;
        }

        // Timer Variables
        let timerInterval;
        let timerSeconds = 90;
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
            timerDisplay: document.getElementById("timerDisplay"),
            timerStart: document.getElementById("timerStart"),
            timerPause: document.getElementById("timerPause"),
            timerReset: document.getElementById("timerReset")
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
                } else {
                    stopTimer();
                }
            }, 1000);
        }

        function pauseTimer() {
            if (!isTimerRunning) return;
            
            isTimerRunning = false;
            clearInterval(timerInterval);
        }

        function stopTimer() {
            isTimerRunning = false;
            clearInterval(timerInterval);
            timerSeconds = 90;
            updateTimerDisplay();
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
            elements.exerciseTitle.textContent = ex.name;
            
            elements.setValue.textContent = ex.sets || 0;
            elements.repValue.textContent = ex.reps || 0;
            
            elements.weightInput.value = ex.weight > 0 ? ex.weight : "";
            elements.exerciseNotes.value = ex.notes || "";
            
            saveData(data);
        }

        // ===============================
        // EDIT EXERCISE NAME
        // ===============================
        elements.editNameBtn.addEventListener('click', () => {
            let newName = prompt("Enter new exercise name:", ex.name);
            if (newName && newName.trim() !== "") {
                ex.name = newName.trim();
                updateUI();
                showMessage("Exercise name updated");
            }
        });

        // ===============================
        // SETS CONTROLS
        // ===============================
        elements.setInc.addEventListener('click', () => {
            ex.sets = (ex.sets || 0) + 1;
            updateUI();
        });

        elements.setDec.addEventListener('click', () => {
            if ((ex.sets || 0) > 0) {
                ex.sets--;
                updateUI();
            }
        });

        // ===============================
        // REPS CONTROLS
        // ===============================
        elements.repInc.addEventListener('click', () => {
            ex.reps = (ex.reps || 0) + 1;
            updateUI();
        });

        elements.repDec.addEventListener('click', () => {
            if ((ex.reps || 0) > 0) {
                ex.reps--;
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
            } else {
                ex.weight = 0;
            }
            
            saveData(data);
        });

        // ===============================
        // NOTES
        // ===============================
        elements.exerciseNotes.addEventListener('input', () => {
            ex.notes = elements.exerciseNotes.value;
            saveData(data);
        });

        // ===============================
        // RESET BUTTON
        // ===============================
        elements.resetBtn.addEventListener('click', () => {
            if (!confirm("Reset all counters to zero?")) return;
            
            ex.sets = 0;
            ex.reps = 0;
            ex.weight = 0;
            
            elements.weightInput.value = "";
            updateUI();
            showMessage("Counters reset");
        });

        // Initialize timer display
        updateTimerDisplay();
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
            createdAt: new Date().toISOString()
        };
        saveData(initialData);
    }
});