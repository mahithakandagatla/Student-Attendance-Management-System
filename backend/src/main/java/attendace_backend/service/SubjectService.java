package attendace_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import attendace_backend.entity.Subject;
import attendace_backend.repository.SubjectRepository;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;

    public SubjectService(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    // Get all subjects
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    // Get subject by ID
    public Subject getSubjectById(int id) {
        return subjectRepository.findById(id).orElse(null);
    }

    // Add subject
    public Subject addSubject(Subject subject) {
        return subjectRepository.save(subject);
    }

    // Update subject
    public Subject updateSubject(int id, Subject subject) {

        Subject existingSubject = subjectRepository.findById(id).orElse(null);

        if (existingSubject != null) {
            existingSubject.setSubjectName(subject.getSubjectName());

            return subjectRepository.save(existingSubject);
        }

        return null;
    }

    // Delete subject
    public void deleteSubject(int id) {
        subjectRepository.deleteById(id);
    }
}