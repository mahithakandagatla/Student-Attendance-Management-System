package attendace_backend.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import attendace_backend.entity.Attendance;
import attendace_backend.service.AttendanceService;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    // Get all attendance records
    @GetMapping
    public List<Attendance> getAllAttendance() {
        return attendanceService.getAllAttendance();
    }

    // Get attendance by ID
    @GetMapping("/{id}")
    public Attendance getAttendanceById(@PathVariable int id) {
        return attendanceService.getAttendanceById(id);
    }

    // Add attendance
    @PostMapping
    public Attendance addAttendance(@RequestBody Attendance attendance) {
        return attendanceService.addAttendance(attendance);
    }

    // Add attendance for multiple students at once
    @PostMapping("/bulk")
    public List<Attendance> addBulkAttendance(
            @RequestBody List<Attendance> attendanceList) {

        List<Attendance> savedAttendance = new ArrayList<>();

        for (Attendance attendance : attendanceList) {
            savedAttendance.add(attendanceService.addAttendance(attendance));
        }

        return savedAttendance;
    }

    // Update attendance
    @PutMapping("/{id}")
    public Attendance updateAttendance(
            @PathVariable int id,
            @RequestBody Attendance attendance) {

        return attendanceService.updateAttendance(id, attendance);
    }

    // Delete attendance
    @DeleteMapping("/{id}")
    public String deleteAttendance(@PathVariable int id) {

        attendanceService.deleteAttendance(id);

        return "Attendance deleted successfully";
    }

    // Get overall attendance percentage for a student
    @GetMapping("/percentage/{studentId}")
    public double getAttendancePercentage(@PathVariable int studentId) {

        return attendanceService.getAttendancePercentage(studentId);
    }

    // Get subject-wise attendance percentage
    @GetMapping("/percentage/{studentId}/{subjectId}")
    public double getSubjectAttendancePercentage(
            @PathVariable int studentId,
            @PathVariable int subjectId) {

        return attendanceService.getSubjectAttendancePercentage(
                studentId, subjectId);
    }
}