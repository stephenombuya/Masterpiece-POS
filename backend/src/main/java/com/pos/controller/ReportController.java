package com.pos.controller;

import com.pos.dto.response.ReportResponse;
import com.pos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

import static org.springframework.format.annotation.DateTimeFormat.ISO.DATE;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<ReportResponse> daily(@RequestParam @DateTimeFormat(iso = DATE) LocalDate date) {
        return ResponseEntity.ok(reportService.getDailyReport(date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ReportResponse> weekly(@RequestParam("weekStart") @DateTimeFormat(iso = DATE) LocalDate weekStart) {
        return ResponseEntity.ok(reportService.getWeeklyReport(weekStart));
    }

    @GetMapping("/custom")
    public ResponseEntity<ReportResponse> custom(
            @RequestParam @DateTimeFormat(iso = DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DATE) LocalDate to
    ) {
        return ResponseEntity.ok(reportService.getReport(from, to));
    }
}
