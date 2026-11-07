const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Base directories
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');

// Helper to determine category from filename
const getCategory = (fileName) => {
  const statusReports = ['PROJECT_STATUS.md', 'OBSOLETE_FILES_REPORT.md', 'QA_TESTING.md', 'ROADMAP.md', 'CHANGELOG.md'];
  const specsPrd = ['PRD.md', 'PROJECT_OVERVIEW.md', 'FEATURES.md', 'FEATURE_TICKETS.md', 'DATA_MODEL.md'];
  const technical = ['FRONTEND_SPECIFICATION.md', 'BACKEND_SPECIFICATION.md', 'DATABASE_SPECIFICATION.md', 'API_DOCUMENTATION.md', 'SECURITY_ACCESS.md', 'DESIGN_SYSTEM.md', 'DEPLOYMENT.md'];
  
  if (statusReports.includes(fileName)) return 'Status & Reports';
  if (specsPrd.includes(fileName)) return 'Specifications & PRD';
  if (technical.includes(fileName)) return 'Technical Architecture';
  return 'Project Core';
};

// Safe path resolver - prevents directory traversal
const resolveSafeFilePath = (fileName) => {
  // Disallow path traversal characters
  const sanitized = path.basename(fileName);
  
  // Check in docs/
  const docsPath = path.join(DOCS_DIR, sanitized);
  if (fs.existsSync(docsPath)) {
    return docsPath;
  }
  
  // Check in ROOT_DIR for allowed root files
  const allowedRootFiles = ['README.md', 'RELEASE_NOTES.md', 'PROJECT_STATUS.md'];
  if (allowedRootFiles.includes(sanitized)) {
    const rootPath = path.join(ROOT_DIR, sanitized);
    if (fs.existsSync(rootPath)) return rootPath;
  }
  
  return docsPath; // default destination if creating/saving
};

// ----------------------------------------------------
// GET /api/admin/docs
// Lists all documentation and report files
// ----------------------------------------------------
router.get('/', (req, res) => {
  try {
    const files = [];

    // Scan docs/ folder
    if (fs.existsSync(DOCS_DIR)) {
      const docsEntries = fs.readdirSync(DOCS_DIR);
      docsEntries.forEach(file => {
        if (file.endsWith('.md') || file.endsWith('.json') || file.endsWith('.txt')) {
          const filePath = path.join(DOCS_DIR, file);
          const stat = fs.statSync(filePath);
          const content = fs.readFileSync(filePath, 'utf8');
          const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim() || file;
          
          files.push({
            id: file,
            name: file,
            title: firstLine,
            category: getCategory(file),
            size: stat.size,
            linesCount: content.split('\n').length,
            updatedAt: stat.mtime.toISOString(),
            isRoot: false
          });
        }
      });
    }

    // Include root files (README.md, RELEASE_NOTES.md)
    const rootFiles = ['README.md', 'RELEASE_NOTES.md'];
    rootFiles.forEach(file => {
      const rootPath = path.join(ROOT_DIR, file);
      if (fs.existsSync(rootPath)) {
        const stat = fs.statSync(rootPath);
        const content = fs.readFileSync(rootPath, 'utf8');
        const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').trim() || file;
        
        // Don't duplicate if already in docs
        if (!files.some(f => f.name === file)) {
          files.push({
            id: file,
            name: file,
            title: firstLine,
            category: 'Project Core',
            size: stat.size,
            linesCount: content.split('\n').length,
            updatedAt: stat.mtime.toISOString(),
            isRoot: true
          });
        }
      }
    });

    // Sort: Status & Reports first, then alphabetical
    files.sort((a, b) => {
      if (a.name === 'PROJECT_STATUS.md') return -1;
      if (b.name === 'PROJECT_STATUS.md') return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    console.error('[Admin Docs API] List error:', error);
    res.status(500).json({ success: false, message: 'Failed to list documentation files.' });
  }
});

// ----------------------------------------------------
// GET /api/admin/docs/:fileName
// Read file content
// ----------------------------------------------------
router.get('/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const filePath = resolveSafeFilePath(fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: `File "${fileName}" not found.` });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);

    res.json({
      success: true,
      data: {
        name: path.basename(filePath),
        content,
        size: stat.size,
        updatedAt: stat.mtime.toISOString(),
        category: getCategory(path.basename(filePath))
      }
    });
  } catch (error) {
    console.error('[Admin Docs API] Read error:', error);
    res.status(500).json({ success: false, message: 'Failed to read document.' });
  }
});

// ----------------------------------------------------
// PUT /api/admin/docs/:fileName
// Save updated file content
// ----------------------------------------------------
router.put('/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const { content } = req.body;

    if (typeof content !== 'string') {
      return res.status(400).json({ success: false, message: 'Content must be a string.' });
    }

    const filePath = resolveSafeFilePath(fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    const stat = fs.statSync(filePath);

    console.log(`[Admin Docs API] File updated: ${path.basename(filePath)} (${stat.size} bytes)`);

    res.json({
      success: true,
      message: `File "${path.basename(filePath)}" updated successfully.`,
      data: {
        name: path.basename(filePath),
        size: stat.size,
        updatedAt: stat.mtime.toISOString()
      }
    });
  } catch (error) {
    console.error('[Admin Docs API] Save error:', error);
    res.status(500).json({ success: false, message: 'Failed to save document.' });
  }
});

module.exports = router;
