package attendace_backend.controller;

import attendace_backend.entity.Student;
import attendace_backend.entity.User;
import attendace_backend.security.AccessRules;
import attendace_backend.security.AuthStore;
import attendace_backend.service.StudentService;
import attendace_backend.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class UserController {

    private final UserService userService;
    private final StudentService studentService;
    private final AuthStore authStore;

    public UserController(UserService userService,
                          StudentService studentService,
                          AuthStore authStore) {
        this.userService = userService;
        this.studentService = studentService;
        this.authStore = authStore;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        Optional<User> user = userService.login(
                request.getUsername(),
                request.getPassword()
        );

        if (user.isEmpty()) {
            return error(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        // "Faculty", "STUDENT", "admin" ... all become "faculty" or "student".
        // Anything else is refused instead of being treated as faculty.
        String role = AccessRules.normalizeRole(user.get().getRole());

        if (role == null) {
            return error(HttpStatus.FORBIDDEN,
                    "This account has no valid role. Contact the administrator.");
        }

        String name = user.get().getUsername();
        Integer studentId = null;

        if (role.equals("student")) {
            // Student accounts use the student ID as the username.
            studentId = AccessRules.parseStudentId(user.get().getUsername());

            if (studentId == null) {
                return error(HttpStatus.FORBIDDEN,
                        "Student usernames must be the student ID number.");
            }

            Student student = studentService.getStudentById(studentId);

            if (student == null) {
                return error(HttpStatus.FORBIDDEN,
                        "No student record found for ID " + studentId + ".");
            }

            name = student.getStudentName();
        }

        String token = authStore.create(new AuthStore.AuthUser(
                user.get().getUserId(),
                user.get().getUsername(),
                role,
                studentId
        ));

        Map<String, Object> response = new HashMap<>();

        response.put("message", "Login successful");
        response.put("token", token);
        response.put("userId", user.get().getUserId());
        response.put("username", user.get().getUsername());
        response.put("name", name);
        response.put("role", role);
        response.put("studentId", studentId);

        return ResponseEntity.ok(response);
    }

    private ResponseEntity<Map<String, String>> error(HttpStatus status, String message) {
        Map<String, String> body = new HashMap<>();
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }

    public static class LoginRequest {

        private String username;
        private String password;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }
}
