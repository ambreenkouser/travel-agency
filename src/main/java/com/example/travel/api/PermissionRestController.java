package com.example.travel.api;

import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.Permission;
import com.example.travel.auth.PermissionRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/permissions")
public class PermissionRestController {

    private final PermissionRepository permissionRepository;

    public PermissionRestController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    /**
     * Returns the permissions that the current user can grant to others.
     * super_admin → all permissions in the system.
     * agency_admin → only the permissions they themselves hold.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Permission> grantable(@AuthenticationPrincipal AuthUserDetails principal) {
        if (principal.getUserTypeLevel() == 1) {
            return permissionRepository.findAll();
        }
        return new ArrayList<>(principal.getUser().getCustomPermissions());
    }
}
