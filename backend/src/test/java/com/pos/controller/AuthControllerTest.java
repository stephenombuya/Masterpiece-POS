package com.pos.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.dto.request.LoginRequest;
import com.pos.dto.response.AuthResponse;
import com.pos.dto.response.UserResponse;
import com.pos.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private AuthService authService;
    @MockBean private com.pos.security.JwtAuthFilter jwtAuthFilter;
    @MockBean private com.pos.security.UserDetailsServiceImpl userDetailsService;

    @Test
    void login_withValidCredentials_returns200() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin");
        req.setPassword("Admin@1234");

        UserResponse userResp = UserResponse.builder()
                .id(1L).username("admin").fullName("System Administrator")
                .roleId(1L).roleName("ADMIN").active(true).build();

        AuthResponse authResp = AuthResponse.builder().token("fake-jwt-token").user(userResp).build();

        when(authService.login(any())).thenReturn(authResp);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("fake-jwt-token"))
                .andExpect(jsonPath("$.user.username").value("admin"));
    }

    @Test
    void login_withBlankUsername_returns400() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("");
        req.setPassword("Admin@1234");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_withInvalidCredentials_returns401() throws Exception {
        LoginRequest req = new LoginRequest();
        req.setUsername("admin");
        req.setPassword("wrongpass");

        when(authService.login(any())).thenThrow(new BadCredentialsException("Invalid username or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }
}
