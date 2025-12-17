// Show live clock
function updateClock() {
  const now = new Date();
  document.getElementById("currentTime").textContent =
    "Current Time: " + now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

function addTask() {
  const taskInput = document.getElementById("taskInput");
  const sectionSelect = document.getElementById("sectionSelect");
  const deadlineInput = document.getElementById("deadlineInput");
  const taskText = taskInput.value.trim();
  if (taskText === "") return;

  let displayText = taskText;
  let deadline = null;
  if (deadlineInput.value) {
    deadline = new Date(deadlineInput.value);
    displayText += " (Deadline: " + deadline.toLocaleString() + ")";
  }

  // Create li for ALL TASKS
  const liAll = document.createElement("li");
  liAll.textContent = displayText;
  document.querySelector("#all ul").appendChild(liAll);

  // Create li for chosen section
  const liSection = document.createElement("li");
  liSection.textContent = displayText;
  document.querySelector(`#${sectionSelect.value} ul`).appendChild(liSection);

  // If deadline is within 24 hours, add to Upcoming Deadlines
  if (deadline) {
    const now = new Date();
    const diff = deadline - now;
    if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
      const liUpcoming = document.createElement("li");
      liUpcoming.textContent = displayText;
      document.querySelector("#upcoming ul").appendChild(liUpcoming);
    }
  }

  // Reset inputs
  taskInput.value = "";
  deadlineInput.value = "";
}

function showSection(sectionId) {
  const sections = document.querySelectorAll(".task-section");
  sections.forEach(sec => sec.style.display = "none");

  const target = document.getElementById(sectionId);
  target.style.display = "block";

  // If no tasks
  const ulElements = target.querySelectorAll("ul");
  ulElements.forEach(ul => {
    if (ul.children.length === 0) {
      ul.innerHTML = `<p class="no-tasks">No tasks here ✨</p>`;
    }
  });
}
function createTaskElement(text) {
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = text;

  // Finish button
  const finishBtn = document.createElement("button");
  finishBtn.textContent = "✅";
  finishBtn.onclick = () => {
    span.style.textDecoration = "line-through";
    // Hide delete initially
    deleteBtn.style.display = "none";
  };

  // Delete button (hidden by default)
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "❌";
  deleteBtn.style.display = "none";
  deleteBtn.onclick = () => li.remove();

  // Double click to reveal delete
  li.ondblclick = () => {
    if (span.style.textDecoration === "line-through") {
      deleteBtn.style.display = "inline-block";
    }
  };

  li.appendChild(span);
  li.appendChild(finishBtn);
  li.appendChild(deleteBtn);

  return li;
}
