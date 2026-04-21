package com.example.travel.config;

import com.example.travel.agency.Agency;
import com.example.travel.agency.AgencyRepository;
import com.example.travel.tenancy.AgencyContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SubscriptionFilter extends OncePerRequestFilter {

    /** Paths that are always allowed regardless of subscription status. */
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/login", "/logout", "/api/branding", "/api/me",
            "/actuator/health", "/css", "/js", "/favicon.ico"
    );

    private final AgencyRepository agencyRepository;

    public SubscriptionFilter(AgencyRepository agencyRepository) {
        this.agencyRepository = agencyRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Always pass through public paths
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        // Unauthenticated or super_admin — skip subscription check
        if (auth == null || !auth.isAuthenticated() ||
                auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_super_admin"))) {
            filterChain.doFilter(request, response);
            return;
        }

        Long agencyId = AgencyContext.getCurrentAgencyId();
        if (agencyId == null) {
            filterChain.doFilter(request, response);
            return;
        }

        Optional<Agency> opt = agencyRepository.findById(agencyId);
        if (opt.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        Agency agency = opt.get();

        if (isExpired(agency)) {
            response.setStatus(HttpServletResponse.SC_PAYMENT_REQUIRED);
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"subscription_expired\",\"message\":\"Your agency subscription has expired. Please renew to continue.\"}");
            return;
        }

        // Add warning header if within grace period
        long daysUntilExpiry = daysUntilExpiry(agency);
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
            response.setHeader("X-Subscription-Warning",
                    "Subscription expires in " + daysUntilExpiry + " day(s)");
        }

        filterChain.doFilter(request, response);
    }

    private boolean isExpired(Agency agency) {
        LocalDate expiresAt = agency.getExpiresAt();
        if (expiresAt == null) return false;
        int graceDays = agency.getGraceDays() == null ? 0 : agency.getGraceDays();
        return LocalDate.now().isAfter(expiresAt.plusDays(graceDays));
    }

    /** Days until the subscription expires (negative = already expired past grace). */
    private long daysUntilExpiry(Agency agency) {
        LocalDate expiresAt = agency.getExpiresAt();
        if (expiresAt == null) return Long.MAX_VALUE;
        return ChronoUnit.DAYS.between(LocalDate.now(), expiresAt);
    }

    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::startsWith);
    }
}
