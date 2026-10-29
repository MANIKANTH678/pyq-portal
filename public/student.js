const form = document.querySelector('form');
const searchInput = document.querySelector('input[name="q"]');
const params = new URLSearchParams(location.search);

let allPapers = [];
let filteredPapers = []; // Holds the results after filtering

// Pagination State
let currentPage = 1;
const ITEMS_PER_PAGE = 12; // Change this to show more/less per page

const getExamLabel = (type) => {
  const labels = { 'main': 'Main', 'mid1': 'Mid 1', 'mid2': 'Mid 2', 'backlog': 'Backlog' };
  return labels[type];
};

// Theme switch: flips whatever is showing now and remembers the choice.
document.getElementById('theme-toggle').onclick = () => {
  const root = document.documentElement;
  const isDark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', root.dataset.theme);
};

// Populate Year Dropdown
for (let y = new Date().getFullYear(); y >= 2015; y--) form.year.add(new Option(y));

// --- INITIALIZATION ---
async function load() {
  try {
    const response = await fetch('papers.json');
    allPapers = await response.json();

    // Restore state from URL
    for (const [key, value] of params) {
      if (form.elements[key]) form.elements[key].value = value;
    }

    updateSubjectDropdown();
    applyFilters(); // Initial run

    // Event Listeners
    searchInput.addEventListener('input', applyFilters);
    
    form.addEventListener('change', (e) => {
      if (e.target.tagName !== 'SELECT') return;
      if (e.target.name === 'branch' || e.target.name === 'semester') {
        form.subject.value = '';
        updateSubjectDropdown();
      }
      applyFilters();
    });

    form.addEventListener('submit', (e) => e.preventDefault());

    document.getElementById('reset-filters').addEventListener('click', () => {
      form.reset();
      updateSubjectDropdown();
      applyFilters();
    });
  } catch (err) {
    console.error(err);
    document.getElementById('summary').textContent = "Error loading papers.";
  }
}

// --- SUBJECT DROPDOWN ---
function updateSubjectDropdown() {
  const branch = form.branch.value;
  const semester = form.semester.value;

  const availablePapers = allPapers.filter(p => {
    if (branch && p.branch !== branch) return false;
    if (semester && p.semester.toString() !== semester) return false;
    return true;
  });

  const uniqueSubjects = [...new Set(availablePapers.map(p => p.subject))].sort();
  form.subject.innerHTML = '<option value="">All</option>';
  uniqueSubjects.forEach(subject => form.subject.add(new Option(subject, subject)));
}

// --- FILTERING LOGIC ---
function applyFilters() {
  const branch = form.branch.value;
  const semester = form.semester.value;
  const subject = form.subject.value;
  const year = form.year.value;
  const examType = form.exam_type.value;
  const query = searchInput.value.toLowerCase().trim();

  // 1. Basic Dropdown Filters
  filteredPapers = allPapers.filter(p => {
    if (branch && p.branch !== branch) return false;
    if (semester && p.semester.toString() !== semester) return false;
    if (subject && p.subject !== subject) return false;
    if (year && p.year.toString() !== year) return false;
    if (examType && p.exam_type !== examType) return false;
    return true;
  });

  // 2. Smart Search
  if (query) {
    const searchWords = query.split(/\s+/);
    filteredPapers = filteredPapers.map(paper => {
      const searchString = `${paper.subject} ${paper.name} ${paper.branch} ${paper.year} ${paper.semester} ${paper.exam_type}`.toLowerCase();
      let score = 0;
      let matchesAll = true;

      for (const word of searchWords) {
        if (searchString.includes(word)) {
          score += 1; 
          if (paper.subject.toLowerCase().startsWith(word)) score += 10; 
        } else {
          matchesAll = false;
          break;
        }
      }
      return { paper, score, matchesAll };
    })
    .filter(item => item.matchesAll)
    .sort((a, b) => b.score - a.score)
    .map(item => item.paper);
  }

  // Reset to page 1 whenever a new filter is applied
  currentPage = 1; 
  renderPage();
}

// --- PAGINATION & RENDERING ---
function renderPage() {
  const totalItems = filteredPapers.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Slice the array to get only the papers for the current page
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPapers = filteredPapers.slice(startIndex, endIndex);

  // Update Summary
  document.getElementById('summary').textContent = 
    `${totalItems} paper${totalItems === 1 ? '' : 's'} found (Page ${currentPage} of ${totalPages || 1})`;

  // Render Papers
  document.getElementById('papers').innerHTML = paginatedPapers.map((p) => `
    <li>
      <div>
        <strong>${p.subject} · ${p.year} · ${getExamLabel(p.exam_type)}</strong>
        <small>${p.branch} · Semester ${p.semester}</small>
      </div>
      <a href="${p.file}" target="_blank">View</a>
      <a href="${p.file}" download>Download</a>
    </li>`).join('') || '<li>No papers match these filters.</li>';

  // Render Pagination Buttons
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const paginationContainer = document.getElementById('pagination');
  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '';

  // Previous Button
  if (currentPage > 1) {
    html += `<button type="button" onclick="changePage(${currentPage - 1})">Previous</button>`;
  }

  // Page Numbers
  for (let i = 1; i <= totalPages; i++) {
    // Hide some page numbers if there are too many
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<button type="button" class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += `<span class="dots">...</span>`;
    }
  }

  // Next Button
  if (currentPage < totalPages) {
    html += `<button type="button" onclick="changePage(${currentPage + 1})">Next</button>`;
  }

  paginationContainer.innerHTML = html;
}

// Global function for pagination buttons to call
window.changePage = function(page) {
  currentPage = page;
  renderPage();
  window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top on page change
};

load();
