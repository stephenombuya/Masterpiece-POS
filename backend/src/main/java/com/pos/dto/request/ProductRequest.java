package com.pos.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 200)
    private String name;

    @Size(max = 100)
    private String barcode;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price cannot be negative")
    private BigDecimal price;

    @DecimalMin(value = "0.00", message = "Cost price cannot be negative")
    private BigDecimal costPrice = BigDecimal.ZERO;

    private Long categoryId;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private Integer stockQuantity = 0;

    @Min(value = 0, message = "Min stock cannot be negative")
    private Integer minStock = 5;

    private boolean active = true;
}
