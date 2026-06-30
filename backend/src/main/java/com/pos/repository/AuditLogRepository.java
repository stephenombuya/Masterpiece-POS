package com.pos.repository;

import com.pos.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a LEFT JOIN FETCH a.user ORDER BY a.createdAt DESC LIMIT 100")
    List<AuditLog> findRecent();

    List<AuditLog> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
}
