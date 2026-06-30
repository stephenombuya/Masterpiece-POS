package com.pos.service;

import com.pos.dto.request.ChangePasswordRequest;
import com.pos.dto.request.UserRequest;
import com.pos.dto.response.UserResponse;
import com.pos.entity.Role;
import com.pos.entity.User;
import com.pos.exception.BusinessException;
import com.pos.exception.ResourceNotFoundException;
import com.pos.mapper.UserMapper;
import com.pos.repository.RoleRepository;
import com.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final CurrentUserService currentUserService;

    public List<UserResponse> getAll() {
        return userRepository.findAllWithRole().stream()
                .map(userMapper::toResponse)
                .toList();
    }

    public UserResponse getById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return userMapper.toResponse(user);
    }

    @Transactional
    public UserResponse create(UserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("Username '" + request.getUsername() + "' is already taken");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("Password is required for new users");
        }

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", request.getRoleId()));

        User user = User.builder()
                .username(request.getUsername().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .role(role)
                .active(true)
                .build();

        User saved = userRepository.save(user);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "CREATE_USER", "users", saved.getId(), "Created: " + saved.getUsername());

        return userMapper.toResponse(saved);
    }

    @Transactional
    public UserResponse update(Long id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new ResourceNotFoundException("Role", request.getRoleId()));

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setRole(role);
        user.setActive(request.isActive());

        User saved = userRepository.save(user);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "UPDATE_USER", "users", saved.getId(), "Updated: " + saved.getUsername());

        return userMapper.toResponse(saved);
    }

    @Transactional
    public void deactivate(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.setActive(false);
        userRepository.save(user);

        User actor = currentUserService.getCurrentUser();
        auditService.log(actor, "DEACTIVATE_USER", "users", id, "Deactivated: " + user.getUsername());
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BusinessException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.log(user, "PASSWORD_CHANGE", "users", userId, null);
    }

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}
