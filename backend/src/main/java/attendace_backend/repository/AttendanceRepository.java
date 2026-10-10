
package attendace_backend.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import attendace_backend.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {

    List<Attendance> findByStudentId(int studentId);

    List<Attendance> findByStudentIdAndSubjectId(
            int studentId, int subjectId);

    Optional<Attendance> findByStudentIdAndSubjectIdAndDate(
            int studentId, int subjectId, LocalDate date);
}
