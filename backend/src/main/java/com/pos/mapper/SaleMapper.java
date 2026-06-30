package com.pos.mapper;

import com.pos.dto.response.SaleItemResponse;
import com.pos.dto.response.SaleResponse;
import com.pos.entity.Sale;
import com.pos.entity.SaleItem;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SaleMapper {

    public SaleResponse toResponse(Sale sale) {
        List<SaleItemResponse> items = sale.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        String receiptPath = sale.getReceipt() != null ? sale.getReceipt().getReceiptPath() : null;

        return SaleResponse.builder()
                .id(sale.getId())
                .saleNumber(sale.getSaleNumber())
                .cashierId(sale.getCashier().getId())
                .cashierName(sale.getCashier().getFullName())
                .items(items)
                .subtotal(sale.getSubtotal())
                .taxAmount(sale.getTaxAmount())
                .discount(sale.getDiscount())
                .totalAmount(sale.getTotalAmount())
                .status(sale.getStatus())
                .notes(sale.getNotes())
                .receiptPath(receiptPath)
                .createdAt(sale.getCreatedAt())
                .build();
    }

    public SaleItemResponse toItemResponse(SaleItem item) {
        return SaleItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discount(item.getDiscount())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
