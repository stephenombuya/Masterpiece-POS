package com.pos.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class SaleRequest {

    @NotEmpty(message = "Sale must have at least one item")
    @Valid
    private List<SaleItemRequest> items;

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    @NotNull
    @DecimalMin(value = "0.01", message = "Tendered amount must be positive")
    private BigDecimal amountTendered;

    private String paymentReference;

    private BigDecimal discount = BigDecimal.ZERO;

    private String notes;
}
