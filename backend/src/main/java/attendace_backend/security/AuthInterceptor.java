package attendace_backend.security;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Checks the "Authorization: Bearer <token>" header on every /api request
 * (except login) and applies the rules in AccessRules.
 *
 * 401 = not signed in / token unknown  -> frontend sends the user to login
 * 403 = signed in but not allowed      -> frontend shows the message
 */
@Component
public class AuthInterceptor implements HandlerInterceptor, WebMvcConfigurer {

    private final AuthStore authStore;

    public AuthInterceptor(AuthStore authStore) {
        this.authStore = authStore;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/login");
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        // Browsers send an OPTIONS "preflight" first; it carries no token.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String header = request.getHeader("Authorization");
        String token = (header != null && header.startsWith("Bearer "))
                ? header.substring(7).trim()
                : null;

        AuthStore.AuthUser user = authStore.find(token);

        if (user == null) {
            reject(response, 401, "Please sign in again.");
            return false;
        }

        if (!AccessRules.isAllowed(user.role(), user.studentId(),
                request.getMethod(), request.getRequestURI())) {
            reject(response, 403, "You do not have permission to do that.");
            return false;
        }

        return true;
    }

    private void reject(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"message\":\"" + message + "\"}");
    }
}
