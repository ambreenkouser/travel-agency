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
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class SubscriptionFilter extends OncePerRequestFilter {

    private final AgencyRepository agencyRepository;

    public SubscriptionFilter(AgencyRepository agencyRepository) {
        this.agencyRepository = agencyRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_super_admin"))) {
            filterChain.doFilter(request, response);
            return;
        }

        Long agencyId = AgencyContext.getCurrentAgencyId();
        if (agencyId != null) {
            Optional<Agency> agency = agencyRepository.findById(agencyId);
            if (agency.isPresent() && isExpired(agency.get())) {
                response.sendError(HttpServletResponse.SC_PAYMENT_REQUIRED, "Subscription expired");
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private boolean isExpired(Agency agency) {
        LocalDate expiresAt = agency.getExpiresAt();
        if (expiresAt == null) return false;
        int graceDays = agency.getGraceDays() == null ? 0 : agency.getGraceDays();
        return LocalDate.now().isAfter(expiresAt.plusDays(graceDays));
    }
}
