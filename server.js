const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const db = require('./db');

const app = express();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } });
const UPLOADS = path.join(__dirname, 'uploads');

// Same rules the admin form uses. The browser checks are for convenience,
// these are the ones that actually protect the data.
const RULES = {
  branch: /^(CSE|AIML|ECE|EEE|MECH|CIVIL|IT)$/,
  semester: /^[1-8]$/,
  subject: /^[A-Z]{2,6}$/,
  year: /^20\d{2}$/,
  exam_type: /^(main|backlog)$/,
};

// Builds "WHERE a = ? AND b = ?" from whichever filters were sent.
// Column names come from our own list, values always go in as ? params.
function where(query, columns) {
  const used = columns.filter((c) => query[c]);
  return {
    sql: used.length ? ' WHERE ' + used.map((c) => `${c} = ?`).join(' AND ') : '',
    params: used.map((c) => query[c]),
  };
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/subjects', (req, res) => {
  const { sql, params } = where(req.query, ['branch', 'semester']);
  const rows = db.prepare(`SELECT DISTINCT subject FROM papers${sql} ORDER BY subject`).all(params);
  res.json(rows.map((r) => r.subject));
});

app.get('/api/papers', (req, res) => {
  let { sql, params } = where(req.query, ['branch', 'semester', 'subject', 'year']);
  if (req.query.q) {
    sql += (sql ? ' AND' : ' WHERE') + ' subject LIKE ?';
    params.push(`%${req.query.q}%`);
  }
  const rows = db.prepare(
    `SELECT id, branch, semester, subject, year, exam_type FROM papers${sql} ORDER BY year DESC, exam_type DESC`
  ).all(params);
  res.json(rows);
});

app.get('/api/papers/:id/file', (req, res) => {
  const paper = db.prepare('SELECT file_path FROM papers WHERE id = ?').get(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });

  // inline = open in the browser's PDF viewer, attachment = download
  const mode = req.query.download ? 'attachment' : 'inline';
  res.set('Content-Disposition', `${mode}; filename="${path.basename(paper.file_path)}"`);
  res.sendFile(path.join(UPLOADS, paper.file_path));
});

app.post('/api/papers', upload.single('paper'), (req, res) => {
  const invalid = Object.keys(RULES).find((field) => !RULES[field].test(req.body[field] ?? ''));
  if (invalid) return res.status(400).json({ error: `Invalid ${invalid}` });

  // Every real PDF starts with the bytes "%PDF", whatever the file is named.
  if (req.file?.buffer.subarray(0, 4).toString() !== '%PDF') {
    return res.status(400).json({ error: 'File is not a PDF' });
  }

  const { branch, semester, subject, year, exam_type } = req.body;
  const name = `${subject}-${year}${exam_type === 'backlog' ? '-backlog' : ''}.pdf`;
  const filePath = path.join(branch, semester, subject, name);

  try {
    db.prepare(
      'INSERT INTO papers (branch, semester, subject, year, exam_type, file_path) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(branch, semester, subject, year, exam_type, filePath);
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'This paper already exists' });
    throw err;
  }

  fs.mkdirSync(path.join(UPLOADS, path.dirname(filePath)), { recursive: true });
  fs.writeFileSync(path.join(UPLOADS, filePath), req.file.buffer);
  res.status(201).json({ file: name });
});

app.delete('/api/papers/:id', (req, res) => {
  const paper = db.prepare('DELETE FROM papers WHERE id = ? RETURNING file_path').get(req.params.id);
  if (!paper) return res.status(404).json({ error: 'Paper not found' });
  fs.rmSync(path.join(UPLOADS, paper.file_path), { force: true });
  res.sendStatus(204);
});

app.use((err, req, res, next) => {
  res.status(err.status || (err instanceof multer.MulterError ? 400 : 500)).json({ error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
