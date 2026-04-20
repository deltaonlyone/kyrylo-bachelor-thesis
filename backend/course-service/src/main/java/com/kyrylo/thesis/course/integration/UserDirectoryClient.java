package com.kyrylo.thesis.course.integration;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.kyrylo.thesis.course.integration.userservice.MeContextDto;
import com.kyrylo.thesis.course.integration.userservice.UserResponseDto;

@Component
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

    /** Додає слухача до організації (ідемпотентно ігнорує 409). */
    public void tryAddLearnerToOrganization(Long organizationId, Long learnerUserId, String authorizationHeader) {
        String body = "{\"userId\": " + learnerUserId + "}";
        try {
            userServiceClient.post()
                    .uri("/api/organizations/{id}/members/learners", organizationId)
                    .header(HttpHeaders.AUTHORIZATION, authorizationHeader)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 409) {
                return;
            }
            throw e;
        }
    }
}
