package com.example.travel.api;

import com.example.travel.agency.AgencyRepository;
import com.example.travel.api.dto.CreateUserRequest;
import com.example.travel.api.dto.UserListDto;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.Permission;
import com.example.travel.auth.PermissionRepository;
import com.example.travel.auth.Role;
import com.example.travel.auth.RoleRepository;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import com.example.travel.auth.UserType;
import com.example.travel.auth.UserTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/users")
public class UserRestController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AgencyRepository agencyRepository;
    private final UserTypeRepository userTypeRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public UserRestController(UserRepository userRepository,
                              RoleRepository roleRepository,
                              AgencyRepository agencyRepository,
                              UserTypeRepository userTypeRepository,
                              PermissionRepository permissionRepository,
                              PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.agencyRepository = agencyRepository;
        this.userTypeRepository = userTypeRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Hierarchy-aware list:
     *  level 1 super_admin  → all users
     *  level 2 master_admin → full subtree (recursive)
     *  level 3 agency_admin → direct children only
     *  level 4 agency_agent → only themselves
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<UserListDto> list(@AuthenticationPrincipal AuthUserDetails principal) {
        int myLevel = principal.getUserTypeLevel();
        Long myId   = principal.getUserId();

        List<User> users = switch (myLevel) {
            case 1 -> userRepository.findAll();
            case 2 -> userRepository.findSubtree(myId);
            case 3 -> userRepository.findByParentId(myId);
            default -> userRepository.findById(myId).map(List::of).orElse(List.of());
        };

        return toDtoList(users);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('agencies:create')")
    public UserListDto create(@RequestBody CreateUserRequest req,
                              @AuthenticationPrincipal AuthUserDetails principal) {
        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new IllegalArgumentException("Email already in use: " + req.email());
        }

        int myLevel = principal.getUserTypeLevel();

        // Resolve target user type
        UserType targetType = null;
        if (req.userTypeId() != null) {
            targetType = userTypeRepository.findById(req.userTypeId())
                    .orElseThrow(() -> new EntityNotFoundException("User type not found: " + req.userTypeId()));
            // super_admin (level 1) can create any level; others can only create one level below
            if (myLevel != 1 && targetType.getLevel() != myLevel + 1) {
                throw new IllegalArgumentException(
                        "You can only create users exactly one level below yourself.");
            }
        }

        // Determine role from user type (or fall back to req.role for backwards compat)
        String roleName = targetType != null
                ? userTypeToRoleName(targetType.getName())
                : req.role();
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));

        // Parent: auto-set to current user; super_admin may override
        Long parentId = (myLevel == 1 && req.parentId() != null)
                ? req.parentId()
                : principal.getUserId();

        Long agencyId = resolveAgencyId(req, principal, myLevel);

        User user = new User();
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setActive(true);
        user.setAgencyId(agencyId);
        user.setRoles(Set.of(role));
        user.setUserTypeId(targetType != null ? targetType.getId() : null);
        user.setParentId(parentId);

        // Assign custom permissions (not applicable for super_admin)
        if (!roleName.equals("super_admin") && req.permissionIds() != null && !req.permissionIds().isEmpty()) {
            // Non-super_admin creators can only grant permissions they themselves hold
            Set<String> myPerms = principal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(a -> !a.startsWith("ROLE_"))
                    .collect(Collectors.toSet());
            List<Permission> toGrant = permissionRepository.findAllById(req.permissionIds());
            if (myLevel != 1) {
                for (Permission p : toGrant) {
                    if (!myPerms.contains(p.getName())) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "Cannot grant permission you don't have: " + p.getName());
                    }
                }
            }
            user.setCustomPermissions(new HashSet<>(toGrant));
        }

        return toDtoList(List.of(userRepository.save(user))).get(0);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('agencies:edit')")
    public UserListDto update(@PathVariable Long id,
                              @RequestBody CreateUserRequest req,
                              @AuthenticationPrincipal AuthUserDetails principal) {
        assertCanManage(id, principal);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));

        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setEmail(req.email());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(req.password()));
        }

        if (req.userTypeId() != null) {
            UserType targetType = userTypeRepository.findById(req.userTypeId())
                    .orElseThrow(() -> new EntityNotFoundException("User type not found: " + req.userTypeId()));
            String roleName = userTypeToRoleName(targetType.getName());
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new EntityNotFoundException("Role not found: " + roleName));
            user.setRoles(Set.of(role));
            user.setUserTypeId(targetType.getId());
        } else if (req.role() != null && !req.role().isBlank()) {
            Role role = roleRepository.findByName(req.role())
                    .orElseThrow(() -> new EntityNotFoundException("Role not found: " + req.role()));
            user.setRoles(Set.of(role));
        }

        int myLevel = principal.getUserTypeLevel();
        Long agencyId = resolveAgencyId(req, principal, myLevel);
        if (agencyId != null) user.setAgencyId(agencyId);

        // Update custom permissions (skip for super_admin targets)
        boolean targetIsSuperAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("super_admin"));
        if (!targetIsSuperAdmin && req.permissionIds() != null) {
            Set<String> myPerms = principal.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(a -> !a.startsWith("ROLE_"))
                    .collect(Collectors.toSet());
            List<Permission> toGrant = permissionRepository.findAllById(req.permissionIds());
            if (myLevel != 1) {
                for (Permission p : toGrant) {
                    if (!myPerms.contains(p.getName())) {
                        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                                "Cannot grant permission you don't have: " + p.getName());
                    }
                }
            }
            user.setCustomPermissions(new HashSet<>(toGrant));
        }

        return toDtoList(List.of(userRepository.save(user))).get(0);
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasAuthority('agencies:edit')")
    public UserListDto toggleActive(@PathVariable Long id,
                                    @AuthenticationPrincipal AuthUserDetails principal) {
        assertCanManage(id, principal);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        user.setActive(!user.isActive());
        return toDtoList(List.of(userRepository.save(user))).get(0);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('agencies:delete')")
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal AuthUserDetails principal) {
        assertCanManage(id, principal);
        try {
            userRepository.deleteById(id);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot delete user: they have associated records (bookings, payments). " +
                    "Deactivate the user instead.");
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void assertCanManage(Long targetId, AuthUserDetails principal) {
        int myLevel = principal.getUserTypeLevel();
        if (myLevel == 1) return; // super_admin

        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + targetId));

        if (myLevel == 3) {
            // agency_admin: only direct children
            if (!principal.getUserId().equals(target.getParentId())) {
                throw new IllegalStateException("Access denied: user is not your direct subordinate.");
            }
        } else if (myLevel == 2) {
            // master_admin: subtree check
            List<User> subtree = userRepository.findSubtree(principal.getUserId());
            boolean inSubtree = subtree.stream().anyMatch(u -> u.getId().equals(targetId));
            if (!inSubtree) {
                throw new IllegalStateException("Access denied: user is not in your subtree.");
            }
        }
    }

    private Long resolveAgencyId(CreateUserRequest req, AuthUserDetails principal, int myLevel) {
        if (myLevel <= 2) {
            // super_admin or master_admin: caller must provide agencyId for agency-scoped users
            return req.agencyId();
        }
        // agency_admin creating an agent: inherit own agency
        return principal.getAgencyId();
    }

    /** Maps a user_type name to the corresponding role name. */
    private String userTypeToRoleName(String userTypeName) {
        return switch (userTypeName) {
            case "super_admin"  -> "super_admin";
            case "master_admin" -> "master_agent";
            case "agency_admin" -> "agency_admin";
            default             -> "sub_agent";
        };
    }

    private List<UserListDto> toDtoList(List<User> users) {
        // Batch-load user types (avoid lazy loading after session close)
        Set<Long> typeIds = users.stream()
                .map(User::getUserTypeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, UserType> typeMap = new HashMap<>();
        if (!typeIds.isEmpty()) {
            userTypeRepository.findAllById(typeIds)
                    .forEach(t -> typeMap.put(t.getId(), t));
        }

        // Batch-load parent names
        Set<Long> parentIds = users.stream()
                .map(User::getParentId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> parentNames = new HashMap<>();
        if (!parentIds.isEmpty()) {
            userRepository.findAllById(parentIds)
                    .forEach(p -> parentNames.put(p.getId(),
                            p.getFirstName() + " " + p.getLastName()));
        }

        // Batch-load agency names
        Set<Long> agencyIds = users.stream()
                .map(User::getAgencyId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> agencyNames = new HashMap<>();
        if (!agencyIds.isEmpty()) {
            agencyRepository.findAllById(agencyIds)
                    .forEach(a -> agencyNames.put(a.getId(), a.getName()));
        }

        return users.stream().map(u -> {
            List<String> roles = u.getRoles().stream()
                    .map(Role::getName)
                    .collect(Collectors.toList());

            UserType ut         = u.getUserTypeId() != null ? typeMap.get(u.getUserTypeId()) : null;
            Long userTypeId     = ut != null ? ut.getId()          : null;
            String userTypeName = ut != null ? ut.getDisplayName() : null;
            int userTypeLevel   = ut != null ? ut.getLevel()       : 0;

            List<Long> permissionIds = u.getCustomPermissions().stream()
                    .map(p -> p.getId())
                    .collect(Collectors.toList());

            return new UserListDto(
                    u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(),
                    u.isActive(), roles,
                    u.getAgencyId(), agencyNames.get(u.getAgencyId()),
                    userTypeId, userTypeName, userTypeLevel,
                    u.getParentId(), parentNames.get(u.getParentId()),
                    permissionIds
            );
        }).collect(Collectors.toList());
    }
}
