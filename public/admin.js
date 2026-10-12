const form = document.getElementById('upload');
const list = document.getElementById('papers');
const message = document.getElementById('status');

for (let y = new Date().getFullYear(); y >= 2015; y--) form.year.add(new Option(y));

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // --- NEW: Subject length validation (2 to 20 characters) ---
  const subjectValue = form.subject.value.trim(); 
  if (subjectValue.length < 2 || subjectValue.length > 20) {
    return (message.textContent = 'Error: Subject must be between 2 and 20 characters.');
  }
  // -----------------------------------------------------------

  const file = form.paper.files[0];
  if (file.type !== 'application/pdf') return (message.textContent = 'Only PDF files can be uploaded.');
  if (file.size > 10 * 1024 * 1024) return (message.textContent = 'The PDF must be under 10 MB.');

  const res = await fetch('/api/papers', { method: 'POST', body: new FormData(form) });
  const data = await res.json();
  message.textContent = `${res.status} · ${res.ok ? `Saved as ${data.file}` : data.error}`;
  
  if (res.ok) {
    form.reset();
    loadPapers();
  }
});

list.addEventListener('click', async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;
  const res = await fetch(`/api/papers/${id}`, { method: 'DELETE' });
  message.textContent = `${res.status} · ${res.ok ? 'Deleted' : 'Paper not found'}`;
  loadPapers();
});

async function loadPapers() {
  const papers = await (await fetch('/api/papers')).json();
  list.innerHTML = papers.map((p) => `
    <li>
      <span>${p.branch} · Sem ${p.semester} · ${p.subject} · ${p.year} · ${p.exam_type}</span>
      <button data-id="${p.id}">Delete</button>
    </li>`).join('') || '<li>No papers yet.</li>';
}

loadPapers();
