// ========== CONFIGURACIÓN ==========
const API_URL = 'https://693843864618a71d77cf99b8.mockapi.io/Api';

// ========== ESTADO GLOBAL ==========
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;

// ========== ELEMENTOS DEL DOM ==========
const DOM = {
    taskTitle: null,
    taskDescription: null,
    taskPriority: null,
    addTaskBtn: null,
    tasksList: null,
    filterBtns: null,
    editModal: null,
    closeModalBtn: null,
    cancelEditBtn: null,
    saveEditBtn: null,
    errorMessage: null,
    editTitle: null,
    editDescription: null,
    editPriority: null
};

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', () => {
    initializeDOMElements();
    setupEventListeners();
    loadTasks();
});

function initializeDOMElements() {
    DOM.taskTitle = document.getElementById('taskTitle');
    DOM.taskDescription = document.getElementById('taskDescription');
    DOM.taskPriority = document.getElementById('taskPriority');
    DOM.addTaskBtn = document.getElementById('addTaskBtn');
    DOM.tasksList = document.getElementById('tasksList');
    DOM.filterBtns = document.querySelectorAll('.filter-btn');
    DOM.editModal = document.getElementById('editModal');
    DOM.closeModalBtn = document.getElementById('closeModal');
    DOM.cancelEditBtn = document.getElementById('cancelEditBtn');
    DOM.saveEditBtn = document.getElementById('saveEditBtn');
    DOM.errorMessage = document.getElementById('errorMessage');
    DOM.editTitle = document.getElementById('editTitle');
    DOM.editDescription = document.getElementById('editDescription');
    DOM.editPriority = document.getElementById('editPriority');
}

function setupEventListeners() {
    DOM.addTaskBtn.addEventListener('click', addTask);
    
    DOM.filterBtns.forEach(btn => {
        btn.addEventListener('click', handleFilterClick);
    });
    
    DOM.closeModalBtn.addEventListener('click', closeModal);
    DOM.cancelEditBtn.addEventListener('click', closeModal);
    DOM.saveEditBtn.addEventListener('click', saveEdit);
    
    DOM.taskTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
}

// ========== MANEJO DE FILTROS ==========
function handleFilterClick(e) {
    DOM.filterBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
}

// ========== UTILIDADES ==========
function showError(message) {
    DOM.errorMessage.textContent = message;
    DOM.errorMessage.style.display = 'block';
    setTimeout(() => {
        DOM.errorMessage.style.display = 'none';
    }, 4000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(str) {
    const translations = {
        'low': 'Baja',
        'medium': 'Media',
        'high': 'Alta'
    };
    return translations[str] || str;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Hoy a las ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer a las ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

function clearForm() {
    DOM.taskTitle.value = '';
    DOM.taskDescription.value = '';
    DOM.taskPriority.value = 'medium';
}

// ========== API CALLS ==========
async function loadTasks() {
    try {
        DOM.addTaskBtn.classList.add('loading');
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al cargar tareas');
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        showError('Error al cargar las tareas');
        console.error(error);
    } finally {
        DOM.addTaskBtn.classList.remove('loading');
    }
}

async function addTask() {
    const title = DOM.taskTitle.value.trim();
    const description = DOM.taskDescription.value.trim();
    const priority = DOM.taskPriority.value;

    if (!title) {
        showError('Por favor ingresa un título para la tarea');
        return;
    }

    try {
        DOM.addTaskBtn.classList.add('loading');
        const newTask = {
            title,
            description: description || '',
            completed: false,
            priority,
            createdAt: new Date().toISOString()
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        });

        if (!response.ok) throw new Error('Error al crear tarea');
        const createdTask = await response.json();
        tasks.push(createdTask);
        clearForm();
        renderTasks();
    } catch (error) {
        showError('Error al crear la tarea');
        console.error(error);
    } finally {
        DOM.addTaskBtn.classList.remove('loading');
    }
}

async function deleteTask(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

    try {
        DOM.addTaskBtn.classList.add('loading');
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar tarea');
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
    } catch (error) {
        showError('Error al eliminar la tarea');
        console.error(error);
    } finally {
        DOM.addTaskBtn.classList.remove('loading');
    }
}

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
        task.completed = !task.completed;
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        if (!response.ok) throw new Error('Error al actualizar tarea');
        renderTasks();
    } catch (error) {
        task.completed = !task.completed;
        showError('Error al actualizar la tarea');
        console.error(error);
    }
}

// ========== MODAL ==========
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    DOM.editTitle.value = task.title;
    DOM.editDescription.value = task.description || '';
    DOM.editPriority.value = task.priority;
    DOM.editModal.classList.add('active');
}

function closeModal() {
    DOM.editModal.classList.remove('active');
    editingTaskId = null;
}

async function saveEdit() {
    if (!editingTaskId) return;

    const title = DOM.editTitle.value.trim();
    const description = DOM.editDescription.value.trim();
    const priority = DOM.editPriority.value;

    if (!title) {
        showError('El título no puede estar vacío');
        return;
    }

    const task = tasks.find(t => t.id === editingTaskId);
    if (!task) return;

    try {
        DOM.saveEditBtn.classList.add('loading');
        task.title = title;
        task.description = description;
        task.priority = priority;

        const response = await fetch(`${API_URL}/${editingTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        if (!response.ok) throw new Error('Error al guardar cambios');
        closeModal();
        renderTasks();
    } catch (error) {
        showError('Error al guardar los cambios');
        console.error(error);
    } finally {
        DOM.saveEditBtn.classList.remove('loading');
    }
}

// ========== RENDERIZADO ==========
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        default:
            return tasks;
    }
}

function renderTasks() {
    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        DOM.tasksList.innerHTML = `
            <div class="empty-state">
                <p>${currentFilter === 'all' ? 'No hay tareas aún. ¡Crea una para comenzar!' : 
                    currentFilter === 'active' ? 'No hay tareas pendientes.' : 
                    'No hay tareas completadas.'}</p>
            </div>
        `;
        return;
    }

    DOM.tasksList.innerHTML = filteredTasks.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? 'checked' : ''}
                onchange="toggleTask('${task.id}')"
            >
            <div class="task-content">
                <div class="task-header">
                    <div class="task-title">${escapeHtml(task.title)}</div>
                    <span class="task-priority priority-${task.priority}">${capitalize(task.priority)}</span>
                </div>
                ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-date">${formatDate(task.createdAt)}</div>
            </div>
            <div class="task-actions">
                <button class="btn-small btn-edit" onclick="openEditModal('${task.id}')">Editar</button>
                <button class="btn-small btn-delete" onclick="deleteTask('${task.id}')">Eliminar</button>
            </div>
        </div>
    `).join('');
}
