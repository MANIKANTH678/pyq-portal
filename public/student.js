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

async function load() {
  const subjects = await (await fetch('/api/subjects?' + params)).json();
  subjects.forEach((s) => form.subject.add(new Option(s)));

  // Put the filters from the URL back into the form.
  for (const [key, value] of params) if (form.elements[key]) form.elements[key].value = value;

  const papers = await (await fetch('/api/papers?' + params)).json();
  document.getElementById('summary').textContent = `${papers.length} paper${papers.length === 1 ? '' : 's'}`;
  document.getElementById('papers').innerHTML = papers.map((p) => `
    <li>
      <div>
        <strong>${p.subject} · ${p.year} · ${p.exam_type === 'main' ? 'Main' : 'Backlog'}</strong>
        <small>${p.branch} · Semester ${p.semester}</small>
      </div>
      <a href="/api/papers/${p.id}/file" target="_blank">View</a>
      <a href="/api/papers/${p.id}/file?download=1">Download</a>
    </li>`).join('') || '<li>No papers match these filters.</li>';
}

load();
