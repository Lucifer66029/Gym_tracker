// ========================
// GLOBAL UTILITIES
// ========================

console.log("Gym Tracker Pro © 2025 - Developed by Mohamed Reda");

function getData() {
  return JSON.parse(localStorage.getItem("gymData")) || { folders: {} };
}

window.saveData = function (data) {
  localStorage.setItem("gymData", JSON.stringify(data));
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function showMessage(message, type = "success") {
  const div = document.createElement("div");
  div.className = type === "error" ? "error-message" : "success-message";
  div.textContent = message;
  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 2000);
}

// Navigation
window.goBack = function () {
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
  document.addEventListener("DOMContentLoaded", function () {
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
        createdAt: new Date().toISOString(),
      };

      saveData(data);
      folderName.value = "";
      loadFolders();
      showMessage("Folder created!");
    };

    // Enter key support
    folderName.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        addFolder.click();
      }
    });

    function loadFolders() {
      let data = getData();
      folderList.innerHTML = "";

      const folders = data.folders;
      const folderIds = Object.keys(folders);

      folderCount.textContent = `${folderIds.length} folder${
        folderIds.length !== 1 ? "s" : ""
      }`;

      if (folderIds.length === 0) {
        folderList.innerHTML = `
                    <li class="empty-state">
                        No folders yet. Create your first workout folder!
                    </li>
                `;
        return;
      }

      folderIds.forEach((id) => {
        const folder = folders[id];
        const exerciseCount = Object.keys(folder.exercises).length;

        let li = document.createElement("li");
        li.innerHTML = `
                    <div class="folder-info">
                        <strong>${folder.name}</strong>
                        <span class="folder-meta">${exerciseCount} exercise${
          exerciseCount !== 1 ? "s" : ""
        }</span>
                    </div>
                    <div class="folder-actions">
                        <button onclick="openFolder('${id}')" class="action-btn open-btn">Open</button>
                        <button onclick="deleteFolder('${id}')" class="action-btn delete-btn">Delete</button>
                    </div>
                `;
        folderList.appendChild(li);
      });
    }

    window.openFolder = function (id) {
      location.href = `exercises.html?folder=${id}`;
    };

    window.deleteFolder = function (id) {
      if (
        !confirm(
          "Are you sure you want to delete this folder? All exercises inside will be lost."
        )
      ) {
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
  document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(location.search);
    const folderId = params.get("folder");

    if (!folderId) {
      showMessage("No folder specified", "error");
      setTimeout(() => (location.href = "index.html"), 2000);
      return;
    }

    const data = getData();
    const folder = data.folders[folderId];

    if (!folder) {
      showMessage("Folder not found", "error");
      setTimeout(() => (location.href = "index.html"), 2000);
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
        createdAt: new Date().toISOString(),
      };

      saveData(data);
      exerciseName.value = "";
      loadExercises();
      updateExerciseCount();
      showMessage("Exercise added!");
    };

    // Enter key support
    exerciseName.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
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

      exerciseIds.forEach((exId) => {
        const exercise = exercises[exId];

        let li = document.createElement("li");
        li.innerHTML = `
                    <div class="exercise-info">
                        <strong>${exercise.name}</strong>
                        <span class="exercise-meta">
                            Sets: ${exercise.sets || 0} | Reps: ${
          exercise.reps || 0
        } | Weight: ${exercise.weight || 0}kg
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
      exerciseCount.textContent = `${count} exercise${count !== 1 ? "s" : ""}`;
    }

    window.openExercise = function (folderId, exId) {
      location.href = `exercise.html?folder=${folderId}&ex=${exId}`;
    };

    window.deleteExercise = function (folderId, exId) {
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
// 3) EXERCISE.HTML - SINGLE EXERCISE PAGE (WITH MULTIPLE SETS)
// ========================
if (page === "exercise.html") {
  document.addEventListener("DOMContentLoaded", function () {
    // Get IDs from URL
    const url = new URL(window.location.href);
    const folderId = url.searchParams.get("folder");
    const exerciseId = url.searchParams.get("ex");

    if (!folderId || !exerciseId) {
      showMessage("Invalid exercise link", "error");
      setTimeout(() => (location.href = "index.html"), 2000);
      return;
    }

    // Load data
    let data = getData();
    let folder = data.folders[folderId];

    if (!folder) {
      showMessage("Folder not found", "error");
      setTimeout(() => (location.href = "index.html"), 2000);
      return;
    }

    let ex = folder.exercises[exerciseId];

    if (!ex) {
      showMessage("Exercise not found", "error");
      setTimeout(() => (location.href = "index.html"), 2000);
      return;
    }

    // Initialize sets array if not exists
    if (!ex.sets) {
      ex.sets = [{ reps: 0, weight: 0, notes: "", id: uid() }];
      saveData(data);
    }

    // Timer Variables
    let timerInterval;
    let timerSeconds = 90;
    let isTimerRunning = false;

    // Elements
    const elements = {
      exerciseTitle: document.getElementById("exerciseTitle"),
      editNameBtn: document.getElementById("editName"),
      exerciseNotes: document.getElementById("exerciseNotes"),
      resetBtn: document.getElementById("reset"),
      timerDisplay: document.getElementById("timerDisplay"),
      timerStart: document.getElementById("timerStart"),
      timerPause: document.getElementById("timerPause"),
      timerReset: document.getElementById("timerReset"),
      addSetBtn: document.getElementById("addSetBtn"),
      setsContainer: document.getElementById("setsContainer"),
      setTemplate: document.getElementById("setTemplate"),
    };

    // Initialize UI
    updateUI();

    // ===============================
    // TIMER FUNCTIONS (Same as before)
    // ===============================
    function updateTimerDisplay() {
      const minutes = Math.floor(timerSeconds / 60);
      const seconds = timerSeconds % 60;
      elements.timerDisplay.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
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
    elements.timerStart.addEventListener("click", startTimer);
    elements.timerPause.addEventListener("click", pauseTimer);
    elements.timerReset.addEventListener("click", stopTimer);

    // Timer Presets
    document.querySelectorAll(".preset-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
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
      elements.exerciseNotes.value = ex.notes || "";

      // Render all sets
      renderSets();
    }

    // ===============================
    // RENDER ALL SETS
    // ===============================
    function renderSets() {
      elements.setsContainer.innerHTML = "";

      ex.sets.forEach((set, index) => {
        const setElement = createSetElement(set, index);
        elements.setsContainer.appendChild(setElement);
      });
    }

    // ===============================
    // CREATE SINGLE SET ELEMENT
    // ===============================
    function createSetElement(set, index) {
      const template = elements.setTemplate.content.cloneNode(true);
      const setElement = template.querySelector(".set-box");

      setElement.dataset.setId = set.id;
      setElement.querySelector(".set-index").textContent = index + 1;

      // Set current values
      setElement.querySelector(".set-rep-value").textContent = set.reps || 0;
      setElement.querySelector(".set-weight-input").value =
        set.weight > 0 ? set.weight : "";
      setElement.querySelector(".set-notes-input").value = set.notes || "";

      // Add event listeners
      const setElementInDoc = document.importNode(template, true);
      const actualSetElement = setElementInDoc.querySelector(".set-box");

      setupSetEventListeners(actualSetElement, set.id);

      return setElementInDoc;
    }

    // ===============================
    // SETUP SET EVENT LISTENERS
    // ===============================
    function setupSetEventListeners(setElement, setId) {
      const set = ex.sets.find((s) => s.id === setId);
      if (!set) return;

      // Reps increase
      setElement.querySelector(".set-rep-inc").addEventListener("click", () => {
        set.reps = (set.reps || 0) + 1;
        setElement.querySelector(".set-rep-value").textContent = set.reps;
        saveData(data);
      });

      // Reps decrease
      setElement.querySelector(".set-rep-dec").addEventListener("click", () => {
        if (set.reps > 0) {
          set.reps--;
          setElement.querySelector(".set-rep-value").textContent = set.reps;
          saveData(data);
        }
      });

      // Weight input
      setElement
        .querySelector(".set-weight-input")
        .addEventListener("input", (e) => {
          let v = parseFloat(e.target.value);
          set.weight = !isNaN(v) && v >= 0 ? v : 0;
          saveData(data);
        });

      // Set notes
      setElement
        .querySelector(".set-notes-input")
        .addEventListener("input", (e) => {
          set.notes = e.target.value;
          saveData(data);
        });

      // Delete set button
      setElement
        .querySelector(".delete-set-btn")
        .addEventListener("click", () => {
          if (ex.sets.length <= 1) {
            showMessage("You must have at least one set", "error");
            return;
          }

          if (confirm("Delete this set?")) {
            const index = ex.sets.findIndex((s) => s.id === setId);
            if (index !== -1) {
              ex.sets.splice(index, 1);
              renderSets();
              saveData(data);
              showMessage("Set deleted");
            }
          }
        });
    }

    // ===============================
    // ADD NEW SET
    // ===============================
    elements.addSetBtn.addEventListener("click", () => {
      const newSet = {
        id: uid(),
        reps: 0,
        weight: 0,
        notes: "",
      };

      ex.sets.push(newSet);
      renderSets();
      saveData(data);
      showMessage("New set added");

      // Scroll to new set
      setTimeout(() => {
        const lastSet = elements.setsContainer.lastElementChild;
        lastSet.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    });

    // ===============================
    // EDIT EXERCISE NAME
    // ===============================
    elements.editNameBtn.addEventListener("click", () => {
      let newName = prompt("Enter new exercise name:", ex.name);
      if (newName && newName.trim() !== "") {
        ex.name = newName.trim();
        updateUI();
        showMessage("Exercise name updated");
      }
    });

    // ===============================
    // EXERCISE NOTES
    // ===============================
    elements.exerciseNotes.addEventListener("input", () => {
      ex.notes = elements.exerciseNotes.value;
      saveData(data);
    });

    // ===============================
    // RESET ALL SETS
    // ===============================
    elements.resetBtn.addEventListener("click", () => {
      if (!confirm("Reset all sets to zero?")) return;

      ex.sets.forEach((set) => {
        set.reps = 0;
        set.weight = 0;
      });

      renderSets();
      saveData(data);
      showMessage("All sets reset");
    });

    // Initialize timer display
    updateTimerDisplay();
  });
}
