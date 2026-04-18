// ============================================================
// Desktop Domain Models
// ============================================================

// === Product.java ===
package com.pos.desktop.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    private String  id;
    private String  sku;
    private String  name;
    private String  description;
    private Integer categoryId;
    private String  categoryName;
    private double  costPrice;
    private double  sellingPrice;
    private double  taxRate;
    private int     stockQuantity;
    private int     lowStockAlert;
    private String  barcode;
    private boolean active;
    private String  createdAt;
    private String  updatedAt;

    public boolean isLowStock() {
        return stockQuantity <= lowStockAlert;
    }
}

// === CartItem.java ===
package com.pos.desktop.model;

import lombok.Data;

@Data
public class CartItem {
    private String productId;
    private String productName;
    private double unitPrice;
    private double taxRate;
    private int    quantity;
    private double discount;
    private double taxAmount;
    private double lineTotal;
    private int    maxStock;

    public static CartItem from(Product product, int quantity) {
        CartItem item = new CartItem();
        item.setProductId(product.getId());
        item.setProductName(product.getName());
        item.setUnitPrice(product.getSellingPrice());
        item.setTaxRate(product.getTaxRate());
        item.setQuantity(quantity);
        item.setDiscount(0);
        item.setMaxStock(product.getStockQuantity());
        item.recalculate();
        return item;
    }

    public void recalculate() {
        double base     = unitPrice * quantity - discount;
        this.taxAmount  = round2(base * (taxRate / 100.0));
        this.lineTotal  = round2(base + taxAmount);
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}

// === Sale.java ===
package com.pos.desktop.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class Sale {
    private String        id;
    private String        receiptNumber;
    private String        cashierId;
    private List<SaleItem> items = new ArrayList<>();
    private double        subtotal;
    private double        taxTotal;
    private double        discountTotal;
    private double        totalAmount;
    private String        paymentMethod;
    private double        amountTendered;
    private double        changeGiven;
    private String        status;
    private String        notes;
    private String        createdAt;
}

// === SaleItem.java ===
package com.pos.desktop.model;

import lombok.Data;

@Data
public class SaleItem {
    private String id;
    private String saleId;
    private String productId;
    private String productName;
    private double unitPrice;
    private int    quantity;
    private double discount;
    private double taxAmount;
    private double lineTotal;
}

// === User.java ===
package com.pos.desktop.model;

import lombok.Data;

@Data
public class User {
    private String  id;
    private String  username;
    private String  password;     // bcrypt hash — never expose
    private String  fullName;
    private String  role;         // ADMIN, CASHIER
    private boolean active;
    private String  createdAt;

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }
}
