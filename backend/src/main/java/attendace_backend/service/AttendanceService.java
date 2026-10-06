package attendace_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import attendace_backend.entity.Attendance;
import attendace_backend.repository.AttendanceRepository;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;

    public AttendanceService(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    // Get all attendance records
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }

    // Get attendance by ID
    public Attendance getAttendanceById(int id) {
        return attendanceRepository.findById(id).orElse(null);
    }

    // Add attendance
    public Attendance addAttendance(Attendance attendance) {
        return attendanceRepository.save(attendance);
    }

    // Update attendance
    public Attendance updateAttendance(int id, Attendance attendance) {

        Attendance existingAttendance =
                attendanceRepository.findById(id).orElse(null);

        if (existingAttendance != null) {

            existingAttendance.setStudentId(attendance.getStudentId());
            existingAttendance.setSubjectId(attendance.getSubjectId());
            existingAttendance.setDate(attendance.getDate());
            existingAttendance.setStatus(attendance.getStatus());

            return attendanceRepository.save(existingAttendance);
        }

        return null;
    }

    // Delete attendance
    public void deleteAttendance(int id) {
        attendanceRepository.deleteById(id);
    }

    // Calculate overall attendance percentage
    public double getAttendancePercentage(int studentId) {

        List<Attendance> attendanceList =
                attendanceRepository.findByStudentId(studentId);

        if (attendanceList.isEmpty()) {
            return 0;
        }

        int totalClasses = attendanceList.size();
        int presentClasses = 0;

        for (Attendance attendance : attendanceList) {

            if (attendance.getStatus().equalsIgnoreCase("Present")) {
                presentClasses++;
            }
        }

        return ((double) presentClasses / totalClasses) * 100;
    }

    // Calculate subject-wise attendance percentage
    public double getSubjectAttendancePercentage(
            int studentId, int subjectId) {

        List<Attendance> attendanceList =
                attendanceRepository.findByStudentIdAndSubjectId(
                        studentId, subjectId);

        if (attendanceList.isEmpty()) {
            return 0;
        }

        int totalClasses = attendanceList.size();
        int presentClasses = 0;

        for (Attendance attendance : attendanceList) {

            if (attendance.getStatus().equalsIgnoreCase("Present")) {
                presentClasses++;
            }
        }

        return ((double) presentClasses / totalClasses) * 100;
    }
}