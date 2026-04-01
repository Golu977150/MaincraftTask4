// ---------- Task Data Model ----------
let tasks = [];     // each task: { id, name, completed }

// DOM elements
const taskInput = document.getElementById('taskNameInput');
const addBtn = document.getElementById('addTaskBtn');
const taskListEl = document.getElementById('taskList');
const searchInput = document.getElementById('searchTaskInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const taskCounterSpan = document.getElementById('taskCounter');
const clearAllBtn = document.getElementById('clearAllTasksBtn');

// current filter & search state
let currentFilter = 'all';     // 'all', 'pending', 'completed'
let currentSearchQuery = '';

// ---------- Helper: Save to localStorage ----------
function saveToLocalStorage() {
    localStorage.setItem('taskManagerTasks', JSON.stringify(tasks));
}

// ---------- Load tasks from localStorage ----------
function loadTasksFromStorage() {
    const stored = localStorage.getItem('taskManagerTasks');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                tasks = parsed;
            } else {
                tasks = [];
            }
        } catch (e) {
            tasks = [];
        }
    } else {
        // Default demo tasks for better preview
        tasks = [
            { id: 1001, name: "Review CRUD concepts", completed: false },
            { id: 1002, name: "Design dashboard layout", completed: true },
            { id: 1003, name: "Implement LocalStorage persistence", completed: false }
        ];
        saveToLocalStorage();
    }
}

// ---------- Core Rendering: apply search + filter ----------
function getFilteredAndSearchedTasks() {
    // 1) filter by completion status
    let filtered = tasks.filter(task => {
        if (currentFilter === 'completed') return task.completed === true;
        if (currentFilter === 'pending') return task.completed === false;
        return true; // 'all'
    });

    // 2) search by name (case-insensitive)
    if (currentSearchQuery.trim() !== '') {
        const queryLower = currentSearchQuery.trim().toLowerCase();
        filtered = filtered.filter(task => task.name.toLowerCase().includes(queryLower));
    }
    return filtered;
}

// update task counter
function updateStats() {
    const total = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = total - completedCount;
    taskCounterSpan.innerHTML = `📌 ${total} total  |  ✅ ${completedCount} done  |  ⏳ ${pendingCount} pending`;
}

// escape HTML to prevent XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// render the task list
function renderTaskList() {
    const visibleTasks = getFilteredAndSearchedTasks();

    if (visibleTasks.length === 0) {
        taskListEl.innerHTML = `<div class="empty-message">✨ No tasks match <br> ${currentSearchQuery ? '“' + escapeHtml(currentSearchQuery) + '”' : 'current filter'} ✨</div>`;
        updateStats();
        return;
    }

    let html = '';
    for (let task of visibleTasks) {
        const completionClass = task.completed ? 'completed-task' : '';
        const checkedAttr = task.completed ? 'checked' : '';
        const safeName = escapeHtml(task.name);

        html += `
            <li class="task-item ${completionClass}" data-task-id="${task.id}">
                <div class="task-left">
                    <input type="checkbox" class="task-check" ${checkedAttr} data-id="${task.id}">
                    <span class="task-text">${safeName}</span>
                </div>
                <div class="task-actions">
                    <button class="edit-btn" data-id="${task.id}" title="Edit task">✏️ Edit</button>
                    <button class="delete-btn" data-id="${task.id}" title="Delete task">🗑️ Delete</button>
                </div>
            </li>
        `;
    }
    taskListEl.innerHTML = html;
    updateStats();

    // attach event listeners dynamically
    document.querySelectorAll('.task-check').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const taskId = parseInt(cb.getAttribute('data-id'));
            toggleTaskCompletion(taskId);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(btn.getAttribute('data-id'));
            editTaskById(taskId);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = parseInt(btn.getAttribute('data-id'));
            deleteTaskById(taskId);
        });
    });
}

// ---------- CRUD Operations ----------
function addTask(taskName) {
    const trimmed = taskName.trim();
    if (trimmed === "") {
        alert("❌ Task cannot be empty! Write something productive.");
        return false;
    }
    const newTask = {
        id: Date.now(),
        name: trimmed,
        completed: false
    };
    tasks.push(newTask);
    saveToLocalStorage();
    renderTaskList();
    return true;
}

function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveToLocalStorage();
        renderTaskList();
    }
}

function deleteTaskById(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToLocalStorage();
    renderTaskList();
}

function editTaskById(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    let newName = prompt("✏️ Edit your task:", task.name);
    if (newName === null) return;
    newName = newName.trim();
    if (newName === "") {
        alert("Task name cannot be empty! Edit cancelled.");
        return;
    }
    task.name = newName;
    saveToLocalStorage();
    renderTaskList();
}

function clearAllTasks() {
    if (tasks.length === 0) return;
    const confirmClear = confirm("⚠️ Are you sure you want to delete ALL tasks? This action cannot be undone.");
    if (confirmClear) {
        tasks = [];
        saveToLocalStorage();
        renderTaskList();
    }
}

// ----- SEARCH & FILTER handlers -----
function handleSearch() {
    currentSearchQuery = searchInput.value;
    renderTaskList();
}

function setFilter(filterValue) {
    currentFilter = filterValue;
    filterBtns.forEach(btn => {
        const btnFilter = btn.getAttribute('data-filter');
        if (btnFilter === currentFilter) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    renderTaskList();
}

// ----- Event binding & initialization -----
function initEventListeners() {
    addBtn.addEventListener('click', () => {
        const newTaskName = taskInput.value;
        if (addTask(newTaskName)) {
            taskInput.value = '';
            taskInput.focus();
        }
    });

    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (addTask(taskInput.value)) {
                taskInput.value = '';
            }
        }
    });

    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            handleSearch();
        }, 250);
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterValue = btn.getAttribute('data-filter');
            setFilter(filterValue);
        });
    });

    clearAllBtn.addEventListener('click', () => {
        clearAllTasks();
    });
}

// initialize the application
function init() {
    loadTasksFromStorage();
    initEventListeners();
    currentFilter = 'all';
    currentSearchQuery = '';
    searchInput.value = '';
    setFilter('all');
    renderTaskList();
}

// start the app
init();