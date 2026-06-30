package com.pos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.request.ProductRequest;
import com.pos.dto.response.ProductResponse;
import com.pos.service.ProductService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private ProductService productService;
    @MockBean private com.pos.security.JwtAuthFilter jwtAuthFilter;
    @MockBean private com.pos.security.UserDetailsServiceImpl userDetailsService;

    @Test
    @WithMockUser(roles = "CASHIER")
    void getAll_returnsProductList() throws Exception {
        ProductResponse p = ProductResponse.builder()
                .id(1L).name("Coffee").price(BigDecimal.valueOf(10)).stockQuantity(50).build();
        when(productService.getAll()).thenReturn(List.of(p));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Coffee"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void create_withValidRequest_returns201() throws Exception {
        ProductRequest req = new ProductRequest();
        req.setName("Doughnut");
        req.setPrice(BigDecimal.valueOf(10));

        ProductResponse resp = ProductResponse.builder().id(1L).name("Doughnut").price(BigDecimal.valueOf(10)).build();
        when(productService.create(any())).thenReturn(resp);

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Doughnut"));
    }

    @Test
    @WithMockUser(roles = "CASHIER")
    void create_withBlankName_returns400() throws Exception {
        ProductRequest req = new ProductRequest();
        req.setName("");
        req.setPrice(BigDecimal.valueOf(10));

        mockMvc.perform(post("/api/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deactivate_returns204() throws Exception {
        mockMvc.perform(delete("/api/products/1"))
                .andExpect(status().isNoContent());
    }
}
