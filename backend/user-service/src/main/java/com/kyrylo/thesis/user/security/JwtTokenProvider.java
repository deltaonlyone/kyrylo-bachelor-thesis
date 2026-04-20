package com.kyrylo.thesis.user.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.UserRole;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

/**
 * Генерація та валідація JWT-токенів (HMAC-SHA256).
 * <p>
 * Payload містить:
 * <ul>
 *   <li>{@code sub} — userId (Long → String)</li>
 *   <li>{@code email} — email користувача</li>
 *   <li>{@code role} — роль (CURATOR / EDUCATOR / LEARNER)</li>
 *   <li>{@code curatorGlobalRole} — NONE / SUPER_ADMIN (для кураторів)</li>
 * </ul>
 */
@Component
public class JwtTokenProvider {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtTokenProvider(
            @Value("${jwt.secret}") String base64Secret,
            @Value("${jwt.expiration-ms}") long expirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
        this.expirationMs = expirationMs;
    }

    /** Створити JWT для автентифікованого користувача. */
    public String generateToken(
            Long userId,
            String email,
            UserRole role,
            CuratorGlobalRole curatorGlobalRole) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        CuratorGlobalRole cgr = curatorGlobalRole != null ? curatorGlobalRole : CuratorGlobalRole.NONE;

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role.name())
                .claim("curatorGlobalRole", cgr.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    /** Валідація підпису та терміну дії; повертає claims або кидає виняток. */
    public Claims validateAndGetClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Швидка перевірка валідності (true / false). */
    public boolean isValid(String token) {
        try {
            validateAndGetClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Long getUserId(String token) {
        return Long.valueOf(validateAndGetClaims(token).getSubject());
    }

    public String getEmail(String token) {
        return validateAndGetClaims(token).get("email", String.class);
    }

    public UserRole getRole(String token) {
        return UserRole.valueOf(validateAndGetClaims(token).get("role", String.class));
    }

    public CuratorGlobalRole getCuratorGlobalRole(String token) {
        String raw = validateAndGetClaims(token).get("curatorGlobalRole", String.class);
        if (raw == null || raw.isBlank()) {
            return CuratorGlobalRole.NONE;
        }
        return CuratorGlobalRole.valueOf(raw);
    }
}
