package com.pos.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CategoryRequest {
    @NotBlank(message = "Category name is required")
    @Size(max = 100)
    private String name;
    private String description;
}
