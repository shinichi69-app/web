// Web Builder Pro - Main Application

class WebBuilder {
    constructor() {
        this.sections = [];
        this.selectedElement = null;
        this.selectedSection = null;
        this.elementIdCounter = 0;
        this.sectionIdCounter = 0;
        this.isDragging = false;
        this.dragElement = null;

        this.canvas = document.getElementById('canvas');
        this.propertyPanel = document.getElementById('propertyPanel');
        this.emptyState = this.canvas.querySelector('.empty-state');

        this.init();
    }

    init() {
        // Load saved data
        this.loadFromStorage();

        // Event listeners
        document.getElementById('addSectionBtn').addEventListener('click', () => this.addSection());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToStorage());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportHTML());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadFromFile());

        // Element items click
        document.querySelectorAll('.element-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.dataset.type;
                this.addElementToSelectedSection(type);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedElement) {
                    this.deleteElement(this.selectedElement);
                }
            }
            if (e.key === 'Escape') {
                this.deselectAll();
            }
        });

        // Initial section if empty
        if (this.sections.length === 0) {
            this.addSection();
        } else {
            this.renderAll();
        }
    }

    // --- Section Management ---

    addSection() {
        const section = {
            id: `section-${++this.sectionIdCounter}`,
            elements: []
        };
        this.sections.push(section);
        this.renderAll();
        this.selectSection(section.id);
        this.updateEmptyState();
        this.showNotification('✅ เพิ่ม Section ใหม่แล้ว');
        return section;
    }

    deleteSection(sectionId) {
        if (this.sections.length <= 1) {
            this.showNotification('⚠️ ต้องมีอย่างน้อย 1 Section');
            return;
        }
        const index = this.sections.findIndex(s => s.id === sectionId);
        if (index !== -1) {
            this.sections.splice(index, 1);
            this.renderAll();
            this.updateEmptyState();
            this.showNotification('🗑️ ลบ Section แล้ว');
            if (this.selectedSection === sectionId) {
                this.selectedSection = null;
                this.selectedElement = null;
                this.updatePropertyPanel();
            }
        }
    }

    moveSection(sectionId, direction) {
        const index = this.sections.findIndex(s => s.id === sectionId);
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.sections.length) return;
        [this.sections[index], this.sections[newIndex]] = [this.sections[newIndex], this.sections[index]];
        this.renderAll();
        this.selectSection(sectionId);
    }

    selectSection(sectionId) {
        this.selectedSection = sectionId;
        this.selectedElement = null;
        this.renderAll();
        this.updatePropertyPanel();
    }

    // --- Element Management ---

    addElementToSelectedSection(type) {
        if (!this.selectedSection) {
            this.showNotification('⚠️ กรุณาเลือก Section ก่อน');
            return;
        }

        const section = this.sections.find(s => s.id === this.selectedSection);
        if (!section) return;

        const element = this.createElement(type);
        section.elements.push(element);
        this.renderAll();
        this.selectElement(element.id);
        this.showNotification(`✅ เพิ่ม ${this.getTypeName(type)} แล้ว`);
    }

    createElement(type) {
        const id = `elem-${++this.elementIdCounter}`;
        const base = {
            id,
            type,
            styles: {},
            classes: []
        };

        switch (type) {
            case 'heading':
                return { ...base, content: 'หัวข้อใหม่', level: 'h1' };
            case 'paragraph':
                return { ...base, content: 'ข้อความใหม่ที่นี่' };
            case 'image':
                return { ...base, src: 'https://via.placeholder.com/400x200', alt: 'รูปภาพ' };
            case 'button':
                return { ...base, content: 'ปุ่ม', link: '#' };
            case 'container':
                return { ...base, elements: [] };
            default:
                return { ...base, content: '' };
        }
    }

    deleteElement(elementId) {
        if (!this.selectedSection) return;
        const section = this.sections.find(s => s.id === this.selectedSection);
        if (!section) return;

        const index = section.elements.findIndex(e => e.id === elementId);
        if (index !== -1) {
            section.elements.splice(index, 1);
            this.renderAll();
            this.selectedElement = null;
            this.updatePropertyPanel();
            this.showNotification('🗑️ ลบ元素แล้ว');
        }
    }

    selectElement(elementId) {
        this.selectedElement = elementId;
        this.renderAll();
        this.updatePropertyPanel();
    }

    getElementById(elementId) {
        for (const section of this.sections) {
            for (const element of section.elements) {
                if (element.id === elementId) return element;
                if (element.type === 'container' && element.elements) {
                    const found = this.findInContainer(element, elementId);
                    if (found) return found;
                }
            }
        }
        return null;
    }

    findInContainer(container, elementId) {
        for (const child of container.elements) {
            if (child.id === elementId) return child;
            if (child.type === 'container' && child.elements) {
                const found = this.findInContainer(child, elementId);
                if (found) return found;
            }
        }
        return null;
    }

    getTypeName(type) {
        const names = {
            heading: 'หัวข้อ',
            paragraph: 'ย่อหน้า',
            image: 'รูปภาพ',
            button: 'ปุ่ม',
            container: 'กล่อง'
        };
        return names[type] || type;
    }

    // --- Rendering ---

    renderAll() {
        // Remove old sections (keep empty state)
        const sections = this.canvas.querySelectorAll('.section');
        sections.forEach(el => el.remove());

        if (this.sections.length === 0) {
            this.emptyState.style.display = 'block';
            return;
        }
        this.emptyState.style.display = 'none';

        this.sections.forEach((section, index) => {
            const sectionEl = this.renderSection(section, index);
            this.canvas.appendChild(sectionEl);
        });
    }

    renderSection(section, index) {
        const div = document.createElement('div');
        div.className = `section ${section.id === this.selectedSection ? 'selected' : ''}`;
        div.dataset.sectionId = section.id;

        // Header
        const header = document.createElement('div');
        header.className = 'section-header';
        header.innerHTML = `
            <h5>📄 Section ${index + 1} (${section.elements.length} elements)</h5>
            <div class="section-controls">
                <button class="move-up-btn" title="เลื่อนขึ้น"><i class="fas fa-chevron-up"></i></button>
                <button class="move-down-btn" title="เลื่อนลง"><i class="fas fa-chevron-down"></i></button>
                <button class="delete-btn" title="ลบ Section"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Section click to select
        div.addEventListener('click', (e) => {
            if (e.target.closest('.section-controls')) return;
            if (e.target.closest('.element-wrapper')) return;
            this.selectSection(section.id);
        });

        // Controls
        header.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteSection(section.id);
        });

        header.querySelector('.move-up-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveSection(section.id, 'up');
        });

        header.querySelector('.move-down-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.moveSection(section.id, 'down');
        });

        // Content
        const content = document.createElement('div');
        content.className = 'section-content';

        section.elements.forEach(element => {
            const wrapper = this.renderElement(element);
            content.appendChild(wrapper);
        });

        // Drop zone for adding elements
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.style.cssText = `
            text-align: center;
            padding: 12px;
            color: #aaa;
            font-size: 13px;
            border: 1px dashed #ddd;
            border-radius: 8px;
            margin-top: 8px;
            cursor: pointer;
            transition: all 0.2s;
        `;
        dropZone.textContent = '+ คลิกเพื่อเพิ่ม元素';
        dropZone.addEventListener('click', () => {
            // Show element picker or add default
            const types = ['heading', 'paragraph', 'image', 'button', 'container'];
            const type = prompt('เลือกประเภท元素 (heading, paragraph, image, button, container):', 'paragraph');
            if (type && types.includes(type)) {
                this.selectedSection = section.id;
                this.addElementToSelectedSection(type);
            }
        });

        content.appendChild(dropZone);

        div.appendChild(header);
        div.appendChild(content);

        return div;
    }

    renderElement(element) {
        const wrapper = document.createElement('div');
        wrapper.className = `element-wrapper ${element.id === this.selectedElement ? 'selected' : ''}`;
        wrapper.dataset.elementId = element.id;

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-element-btn';
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteElement(element.id);
        });
        wrapper.appendChild(deleteBtn);

        // Click to select
        wrapper.addEventListener('click', (e) => {
            if (e.target.closest('.delete-element-btn')) return;
            e.stopPropagation();
            this.selectElement(element.id);
        });

        // Render content based on type
        const content = this.createElementContent(element);
        wrapper.appendChild(content);

        return wrapper;
    }

    createElementContent(element) {
        const div = document.createElement('div');

        switch (element.type) {
            case 'heading': {
                const el = document.createElement(element.level || 'h1');
                el.textContent = element.content || 'หัวข้อ';
                el.contentEditable = true;
                el.addEventListener('blur', () => {
                    element.content = el.textContent;
                    this.saveToStorage();
                });
                div.appendChild(el);
                break;
            }
            case 'paragraph': {
                const el = document.createElement('p');
                el.textContent = element.content || 'ข้อความ';
                el.contentEditable = true;
                el.addEventListener('blur', () => {
                    element.content = el.textContent;
                    this.saveToStorage();
                });
                div.appendChild(el);
                break;
            }
            case 'image': {
                const el = document.createElement('img');
                el.src = element.src || 'https://via.placeholder.com/400x200';
                el.alt = element.alt || 'รูปภาพ';
                el.style.maxWidth = '100%';
                el.style.borderRadius = '8px';
                div.appendChild(el);
                break;
            }
            case 'button': {
                const el = document.createElement('button');
                el.textContent = element.content || 'ปุ่ม';
                if (element.link && element.link !== '#') {
                    el.addEventListener('click', () => window.open(element.link, '_blank'));
                }
                div.appendChild(el);
                break;
            }
            case 'container': {
                const inner = document.createElement('div');
                inner.className = 'container-inner';
                inner.style.cssText = `
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px dashed #ddd;
                    min-height: 40px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                `;

                // Render child elements
                if (element.elements && element.elements.length > 0) {
                    element.elements.forEach(child => {
                        const childWrapper = this.renderElement(child);
                        inner.appendChild(childWrapper);
                    });
                }

                // Add element button inside container
                const addBtn = document.createElement('button');
                addBtn.textContent = '+ เพิ่ม元素ในกล่อง';
                addBtn.style.cssText = `
                    background: transparent;
                    border: 1px dashed #ccc;
                    color: #888;
                    padding: 6px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                `;
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const types = ['heading', 'paragraph', 'image', 'button'];
                    const type = prompt('เลือกประเภท元素 (heading, paragraph, image, button):', 'paragraph');
                    if (type && types.includes(type)) {
                        const newChild = this.createElement(type);
                        if (!element.elements) element.elements = [];
                        element.elements.push(newChild);
                        this.renderAll();
                        this.selectElement(newChild.id);
                        this.showNotification(`✅ เพิ่ม ${this.getTypeName(type)} ในกล่องแล้ว`);
                    }
                });
                inner.appendChild(addBtn);

                div.appendChild(inner);
                break;
            }
            default: {
                const el = document.createElement('div');
                el.textContent = 'Unknown element';
                div.appendChild(el);
            }
        }

        return div;
    }

    // --- Property Panel ---

    updatePropertyPanel() {
        if (!this.selectedElement) {
            this.propertyPanel.innerHTML = `
                <p>🎯 คลิกที่元素เพื่อแก้ไข</p>
                <p style="font-size:12px;color:#bbb;margin-top:4px;">หรือคลิก Section เพื่อเลือก</p>
            `;
            return;
        }

        const element = this.getElementById(this.selectedElement);
        if (!element) {
            this.propertyPanel.innerHTML = `<p>⚠️ ไม่พบ元素</p>`;
            return;
        }

        let html = `<div class="property-group"><label>🔹 ประเภท</label><input value="${this.getTypeName(element.type)}" disabled style="background:#f0f0f0;"></div>`;
        html += `<div class="property-group"><label>🆔 ID</label><input value="${element.id}" disabled style="background:#f0f0f0;font-size:11px;"></div>`;

        switch (element.type) {
            case 'heading':
                html += `
                    <div class="property-group"><label>📝 ข้อความ</label><input id="prop-content" value="${element.content || ''}" placeholder="ข้อความหัวข้อ"></div>
                    <div class="property-group"><label>📏 ระดับ</label>
                        <select id="prop-level">
                            <option value="h1" ${element.level === 'h1' ? 'selected' : ''}>H1</option>
                            <option value="h2" ${element.level === 'h2' ? 'selected' : ''}>H2</option>
                            <option value="h3" ${element.level === 'h3' ? 'selected' : ''}>H3</option>
                            <option value="h4" ${element.level === 'h4' ? 'selected' : ''}>H4</option>
                        </select>
                    </div>
                `;
                break;
            case 'paragraph':
                html += `
                    <div class="property-group"><label>📝 ข้อความ</label><textarea id="prop-content" rows="3">${element.content || ''}</textarea></div>
                `;
                break;
            case 'image':
                html += `
                    <div class="property-group"><label>🔗 URL รูป</label><input id="prop-src" value="${element.src || ''}" placeholder="https://example.com/image.jpg"></div>
                    <div class="property-group"><label>📝 คำอธิบาย</label><input id="prop-alt" value="${element.alt || ''}" placeholder="คำอธิบายรูป"></div>
                `;
                break;
            case 'button':
                html += `
                    <div class="property-group"><label>📝 ข้อความ</label><input id="prop-content" value="${element.content || ''}" placeholder="ข้อความปุ่ม"></div>
                    <div class="property-group"><label>🔗 ลิงก์</label><input id="prop-link" value="${element.link || ''}" placeholder="https://example.com"></div>
                `;
                break;
            case 'container':
                html += `
                    <div class="property-group"><label>📦 จำนวน元素ภายใน</label><input value="${(element.elements || []).length} ชิ้น" disabled style="background:#f0f0f0;"></div>
                    <div class="property-group"><label>🎨 สีพื้นหลัง</label><input id="prop-bg" type="color" value="${element.styles?.backgroundColor || '#f8f9fa'}"></div>
                `;
                break;
        }

        // Common properties
        html += `
            <div class="property-group"><label>📐 Padding</label><input id="prop-padding" value="${element.styles?.padding || '8px'}" placeholder="8px"></div>
            <div class="property-group"><label>🎨 สีข้อความ</label><input id="prop-color" type="color" value="${element.styles?.color || '#1a1a2e'}"></div>
        `;

        this.propertyPanel.innerHTML = html;

        // Event listeners for property changes
        this.attachPropertyListeners(element);
    }

    attachPropertyListeners(element) {
        // Content
        const contentInput = document.getElementById('prop-content');
        if (contentInput) {
            contentInput.addEventListener('change', () => {
                element.content = contentInput.value;
                this.renderAll();
                this.saveToStorage();
            });
            contentInput.addEventListener('input', () => {
                element.content = contentInput.value;
                this.renderAll();
            });
        }

        // Level (heading)
        const levelSelect = document.getElementById('prop-level');
        if (levelSelect) {
            levelSelect.addEventListener('change', () => {
                element.level = levelSelect.value;
                this.renderAll();
                this.saveToStorage();
            });
        }

        // Image src
        const srcInput = document.getElementById('prop-src');
        if (srcInput) {
            srcInput.addEventListener('change', () => {
                element.src = srcInput.value;
                this.renderAll();
                this.saveToStorage();
            });
        }

        // Image alt
        const altInput = document.getElementById('prop-alt');
        if (altInput) {
            altInput.addEventListener('change', () => {
                element.alt = altInput.value;
                this.renderAll();
                this.saveToStorage();
            });
        }

        // Button link
        const linkInput = document.getElementById('prop-link');
        if (linkInput) {
            linkInput.addEventListener('change', () => {
                element.link = linkInput.value;
                this.renderAll();
                this.saveToStorage();
            });
        }

        // Padding
        const paddingInput = document.getElementById('prop-padding');
        if (paddingInput) {
            paddingInput.addEventListener('change', () => {
                if (!element.styles) element.styles = {};
                element.styles.padding = paddingInput.value;
                this.applyStylesToElement(element);
                this.saveToStorage();
            });
        }

        // Color
        const colorInput = document.getElementById('prop-color');
        if (colorInput) {
            colorInput.addEventListener('change', () => {
                if (!element.styles) element.styles = {};
                element.styles.color = colorInput.value;
                this.applyStylesToElement(element);
                this.saveToStorage();
            });
        }

        // Background color (container)
        const bgInput = document.getElementById('prop-bg');
        if (bgInput) {
            bgInput.addEventListener('change', () => {
                if (!element.styles) element.styles = {};
                element.styles.backgroundColor = bgInput.value;
                this.applyStylesToElement(element);
                this.saveToStorage();
            });
        }
    }

    applyStylesToElement(element) {
        // Find and update the rendered element
        const wrapper = document.querySelector(`[data-element-id="${element.id}"]`);
        if (wrapper) {
            const content = wrapper.querySelector('div:not(.delete-element-btn)');
            if (content) {
                if (element.styles) {
                    Object.entries(element.styles).forEach(([key, value]) => {
                        content.style[key] = value;
                    });
                }
            }
        }
    }

    // --- Utility ---

    deselectAll() {
        this.selectedElement = null;
        this.selectedSection = null;
        this.renderAll();
        this.updatePropertyPanel();
    }

    updateEmptyState() {
        if (this.sections.length === 0) {
            this.emptyState.style.display = 'block';
        } else {
            this.emptyState.style.display = 'none';
        }
    }

    showNotification(message) {
        // Simple notification
        const old = document.querySelector('.notification');
        if (old) old.remove();

        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            padding: 12px 24px;
            background: #1a1a2e;
            color: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            font-size: 14px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = message;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notif);

        setTimeout(() => {
            notif.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notif.remove(), 300);
        }, 2500);
    }

    // --- Storage ---

    saveToStorage() {
        try {
            const data = {
                sections: this.sections,
                counters: {
                    elementId: this.elementIdCounter,
                    sectionId: this.sectionIdCounter
                }
            };
            localStorage.setItem('webBuilderData', JSON.stringify(data));
            this.showNotification('💾 บันทึกเรียบร้อย!');
        } catch (e) {
            console.error('Save error:', e);
            this.showNotification('❌ บันทึกไม่สำเร็จ');
        }
    }

    loadFromStorage() {
        try {
            const raw = localStorage.getItem('webBuilderData');
            if (!raw) return;

            const data = JSON.parse(raw);
            this.sections = data.sections || [];
            this.elementIdCounter = data.counters?.elementId || 0;
            this.sectionIdCounter = data.counters?.sectionId || 0;

            // Restore selected section
            if (this.sections.length > 0) {
                this.selectedSection = this.sections[0].id;
            }
        } catch (e) {
            console.error('Load error:', e);
        }
    }

    // --- Export ---

    exportHTML() {
        // Generate complete HTML
        let elementsHTML = '';
        this.sections.forEach((section, index) => {
            elementsHTML += `
                <div class="section" style="background:white;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                    <h5 style="color:#888;font-size:13px;margin-bottom:12px;border-bottom:1px solid #eee;padding-bottom:12px;">📄 Section ${index + 1}</h5>
                    ${this.exportElements(section.elements)}
                </div>
            `;
        });

        const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Builder Pro - Export</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; background: #f0f2f5; padding: 40px 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .section { background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .section h5 { color: #888; font-size: 13px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 12px; }
        .element-wrapper { padding: 6px 10px; }
        .element-wrapper h1, .element-wrapper h2, .element-wrapper h3, .element-wrapper h4 { margin: 0; }
        .element-wrapper p { margin: 0; line-height: 1.6; }
        .element-wrapper img { max-width: 100%; border-radius: 8px; }
        .element-wrapper button { padding: 8px 20px; background: #e94560; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
        .element-wrapper button:hover { background: #c23152; }
        .container-inner { padding: 16px; background: #f8f9fa; border-radius: 8px; border: 1px dashed #ddd; min-height: 40px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 style="text-align:center;color:#1a1a2e;margin-bottom:30px;">🧩 Web Builder Pro</h1>
        ${elementsHTML}
        <p style="text-align:center;color:#999;font-size:13px;margin-top:20px;">สร้างด้วย Web Builder Pro</p>
    </div>
</body>
</html>`;

        // Download
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `web-builder-export-${new Date().toISOString().slice(0,10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('📤 Export HTML เรียบร้อย!');
    }

    exportElements(elements) {
        let html = '';
        for (const element of elements) {
            html += `<div class="element-wrapper">`;
            switch (element.type) {
                case 'heading':
                    html += `<${element.level || 'h1'}>${element.content || 'หัวข้อ'}</${element.level || 'h1'}>`;
                    break;
                case 'paragraph':
                    html += `<p>${element.content || 'ข้อความ'}</p>`;
                    break;
                case 'image':
                    html += `<img src="${element.src || 'https://via.placeholder.com/400x200'}" alt="${element.alt || 'รูปภาพ'}" style="max-width:100%;border-radius:8px;">`;
                    break;
                case 'button':
                    html += `<button style="padding:8px 20px;background:#e94560;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">${element.content || 'ปุ่ม'}</button>`;
                    break;
                case 'container':
                    html += `<div class="container-inner">${this.exportElements(element.elements || [])}</div>`;
                    break;
            }
            html += `</div>`;
        }
        return html;
    }

    // --- Load from file ---

    loadFromFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    this.sections = data.sections || [];
                    this.elementIdCounter = data.counters?.elementId || 0;
                    this.sectionIdCounter = data.counters?.sectionId || 0;
                    this.selectedSection = this.sections.length > 0 ? this.sections[0].id : null;
                    this.selectedElement = null;
                    this.renderAll();
                    this.updatePropertyPanel();
                    this.updateEmptyState();
                    this.showNotification('📂 โหลดไฟล์สำเร็จ!');
                } catch (err) {
                    this.showNotification('❌ โหลดไฟล์ไม่สำเร็จ: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const builder = new WebBuilder();
    window.builder = builder; // For debugging
});
