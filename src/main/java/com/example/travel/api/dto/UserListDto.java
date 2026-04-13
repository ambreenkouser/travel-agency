package com.example.travel.api.dto;

import java.util.List;

public record UserListDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        boolean active,
        List<String> roles,
        Long agencyId,
        String agencyName,
        Long userTypeId,
        String userTypeName,
        int userTypeLevel,
        Long parentId,
        String parentName,
        List<Long> permissionIds
) {}
