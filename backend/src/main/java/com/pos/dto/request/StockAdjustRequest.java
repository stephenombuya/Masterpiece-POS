package com.pos.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StockAdjustRequest {
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Delta is required")
    private Integer delta;

    @NotBlank(message = "Reason is required")
    private String reason;
}
