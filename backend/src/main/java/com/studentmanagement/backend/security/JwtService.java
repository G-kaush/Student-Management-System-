package com.studentmanagement.backend.security;

import com.studentmanagement.backend.entity.AppUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(
        @Value("${app.jwt.secret}") String secret,
        @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.signingKey = Keys.hmacShaKeyFor(
            Decoders.BASE64.decode(secret)
        );

        this.expirationMs = expirationMs;
    }

    public String generateToken(AppUser user) {
        Date issuedAt = new Date();

        Date expiration = new Date(
            issuedAt.getTime() + expirationMs
        );

        return Jwts.builder()
            .subject(user.getEmail())
            .claim("userId", user.getId())
            .claim("username", user.getUsername())
            .claim("role", user.getRole().name())
            .issuedAt(issuedAt)
            .expiration(expiration)
            .signWith(signingKey)
            .compact();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(
        String token,
        UserDetails userDetails
    ) {
        try {
            Claims claims = extractClaims(token);

            return claims
                    .getSubject()
                    .equals(userDetails.getUsername())
                && claims
                    .getExpiration()
                    .after(new Date());
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}