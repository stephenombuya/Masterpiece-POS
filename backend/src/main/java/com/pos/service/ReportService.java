package com.pos.service;

import com.pos.dto.response.ReportResponse;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import com.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final SaleRepository saleRepository;

    public ReportResponse getReport(LocalDate from, LocalDate to) {
        List<Sale> sales = saleRepository.findByDateRange(from, to);

        BigDecimal totalRevenue   = BigDecimal.ZERO;
        BigDecimal totalTax       = BigDecimal.ZERO;
        BigDecimal totalDiscount  = BigDecimal.ZERO;
        BigDecimal netRevenue     = BigDecimal.ZERO;

        Map<String, Long> qtySoldByProduct      = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueByProduct = new LinkedHashMap<>();
        Map<String, Long> txnByDate              = new TreeMap<>();
        Map<String, BigDecimal> revenueByDate    = new TreeMap<>();

        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (Sale sale : sales) {
            totalRevenue  = totalRevenue.add(sale.getSubtotal());
            totalTax      = totalTax.add(sale.getTaxAmount());
            totalDiscount = totalDiscount.add(sale.getDiscount());
            netRevenue    = netRevenue.add(sale.getTotalAmount());

            String day = sale.getCreatedAt().atZone(ZoneId.of("Africa/Nairobi")).format(dayFmt);
            txnByDate.merge(day, 1L, Long::sum);
            revenueByDate.merge(day, sale.getTotalAmount(), BigDecimal::add);

            for (SaleItem item : sale.getItems()) {
                qtySoldByProduct.merge(item.getProductName(), (long) item.getQuantity(), Long::sum);
                revenueByProduct.merge(item.getProductName(), item.getLineTotal(), BigDecimal::add);
            }
        }

        List<ReportResponse.TopProductDto> topProducts = qtySoldByProduct.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .map(e -> ReportResponse.TopProductDto.builder()
                        .productName(e.getKey())
                        .quantitySold(e.getValue())
                        .revenue(revenueByProduct.getOrDefault(e.getKey(), BigDecimal.ZERO))
                        .build())
                .collect(Collectors.toList());

        List<ReportResponse.DailySummaryDto> dailySummaries = txnByDate.entrySet().stream()
                .map(e -> ReportResponse.DailySummaryDto.builder()
                        .date(e.getKey())
                        .transactions(e.getValue())
                        .revenue(revenueByDate.getOrDefault(e.getKey(), BigDecimal.ZERO))
                        .build())
                .collect(Collectors.toList());

        return ReportResponse.builder()
                .fromDate(from)
                .toDate(to)
                .totalTransactions(sales.size())
                .totalRevenue(totalRevenue)
                .totalTax(totalTax)
                .totalDiscount(totalDiscount)
                .netRevenue(netRevenue)
                .topProducts(topProducts)
                .dailySummaries(dailySummaries)
                .build();
    }

    public ReportResponse getDailyReport(LocalDate date) {
        return getReport(date, date);
    }

    public ReportResponse getWeeklyReport(LocalDate weekStart) {
        return getReport(weekStart, weekStart.plusDays(6));
    }
}
