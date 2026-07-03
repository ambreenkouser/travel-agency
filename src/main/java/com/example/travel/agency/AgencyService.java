package com.example.travel.agency;

import java.time.LocalDate;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgencyService {

    private final AgencyRepository repository;

    public AgencyService(AgencyRepository repository) {
        this.repository = repository;
    }

    public List<Agency> findAll() {
        return repository.findAll();
    }

    public Agency findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Agency not found: " + id));
    }

    @Transactional
    public Agency create(AgencyRequest req) {
        Agency agency = new Agency();
        applyRequest(agency, req);
        return repository.save(agency);
    }

    @Transactional
    public Agency update(Long id, AgencyRequest req) {
        Agency agency = findById(id);
        applyRequest(agency, req);
        return repository.save(agency);
    }

    @Transactional
    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public void saveLogo(Long id, byte[] data, String contentType) {
        Agency agency = findById(id);
        agency.setLogoData(data);
        agency.setLogoContentType(contentType);
        repository.save(agency);
    }

    private void applyRequest(Agency agency, AgencyRequest req) {
        agency.setName(req.getName());
        agency.setSlug(req.getSlug());
        agency.setLogoPath(req.getLogoPath());
        agency.setSubscriptionPlan(req.getSubscriptionPlan());
        agency.setGraceDays(req.getGraceDays());
        agency.setActive(req.isActive());
        if (req.getBookingExpiryMinutes() != null) {
            agency.setBookingExpiryMinutes(req.getBookingExpiryMinutes());
        }
        agency.setContactNo(req.getContactNo());
        agency.setAddress(req.getAddress());

        // Auto-calculate expiry from plan if no explicit date provided
        if (req.getExpiresAt() != null) {
            agency.setExpiresAt(req.getExpiresAt());
        } else if (req.getSubscriptionPlan() != null) {
            LocalDate from = agency.getExpiresAt() != null ? agency.getExpiresAt() : LocalDate.now();
            agency.setExpiresAt(switch (req.getSubscriptionPlan().toLowerCase()) {
                case "weekly"  -> from.plusWeeks(1);
                case "monthly" -> from.plusMonths(1);
                case "yearly"  -> from.plusYears(1);
                default        -> from.plusMonths(1);
            });
        }
    }
}
