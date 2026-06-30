package com.pos.controller;

import com.pos.dto.request.SaleRequest;
import com.pos.dto.request.VoidSaleRequest;
import com.pos.dto.response.SaleResponse;
import com.pos.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(saleService.completeSale(request));
    }

    @GetMapping
    public ResponseEntity<List<SaleResponse>> getAll() {
        return ResponseEntity.ok(saleService.getAll());
    }

    @GetMapping("/today")
    public ResponseEntity<List<SaleResponse>> getToday() {
        return ResponseEntity.ok(saleService.getToday());
    }

    @GetMapping("/range")
    public ResponseEntity<List<SaleResponse>> getByRange(
            @RequestParam("from") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ResponseEntity.ok(saleService.getByDateRange(from, to));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getById(id));
    }

    @GetMapping("/{id}/receipt")
    public ResponseEntity<FileSystemResource> downloadReceipt(@PathVariable Long id) {
        SaleResponse sale = saleService.getById(id);
        if (sale.getReceiptPath() == null) {
            return ResponseEntity.notFound().build();
        }
        File file = new File(sale.getReceiptPath());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + sale.getSaleNumber() + ".pdf\"")
                .body(new FileSystemResource(file));
    }

    @PostMapping("/{id}/void")
    public ResponseEntity<Void> voidSale(@PathVariable Long id, @Valid @RequestBody VoidSaleRequest request) {
        saleService.voidSale(id, request.getReason());
        return ResponseEntity.ok().build();
    }
}
