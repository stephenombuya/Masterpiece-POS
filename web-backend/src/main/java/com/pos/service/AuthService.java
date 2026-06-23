package com.pos.service;

import com.pos.dto.auth.AuthRequest;
import com.pos.dto.auth.AuthResponse;
import com.pos.dto.auth.RegisterRequest;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BadRequestException;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import com.pos.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final AuditService auditService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already registered");
        }

        Role role = roleRepository.findByName("CASHIER")
            .orElseThrow(() -> new IllegalStateException("Default role not found"));

        User user = User.builder()
            .username(request.username())
            .email(request.email())
            .password(passwordEncoder.encode(request.password()))
            .fullName(request.fullName())
            .role(role)
            .isActive(true)
            .build();

        userRepository.save(user);
        auditService.log(user, "USER_REGISTERED", "User", user.getId().toString(), null, null);

        String token = jwtService.generateToken(user);
        return buildResponse(user, token);
    }

    public AuthResponse authenticate(AuthRequest request) {
        authManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.username(), request.password())
        );

        User user = userRepository.findByUsername(request.username())
            .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        auditService.log(user, "LOGIN", null, null, null, null);

        String token = jwtService.generateToken(user);
        return buildResponse(user, token);
    }

    public AuthResponse refreshToken(String token) {
        String username = jwtService.extractUsername(token);
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new BadRequestException("User not found"));

        if (!jwtService.isTokenValid(token, user)) {
            throw new BadRequestException("Invalid or expired token");
        }

        String newToken = jwtService.generateToken(user);
        return buildResponse(user, newToken);
    }

    private AuthResponse buildResponse(User user, String token) {
        return new AuthResponse(
            token,
            user.getId().toString(),
            user.getUsername(),
            user.getEmail(),
            user.getFullName(),
            user.getRole().getName()
        );
    }
}
