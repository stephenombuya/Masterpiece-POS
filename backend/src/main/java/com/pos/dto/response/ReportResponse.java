package com.pos.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReportResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private long totalTransactions;
    private BigDecimal totalRevenue;
    private BigDecimal totalTax;
    private BigDecimal totalDiscount;
    private BigDecimal netRevenue;
    private List<TopProductDto> topProducts;
    private List<DailySummaryDto> dailySummaries;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProductDto {
        private String productName;
        private Long quantitySold;
        private BigDecimal revenue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DailySummaryDto {
        private String date;
        private Long transactions;
        private BigDecimal revenue;
    }
}
