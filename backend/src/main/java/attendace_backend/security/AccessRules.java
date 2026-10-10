package attendace_backend.security;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Who may call what. Plain Java (no Spring) so it is easy to read and test.
 *
 *  faculty -> every endpoint
 *  student -> read-only, and only their own data:
 *               GET /api/subjects
 *               GET /api/students/{ownId}
 *               GET /api/attendance/student/{ownId}
 *               GET /api/attendance/percentage/{ownId}[/{subjectId}]
 *             Anything else (POST / PUT / DELETE, other students' data,
 *             the full attendance list) is refused.
 */
public final class AccessRules {

    private static final Pattern STUDENT_ATTENDANCE =
            Pattern.compile("^/api/attendance/(?:student|percentage)/(\\d{1,9})(?:/\\d{1,9})?$");

    private static final Pattern OWN_STUDENT_RECORD =
            Pattern.compile("^/api/students/(\\d{1,9})$");

    private AccessRules() {
    }

    /** Maps the free-text users.role value to "faculty" or "student". Unknown -> null (no access). */
    public static String normalizeRole(String raw) {
        if (raw == null) {
            return null;
        }
        String role = raw.trim().toLowerCase();

        switch (role) {
            case "student":
                return "student";
            case "faculty":
            case "teacher":
            case "admin":
            case "staff":
                return "faculty";
            default:
                return null;
        }
    }

    /** Student accounts log in with their student ID as username. Returns null if it is not a plain number. */
    public static Integer parseStudentId(String username) {
        if (username == null || !username.trim().matches("\\d{1,9}")) {
            return null;
        }
        return Integer.valueOf(username.trim());
    }

    public static boolean isAllowed(String role, Integer studentId, String method, String path) {
        if ("faculty".equals(role)) {
            return true;
        }

        if (!"student".equals(role) || studentId == null || method == null || path == null) {
            return false;
        }

        if (!"GET".equalsIgnoreCase(method)) {
            return false;
        }

        if (path.equals("/api/subjects")) {
            return true;
        }

        Matcher attendance = STUDENT_ATTENDANCE.matcher(path);
        if (attendance.matches()) {
            return Integer.parseInt(attendance.group(1)) == studentId;
        }

        Matcher own = OWN_STUDENT_RECORD.matcher(path);
        if (own.matches()) {
            return Integer.parseInt(own.group(1)) == studentId;
        }

        return false;
    }
}
