package attendace_backend.repository;

import java.util.List;

import attendace_backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {

    List<Attendance> findByStudentId(int studentId);

    List<Attendance> findByStudentIdAndSubjectId(int studentId, int subjectId);

}