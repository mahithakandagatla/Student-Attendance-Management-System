
/* =========================================================
   ATTENDANCE MANAGEMENT
   Loads students and subjects, marks attendance, and saves
   attendance records to the Spring Boot backend.
   ========================================================= */

(function () {
  'use strict';

  /* ---------- Authentication guard ---------- */

  const session = Session.get();

  if (!session) {
    window.location.replace('Login.html');
    return;
  }

  const role = session.role === 'student' ? 'student' : 'faculty';

  if (role !== 'faculty') {
    window.location.replace('Dashboard.html');
    return;
  }

  const $ = function (id) {
    return document.getElementById(id);
  };

  /* ---------- Today's date ---------- */

  function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  function setTodayDate() {
    const dateInput = $('date');
    const todayDate = $('todayDate');

    if (dateInput && !dateInput.value) {
      dateInput.value = getTodayString();
    }

    if (todayDate) {
      todayDate.textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
  }

  /* ---------- User information and navigation ---------- */

  document.querySelectorAll('[data-role]').forEach(function (el) {
    if (el.dataset.role !== role) {
      el.style.display = 'none';
    }
  });

  const name = session.name || session.username || 'User';

  const initials = name
    .replace(/^(Dr|Mr|Mrs|Ms|Prof)\.?\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map(function (part) {
      return part[0];
    })
    .join('')
    .toUpperCase();

  if ($('userName')) $('userName').textContent = name;
  if ($('userRole')) $('userRole').textContent = role;
  if ($('userAvatar')) $('userAvatar').textContent = initials || 'U';
  if ($('sideUser')) $('sideUser').textContent = name;

  if ($('menuBtn') && $('sidebar')) {
    $('menuBtn').addEventListener('click', function () {
      $('sidebar').classList.toggle('open');
    });
  }

  if ($('.content') && $('sidebar')) {
    $('.content').addEventListener('click', function () {
      $('sidebar').classList.remove('open');
    });
  }

  if ($('logoutBtn')) {
    $('logoutBtn').addEventListener('click', function () {
      Session.clear();
      window.location.href = 'Login.html';
    });
  }

  /* ---------- Notifications ---------- */

  function showNotice(message) {
    const notice = $('notice');

    if (notice) {
      notice.textContent = message;
      notice.classList.add('show');
    } else {
      alert(message);
    }
  }

  function hideNotice() {
    const notice = $('notice');

    if (notice) {
      notice.textContent = '';
      notice.classList.remove('show');
    }
  }

  /* ---------- Data ---------- */

  let students = [];
  let subjects = [];

  // Stores the selected status for each student.
  const marks = {};

  function makeDemoStudents() {
    const firstNames = [
      'Ravi', 'Sita', 'Kiran', 'Anil', 'Priya', 'Meena',
      'Suresh', 'Lakshmi', 'Rahul', 'Divya', 'Imran',
      'Sneha', 'Arjun', 'Kavya', 'Vikram', 'Anjali'
    ];

    const lastNames = [
      'Kumar', 'Reddy', 'Sharma', 'Patil',
      'Nair', 'Rao', 'Verma', 'Shaikh'
    ];

    const departments = ['CSE', 'IT', 'ECE'];
    const list = [];

    for (let i = 0; i < 74; i++) {
      list.push({
        studentId: 101 + i,
        studentName:
          firstNames[i % firstNames.length] +
          ' ' +
          lastNames[(i * 3) % lastNames.length],
        department: departments[i % departments.length],
        year: (i % 4) + 1,
        section: i % 2 ? 'B' : 'A'
      });
    }

    return list;
  }

  async function loadData() {
    if (CONFIG.DEMO_MODE) {
      students = makeDemoStudents();

      subjects = [
        { subjectId: 1, subjectName: 'Java' },
        { subjectId: 2, subjectName: 'DBMS' },
        { subjectId: 3, subjectName: 'Web Technologies' },
        { subjectId: 4, subjectName: 'Computer Organization' }
      ];

      return;
    }

    try {
      const results = await Promise.allSettled([
        apiFetch('/students'),
        apiFetch('/subjects')
      ]);

      students =
        results[0].status === 'fulfilled' &&
        Array.isArray(results[0].value)
          ? results[0].value
          : [];

      subjects =
        results[1].status === 'fulfilled' &&
        Array.isArray(results[1].value)
          ? results[1].value
          : [];

      if (results.some(function (result) {
        return result.status === 'rejected';
      })) {
        showNotice(
          'Could not load students or subjects. Check that the backend is running.'
        );
      }

      if (students.length === 0) {
        showNotice(
          'No students were loaded. Please check the backend students API.'
        );
      }
    } catch (error) {
      students = [];
      subjects = [];

      showNotice('Unable to load attendance data: ' + error.message);
    }
  }

  /* ---------- Filters ---------- */

  function fillSelect(id, values, allLabel) {
    const select = $(id);

    if (!select) return;

    select.innerHTML = '';

    if (allLabel) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = allLabel;
      select.appendChild(option);
    }

    values.forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.value;
      option.textContent = item.label;
      select.appendChild(option);
    });
  }

  function uniqueSorted(field) {
    const uniqueValues = {};

    students.forEach(function (student) {
      if (
        student[field] !== null &&
        student[field] !== undefined &&
        student[field] !== ''
      ) {
        uniqueValues[student[field]] = true;
      }
    });

    return Object.keys(uniqueValues)
      .sort(function (a, b) {
        return a.localeCompare(b, undefined, { numeric: true });
      })
      .map(function (value) {
        return { value: value, label: value };
      });
  }

  function buildFilters() {
    fillSelect(
      'subject',
      subjects.map(function (subject) {
        return {
          value: subject.subjectId,
          label: subject.subjectName
        };
      })
    );

    fillSelect('dept', uniqueSorted('department'), 'All departments');
    fillSelect('year', uniqueSorted('year'), 'All years');
    fillSelect('section', uniqueSorted('section'), 'All sections');

    // Automatically select today's date.
    const dateInput = $('date');

    if (dateInput) {
      dateInput.value = getTodayString();
    }

    setTodayDate();
  }

  function visibleStudents() {
    const department = $('dept') ? $('dept').value : '';
    const year = $('year') ? $('year').value : '';
    const section = $('section') ? $('section').value : '';

    return students.filter(function (student) {
      return (
        (!department ||
          String(student.department) === department) &&
        (!year || String(student.year) === year) &&
        (!section || String(student.section) === section)
      );
    });
  }

  /* ---------- Attendance summary ---------- */

  function updateSummary(list) {
    let present = 0;

    list.forEach(function (student) {
      if (marks[student.studentId] === 'Present') {
        present++;
      }
    });

    const summary = $('summary');

    if (summary) {
      summary.textContent =
        list.length +
        ' students · ' +
        present +
        ' present · ' +
        (list.length - present) +
        ' absent';
    }
  }

  /* ---------- Render student attendance table ---------- */

  function render() {
    const list = visibleStudents();
    const body = $('attBody');

    if (!body) {
      showNotice('Attendance table was not found in attendance.html.');
      return;
    }

    body.innerHTML = '';

    if (list.length === 0) {
      body.innerHTML =
        '<tr><td colspan="4" class="empty">' +
        'No students match these filters.' +
        '</td></tr>';

      updateSummary(list);
      return;
    }

    list.forEach(function (student) {
      // Default each student to Present until changed.
      if (!marks[student.studentId]) {
        marks[student.studentId] = 'Present';
      }

      const row = document.createElement('tr');

      const idCell = document.createElement('td');
      idCell.textContent = student.studentId;

      const nameCell = document.createElement('td');
      nameCell.textContent = student.studentName;

      row.appendChild(idCell);
      row.appendChild(nameCell);

      ['Present', 'Absent'].forEach(function (status) {
        const cell = document.createElement('td');
        cell.className =
          'mark ' + (status === 'Present' ? 'p' : 'a');

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'att_' + student.studentId;
        radio.value = status;
        radio.checked = marks[student.studentId] === status;

        radio.setAttribute(
          'aria-label',
          student.studentName + ' ' + status
        );

        radio.addEventListener('change', function () {
          marks[student.studentId] = status;
          updateSummary(visibleStudents());
        });

        cell.appendChild(radio);
        row.appendChild(cell);
      });

      body.appendChild(row);
    });

    updateSummary(list);
  }

  /* ---------- Mark all students ---------- */

  function markAll(status) {
    visibleStudents().forEach(function (student) {
      marks[student.studentId] = status;
    });

    render();
  }

  /* ---------- Save attendance to backend ---------- */

  async function saveRecords(records) {
    const results = await Promise.allSettled(
      records.map(function (record) {
        return apiFetch('/attendance', {
          method: 'POST',
          body: JSON.stringify(record)
        });
      })
    );

    const failed = results.filter(function (result) {
      return result.status === 'rejected';
    }).length;

    if (failed > 0) {
      throw new Error(
        failed +
        ' of ' +
        records.length +
        ' attendance records failed to save.'
      );
    }
  }

  async function submit() {
    hideNotice();

    const dateInput = $('date');
    const subjectInput = $('subject');
    const submitButton = $('submitBtn');

    if (!dateInput || !subjectInput || !submitButton) {
      showNotice('Required attendance form elements were not found.');
      return;
    }

    const date = dateInput.value;
    const subjectId = subjectInput.value;
    const list = visibleStudents();

    if (!subjectId) {
      showNotice('Please select a subject.');
      return;
    }

    if (!date) {
      showNotice('Please select a date.');
      return;
    }

    if (list.length === 0) {
      showNotice('There are no students to mark.');
      return;
    }

    const records = list.map(function (student) {
      return {
        studentId: student.studentId,
        subjectId: Number(subjectId),
        date: date,
        status: marks[student.studentId] || 'Present'
      };
    });

    submitButton.disabled = true;
    submitButton.classList.add('loading');

    try {
      if (CONFIG.DEMO_MODE) {
        console.log('DEMO MODE — attendance was not saved:', records);

        showNotice(
          'Demo mode: ' +
          records.length +
          ' records prepared, but not saved to the database.'
        );
      } else {
        await saveRecords(records);

        showNotice(
          'Attendance saved successfully for ' +
          records.length +
          ' students on ' +
          date +
          '.'
        );
      }
    } catch (error) {
      showNotice('Could not save attendance: ' + error.message);
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('loading');
    }
  }

  /* ---------- Event listeners ---------- */

  if ($('dept')) {
    $('dept').addEventListener('change', render);
  }

  if ($('year')) {
    $('year').addEventListener('change', render);
  }

  if ($('section')) {
    $('section').addEventListener('change', render);
  }

  if ($('allPresentBtn')) {
    $('allPresentBtn').addEventListener('click', function () {
      markAll('Present');
    });
  }

  if ($('allAbsentBtn')) {
    $('allAbsentBtn').addEventListener('click', function () {
      markAll('Absent');
    });
  }

  if ($('submitBtn')) {
    $('submitBtn').addEventListener('click', submit);
  }

  /* ---------- Initialize page ---------- */

  setTodayDate();

  loadData().then(function () {
    buildFilters();
    render();
  });
})();
