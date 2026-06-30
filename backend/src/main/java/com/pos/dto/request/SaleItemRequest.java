package com.pos.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class SaleItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;

    private BigDecimal discount = BigDecimal.ZERO;
}
