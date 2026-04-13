package com.example.travel.api;

import com.example.travel.api.dto.RoleDto;
import com.example.travel.auth.Role;
import com.example.travel.auth.RoleRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/roles")
public class RolesRestController {

    private final RoleRepository roleRepository;

    public RolesRestController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('agencies:view')")
    public List<RoleDto> list() {
        return roleRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private RoleDto toDto(Role role) {
        List<String> permissions = role.getPermissions().stream()
                .map(p -> p.getName())
                .sorted()
                .collect(Collectors.toList());
        return new RoleDto(role.getId(), role.getName(), permissions);
    }
}
