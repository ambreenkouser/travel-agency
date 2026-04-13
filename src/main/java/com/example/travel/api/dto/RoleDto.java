package com.example.travel.api.dto;

import java.util.List;

public record RoleDto(
        Long id,
        String name,
        List<String> permissions
) {}
