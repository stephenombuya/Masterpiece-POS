package com.pos.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

// ── AuthResponse ───────────────────────────────────────────────────────
@Data @Builder
public class AuthResponse {
    private String token;
    private UserResponse user;
}
