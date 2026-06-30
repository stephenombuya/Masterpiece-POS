package com.pos.service;

import com.pos.entity.AuditLog;
import com.pos.entity.User;
import com.pos.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditService {

    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    @Async
    public void log(User user, String action, String entity, Long entityId, String details) {
        try {
            AuditLog entry = AuditLog.builder()
                    .user(user)
                    .action(action)
                    .entity(entity)
                    .entityId(entityId)
                    .details(details)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Audit logging must never break the main flow
            logger.warn("Audit log failed: {}", e.getMessage());
        }
    }
}
