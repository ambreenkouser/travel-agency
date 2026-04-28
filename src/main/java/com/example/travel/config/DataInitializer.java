package com.example.travel.config;

import com.example.travel.agency.Agency;
import com.example.travel.agency.AgencyRepository;
import com.example.travel.auth.Permission;
import com.example.travel.auth.PermissionRepository;
import com.example.travel.auth.Role;
import com.example.travel.auth.RoleRepository;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import com.example.travel.payment.Bank;
import com.example.travel.payment.BankRepository;
import com.example.travel.payment.PaymentAccount;
import com.example.travel.payment.PaymentAccountRepository;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final BankRepository bankRepository;
    private final PaymentAccountRepository paymentAccountRepository;


    public DataInitializer(AgencyRepository agencyRepository, UserRepository userRepository,
                           RoleRepository roleRepository, PermissionRepository permissionRepository,
                           PasswordEncoder passwordEncoder,
                           BankRepository bankRepository,
                           PaymentAccountRepository paymentAccountRepository) {
        this.agencyRepository = agencyRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.bankRepository = bankRepository;
        this.paymentAccountRepository = paymentAccountRepository;
    }

    @Override
    public void run(String... args) {
        try {
            System.out.println("[Seed] Starting DataInitializer...");

            // Always ensure parent-child hierarchy is correct (safe to run repeatedly)
            fixDemoParentIds();

            if (userRepository.findByEmail("superadmin@demo.com").isPresent()) {
                // Already seeded — but still ensure payment account exists for agencyadmin
                userRepository.findByEmail("agencyadmin@demo.com").ifPresent(admin ->
                        ensureAgencyAdminPaymentAccount(admin));
                System.out.println("[Seed] Already seeded — skipping full seed.");
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
                    "custom:view", "custom:manage",
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
                    "custom:view", "custom:manage",
                    "bookings:view", "bookings:create", "bookings:confirm", "bookings:cancel",
                    "reports:view"));
            System.out.println("[Seed] master_agent id=" + masterAgent.getId());

            Role agencyAdmin = saveRole("agency_admin", permsOf(perms,
                    "agencies:view", "agencies:create", "agencies:edit",
                    "flights:view", "flights:manage",
                    "umrah:view", "umrah:manage",
                    "hajj:view", "hajj:manage",
                    "custom:view", "custom:manage",
                    "bookings:view", "bookings:create", "bookings:confirm", "bookings:cancel",
                    "reports:view"));
            System.out.println("[Seed] agency_admin id=" + agencyAdmin.getId());

            Role subAgent = saveRole("sub_agent", permsOf(perms,
                    "flights:view",
                    "umrah:view",
                    "hajj:view",
                    "custom:view",
                    "bookings:view", "bookings:create"));
            System.out.println("[Seed] sub_agent id=" + subAgent.getId());

            // ── 4. Users ─────────────────────────────────────────────────────
            System.out.println("[Seed] Step 4: Users...");
            User superAdminUser = createUser("superadmin@demo.com", "password", "Super", "Admin", agency.getId(), superAdmin, null, null);
            System.out.println("[Seed] superadmin created id=" + superAdminUser.getId());
            User masterUser = createUser("master@demo.com", "password", "Master", "Agent", agency.getId(), masterAgent, null, superAdminUser.getId());
            System.out.println("[Seed] master created id=" + masterUser.getId());

            // agency_admin demo: grant same permissions as the old agency_admin role
            Set<Permission> adminPerms = permsOf(perms,
                    "agencies:view", "agencies:create", "agencies:edit",
                    "flights:view", "flights:manage",
                    "umrah:view", "umrah:manage",
                    "hajj:view", "hajj:manage",
                    "custom:view", "custom:manage",
                    "bookings:view", "bookings:create", "bookings:confirm", "bookings:cancel",
                    "reports:view", "accounts:manage");
            User agencyAdminUser = createUser("agencyadmin@demo.com", "password", "Agency", "Admin", agency.getId(), agencyAdmin, adminPerms, masterUser.getId());
            System.out.println("[Seed] agencyadmin created id=" + agencyAdminUser.getId());

            // sub_agent demo: grant same permissions as the old sub_agent role
            Set<Permission> agentPerms = permsOf(perms,
                    "flights:view", "umrah:view", "hajj:view", "custom:view",
                    "bookings:view", "bookings:create");
            createUser("agent@demo.com", "password", "Sub", "Agent", agency.getId(), subAgent, agentPerms, agencyAdminUser.getId());
            System.out.println("[Seed] agent created");

            // ── 5. Seed demo payment account for agencyadmin ─────────────────
            System.out.println("[Seed] Step 5: Payment account...");
            ensureAgencyAdminPaymentAccount(agencyAdminUser);

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
    public User createUser(String email, String password, String firstName, String lastName,
                            Long agencyId, Role role, Set<Permission> customPermissions, Long parentId) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setActive(true);
        user.setAgencyId(agencyId);
        user.setParentId(parentId);
        user.setRoles(new HashSet<>(Set.of(role)));
        if (customPermissions != null) {
            user.setCustomPermissions(new HashSet<>(customPermissions));
        }
        return userRepository.save(user);
    }

    /**
     * Fixes the parent-child hierarchy for demo users if parentId is not set.
     * Runs on every startup — safe to call repeatedly.
     */
    @Transactional
    public void fixDemoParentIds() {
        Optional<User> superAdminOpt   = userRepository.findByEmail("superadmin@demo.com");
        Optional<User> masterOpt       = userRepository.findByEmail("master@demo.com");
        Optional<User> agencyAdminOpt  = userRepository.findByEmail("agencyadmin@demo.com");
        Optional<User> agentOpt        = userRepository.findByEmail("agent@demo.com");

        masterOpt.ifPresent(master -> {
            if (master.getParentId() == null) {
                superAdminOpt.ifPresent(sa -> { master.setParentId(sa.getId()); userRepository.save(master); });
            }
        });
        agencyAdminOpt.ifPresent(admin -> {
            if (admin.getParentId() == null) {
                masterOpt.ifPresent(m -> { admin.setParentId(m.getId()); userRepository.save(admin); });
            }
        });
        agentOpt.ifPresent(agent -> {
            if (agent.getParentId() == null) {
                agencyAdminOpt.ifPresent(a -> { agent.setParentId(a.getId()); userRepository.save(agent); });
            }
        });
    }

    /**
     * Ensures the demo agencyadmin has at least one payment account.
     * Agents (sub_agent role) look up their parent's accounts to submit payment.
     */
    @Transactional
    public void ensureAgencyAdminPaymentAccount(User agencyAdmin) {
        if (!paymentAccountRepository.findByUserIdAndActiveTrue(agencyAdmin.getId()).isEmpty()) {
            return; // already exists
        }
        Bank bank = bankRepository.findAll().stream().findFirst().orElseGet(() -> {
            Bank b = new Bank();
            b.setName("HBL");
            b.setType("BANK");

            return bankRepository.save(b);
        });
        PaymentAccount acct = new PaymentAccount();
        acct.setUserId(agencyAdmin.getId());
        acct.setAgencyId(agencyAdmin.getAgencyId());
        acct.setAccountName("Demo HBL Account");
        acct.setBankId(bank.getId());
        acct.setAccountTitle("Demo Agency Travel");
        acct.setBankAccountNumber("0123456789012");
        acct.setActive(true);
        paymentAccountRepository.save(acct);
        System.out.println("[Seed] Payment account created for agencyadmin");
    }
}
