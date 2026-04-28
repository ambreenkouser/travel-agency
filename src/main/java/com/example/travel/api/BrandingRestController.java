package com.example.travel.api;

import com.example.travel.agency.Agency;
import com.example.travel.agency.AgencyRepository;
import com.example.travel.auth.AuthUserDetails;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/branding")
public class BrandingRestController {

    private final AgencyRepository agencyRepository;

    public BrandingRestController(AgencyRepository agencyRepository) {
        this.agencyRepository = agencyRepository;
    }

    @GetMapping
    public Map<String, Object> branding(@AuthenticationPrincipal AuthUserDetails principal) {
        if (principal == null || principal.getAgencyId() == null) {
            return Map.of("agencyName", "TravelDesk", "logoUrl", "");
        }
        return agencyRepository.findById(principal.getAgencyId())
                .map(a -> Map.<String, Object>of(
                        "agencyName", a.getName(),
                        "logoUrl", a.getLogoData() != null
                                ? "/api/agencies/" + a.getId() + "/logo"
                                : (a.getLogoPath() != null ? a.getLogoPath() : ""),
                        "subscriptionPlan", a.getSubscriptionPlan() != null ? a.getSubscriptionPlan() : "",
                        "active", a.isActive()))
                .orElse(Map.of("agencyName", "TravelDesk", "logoUrl", ""));
    }
}
