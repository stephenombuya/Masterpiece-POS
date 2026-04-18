package com.pos.service;

import com.pos.dto.sale.CreateSaleRequest;
import com.pos.dto.sale.SaleItemRequest;
import com.pos.dto.sale.SaleResponse;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.*;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final StockMovementRepository stockMovementRepository;

    private static final AtomicInteger SEQUENCE = new AtomicInteger(1);

    @Transactional
    public SaleResponse processSale(CreateSaleRequest req, String cashierUsername) {
        User cashier = userRepository.findByUsername(cashierUsername)
            .orElseThrow(() -> new ResourceNotFoundException("Cashier not found"));

        Customer customer = req.customerId() != null
            ? customerRepository.findById(req.customerId()).orElse(null)
            : null;

        // Build sale items + compute totals
        List<SaleItem> items = new ArrayList<>();
        BigDecimal subtotal      = BigDecimal.ZERO;
        BigDecimal taxTotal      = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : req.items()) {
            Product product = productRepository.findById(itemReq.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + itemReq.productId()));

            if (!product.isActive()) {
                throw new BadRequestException("Product is inactive: " + product.getName());
            }
            if (product.getStockQuantity() < itemReq.quantity()) {
                throw new BadRequestException(
                    "Insufficient stock for: " + product.getName() +
                    ". Available: " + product.getStockQuantity()
                );
            }

            BigDecimal lineDiscount = itemReq.discount() != null ? itemReq.discount() : BigDecimal.ZERO;
            BigDecimal unitPrice    = product.getSellingPrice();
            BigDecimal taxableAmt   = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity())).subtract(lineDiscount);
            BigDecimal taxAmt       = taxableAmt.multiply(product.getTaxRate().divide(BigDecimal.valueOf(100)));
            BigDecimal lineTotal    = taxableAmt.add(taxAmt);

            SaleItem saleItem = SaleItem.builder()
                .product(product)
                .productName(product.getName())
                .unitPrice(unitPrice)
                .quantity(itemReq.quantity())
                .discount(lineDiscount)
                .taxAmount(taxAmt.setScale(2, RoundingMode.HALF_UP))
                .lineTotal(lineTotal.setScale(2, RoundingMode.HALF_UP))
                .build();

            items.add(saleItem);

            subtotal      = subtotal.add(unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity())));
            taxTotal      = taxTotal.add(taxAmt);
            discountTotal = discountTotal.add(lineDiscount);

            // Deduct stock
            product.setStockQuantity(product.getStockQuantity() - itemReq.quantity());
            productRepository.save(product);

            // Record stock movement
            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType("SALE")
                .quantity(-itemReq.quantity())
                .build());
        }

        BigDecimal total       = subtotal.add(taxTotal).subtract(discountTotal);
        BigDecimal change      = req.amountTendered() != null
            ? req.amountTendered().subtract(total).max(BigDecimal.ZERO)
            : BigDecimal.ZERO;

        Sale sale = Sale.builder()
            .receiptNumber(generateReceiptNumber())
            .cashier(cashier)
            .customer(customer)
            .subtotal(subtotal.setScale(2, RoundingMode.HALF_UP))
            .taxTotal(taxTotal.setScale(2, RoundingMode.HALF_UP))
            .discountTotal(discountTotal.setScale(2, RoundingMode.HALF_UP))
            .totalAmount(total.setScale(2, RoundingMode.HALF_UP))
            .paymentMethod(Sale.PaymentMethod.valueOf(req.paymentMethod()))
            .amountTendered(req.amountTendered())
            .changeGiven(change.setScale(2, RoundingMode.HALF_UP))
            .status(Sale.SaleStatus.COMPLETED)
            .notes(req.notes())
            .build();

        items.forEach(item -> item.setSale(sale));
        sale.setItems(items);

        return toResponse(saleRepository.save(sale));
    }

    public SaleResponse getSale(UUID id) {
        return toResponse(saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found")));
    }

    public SaleResponse getByReceiptNumber(String receiptNumber) {
        return toResponse(saleRepository.findByReceiptNumber(receiptNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Receipt not found")));
    }

    public PageResponse<SaleResponse> getSales(LocalDate from, LocalDate to, String cashierId, Pageable pageable) {
        Page<Sale> page = saleRepository.searchSales(from, to, cashierId, pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    public PageResponse<SaleResponse> getSalesByCashier(String username, Pageable pageable) {
        Page<Sale> page = saleRepository.findByCashierUsername(username, pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    @Transactional
    public SaleResponse voidSale(UUID id, String reason) {
        Sale sale = saleRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Sale not found"));

        if (sale.getStatus() == Sale.SaleStatus.VOIDED) {
            throw new BadRequestException("Sale already voided");
        }

        sale.setStatus(Sale.SaleStatus.VOIDED);
        sale.setNotes(reason);

        // Restore stock
        sale.getItems().forEach(item -> {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            productRepository.save(product);

            stockMovementRepository.save(StockMovement.builder()
                .product(product)
                .movementType("RETURN")
                .quantity(item.getQuantity())
                .referenceId(sale.getId())
                .notes("Void: " + reason)
                .build());
        });

        return toResponse(saleRepository.save(sale));
    }

    private String generateReceiptNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "RCP-" + date + "-" + String.format("%04d", SEQUENCE.getAndIncrement());
    }

    private SaleResponse toResponse(Sale s) {
        return SaleResponse.fromSale(s);
    }
}
