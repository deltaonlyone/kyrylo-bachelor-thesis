package com.kyrylo.thesis.course.integration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.UserResponseDto;

@Component
@SuppressWarnings("null")
public class UserDirectoryClient {

    private final RestClient userServiceClient;

    public UserDirectoryClient(RestClient userServiceClient) {
        this.userServiceClient = userServiceClient;
    }

    public MeContextDto fetchMeContext(String authorizationHeader) {
        return userServiceClient.get()
                .uri("/api/me/context")
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .retrieve()
                .body(MeContextDto.class);
    }

    public UserResponseDto fetchUser(Long userId, String authorizationHeader) {
        return userServiceClient.get()
                .uri("/api/users/{id}", userId)
                .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                .retrieve()
                .body(UserResponseDto.class);
    }

    /** Перевіряє, чи є користувач учасником організації. */
    public boolean isLearnerInOrganization(Long organizationId, Long learnerUserId, String authorizationHeader) {
        try {
            java.util.List<?> members = userServiceClient.get()
                    .uri("/api/organizations/{id}/members", organizationId)
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .retrieve()
                    .body(java.util.List.class);
            
            if (members == null) return false;
            
            for (Object obj : members) {
                if (obj instanceof java.util.Map<?, ?> map) {
                    Object idObj = map.get("userId");
                    if (idObj instanceof Number n && n.longValue() == learnerUserId) {
                        return true;
                    }
                }
            }
            return false;
        } catch (RestClientResponseException e) {
            return false;
        }
    }
}
