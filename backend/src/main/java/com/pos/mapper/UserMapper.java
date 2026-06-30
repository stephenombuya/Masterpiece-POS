package com.pos.mapper;

import com.pos.dto.response.UserResponse;
import com.pos.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .roleId(user.getRole().getId())
                .roleName(user.getRole().getName())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
