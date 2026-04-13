package com.example.travel.api.dto;

import java.util.List;

public record UserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        Long agencyId,
        List<String> authorities
) {}
