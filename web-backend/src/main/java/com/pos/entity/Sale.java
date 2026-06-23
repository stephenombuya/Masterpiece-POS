package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "sales")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Sale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "receipt_number", unique = true, nullable = false)
    private String receiptNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "cashier_id", nullable = false)
    private User cashier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal subtotal;

    @Column(name = "tax_total", precision = 12, scale = 2)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(name = "discount_total", precision = 12, scale = 2)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", nullable = false)
    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    @Column(name = "amount_tendered", precision = 12, scale = 2)
    private BigDecimal amountTendered;

    @Column(name = "change_given", precision = 12, scale = 2)
    private BigDecimal changeGiven = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private SaleStatus status = SaleStatus.COMPLETED;

    private String notes;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist void prePersist() {
        this.createdAt = Instant.now();
    }

    public enum PaymentMethod { CASH, CARD, MPESA, MIXED }
    public enum SaleStatus    { COMPLETED, REFUNDED, VOIDED }
}
