package com.pos.service;

import com.pos.dto.product.CreateProductRequest;
import com.pos.dto.product.ProductResponse;
import com.pos.dto.product.UpdateProductRequest;
import com.pos.dto.shared.PageResponse;
import com.pos.entity.Category;
import com.pos.entity.Product;
import com.pos.entity.StockMovement;
import com.pos.exception.BadRequestException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.repository.CategoryRepository;
import com.pos.repository.ProductRepository;
import com.pos.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final StockMovementRepository stockMovementRepository;

    public PageResponse<ProductResponse> getProducts(
        String search, Integer categoryId, boolean activeOnly, Pageable pageable
    ) {
        Page<Product> page = productRepository.search(search, categoryId, activeOnly, pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    public ProductResponse getProduct(UUID id) {
        return toResponse(findById(id));
    }

    public ProductResponse getByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
            .map(this::toResponse)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found for barcode: " + barcode));
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest req) {
        if (productRepository.existsBySku(req.sku())) {
            throw new BadRequestException("SKU already exists: " + req.sku());
        }

        Category category = req.categoryId() != null
            ? categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"))
            : null;

        Product product = Product.builder()
            .sku(req.sku())
            .name(req.name())
            .description(req.description())
            .category(category)
            .costPrice(req.costPrice())
            .sellingPrice(req.sellingPrice())
            .taxRate(req.taxRate())
            .stockQuantity(req.initialStock())
            .lowStockAlert(req.lowStockAlert() != null ? req.lowStockAlert() : 10)
            .barcode(req.barcode())
            .imageUrl(req.imageUrl())
            .isActive(true)
            .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateProduct(UUID id, UpdateProductRequest req) {
        Product product = findById(id);

        if (StringUtils.hasText(req.name()))          product.setName(req.name());
        if (StringUtils.hasText(req.description()))   product.setDescription(req.description());
        if (req.sellingPrice() != null)               product.setSellingPrice(req.sellingPrice());
        if (req.costPrice() != null)                  product.setCostPrice(req.costPrice());
        if (req.taxRate() != null)                    product.setTaxRate(req.taxRate());
        if (req.lowStockAlert() != null)              product.setLowStockAlert(req.lowStockAlert());
        if (StringUtils.hasText(req.imageUrl()))      product.setImageUrl(req.imageUrl());
        if (req.categoryId() != null) {
            Category cat = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(cat);
        }

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse adjustStock(UUID id, int quantity, String movementType, String notes) {
        Product product = findById(id);
        int newStock = product.getStockQuantity() + quantity;
        if (newStock < 0) throw new BadRequestException("Insufficient stock");

        product.setStockQuantity(newStock);
        productRepository.save(product);

        StockMovement movement = StockMovement.builder()
            .product(product)
            .movementType(movementType)
            .quantity(quantity)
            .notes(notes)
            .build();
        stockMovementRepository.save(movement);

        return toResponse(product);
    }

    @Transactional
    public void deactivateProduct(UUID id) {
        Product product = findById(id);
        product.setActive(false);
        productRepository.save(product);
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    private Product findById(UUID id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    private ProductResponse toResponse(Product p) {
        return new ProductResponse(
            p.getId(), p.getSku(), p.getName(), p.getDescription(),
            p.getCategory() != null ? p.getCategory().getName() : null,
            p.getCostPrice(), p.getSellingPrice(), p.getTaxRate(),
            p.getStockQuantity(), p.getLowStockAlert(), p.isLowStock(),
            p.getBarcode(), p.getImageUrl(), p.isActive(), p.getCreatedAt()
        );
    }
}
