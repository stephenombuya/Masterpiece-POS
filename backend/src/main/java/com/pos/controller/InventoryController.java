package com.pos.controller;

import com.pos.dto.request.StockAdjustRequest;
import com.pos.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final ProductService productService;

    @PostMapping("/adjust")
    public ResponseEntity<Void> adjustStock(@Valid @RequestBody StockAdjustRequest request) {
        productService.adjustStock(request.getProductId(), request.getDelta(), request.getReason());
        return ResponseEntity.ok().build();
    }
}
