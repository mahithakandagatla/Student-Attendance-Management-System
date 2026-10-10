
(function () {
  /* ---------- Faculty-only guard ---------- */
  const session = Session.get();
  if (!session) { window.location.replace('login.html'); return; }
  if (session.role !== 'faculty') { window.location.replace('dashboard.html'); return; }

  const message = document.getElementById('reportMessage');
  const content = document.getElementById('reportContent');

  const studentIdInput = document.getElementById('studentIdSearch');
  const dateInput = document.getElementById('attendanceDateSearch');
  const statusFilter = document.getElementById('statusFilter');

  const searchButton = document.getElementById('searchStudentBtn');
  const showAllButton = document.getElementById('showAllBtn');

  let allRecords = [];

  // Display attendance records in a table
  function displayRecords(records) {
    content.replaceChildren();

    if (records.length === 0) {
      message.textContent = 'No matching attendance records found.';
      return;
    }

    message.textContent =
      'Showing ' + records.length + ' attendance record(s).';

    const table = document.createElement('table');

    table.innerHTML = `
      <thead>
        <tr>
          <th>Attendance ID</th>
          <th>Student ID</th>
          <th>Subject ID</th>
          <th>Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    records.forEach(function (record) {
      const row = document.createElement('tr');

      const values = [
        record.attendanceId,
        record.studentId,
        record.subjectId,
        record.date,
        record.status
      ];

      values.forEach(function (value) {
        const cell = document.createElement('td');
        cell.textContent = value ?? '';
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });

    content.appendChild(table);
  }

  // Filter by Student ID, date, and status
  function applyFilters() {
    const studentId = studentIdInput.value.trim();
    const selectedDate = dateInput.value;
    const selectedStatus = statusFilter.value;

    const filteredRecords = allRecords.filter(function (record) {
      const matchesStudent =
        studentId === '' ||
        String(record.studentId) === studentId;

      // Compare only the YYYY-MM-DD portion of the date
      const recordDate = String(record.date || '').slice(0, 10);

      const matchesDate =
        selectedDate === '' ||
        recordDate === selectedDate;

      const matchesStatus =
        selectedStatus === 'all' ||
        String(record.status).toLowerCase() ===
          selectedStatus.toLowerCase();

      return matchesStudent && matchesDate && matchesStatus;
    });

    displayRecords(filteredRecords);
  }

  // Fetch attendance records from the backend
  async function loadReport() {
    message.textContent = 'Loading attendance report...';
    content.replaceChildren();

    try {
      const records = await apiFetch('/attendance');

      if (!Array.isArray(records)) {
        throw new Error('Unexpected attendance data format.');
      }

      allRecords = records;
      applyFilters();
    } catch (error) {
      message.textContent =
        'Could not load the attendance report: ' + error.message;
    }
  }

  // Search button
  searchButton.addEventListener('click', applyFilters);

  // Allow Enter to trigger a search
  studentIdInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      applyFilters();
    }
  });

  dateInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      applyFilters();
    }
  });

  // Reset filters and display all records
  showAllButton.addEventListener('click', function () {
    studentIdInput.value = '';
    dateInput.value = '';
    statusFilter.value = 'all';

    applyFilters();
  });

  // Load data when the Reports page opens
  loadReport();
})();
