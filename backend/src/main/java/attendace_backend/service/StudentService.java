package attendace_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import attendace_backend.entity.Student;
import attendace_backend.repository.StudentRepository;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    // Get all students
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    // Get student by ID
    public Student getStudentById(int id) {
        return studentRepository.findById(id).orElse(null);
    }

    // Add student
    public Student addStudent(Student student) {
        return studentRepository.save(student);
    }

    // Update student
    public Student updateStudent(int id, Student student) {

        Student existingStudent = studentRepository.findById(id).orElse(null);

        if (existingStudent != null) {
            existingStudent.setStudentName(student.getStudentName());
            existingStudent.setDepartment(student.getDepartment());
            existingStudent.setYear(student.getYear());
            existingStudent.setSection(student.getSection());

            return studentRepository.save(existingStudent);
        }

        return null;
    }

    // Delete student
    public void deleteStudent(int id) {
        studentRepository.deleteById(id);
    }
}