package com.pos.controller;

import com.pos.dto.report.DailySummaryResponse;
import com.pos.dto.report.SalesReportResponse;
import com.pos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<DailySummaryResponse> dailySummary(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(reportService.getDailySummary(reportDate));
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesReportResponse> salesReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getSalesReport(from, to));
    }

    @GetMapping("/top-products")
    public ResponseEntity<?> topProducts(
        @RequestParam(defaultValue = "10") int limit,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getTopProducts(limit, from, to));
    }

    @GetMapping("/cashier-performance")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> cashierPerformance(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getCashierPerformance(from, to));
    }
}
