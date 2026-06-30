package com.pos.repository;

import com.pos.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findByBarcodeAndActiveTrue(String barcode);
    boolean existsByBarcode(String barcode);
    boolean existsByBarcodeAndIdNot(String barcode, Long id);

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.inventory
        WHERE p.active = true
        ORDER BY p.name
    """)
    List<Product> findAllActiveWithDetails();

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.inventory
        WHERE p.active = true
          AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR p.barcode LIKE CONCAT('%', :q, '%'))
        ORDER BY p.name
    """)
    List<Product> searchActive(@Param("q") String query);

    @Query("""
        SELECT p FROM Product p
        JOIN FETCH p.inventory i
        LEFT JOIN FETCH p.category
        WHERE p.active = true AND i.quantity <= i.minStock
        ORDER BY i.quantity ASC
    """)
    List<Product> findLowStock();

    @Query("""
        SELECT p FROM Product p
        LEFT JOIN FETCH p.category
        LEFT JOIN FETCH p.inventory
        WHERE p.id = :id
    """)
    Optional<Product> findByIdWithDetails(@Param("id") Long id);
}
