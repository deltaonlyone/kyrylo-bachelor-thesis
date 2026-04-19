package com.kyrylo.thesis.user.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.kyrylo.thesis.user.security.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin)) // H2 console
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/api/users").permitAll() // створення та перегляд (тимчасово відкритий)
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // @Bean
    // public CorsConfigurationSource corsConfigurationSource() {
    // CorsConfiguration config = new CorsConfiguration();
    // config.setAllowedOrigins(List.of("http://localhost:5173",
    // "http://localhost:3000"));
    // config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    // config.setAllowedHeaders(List.of("*"));
    // config.setAllowCredentials(true);
    // config.setMaxAge(3600L);

    // UrlBasedCorsConfigurationSource source = new
    // UrlBasedCorsConfigurationSource();
    // source.registerCorsConfiguration("/**", config);
    // return source;
    // }
}
