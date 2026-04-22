package com.kyrylo.thesis.course.security;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Base64;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;

import com.kyrylo.thesis.course.integration.userservice.CuratorGlobalRole;
import com.kyrylo.thesis.course.integration.userservice.UserRole;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.Jwts;
import java.util.Date;

class JwtTokenProviderTest {

    @Test
    void token_roundtrip() {
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        String base64 = Base64.getEncoder().encodeToString(key.getEncoded());
        JwtTokenProvider provider = new JwtTokenProvider(base64);

        Date now = new Date();
        Date expiry = new Date(now.getTime() + 60_000L);
        String token = Jwts.builder()
                .setSubject("7")
                .claim("role", UserRole.EDUCATOR.name())
                .claim("curatorGlobalRole", CuratorGlobalRole.NONE.name())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key)
                .compact();

        assertTrue(provider.isValid(token));
        assertEquals(7L, provider.getUserId(token));
        assertEquals(UserRole.EDUCATOR, provider.getRole(token));
    }
}