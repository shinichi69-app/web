// ===== STATE =====
let state = {
    sections: [], // แต่ละ section มี elements
    selectedElementId: null,
    selectedSectionIndex: null,
    nextId: 1
};

// ===== DOM REFS =====
const canvas = document.getElementById('canvas');
const propertyPanel = document.getElementById('propertyPanel');

// ===== HELPERS =====
function generateId() { return state.nextId++; }

// ===== RENDER =====
function render() {
    if (state.sections.length === 0) {
        canvas.innerHTML = `<div class="empty-state">+ คลิก "เพิ่ม Section" เพื่อเริ่มต้น</div>`;
        return;
    }

    let html = '';
    state.sections.forEach((section, idx) => {
        html += `<div class="section" data-section-index="${idx}">
            <div class="section-tools">
                <span class="delete-section" data-idx="${idx}">🗑️ ลบ</span>
                <span class="move-up" data-idx="${idx}">⬆</span>
                <span class="move-down" data-idx="${idx}">⬇</span>
            </div>`;

        section.elements.forEach(el => {
            const selectedClass = (state.selectedElementId === el.id) ? 'selected' : '';
            html += `<div class="element ${selectedClass}" data-id="${el.id}">`;
            html += renderElementContent(el);
            html += `<button class="delete-btn" data-id="${el.id}">✕</button>`;
            html += `</div>`;
        });

        html += `</div>`;
    });

    canvas.innerHTML = html;

    // Attach Events
    document.querySelectorAll('.element').forEach(elDiv => {
        elDiv.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) return;
            const id = parseInt(elDiv.dataset.id);
            selectElement(id);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            deleteElement(id);
        });
    });

    document.querySelectorAll('.delete-section').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            deleteSection(idx);
        });
    });

    document.querySelectorAll('.move-up').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            moveSection(idx, -1);
        });
    });

    document.querySelectorAll('.move-down').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            moveSection(idx, 1);
        });
    });

    updatePropertyPanel();
}

function renderElementContent(el) {
    switch(el.type) {
        case 'heading':
            return `<h1 style="${el.style || ''}">${el.content || 'หัวข้อ'}</h1>`;
        case 'paragraph':
            return `<p style="${el.style || ''}">${el.content || 'ข้อความตัวอย่าง'}</p>`;
        case 'image':
            return `<img src="${el.src || 'https://via.placeholder.com/150'}" alt="${el.alt || ''}" style="${el.style || ''}" width="${el.width || '100%'}">`;
        case 'button':
            return `<button style="${el.style || ''}">${el.content || 'ปุ่ม'}</button>`;
        case 'container':
            return `<div style="${el.style || ''}">${el.content || 'กล่อง'}</div>`;
        default:
            return `<div>Unknown</div>`;
    }
}

// ===== ACTIONS =====
function addSection() {
    state.sections.push({ elements: [] });
    render();
}

function deleteSection(idx) {
    state.sections.splice(idx, 1);
    if (state.selectedSectionIndex === idx) state.selectedSectionIndex = null;
    render();
}

function moveSection(idx, direction) {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= state.sections.length) return;
    const [removed] = state.sections.splice(idx, 1);
    state.sections.splice(newIdx, 0, removed);
    render();
}

function addElementToSection(sectionIdx, type) {
    const el = {
        id: generateId(),
        type: type,
        content: '',
        style: '',
        src: '',
        alt: '',
        width: ''
    };
    state.sections[sectionIdx].elements.push(el);
    render();
    selectElement(el.id);
}

function deleteElement(id) {
    for (let section of state.sections) {
        const idx = section.elements.findIndex(e => e.id === id);
        if (idx !== -1) {
            section.elements.splice(idx, 1);
            if (state.selectedElementId === id) state.selectedElementId = null;
            render();
            return;
        }
    }
}

function selectElement(id) {
    state.selectedElementId = id;
    render();
}

// ===== PROPERTY PANEL =====
function updatePropertyPanel() {
    if (!state.selectedElementId) {
        propertyPanel.innerHTML = `<p style="color:#6c757d;">👆 คลิกที่ element เพื่อแก้ไข</p>`;
        return;
    }

    // Find element
    let targetEl = null;
    let targetSectionIdx = null;
    let targetElIdx = null;
    for (let si = 0; si < state.sections.length; si++) {
        const idx = state.sections[si].elements.findIndex(e => e.id === state.selectedElementId);
        if (idx !== -1) {
            targetEl = state.sections[si].elements[idx];
            targetSectionIdx = si;
            targetElIdx = idx;
            break;
        }
    }
    if (!targetEl) return;

    let html = `<label>ประเภท: <strong>${targetEl.type}</strong></label>`;

    // Common properties
    html += `<label>เนื้อหา</label><input id="propContent" value="${targetEl.content || ''}" placeholder="ข้อความ...">`;
    html += `<label>CSS Style</label><input id="propStyle" value="${targetEl.style || ''}" placeholder="color:red; font-size:20px;">`;

    if (targetEl.type === 'image') {
        html += `<label>URL รูป</label><input id="propSrc" value="${targetEl.src || ''}" placeholder="https://...">`;
        html += `<label>Alt</label><input id="propAlt" value="${targetEl.alt || ''}">`;
        html += `<label>Width</label><input id="propWidth" value="${targetEl.width || ''}" placeholder="100% หรือ 300px">`;
    }

    propertyPanel.innerHTML = html;

    // Bind events
    document.getElementById('propContent')?.addEventListener('input', function() {
        targetEl.content = this.value;
        render();
    });
    document.getElementById('propStyle')?.addEventListener('input', function() {
        targetEl.style = this.value;
        render();
    });
    document.getElementById('propSrc')?.addEventListener('input', function() {
        targetEl.src = this.value;
        render();
    });
    document.getElementById('propAlt')?.addEventListener('input', function() {
        targetEl.alt = this.value;
        render();
    });
    document.getElementById('propWidth')?.addEventListener('input', function() {
        targetEl.width = this.value;
        render();
    });
}

// ===== DRAG & DROP (จาก Sidebar ไปยัง Section) =====
document.querySelectorAll('.element-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', item.dataset.type);
    });
});

canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    if (!type) return;

    // หา section ที่อยู่ใกล้ที่สุด
    const sectionDiv = e.target.closest('.section');
    if (!sectionDiv) {
        alert('โปรดลากไปวางใน Section');
        return;
    }
    const idx = parseInt(sectionDiv.dataset.sectionIndex);
    if (!isNaN(idx)) {
        addElementToSection(idx, type);
    }
});

// ===== SAVE (LocalStorage) =====
function saveToLocal() {
    localStorage.setItem('webBuilderState', JSON.stringify(state));
    alert('💾 บันทึกเรียบร้อย! (LocalStorage)');
}

function loadFromLocal() {
    const data = localStorage.getItem('webBuilderState');
    if (data) {
        state = JSON.parse(data);
        // ตรวจสอบ nextId
        let maxId = 0;
        state.sections.forEach(s => s.elements.forEach(e => { if (e.id > maxId) maxId = e.id; }));
        state.nextId = maxId + 1;
        render();
        alert('📂 โหลดสำเร็จ!');
    } else {
        alert('❌ ไม่มีข้อมูลที่บันทึกไว้');
    }
}

// ===== EXPORT HTML =====
function exportHTML() {
    if (state.sections.length === 0) {
        alert('ไม่มีเนื้อหาที่จะส่งออก');
        return;
    }

    // สร้าง HTML เนื้อหา
    let bodyContent = '';
    state.sections.forEach(section => {
        section.elements.forEach(el => {
            bodyContent += renderElementContent(el);
        });
    });

    const fullHTML = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>เว็บที่สร้างด้วย Web Builder</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family: 'Segoe UI', sans-serif; }
        body { max-width: 1200px; margin: 0 auto; padding: 30px 20px; background: #fff; }
        img { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    ${bodyContent}
</body>
</html>`;

    // ดาวน์โหลดเป็นไฟล์ .html
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===== EVENT BINDINGS =====
document.getElementById('addSectionBtn').addEventListener('click', addSection);
document.getElementById('saveBtn').addEventListener('click', saveToLocal);
document.getElementById('loadBtn').addEventListener('click', loadFromLocal);
document.getElementById('exportBtn').addEventListener('click', exportHTML);

// ===== INIT =====
render();