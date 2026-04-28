package com.example.travel.auth;

import com.example.travel.tenancy.TenantAwarePrincipal;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class AuthUserDetails implements UserDetails, TenantAwarePrincipal {

    private final User user;
    private final Set<GrantedAuthority> authorities;

    public AuthUserDetails(User user) {
        this.user = user;
        this.authorities = buildAuthorities(user);
    }

    private Set<GrantedAuthority> buildAuthorities(User user) {
        Set<GrantedAuthority> auths = new HashSet<>();
        boolean isSuperAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("super_admin"));

        for (Role role : user.getRoles()) {
            auths.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
            // super_admin keeps full role-based permissions; others use per-user permissions
            if (isSuperAdmin) {
                auths.addAll(role.getPermissions().stream()
                        .map(p -> new SimpleGrantedAuthority(p.getName()))
                        .collect(Collectors.toSet()));
            }
        }
        if (!isSuperAdmin) {
            auths.addAll(user.getCustomPermissions().stream()
                    .map(p -> new SimpleGrantedAuthority(p.getName()))
                    .collect(Collectors.toSet()));
        }
        return auths;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return user.isActive();
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.isActive();
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return user.isActive();
    }

    @Override
    public boolean isEnabled() {
        return user.isActive();
    }

    @Override
    public Long getAgencyId() {
        return user.getAgencyId();
    }

    @Override
    public Long getUserId() {
        return user.getId();
    }

    /** Returns the hierarchy level (1–4) derived from the user's role. */
    public int getUserTypeLevel() {
        for (GrantedAuthority auth : authorities) {
            String a = auth.getAuthority();
            if (a.equals("ROLE_super_admin"))  return 1;
            if (a.equals("ROLE_master_agent")) return 2;
            if (a.equals("ROLE_agency_admin")) return 3;
        }
        return 4; // sub_agent / agency_agent
    }

    public Long getParentId() {
        return user.getParentId();
    }

    public User getUser() {
        return user;
    }
}
