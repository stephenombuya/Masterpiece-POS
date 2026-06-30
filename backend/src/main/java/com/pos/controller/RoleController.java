package com.pos.controller;

import com.pos.entity.Role;
import com.pos.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAll() {
        List<Map<String, Object>> roles = userService.getAllRoles().stream()
                .map(r -> Map.<String, Object>of("id", r.getId(), "name", r.getName()))
                .toList();
        return ResponseEntity.ok(roles);
    }
}
