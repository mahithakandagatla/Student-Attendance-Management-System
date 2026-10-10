// dummy data (backend ready ayyaka teeseyyali)
let students = [
  { rollNo: "101", name: "Ravi" },
  { rollNo: "102", name: "Sita" }
];

function showStudents() {
  const table = document.getElementById("studentTable");
  table.innerHTML = "";
  students.forEach((s, index) => {
    table.innerHTML += `
      <tr>
        <td>${s.rollNo}</td>
        <td>${s.name}</td>
        <td><button onclick="deleteStudent(${index})">Delete</button></td>
      </tr>`;
  });
}

function addStudent() {
  const rollNo = document.getElementById("rollNo").value;
  const name = document.getElementById("name").value;
  if (rollNo === "" || name === "") {
    alert("Fill all fields");
    return;
  }
  students.push({ rollNo, name });
  showStudents();
}

function deleteStudent(index) {
  students.splice(index, 1);
  showStudents();
}

showStudents();