package com.pos.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "receipts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Receipt extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sale_id", nullable = false, unique = true)
    private Sale sale;

    @Column(name = "receipt_path")
    private String receiptPath;

    @Column(nullable = false)
    @Builder.Default
    private boolean printed = false;
}
