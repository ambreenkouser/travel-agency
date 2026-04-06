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
        for (Role role : user.getRoles()) {
            auths.add(new SimpleGrantedAuthority("ROLE_" + role.getName()));
            auths.addAll(role.getPermissions().stream()
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

    public User getUser() {
        return user;
    }
}
