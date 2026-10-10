package attendace_backend.security;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Keeps the tokens handed out at login. Held in memory, so everyone has to
 * sign in again after the backend restarts (the frontend sends them to the
 * login page automatically when that happens).
 */
@Component
public class AuthStore {

    public record AuthUser(Integer userId, String username, String role, Integer studentId) {
    }

    private final Map<String, AuthUser> tokens = new ConcurrentHashMap<>();

    public String create(AuthUser user) {
        String token = UUID.randomUUID().toString();
        tokens.put(token, user);
        return token;
    }

    public AuthUser find(String token) {
        return token == null ? null : tokens.get(token);
    }
}
