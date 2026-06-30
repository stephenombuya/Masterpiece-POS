package com.pos.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UserRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 80)
    private String username;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    @Size(max = 150)
    private String fullName;

    @Email
    @Size(max = 150)
    private String email;

    @NotNull(message = "Role ID is required")
    private Long roleId;

    private boolean active = true;
}
