
(function () {
  // ---------- Authentication guard ----------
  const session = Session.get();

  if (!session) {
    window.location.replace('login.html');
    return;
  }

  const role = session.role === 'student' ? 'student' : 'faculty';

  if (role !== 'faculty') {
    window.location.replace('dashboard.html');
    return;
  }

  const $ = function (id) {
    return document.getElementById(id);
  };

  // ---------- Header and navigation ----------
  document.querySelectorAll('[data-role]').forEach(function (el) {
    if (el.dataset.role !== role) {
      el.style.display = 'none';
    }
  });

  const name = session.name || 'User';

  const initials = name
    .replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map(function (p) { return p[0]; })
    .join('')
    .toUpperCase();

  $('userName').textContent = name;
  $('userRole').textContent = role;
  $('userAvatar').textContent = initials || 'U';
  $('sideUser').textContent = name;

  $('todayDate').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  $('menuBtn').addEventListener('click', function () {
    $('sidebar').classList.toggle('open');
  });

  document.querySelector('.content').addEventListener('click', function () {
    $('sidebar').classList.remove('open');
  });

  $('logoutBtn').addEventListener('click', function () {
    Session.clear();
    window.location.href = 'login.html';
  });

  // ---------- Notices ----------
  function showNotice(message) {
    const notice = $('notice');
    notice.textContent = message;
    notice.classList.add('show');
  }

  function hideNotice() {
    $('notice').classList.remove('show');
  }

  // ---------- Student and attendance data ----------
  let students = [];
  let attendanceByStudent = {};

  function makeDemoStudents() {
    const first = [
      'Ravi', 'Sita', 'Kiran', 'Anil', 'Priya', 'Meena',
      'Suresh', 'Lakshmi', 'Rahul', 'Divya', 'Imran',
      'Sneha', 'Arjun', 'Kavya', 'Vikram', 'Anjali'
    ];

    const last = [
      'Kumar', 'Reddy', 'Sharma', 'Patil',
      'Nair', 'Rao', 'Verma', 'Shaikh'
    ];

    const departments = ['CSE', 'IT', 'ECE'];
    const list = [];

    for (let i = 0; i < 74; i++) {
      list.push({
        studentId: 101 + i,
        studentName:
          first[i % first.length] + ' ' +
          last[(i * 3) % last.length],
        department: departments[i % departments.length],
        year: (i % 4) + 1,
        section: i % 2 ? 'B' : 'A'
      });
    }

    return list;
  }

  async function loadStudents() {
    if (CONFIG.DEMO_MODE) {
      students = makeDemoStudents();
      return;
    }

    students = await apiFetch('/students');
  }

  async function loadAttendance() {
    attendanceByStudent = {};

    if (CONFIG.DEMO_MODE) {
      return;
    }

    const records = await apiFetch('/attendance');

    records.forEach(function (record) {
      const id = String(record.studentId);

      if (!attendanceByStudent[id]) {
        attendanceByStudent[id] = {
          total: 0,
          present: 0
        };
      }

      attendanceByStudent[id].total++;

      if (
        String(record.status).toLowerCase() === 'present'
      ) {
        attendanceByStudent[id].present++;
      }
    });
  }

  function getAttendancePercentage(studentId) {
    const data = attendanceByStudent[String(studentId)];

    if (!data || data.total === 0) {
      return null;
    }

    return Math.round((data.present / data.total) * 100);
  }

  // ---------- Table rendering ----------
  function cell(value) {
    const td = document.createElement('td');
    td.textContent = value == null ? '' : value;
    return td;
  }

  function render() {
    const query = $('search').value.trim().toLowerCase();

    const filteredStudents = students.filter(function (student) {
      return (
        String(student.studentId).toLowerCase().includes(query) ||
        String(student.studentName).toLowerCase().includes(query)
      );
    });

    const body = $('studentBody');
    body.innerHTML = '';

    if (filteredStudents.length === 0) {
      const tr = document.createElement('tr');
      const td = cell('No students found.');
      td.colSpan = 6;
      td.className = 'empty';
      tr.appendChild(td);
      body.appendChild(tr);
    }

    filteredStudents.forEach(function (student) {
      const tr = document.createElement('tr');

      tr.appendChild(cell(student.studentId));
      tr.appendChild(cell(student.studentName));
      tr.appendChild(cell(student.department));
      tr.appendChild(cell(student.year));
      tr.appendChild(cell(student.section));

      // Overall attendance percentage
      const percentage = getAttendancePercentage(student.studentId);
      const attendanceCell = cell(
        percentage === null ? 'N/A' : percentage + '%'
      );

      if (percentage !== null) {
        const badge = document.createElement('span');
        badge.className =
          'pill ' + (percentage < 75 ? 'warn' : 'good');
        badge.textContent = percentage + '%';

        attendanceCell.textContent = '';
        attendanceCell.appendChild(badge);
      }

      tr.appendChild(attendanceCell);
      body.appendChild(tr);
    });

    $('count').textContent =
      filteredStudents.length + ' of ' + students.length + ' students';
  }

  // ---------- Add student ----------
  async function addStudent() {
    hideNotice();

    const idText = $('fId').value.trim();
    const yearText = $('fYear').value.trim();

    const student = {
      studentId: Number(idText),
      studentName: $('fName').value.trim(),
      department: $('fDept').value.trim(),
      year: Number(yearText),
      section: $('fSection').value.trim()
    };

    if (
      !idText ||
      !student.studentName ||
      !student.department ||
      !yearText
    ) {
      showNotice('Student ID, Name, Department and Year are required.');
      return;
    }

    if (!Number.isInteger(student.studentId) || student.studentId <= 0) {
      showNotice('Student ID must be a positive whole number.');
      return;
    }

    if (!Number.isInteger(student.year) ||
        student.year < 1 || student.year > 4) {
      showNotice('Year must be a number from 1 to 4.');
      return;
    }

    if (students.some(function (s) {
      return Number(s.studentId) === student.studentId;
    })) {
      showNotice(
        'A student with ID ' + student.studentId + ' already exists.'
      );
      return;
    }

    const button = $('addBtn');
    button.disabled = true;

    try {
      if (CONFIG.DEMO_MODE) {
        students.unshift(student);
      } else {
        await apiFetch('/students', {
          method: 'POST',
          body: JSON.stringify(student)
        });

        await loadStudents();
      }

      ['fId', 'fName', 'fDept', 'fYear', 'fSection']
        .forEach(function (id) {
          $(id).value = '';
        });

      render();
    } catch (error) {
      showNotice('Could not add student: ' + error.message);
    } finally {
      button.disabled = false;
    }
  }

  $('addBtn').addEventListener('click', addStudent);
  $('search').addEventListener('input', render);

  // ---------- Initial loading ----------
  async function initialize() {
    hideNotice();

    try {
      await loadStudents();
    } catch (error) {
      students = [];
      showNotice('Could not load students: ' + error.message);
      render();
      return;
    }

    try {
      await loadAttendance();
    } catch (error) {
      // Keep the student list visible if attendance cannot load.
      attendanceByStudent = {};
      showNotice(
        'Student details loaded, but attendance could not be loaded. ' +
        'Check the backend and faculty access permissions.'
      );
    }

    render();
  }

  initialize();
})();
