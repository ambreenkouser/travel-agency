package com.example.travel.tenancy;

import com.example.travel.auth.AuthUserDetails;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.hibernate.Session;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AgencyFilter extends OncePerRequestFilter {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Long agencyId = null;
        if (auth != null && auth.getPrincipal() instanceof TenantAwarePrincipal principal) {
            agencyId = principal.getAgencyId();
            AgencyContext.setCurrentAgencyId(agencyId);
            if (principal instanceof AuthUserDetails d) {
                AgencyContext.setSuperAdmin(d.getUserTypeLevel() == 1);
            }
        }

        Session session = entityManager.unwrap(Session.class);
        try {
            if (agencyId != null) {
                org.hibernate.Filter filter = session.enableFilter("agencyFilter");
                filter.setParameter("agencyId", agencyId);
            }
            filterChain.doFilter(request, response);
        } finally {
            if (agencyId != null) {
                session.disableFilter("agencyFilter");
            }
            AgencyContext.clear();
        }
    }
}
