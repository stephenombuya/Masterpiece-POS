package com.pos.service;

import com.pos.dto.request.ProductRequest;
import com.pos.dto.response.ProductResponse;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BusinessException;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Testcontainers
@Transactional
class ProductServiceTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));

    @Autowired private ProductService productService;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> roleRepository.save(Role.builder().name("ADMIN").build()));

        User admin = userRepository.findByUsername("testadmin")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("testadmin")
                        .passwordHash(passwordEncoder.encode("Admin@1234"))
                        .fullName("Test Admin")
                        .role(adminRole)
                        .active(true)
                        .build()));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        admin.getUsername(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    @Test
    void create_withValidRequest_returnsCreatedProduct() {
        ProductRequest req = new ProductRequest();
        req.setName("Test Doughnut");
        req.setPrice(BigDecimal.valueOf(10.00));
        req.setCostPrice(BigDecimal.valueOf(5.00));
        req.setStockQuantity(20);
        req.setMinStock(5);

        ProductResponse response = productService.create(req);

        assertNotNull(response.getId());
        assertEquals("Test Doughnut", response.getName());
        assertEquals(20, response.getStockQuantity());
    }

    @Test
    void create_withDuplicateBarcode_throwsException() {
        ProductRequest req1 = new ProductRequest();
        req1.setName("Product A");
        req1.setBarcode("BC-DUPLICATE-001");
        req1.setPrice(BigDecimal.valueOf(10.00));
        productService.create(req1);

        ProductRequest req2 = new ProductRequest();
        req2.setName("Product B");
        req2.setBarcode("BC-DUPLICATE-001");
        req2.setPrice(BigDecimal.valueOf(20.00));

        assertThrows(BusinessException.class, () -> productService.create(req2));
    }

    @Test
    void adjustStock_increasesQuantity() {
        ProductRequest req = new ProductRequest();
        req.setName("Stock Test Item");
        req.setPrice(BigDecimal.valueOf(15.00));
        req.setStockQuantity(10);
        ProductResponse created = productService.create(req);

        productService.adjustStock(created.getId(), 25, "Restocked from supplier");

        ProductResponse updated = productService.getById(created.getId());
        assertEquals(35, updated.getStockQuantity());
    }

    @Test
    void adjustStock_negativeBeyondAvailable_throwsException() {
        ProductRequest req = new ProductRequest();
        req.setName("Low Stock Item");
        req.setPrice(BigDecimal.valueOf(15.00));
        req.setStockQuantity(5);
        ProductResponse created = productService.create(req);

        assertThrows(BusinessException.class,
                () -> productService.adjustStock(created.getId(), -10, "Damaged goods"));
    }
}
