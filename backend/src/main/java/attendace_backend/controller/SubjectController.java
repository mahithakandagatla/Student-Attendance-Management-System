package attendace_backend.controller;

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

import attendace_backend.entity.Subject;
import attendace_backend.service.SubjectService;

@RestController
@RequestMapping("/api/subjects")
@CrossOrigin
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    // Get all subjects
    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectService.getAllSubjects();
    }

    // Get subject by ID
    @GetMapping("/{id}")
    public Subject getSubjectById(@PathVariable int id) {
        return subjectService.getSubjectById(id);
    }

    // Add subject
    @PostMapping
    public Subject addSubject(@RequestBody Subject subject) {
        return subjectService.addSubject(subject);
    }

    // Update subject
    @PutMapping("/{id}")
    public Subject updateSubject(
            @PathVariable int id,
            @RequestBody Subject subject) {

        return subjectService.updateSubject(id, subject);
    }

    // Delete subject
    @DeleteMapping("/{id}")
    public String deleteSubject(@PathVariable int id) {

        subjectService.deleteSubject(id);

        return "Subject deleted successfully";
    }
}