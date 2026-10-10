// dummy data (backend ready ayyaka API nundi teeskuntam)
let students = [
  { id: 1, rollNo: "101", name: "Ravi" },
  { id: 2, rollNo: "102", name: "Sita" },
  { id: 3, rollNo: "103", name: "Kiran" }
];

// today's date default ga set
document.getElementById("date").valueAsDate = new Date();

function showStudents() {
  const table = document.getElementById("attendanceTable");
  table.innerHTML = "";
  students.forEach(s => {
    table.innerHTML += `
      <tr>
        <td>${s.rollNo}</td>
        <td>${s.name}</td>
        <td><input type="radio" name="student${s.id}" value="PRESENT" checked></td>
        <td><input type="radio" name="student${s.id}" value="ABSENT"></td>
      </tr>`;
  });
}

function markAllPresent() {
  students.forEach(s => {
    document.querySelector(`input[name="student${s.id}"][value="PRESENT"]`).checked = true;
  });
}

function submitAttendance() {
  const date = document.getElementById("date").value;
  const subjectId = document.getElementById("subject").value;

  const records = students.map(s => ({
    studentId: s.id,
    status: document.querySelector(`input[name="student${s.id}"]:checked`).value
  }));

  const data = { subjectId, date, records };
  console.log(data);
  alert("Attendance saved! (F12 press chesi Console lo chudandi)");
}

showStudents();