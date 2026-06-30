package com.pos.dto.response;

import lombok.*;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String fullName;
    private String email;
    private Long roleId;
    private String roleName;
    private boolean active;
    private Instant createdAt;
}
