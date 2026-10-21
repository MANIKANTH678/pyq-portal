// Scans public/papers and writes public/papers.json, the index the site searches.
// The folder path is the metadata: papers/<branch>/<semester>/<subject>/<subject>-<year>-<type>.pdf
// Any file that breaks the rules fails the build, so a bad PR fails its check.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, 'public', 'papers');
const MAX_SIZE = 10 * 1024 * 1024;
const NAMES = require('./subjects.json');
const PATTERN = /^(CSE|AIML|ECE|EEE|MECH|CIVIL|IT)\/([1-8])\/([A-Z0-9][A-Z0-9]{1,19})\/\3-(20\d{2})-(main|mid1|mid2|backlog)\.pdf$/;

const papers = [];
const errors = [];

for (const file of fs.readdirSync(ROOT, { recursive: true })) {
  const full = path.join(ROOT, file);
  if (fs.statSync(full).isDirectory()) continue;

  const rel = file.split(path.sep).join('/');
  const match = rel.match(PATTERN);
  if (!match) {
     errors.push(`${rel}: expected <branch>/<semester>/<SUBJECT>/<SUBJECT>-<year>-<main|mid1|mid2|backlog>.pdf`);	  
        continue;
  }
  if (fs.statSync(full).size > MAX_SIZE) {
    errors.push(`${rel}: larger than 10 MB, compress it first`);
    continue;
  }
  // Every real PDF starts with the bytes "%PDF", whatever the file is named.
  const head = Buffer.alloc(4);
  const fd = fs.openSync(full, 'r');
  fs.readSync(fd, head, 0, 4, 0);
  fs.closeSync(fd);
  if (head.toString() !== '%PDF') {
    errors.push(`${rel}: not a PDF`);
    continue;
  }

  const [, branch, semester, subject, year, examType] = match;
  papers.push({
    branch,
    semester: Number(semester),
    subject,
    name: NAMES[subject] || '',
    year: Number(year),
    exam_type: examType,
    file: `papers/${rel}`,
  });
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const TYPES = ['mid1', 'mid2', 'main', 'backlog'];
papers.sort((a, b) => a.subject.localeCompare(b.subject) || b.year - a.year || TYPES.indexOf(a.exam_type) - TYPES.indexOf(b.exam_type) || a.file.localeCompare(b.file));
fs.writeFileSync(path.join(__dirname, 'public', 'papers.json'), JSON.stringify(papers));
console.log(`Indexed ${papers.length} papers`);
