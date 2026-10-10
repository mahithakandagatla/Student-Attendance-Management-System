(function () {
  /* ---------- Auth guard (same as Dashboard.js) ---------- */
  const session = Session.get();
  if (!session) { window.location.replace('login.html'); return; }

  const role = session.role === 'student' ? 'student' : 'faculty';
  if (role !== 'faculty') { window.location.replace('dashboard.html'); return; }

  const $ = function (id) { return document.getElementById(id); };

  /* ---------- Shell: user info, sidebar, logout ---------- */
  document.querySelectorAll('[data-role]').forEach(function (el) {
    if (el.dataset.role !== role) el.style.display = 'none';
  });

  const name = session.name || 'User';
  const initials = name.replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(/\s+/).slice(0, 2).map(function (p) { return p[0]; }).join('').toUpperCase();
  $('userName').textContent = name;
  $('userRole').textContent = role;
  $('userAvatar').textContent = initials || 'U';
  $('sideUser').textContent = name;
  $('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  $('menuBtn').addEventListener('click', function () { $('sidebar').classList.toggle('open'); });
  document.querySelector('.content').addEventListener('click', function () { $('sidebar').classList.remove('open'); });
  $('logoutBtn').addEventListener('click', function () {
    Session.clear();
    window.location.href = 'login.html';
  });

  function showNotice(text) {
    const n = $('notice');
    n.textContent = text;
    n.classList.add('show');
  }
  function hideNotice() { $('notice').classList.remove('show'); }

  /* ---------- Data ---------- */
  // Backend: GET /api/students -> [ { studentId, studentName, department, year, section } ]
  //          POST /api/students  (same fields)
  let students = [];

  // Sample data used while CONFIG.DEMO_MODE is true (74 students to test scrolling/search)
  function makeDemoStudents() {
    const first = ['Ravi', 'Sita', 'Kiran', 'Anil', 'Priya', 'Meena', 'Suresh', 'Lakshmi',
                   'Rahul', 'Divya', 'Imran', 'Sneha', 'Arjun', 'Kavya', 'Vikram', 'Anjali'];
    const last = ['Kumar', 'Reddy', 'Sharma', 'Patil', 'Nair', 'Rao', 'Verma', 'Shaikh'];
    const depts = ['CSE', 'IT', 'ECE'];
    const list = [];
    for (let i = 0; i < 74; i++) {
      list.push({
        studentId: 101 + i,
        studentName: first[i % first.length] + ' ' + last[(i * 3) % last.length],
        department: depts[i % 3],
        year: (i % 4) + 1,
        section: i % 2 ? 'B' : 'A'
      });
    }
    return list;
  }

  async function loadStudents() {
    if (CONFIG.DEMO_MODE) { students = makeDemoStudents(); return; }
    try {
      students = await apiFetch('/students');
    } catch (e) {
      students = [];
      showNotice('Could not load students. Check that the backend server is running. (' + e.message + ')');
    }
  }

  /* ---------- Render ---------- */
  function cell(text) {
    const td = document.createElement('td');
    td.textContent = text == null ? '' : text;
    return td;
  }

  function render() {
    const q = $('search').value.trim().toLowerCase();
    const list = students.filter(function (s) {
      return !q ||
        String(s.studentId).toLowerCase().indexOf(q) !== -1 ||
        String(s.studentName).toLowerCase().indexOf(q) !== -1;
    });

    const body = $('studentBody');
    body.innerHTML = '';
    if (list.length === 0) {
      body.innerHTML = '<tr><td colspan="5" class="empty">No students found.</td></tr>';
    }
    list.forEach(function (s) {
      const tr = document.createElement('tr');
      tr.appendChild(cell(s.studentId));
      tr.appendChild(cell(s.studentName));
      tr.appendChild(cell(s.department));
      tr.appendChild(cell(s.year));
      tr.appendChild(cell(s.section));
      body.appendChild(tr);
    });
    $('count').textContent = list.length + ' of ' + students.length + ' students';
  }

  /* ---------- Add student ---------- */
  async function addStudent() {
    hideNotice();

    // Backend Student entity: studentId (int, NOT auto-generated), studentName,
    // department, year (int), section
    const idText = $('fId').value.trim();
    const yearText = $('fYear').value.trim();
    const s = {
      studentId: Number(idText),
      studentName: $('fName').value.trim(),
      department: $('fDept').value.trim(),
      year: Number(yearText),
      section: $('fSection').value.trim()
    };

    if (!idText || !s.studentName || !s.department || !yearText) {
      showNotice('Student ID, Name, Department and Year are required.');
      return;
    }
    if (!Number.isInteger(s.studentId) || s.studentId <= 0) {
      showNotice('Student ID must be a whole number, e.g. 175.');
      return;
    }
    if (!Number.isInteger(s.year) || s.year < 1 || s.year > 4) {
      showNotice('Year must be a number from 1 to 4.');
      return;
    }
    // Important: the backend would silently overwrite an existing student with the same ID
    const exists = students.some(function (x) { return Number(x.studentId) === s.studentId; });
    if (exists) { showNotice('A student with ID ' + s.studentId + ' already exists.'); return; }

    const btn = $('addBtn');
    btn.disabled = true;
    try {
      if (CONFIG.DEMO_MODE) {
        students.unshift(s);               // demo: only in this page, not saved anywhere
      } else {
        await apiFetch('/students', { method: 'POST', body: JSON.stringify(s) });
        await loadStudents();
      }
      ['fId', 'fName', 'fDept', 'fYear', 'fSection'].forEach(function (id) { $(id).value = ''; });
      render();
    } catch (e) {
      showNotice('Could not add student: ' + e.message);
    } finally {
      btn.disabled = false;
    }
  }

  $('addBtn').addEventListener('click', addStudent);
  $('search').addEventListener('input', render);

  loadStudents().then(render);
})();
