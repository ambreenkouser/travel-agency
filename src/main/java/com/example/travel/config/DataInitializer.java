package com.example.travel.config;

import com.example.travel.agency.Agency;
import com.example.travel.agency.AgencyRepository;
import com.example.travel.auth.Permission;
import com.example.travel.auth.PermissionRepository;
import com.example.travel.auth.Role;
import com.example.travel.auth.RoleRepository;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AgencyRepository agencyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;


    public DataInitializer(AgencyRepository agencyRepository, UserRepository userRepository,
                           RoleRepository roleRepository, PermissionRepository permissionRepository,
                           PasswordEncoder passwordEncoder) {
        this.agencyRepository = agencyRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            System.out.println("[Seed] Starting DataInitializer...");


            if (userRepository.findByEmail("superadmin@demo.com").isPresent()) {
                System.out.println("[Seed] Already seeded — skipping.");
                return;
            }

            // ── 1. Agency ────────────────────────────────────────────────────
            System.out.println("[Seed] Step 1: Agency...");
            Agency agency = agencyRepository.findBySlug("demo").orElseGet(() -> {
                Agency a = new Agency();
                a.setName("Demo Agency");
                a.setSlug("demo");
                a.setActive(true);
                return agencyRepository.save(a);
            });
            System.out.println("[Seed] Agency id=" + agency.getId());

            // ── 2. Permissions ───────────────────────────────────────────────
            System.out.println("[Seed] Step 2: Permissions...");
            List<String> allPermNames = List.of(
                    "agencies:view", "agencies:create", "agencies:edit", "agencies:delete",
                    "flights:view", "flights:manage",
                    "umrah:view", "umrah:manage",
                    "hajj:view", "hajj:manage",
                    "bookings:view", "bookings:create", "bookings:confirm", "bookings:cancel",
                    "reports:view", "accounts:manage"
            );

            Map<String, Permission> perms = new HashMap<>();
            for (String name : allPermNames) {
                Permission p = permissionRepository.findByName(name).orElseGet(() -> {
                    Permission np = new Permission();
                    np.setName(name);
                    return permissionRepository.save(np);
                });
                perms.put(name, p);
            }
            System.out.println("[Seed] Permissions saved: " + perms.size());

            // ── 3. Roles ─────────────────────────────────────────────────────
            System.out.println("[Seed] Step 3: Roles...");
            Role superAdmin = saveRole("super_admin", new HashSet<>(perms.values()));
            System.out.println("[Seed] super_admin id=" + superAdmin.getId());

            Role masterAgent = saveRole("master_agent", permsOf(perms,
                    "agencies:view", "agencies:create", "agencies:edit",
                    "flights:view", "flights:manage",
                    "umrah:view", "umrah:manage",
                    "hajj:view", "hajj:manage",
                    "bookings:view", "bookings:create", "bookings:confirm", "bookings:cancel",
                    "reports:view"));
            System.out.println("[Seed] master_agent id=" + masterAgent.getId());

            Role agencyAdmin = saveRole("agency_admin", permsOf(perms,
                    "agencies:view", "agencies:create", "agencies:edit",
                    "flights:view", "flights:manage",
                    "umrah:view", "umrah:manage",
                    "hajj:view", "hajj:manage",
                    "bookings:view", "bookings:create", "bookings:confirm", "bookings:cancel",
                    "reports:view"));
            System.out.println("[Seed] agency_admin id=" + agencyAdmin.getId());

            Role subAgent = saveRole("sub_agent", permsOf(perms,
                    "flights:view",
                    "umrah:view",
                    "hajj:view",
                    "bookings:view", "bookings:create"));
            System.out.println("[Seed] sub_agent id=" + subAgent.getId());

            // ── 4. Users ─────────────────────────────────────────────────────
            System.out.println("[Seed] Step 4: Users...");
            createUser("superadmin@demo.com", "password", "Super", "Admin", agency.getId(), superAdmin, null);
            System.out.println("[Seed] superadmin created");
            createUser("master@demo.com", "password", "Master", "Agent", agency.getId(), masterAgent, null);
            System.out.println("[Seed] master created");

            // agency_admin demo: grant same permissions as the old agency_admin role
            Set<Permission> adminPerms = permsOf(perms,
                    "agencies:view", "agencies:create", "agencies:edit",
                    "flights:view", "flights:manage",
                    "umrah:view", "umrah:manage",
                    "hajj:view", "hajj:manage",
                    "bookings:view", "bookings:create", "bookings:confirm", "bookings:cancel",
                    "reports:view", "accounts:manage");
            createUser("agencyadmin@demo.com", "password", "Agency", "Admin", agency.getId(), agencyAdmin, adminPerms);
            System.out.println("[Seed] agencyadmin created");

            // sub_agent demo: grant same permissions as the old sub_agent role
            Set<Permission> agentPerms = permsOf(perms,
                    "flights:view", "umrah:view", "hajj:view",
                    "bookings:view", "bookings:create");
            createUser("agent@demo.com", "password", "Sub", "Agent", agency.getId(), subAgent, agentPerms);
            System.out.println("[Seed] agent created");

            System.out.println("=================================================");
            System.out.println("  Seed complete. Logins:");
            System.out.println("  superadmin@demo.com  / password  (super_admin)");
            System.out.println("  master@demo.com      / password  (master_agent)");
            System.out.println("  agencyadmin@demo.com / password  (agency_admin)");
            System.out.println("  agent@demo.com       / password  (sub_agent)");
            System.out.println("=================================================");

        } catch (Exception e) {
            System.err.println("[Seed] FAILED at: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private Role saveRole(String name, Set<Permission> permissions) {
        Role role = roleRepository.findByName(name).orElseGet(Role::new);
        role.setName(name);
        role.setPermissions(permissions);
        return roleRepository.save(role);
    }

    private Set<Permission> permsOf(Map<String, Permission> all, String... names) {
        Set<Permission> set = new HashSet<>();
        for (String name : names) {
            set.add(all.get(name));
        }
        return set;
    }
    @Transactional
    public void createUser(String email, String password, String firstName, String lastName,
                            Long agencyId, Role role, Set<Permission> customPermissions) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setActive(true);
        user.setAgencyId(agencyId);
        user.setRoles(new HashSet<>(Set.of(role)));
        if (customPermissions != null) {
            user.setCustomPermissions(new HashSet<>(customPermissions));
        }
        userRepository.save(user);
    }
}
