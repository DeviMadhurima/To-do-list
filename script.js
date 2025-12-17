// Live clock
function updateClock() {
  const now = new Date();
  document.getElementById("currentTime").textContent =
    "Current Time: " + now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// Central store: taskId -> { text, deadline: Date|null, completed, handled }
const tasks = {};
let taskCounter = 0;
function nextTaskId() {
  taskCounter += 1;
  return "task-" + taskCounter;
}

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const sectionSelect = document.getElementById("sectionSelect");
  const deadlineInput = document.getElementById("deadlineInput");
  const rawText = taskInput.value.trim();
  if (!rawText) return;

  const taskId = nextTaskId();

  // Parse deadline safely
  let deadline = null;
  if (deadlineInput.value) {
    // datetime-local yields "YYYY-MM-DDTHH:MM"
    // Build Date manually to avoid parsing issues
    const parts = deadlineInput.value.split(/[T:-]/);
    // parts: [YYYY, MM, DD, HH, MM]
    if (parts.length >= 5) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1; // month 0-based
      const d = parseInt(parts[2], 10);
      const hh = parseInt(parts[3], 10);
      const mm = parseInt(parts[4], 10);
      deadline = new Date(y, m, d, hh, mm, 0, 0);
    }
  }

  // Save to central store
  tasks[taskId] = {
    text: rawText,
    deadline: deadline,
    completed: false,
    handled: false // whether deadline-passed flow already shown
  };

  // Render copies
  renderTaskCopy("#all ul", taskId);
  renderTaskCopy(`#${sectionSelect.value} ul`, taskId);

  // Upcoming within 24h
  if (deadline) {
    const diff = deadline - new Date();
    if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
      renderTaskCopy("#upcoming ul", taskId);
    }
  }

  // Reset inputs
  taskInput.value = "";
  deadlineInput.value = "";

  updateEmptyStates();
  // Run a deadline check immediately for precision
  checkDeadlines();
}

function renderTaskCopy(selector, taskId) {
  const t = tasks[taskId];
  const ul = document.querySelector(selector);
  if (!ul) return;

  const li = document.createElement("li");
  li.dataset.taskId = taskId;

  const span = document.createElement("span");
  span.textContent = composeDisplayText(t);

  // Finish button
  const finishBtn = document.createElement("button");
  finishBtn.textContent = "✅";
  finishBtn.title = "Mark as complete";
  finishBtn.onclick = () => {
    t.completed = true;
    // strike-through across all copies
    const copies = document.querySelectorAll(`li[data-task-id="${taskId}"] span`);
    copies.forEach(s => (s.style.textDecoration = "line-through"));
  };

  // Double-click to reveal delete ONLY if completed
  li.ondblclick = () => {
    if (!t.completed) return;
    if (!li.querySelector(".delete-btn")) {
      const del = document.createElement("button");
      del.textContent = "❌";
      del.className = "delete-btn";
      del.title = "Delete this task";
      del.onclick = () => deleteTaskById(taskId);
      li.appendChild(del);
    }
  };

  li.appendChild(span);
  li.appendChild(finishBtn);
  ul.appendChild(li);
}

function composeDisplayText(t) {
  return t.text + (t.deadline ? " (Deadline: " + t.deadline.toLocaleString() + ")" : "");
}

function deleteTaskById(taskId) {
  // Remove DOM copies
  const nodes = document.querySelectorAll(`li[data-task-id="${taskId}"]`);
  nodes.forEach(n => n.remove());
  // Remove from store
  delete tasks[taskId];
  updateEmptyStates();
}

function updateDeadlineForTask(taskId, newDeadlineStr) {
  const parts = newDeadlineStr.split(/[T:-]/);
  if (parts.length < 5) return;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const hh = parseInt(parts[3], 10);
  const mm = parseInt(parts[4], 10);
  const nd = new Date(y, m, d, hh, mm, 0, 0);

  const t = tasks[taskId];
  if (!t) return;
  t.deadline = nd;
  t.handled = false; // reset handling

  // Update text across copies
  const spans = document.querySelectorAll(`li[data-task-id="${taskId}"] span`);
  spans.forEach(s => (s.textContent = composeDisplayText(t)));

  // Ensure Upcoming reflect within 24h presence
  const in24h = nd - new Date() > 0 && nd - new Date() <= 24 * 60 * 60 * 1000;
  const hasUpcomingCopy = document.querySelector(`#upcoming ul li[data-task-id="${taskId}"]`);
  if (in24h && !hasUpcomingCopy) {
    renderTaskCopy("#upcoming ul", taskId);
  } else if (!in24h && hasUpcomingCopy) {
    hasUpcomingCopy.remove();
  }

  updateEmptyStates();
  checkDeadlines();
}

// Periodic deadline checker (every 30s)
setInterval(checkDeadlines, 30 * 1000);

function checkDeadlines() {
  const now = new Date();
  Object.entries(tasks).forEach(([taskId, t]) => {
    if (!t.deadline) return;
    if (t.handled) return;
    if (now >= t.deadline) {
      // Mark handled so we don't spam
      t.handled = true;

      if (t.completed) {
        const yes = confirm("Deadline passed and task is marked complete. Delete this task?");
        if (yes) deleteTaskById(taskId);
        return;
      }

      // Not completed: ask what to do
      const action = prompt("Deadline passed. Type:\n- delete (to remove)\n- change (to update deadline)\n- keep (to do nothing)");
      if (!action) return;
      const val = action.trim().toLowerCase();
      if (val === "delete") {
        deleteTaskById(taskId);
      } else if (val === "change") {
        const newVal = prompt("Enter new deadline (YYYY-MM-DDTHH:MM):");
        if (newVal) {
          // allow edit and re-handle later
          t.handled = false;
          updateDeadlineForTask(taskId, newVal);
        }
      } // keep → do nothing
    }
  });
}

// Section visibility
function showSection(sectionId) {
  const sections = document.querySelectorAll(".task-section");
  sections.forEach(sec => (sec.style.display = "none"));
  const target = document.getElementById(sectionId);
  target.style.display = "block";
  updateEmptyStates();
}

// Empty state messages (no innerHTML wipes)
function updateEmptyStates() {
  const sections = document.querySelectorAll(".task-section");
  sections.forEach(section => {
    let msg = section.querySelector(".empty-msg");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "empty-msg";
      msg.style.color = "#888";
      msg.style.fontStyle = "italic";
      msg.style.marginTop = "10px";
      section.appendChild(msg);
    }

    const uls = section.querySelectorAll("ul");
    const hasItems = Array.from(uls).some(ul => ul.children.length > 0);
    msg.textContent = hasItems ? "" : "No tasks here ✨";
  });
}

// Show All by default
showSection("all");
