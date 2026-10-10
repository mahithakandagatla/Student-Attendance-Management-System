
package attendace_backend.service;

import attendace_backend.entity.Attendance;
import attendace_backend.repository.AttendanceRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    // Get all attendance records
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    // Get attendance record by ID
    public Attendance getAttendanceById(int id) {
        return attendanceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Attendance record not found with id: " + id
                ));
    }

    // Add attendance without creating duplicates
    public Attendance addAttendance(Attendance attendance) {

        Optional<Attendance> existing =
                attendanceRepository.findByStudentIdAndSubjectIdAndDate(
                        attendance.getStudentId(),
                        attendance.getSubjectId(),
                        attendance.getDate()
                );

        if (existing.isPresent()) {
            Attendance existingRecord = existing.get();

            // Update the existing record's status
            existingRecord.setStatus(attendance.getStatus());

            return attendanceRepository.save(existingRecord);
        }

        // Save only if no matching record exists
        return attendanceRepository.save(attendance);
    }

    // Update attendance record by ID
    public Attendance updateAttendance(int id, Attendance attendance) {
        if (!attendanceRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Attendance record not found with id: " + id
            );
        }

        attendance.setAttendanceId(id);
        return attendanceRepository.save(attendance);
    }

    // Delete attendance record
    public void deleteAttendance(int id) {
        if (!attendanceRepository.existsById(id)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Attendance record not found with id: " + id
            );
        }

        attendanceRepository.deleteById(id);
    }

    // Get all attendance records of one student
    public List<Attendance> getAttendanceByStudent(int studentId) {
        return attendanceRepository.findByStudentId(studentId);
    }

    // Calculate overall attendance percentage for a student
    public double getAttendancePercentage(int studentId) {
        List<Attendance> records =
                attendanceRepository.findByStudentId(studentId);

        if (records.isEmpty()) {
            return 0.0;
        }

        long presentCount = records.stream()
                .filter(a -> "Present".equalsIgnoreCase(a.getStatus()))
                .count();

        return presentCount * 100.0 / records.size();
    }

    // Calculate subject-wise attendance percentage
    public double getSubjectAttendancePercentage(
            int studentId, int subjectId) {

        List<Attendance> records =
                attendanceRepository.findByStudentIdAndSubjectId(
                        studentId, subjectId);

        if (records.isEmpty()) {
            return 0.0;
        }

        long presentCount = records.stream()
                .filter(a -> "Present".equalsIgnoreCase(a.getStatus()))
                .count();

        return presentCount * 100.0 / records.size();
    }
}