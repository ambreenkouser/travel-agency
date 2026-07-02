package com.example.travel.api;

import com.example.travel.agency.Agency;
import com.example.travel.agency.AgencyRepository;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.User;
import com.example.travel.auth.UserLogoRepository;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/branding")
public class BrandingRestController {

    private final AgencyRepository agencyRepository;
    private final UserLogoRepository userLogoRepository;

    public BrandingRestController(AgencyRepository agencyRepository,
                                  UserLogoRepository userLogoRepository) {
        this.agencyRepository = agencyRepository;
        this.userLogoRepository = userLogoRepository;
    }

    /**
     * Resolves the effective branding for the logged-in user: their own business
     * name/contact/address/logo if set, else the shared agency's.
     */
    @GetMapping
    public Map<String, Object> branding(@AuthenticationPrincipal AuthUserDetails principal) {
        if (principal == null) {
            return Map.of("agencyName", "TravelDesk", "logoUrl", "");
        }

        User user = principal.getUser();
        Agency agency = principal.getAgencyId() != null
                ? agencyRepository.findById(principal.getAgencyId()).orElse(null)
                : null;

        String agencyName = nonBlank(user.getBusinessName())
                ? user.getBusinessName()
                : (agency != null ? agency.getName() : "TravelDesk");

        // Cheap existence check — never loads the logo bytes just to build a URL.
        String logoUrl;
        if (userLogoRepository.existsById(user.getId())) {
            logoUrl = "/api/users/" + user.getId() + "/logo";
        } else if (agency != null && agency.getLogoData() != null) {
            logoUrl = "/api/agencies/" + agency.getId() + "/logo";
        } else if (agency != null && agency.getLogoPath() != null) {
            logoUrl = agency.getLogoPath();
        } else {
            logoUrl = "";
        }

        String contactNo = nonBlank(user.getContactNo())
                ? user.getContactNo()
                : (agency != null ? agency.getContactNo() : null);
        String address = nonBlank(user.getAddress())
                ? user.getAddress()
                : (agency != null ? agency.getAddress() : null);

        Map<String, Object> result = new HashMap<>();
        result.put("agencyName", agencyName);
        result.put("logoUrl", logoUrl);
        result.put("subscriptionPlan", agency != null && agency.getSubscriptionPlan() != null ? agency.getSubscriptionPlan() : "");
        result.put("active", agency == null || agency.isActive());
        result.put("contactNo", contactNo != null ? contactNo : "");
        result.put("address", address != null ? address : "");
        return result;
    }

    private boolean nonBlank(String s) {
        return s != null && !s.isBlank();
    }
}
