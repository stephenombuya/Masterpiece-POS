package com.pos.repository;

import com.pos.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    Optional<Sale> findBySaleNumber(String saleNumber);

    @Query("""
        SELECT s FROM Sale s
        JOIN FETCH s.cashier u
        LEFT JOIN FETCH s.items si
        LEFT JOIN FETCH si.product
        WHERE s.id = :id
    """)
    Optional<Sale> findByIdWithDetails(@Param("id") Long id);

    @Query("""
        SELECT s FROM Sale s JOIN FETCH s.cashier
        WHERE CAST(s.createdAt AS date) = :date AND s.status = 'COMPLETED'
        ORDER BY s.createdAt DESC
    """)
    List<Sale> findByDate(@Param("date") LocalDate date);

    @Query("""
        SELECT s FROM Sale s JOIN FETCH s.cashier
        WHERE CAST(s.createdAt AS date) BETWEEN :from AND :to
          AND s.status = 'COMPLETED'
        ORDER BY s.createdAt DESC
    """)
    List<Sale> findByDateRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        SELECT COUNT(s) FROM Sale s
        WHERE CAST(s.createdAt AS date) = :date AND s.status = 'COMPLETED'
    """)
    long countByDate(@Param("date") LocalDate date);
}
