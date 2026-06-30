package com.pos.service;

import com.pos.dto.request.ProductRequest;
import com.pos.dto.response.ProductResponse;
import com.pos.entity.Category;
import com.pos.entity.Inventory;
import com.pos.entity.Product;
import com.pos.entity.User;
import com.pos.exception.BusinessException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.ProductMapper;
import com.pos.repository.CategoryRepository;
import com.pos.repository.InventoryRepository;
import com.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductMapper productMapper;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;

    public List<ProductResponse> getAll() {
        return productRepository.findAllActiveWithDetails().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public List<ProductResponse> search(String query) {
        return productRepository.searchActive(query).stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public ProductResponse getById(Long id) {
        Product product = productRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return productMapper.toResponse(product);
    }

    public ProductResponse getByBarcode(String barcode) {
        Product product = productRepository.findByBarcodeAndActiveTrue(barcode)
                .orElseThrow(() -> new ResourceNotFoundException("Product with barcode '" + barcode + "' not found"));
        return productMapper.toResponse(product);
    }

    public List<ProductResponse> getLowStock() {
        return productRepository.findLowStock().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (request.getBarcode() != null && !request.getBarcode().isBlank()
                && productRepository.existsByBarcode(request.getBarcode())) {
            throw new BusinessException("Barcode '" + request.getBarcode() + "' already in use");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        }

        Product product = Product.builder()
                .name(request.getName())
                .barcode(blankToNull(request.getBarcode()))
                .description(request.getDescription())
                .price(request.getPrice())
                .costPrice(request.getCostPrice())
                .category(category)
                .active(request.isActive())
                .build();

        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(request.getStockQuantity())
                .minStock(request.getMinStock())
                .build();
        product.setInventory(inventory);

        Product saved = productRepository.save(product);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "CREATE_PRODUCT", "products", saved.getId(), "Created: " + saved.getName());

        return productMapper.toResponse(saved);
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));

        if (request.getBarcode() != null && !request.getBarcode().isBlank()
                && productRepository.existsByBarcodeAndIdNot(request.getBarcode(), id)) {
            throw new BusinessException("Barcode '" + request.getBarcode() + "' already in use by another product");
        }

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", request.getCategoryId()));
        }

        product.setName(request.getName());
        product.setBarcode(blankToNull(request.getBarcode()));
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCostPrice(request.getCostPrice());
        product.setCategory(category);
        product.setActive(request.isActive());

        if (product.getInventory() != null) {
            product.getInventory().setQuantity(request.getStockQuantity());
            product.getInventory().setMinStock(request.getMinStock());
        }

        Product saved = productRepository.save(product);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "UPDATE_PRODUCT", "products", saved.getId(), "Updated: " + saved.getName());

        return productMapper.toResponse(saved);
    }

    @Transactional
    public void deactivate(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(false);
        productRepository.save(product);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "DEACTIVATE_PRODUCT", "products", id, "Deactivated: " + product.getName());
    }

    @Transactional
    public void adjustStock(Long productId, int delta, String reason) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found for product " + productId));

        if (delta < 0 && inv.getQuantity() + delta < 0) {
            throw new BusinessException("Cannot remove more stock than available. Current: " + inv.getQuantity());
        }

        inventoryRepository.adjustQuantity(productId, delta);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "ADJUST_STOCK", "inventory", productId,
                "Delta: " + delta + " | Reason: " + reason);
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }
}
