package com.example.travel.api.dto;

import java.util.List;

public record CreateUserRequest(
        String email,
        String password,
        String firstName,
        String lastName,
        String role,           // kept for backwards compat (ignored when userTypeId is set)
        Long agencyId,         // nullable — required for super_admin creating agency_admin
        Long userTypeId,       // preferred — determines role automatically
        Long parentId,         // nullable — super_admin may override; others auto-set to self
        List<Long> permissionIds  // permissions to assign to this user (not used for super_admin)
) {}
