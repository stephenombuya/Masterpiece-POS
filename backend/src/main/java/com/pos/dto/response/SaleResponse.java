package com.pos.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SaleResponse {
    private Long id;
    private String saleNumber;
    private Long cashierId;
    private String cashierName;
    private List<SaleItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal discount;
    private BigDecimal totalAmount;
    private String status;
    private String notes;
    private String receiptPath;
    private Instant createdAt;
}
