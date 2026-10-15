const form = document.querySelector('form');
const params = new URLSearchParams(location.search);

for (let y = new Date().getFullYear(); y >= 2015; y--) form.year.add(new Option(y));

// Picking a filter submits the form, which is a GET: the filters end up in the URL.
form.addEventListener('change', (e) => {
  if (e.target.tagName !== 'SELECT') return;
  if (e.target.name === 'branch' || e.target.name === 'semester') form.subject.value = '';
  form.submit();
});

// Leave empty filters out of the URL.
form.addEventListener('formdata', (e) => {
  for (const [key, value] of [...e.formData]) if (!value) e.formData.delete(key);
});

// Each filter in the URL must match. Subject only narrows by branch and semester,
// so its dropdown lists what exists for the branch and semester picked.
const matches = (p, keys) => keys.every((k) => !params.get(k) || String(p[k]) === params.get(k));

async function load() {
  const all = await (await fetch('papers.json')).json();

  const subjects = [...new Set(all.filter((p) => matches(p, ['branch', 'semester'])).map((p) => p.subject))].sort();
  subjects.forEach((s) => form.subject.add(new Option(s)));

  // Put the filters from the URL back into the form.
  for (const [key, value] of params) if (form.elements[key]) form.elements[key].value = value;

  const q = (params.get('q') || '').toUpperCase();
  const papers = all.filter((p) => matches(p, ['branch', 'semester', 'subject', 'year']) && p.subject.includes(q));
  document.getElementById('summary').textContent = `${papers.length} paper${papers.length === 1 ? '' : 's'}`;
  document.getElementById('papers').innerHTML = papers.map((p) => `
    <li>
      <div>
        <strong>${p.subject} · ${p.year} · ${p.exam_type === 'main' ? 'Main' : 'Backlog'}</strong>
        <small>${p.branch} · Semester ${p.semester}</small>
      </div>
      <a href="${p.file}" target="_blank">View</a>
      <a href="${p.file}" download>Download</a>
    </li>`).join('') || '<li>No papers match these filters.</li>';
}

load();
