package com.pos.mapper;

import com.pos.dto.response.ProductResponse;
import com.pos.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        var inv = product.getInventory();
        int qty = inv != null ? inv.getQuantity() : 0;
        int minStock = inv != null ? inv.getMinStock() : 5;

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .barcode(product.getBarcode())
                .description(product.getDescription())
                .price(product.getPrice())
                .costPrice(product.getCostPrice())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .active(product.isActive())
                .stockQuantity(qty)
                .minStock(minStock)
                .lowStock(qty <= minStock)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
