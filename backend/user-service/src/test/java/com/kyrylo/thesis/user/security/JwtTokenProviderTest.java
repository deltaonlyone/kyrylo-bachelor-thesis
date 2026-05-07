package com.kyrylo.thesis.user.security;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Base64;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.Test;

import com.kyrylo.thesis.user.domain.CuratorGlobalRole;
import com.kyrylo.thesis.user.domain.UserRole;

import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@SuppressWarnings("deprecation")
class JwtTokenProviderTest {

    @Test
    void generate_and_parse_claims() {
        SecretKey key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
        String base64 = Base64.getEncoder().encodeToString(key.getEncoded());
        JwtTokenProvider provider = new JwtTokenProvider(base64, 60_000L);

        String t = provider.generateToken(123L, "a@b", UserRole.CURATOR, CuratorGlobalRole.SUPER_ADMIN);
        assertTrue(provider.isValid(t));
        assertEquals(123L, provider.getUserId(t));
        assertEquals(UserRole.CURATOR, provider.getRole(t));
        assertEquals(CuratorGlobalRole.SUPER_ADMIN, provider.getCuratorGlobalRole(t));
    }
}
