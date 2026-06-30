package com.pos.service;

import com.pos.config.AppProperties;
import com.pos.dto.request.SaleItemRequest;
import com.pos.dto.request.SaleRequest;
import com.pos.dto.response.SaleResponse;
import com.pos.entity.*;
import com.pos.exception.BusinessException;
import com.pos.exception.InsufficientStockException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.SaleMapper;
import com.pos.repository.InventoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SaleService {

    private static final DateTimeFormatter NUM_FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final List<String> VALID_METHODS = List.of("CASH", "MPESA", "CARD", "CREDIT");

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final SaleMapper saleMapper;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;
    private final ReceiptService receiptService;
    private final AppProperties appProperties;

    /**
     * Completes a sale atomically: validates stock, persists sale + items + payment,
     * decrements inventory, generates a PDF receipt. Fully rolls back on any failure.
     */
    @Transactional
    public SaleResponse completeSale(SaleRequest request) {
        if (!VALID_METHODS.contains(request.getPaymentMethod())) {
            throw new BusinessException("Invalid payment method: " + request.getPaymentMethod());
        }
        if ("MPESA".equals(request.getPaymentMethod())
                && (request.getPaymentReference() == null || request.getPaymentReference().isBlank())) {
            throw new BusinessException("M-PESA transaction reference is required");
        }

        User cashier = currentUserService.getCurrentUser();
        BigDecimal taxRate = BigDecimal.valueOf(appProperties.getTax().getRate());

        Sale sale = Sale.builder()
                .saleNumber(generateSaleNumber())
                .cashier(cashier)
                .status("COMPLETED")
                .discount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO)
                .notes(request.getNotes())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

            if (!product.isActive()) {
                throw new BusinessException("Product '" + product.getName() + "' is not active");
            }

            Inventory inv = inventoryRepository.findByProductId(product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory record missing for product " + product.getId()));

            if (inv.getQuantity() < itemReq.getQuantity()) {
                throw new InsufficientStockException(product.getName(), itemReq.getQuantity(), inv.getQuantity());
            }

            SaleItem item = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .productName(product.getName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(product.getPrice())
                    .discount(itemReq.getDiscount() != null ? itemReq.getDiscount() : BigDecimal.ZERO)
                    .build();
            item.calculateLineTotal();

            sale.getItems().add(item);
            subtotal = subtotal.add(item.getLineTotal());

            // Atomically decrement inventory — guarded by SQL-level WHERE quantity >= qty
            int updated = inventoryRepository.decrementIfSufficient(product.getId(), itemReq.getQuantity());
            if (updated == 0) {
                // Race condition caught at the DB level — another cashier beat us to it
                throw new InsufficientStockException(product.getName(), itemReq.getQuantity(), inv.getQuantity());
            }
        }

        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(taxAmount).subtract(sale.getDiscount());

        if (request.getAmountTendered().compareTo(total) < 0) {
            throw new BusinessException(String.format(
                    "Insufficient payment. Total: %.2f, Tendered: %.2f", total, request.getAmountTendered()));
        }

        sale.setSubtotal(subtotal);
        sale.setTaxAmount(taxAmount);
        sale.setTotalAmount(total);

        Payment payment = Payment.builder()
                .sale(sale)
                .method(request.getPaymentMethod())
                .amount(request.getAmountTendered())
                .reference(request.getPaymentReference())
                .build();
        sale.getPayments().add(payment);

        Sale savedSale = saleRepository.save(sale);

        // Generate PDF receipt
        String receiptPath = receiptService.generateReceipt(savedSale);
        Receipt receipt = Receipt.builder()
                .sale(savedSale)
                .receiptPath(receiptPath)
                .printed(false)
                .build();
        savedSale.setReceipt(receipt);
        saleRepository.save(savedSale);

        auditService.log(cashier, "COMPLETE_SALE", "sales", savedSale.getId(),
                "Sale: " + savedSale.getSaleNumber() + " | Total: " + total);

        return saleMapper.toResponse(savedSale);
    }

    public SaleResponse getById(Long id) {
        Sale sale = saleRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", id));
        return saleMapper.toResponse(sale);
    }

    public List<SaleResponse> getToday() {
        return saleRepository.findByDate(LocalDate.now()).stream()
                .map(saleMapper::toResponse)
                .toList();
    }

    public List<SaleResponse> getByDateRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new BusinessException("'from' date must be before 'to' date");
        }
        return saleRepository.findByDateRange(from, to).stream()
                .map(saleMapper::toResponse)
                .toList();
    }

    public List<SaleResponse> getAll() {
        return saleRepository.findAll().stream()
                .map(saleMapper::toResponse)
                .toList();
    }

    @Transactional
    public void voidSale(Long saleId, String reason) {
        Sale sale = saleRepository.findByIdWithDetails(saleId)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", saleId));

        if ("VOIDED".equals(sale.getStatus())) {
            throw new BusinessException("Sale is already voided");
        }

        // Restore inventory for every line item
        for (SaleItem item : sale.getItems()) {
            inventoryRepository.adjustQuantity(item.getProduct().getId(), item.getQuantity());
        }

        sale.setStatus("VOIDED");
        sale.setNotes("VOIDED: " + reason);
        saleRepository.save(sale);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "VOID_SALE", "sales", saleId, reason);
    }

    private String generateSaleNumber() {
        return "TXN-" + LocalDateTime.now().format(NUM_FMT);
    }
}
