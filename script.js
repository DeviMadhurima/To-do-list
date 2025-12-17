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

  let deadline = null;
  if (deadlineInput.value) {
    deadline = new Date(deadlineInput.value);
  }

  const displayText = taskText + (deadline ? " (Deadline: " + deadline.toLocaleString() + ")" : "");

  // Add to ALL TASKS
  const liAll = createTaskElement(displayText, deadline);
  document.querySelector("#all ul").appendChild(liAll);

  // Add to chosen section
  const liSection = createTaskElement(displayText, deadline);
  document.querySelector(`#${sectionSelect.value} ul`).appendChild(liSection);

  // If deadline is within 24 hours → Upcoming Deadlines
  if (deadline) {
    const now = new Date();
    const diff = deadline - now;
    if (diff > 0 && diff <= 24 * 60 * 60 * 1000) {
      const liUpcoming = createTaskElement(displayText, deadline);
      document.querySelector("#upcoming ul").appendChild(liUpcoming);
    }
  }

  // Reset inputs
  taskInput.value = "";
  deadlineInput.value = "";
}

function createTaskElement(text, deadline) {
  const li = document.createElement("li");
  const span = document.createElement("span");
  span.textContent = text;

  // Finish button
  const finishBtn = document.createElement("button");
  finishBtn.textContent = "✅";
  finishBtn.onclick = () => {
    span.style.textDecoration = "line-through";
    li.dataset.completed = "true";
  };

  // Check deadline expiry every minute
  if (deadline) {
    const checkDeadline = setInterval(() => {
      const now = new Date();
      if (now >= deadline) {
        clearInterval(checkDeadline);
        if (li.dataset.completed === "true") {
          if (confirm("Deadline passed. Task marked complete. Do you want to delete it?")) {
            li.remove();
          }
        } else {
          if (confirm("Deadline passed. Task not completed. Do you want to delete it?")) {
            li.remove();
          } else if (confirm("Do you want to change the deadline?")) {
            const newDeadline = prompt("Enter new deadline (YYYY-MM-DD HH:MM
