package com.example.travel.api.dto;

import java.util.List;

public record PackageTypeDefDto(
        Long id,
        String name,
        String slug,
        String description,
        String icon,
        boolean active,
        List<Long> grantedAgencyIds
) {}
