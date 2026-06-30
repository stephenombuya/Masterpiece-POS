package com.pos.repository;

import com.pos.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductId(Long productId);

    @Modifying
    @Query("UPDATE Inventory i SET i.quantity = i.quantity + :delta WHERE i.product.id = :productId")
    int adjustQuantity(@Param("productId") Long productId, @Param("delta") int delta);

    @Modifying
    @Query("""
        UPDATE Inventory i SET i.quantity = i.quantity - :qty
        WHERE i.product.id = :productId AND i.quantity >= :qty
    """)
    int decrementIfSufficient(@Param("productId") Long productId, @Param("qty") int qty);
}
