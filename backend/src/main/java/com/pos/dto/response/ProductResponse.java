package com.pos.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String barcode;
    private String description;
    private BigDecimal price;
    private BigDecimal costPrice;
    private Long categoryId;
    private String categoryName;
    private boolean active;
    private Integer stockQuantity;
    private Integer minStock;
    private boolean lowStock;
    private Instant createdAt;
    private Instant updatedAt;
}
