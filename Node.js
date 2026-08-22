// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/webbuilder');

// Schema
const ProjectSchema = new mongoose.Schema({
    userId: String,
    name: String,
    state: Object,  // เก็บ JSON ทั้งหมด
    assets: Array,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const Project = mongoose.model('Project', ProjectSchema);

// Upload
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// ===== ROUTES =====
app.get('/api/projects', async (req, res) => {
    const projects = await Project.find({ userId: 'user1' });
    res.json(projects);
});

app.post('/api/projects', async (req, res) => {
    const project = new Project({
        userId: 'user1',
        name: req.body.name || 'โปรเจคใหม่',
        state: req.body.state || { sections: [], nextId: 1 }
    });
    await project.save();
    res.json(project);
});

app.get('/api/projects/:id', async (req, res) => {
    const project = await Project.findById(req.params.id);
    res.json(project);
});

app.put('/api/projects/:id', async (req, res) => {
    const project = await Project.findByIdAndUpdate(
        req.params.id,
        { state: req.body.state, updatedAt: Date.now() },
        { new: true }
    );
    res.json(project);
});

app.post('/api/upload', upload.single('image'), (req, res) => {
    res.json({ filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

app.listen(3000, () => console.log('Server running on port 3000'));