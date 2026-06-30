package com.pos.service;

import com.pos.dto.request.SaleItemRequest;
import com.pos.dto.request.SaleRequest;
import com.pos.dto.response.SaleResponse;
import com.pos.entity.*;
import com.pos.exception.BusinessException;
import com.pos.exception.InsufficientStockException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.InventoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.repository.SaleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
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
class SaleServiceTest {

    @Container
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));

    @Autowired private SaleService saleService;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private Product testProduct;
    private User testUser;

    @BeforeEach
    void setUp() {
        Role cashierRole = roleRepository.findByName("CASHIER")
                .orElseGet(() -> roleRepository.save(Role.builder().name("CASHIER").build()));

        testUser = userRepository.findByUsername("testcashier")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("testcashier")
                        .passwordHash(passwordEncoder.encode("Test@1234"))
                        .fullName("Test Cashier")
                        .role(cashierRole)
                        .active(true)
                        .build()));

        Category cat = categoryRepository.save(Category.builder().name("TestCat-" + System.nanoTime()).build());

        testProduct = Product.builder()
                .name("Test Coffee")
                .price(BigDecimal.valueOf(10.00))
                .costPrice(BigDecimal.valueOf(5.00))
                .category(cat)
                .active(true)
                .build();
        Inventory inv = Inventory.builder().product(testProduct).quantity(50).minStock(5).build();
        testProduct.setInventory(inv);
        testProduct = productRepository.save(testProduct);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        testUser.getUsername(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_CASHIER"))));
    }

    @Test
    void completeSale_withValidRequest_succeeds() {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(testProduct.getId());
        item.setQuantity(2);

        SaleRequest request = new SaleRequest();
        request.setItems(List.of(item));
        request.setPaymentMethod("CASH");
        request.setAmountTendered(BigDecimal.valueOf(30.00)); // 20 + 16% tax = 23.2

        SaleResponse response = saleService.completeSale(request);

        assertNotNull(response.getId());
        assertEquals("COMPLETED", response.getStatus());
        assertEquals(0, response.getSubtotal().compareTo(BigDecimal.valueOf(20.00)));
    }

    @Test
    void completeSale_decrementsInventory() {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(testProduct.getId());
        item.setQuantity(5);

        SaleRequest request = new SaleRequest();
        request.setItems(List.of(item));
        request.setPaymentMethod("CASH");
        request.setAmountTendered(BigDecimal.valueOf(100.00));

        saleService.completeSale(request);

        Inventory inv = inventoryRepository.findByProductId(testProduct.getId()).orElseThrow();
        assertEquals(45, inv.getQuantity());
    }

    @Test
    void completeSale_withInsufficientStock_throwsException() {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(testProduct.getId());
        item.setQuantity(999); // way more than the 50 in stock

        SaleRequest request = new SaleRequest();
        request.setItems(List.of(item));
        request.setPaymentMethod("CASH");
        request.setAmountTendered(BigDecimal.valueOf(99999.00));

        assertThrows(InsufficientStockException.class, () -> saleService.completeSale(request));
    }

    @Test
    void completeSale_withInsufficientPayment_throwsException() {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(testProduct.getId());
        item.setQuantity(1);

        SaleRequest request = new SaleRequest();
        request.setItems(List.of(item));
        request.setPaymentMethod("CASH");
        request.setAmountTendered(BigDecimal.valueOf(1.00)); // way too low

        assertThrows(BusinessException.class, () -> saleService.completeSale(request));
    }

    @Test
    void completeSale_withMpesaAndNoReference_throwsException() {
        SaleItemRequest item = new SaleItemRequest();
        item.setProductId(testProduct.getId());
        item.setQuantity(1);

        SaleRequest request = new SaleRequest();
        request.setItems(List.of(item));
        request.setPaymentMethod("MPESA");
        request.setAmountTendered(BigDecimal.valueOf(20.00));
        // no paymentReference set

        assertThrows(BusinessException.class, () -> saleService.completeSale(request));
    }
}
