package com.pos.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VoidSaleRequest {
    @NotBlank(message = "Void reason is required")
    private String reason;
}
