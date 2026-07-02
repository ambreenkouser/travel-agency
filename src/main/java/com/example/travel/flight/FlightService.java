package com.example.travel.flight;

import com.example.travel.share.ContentShare;
import com.example.travel.share.ContentShareRepository;
import com.example.travel.tenancy.AgencyContext;
import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FlightService {

    private final FlightRepository flightRepository;
    private final FlightLegRepository flightLegRepository;
    private final ContentShareRepository shareRepository;

    public FlightService(FlightRepository flightRepository,
                         FlightLegRepository flightLegRepository,
                         ContentShareRepository shareRepository) {
        this.flightRepository = flightRepository;
        this.flightLegRepository = flightLegRepository;
        this.shareRepository = shareRepository;
    }

    public Page<Flight> search(String origin, String destination, Long airlineId,
                               OffsetDateTime from, OffsetDateTime to,
                               BigDecimal min, BigDecimal max,
                               String status, boolean upcomingOnly, Pageable pageable) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        Specification<Flight> agencySpec = AgencyContext.isSuperAdmin()
                ? FlightSpecifications.ownedByAgency(agencyId)
                : FlightSpecifications.visibleToAgency(agencyId);
        Specification<Flight> spec = Specification.where(agencySpec)
                .and(FlightSpecifications.byOrigin(origin))
                .and(FlightSpecifications.byDestination(destination))
                .and(FlightSpecifications.byAirline(airlineId))
                .and(FlightSpecifications.betweenDates(from, to))
                .and(FlightSpecifications.withinPrice(min, max))
                .and(FlightSpecifications.byStatus(status))
                .and(upcomingOnly ? FlightSpecifications.departureAfter(OffsetDateTime.now()) : null);
        return flightRepository.findAll(spec, pageable);
    }

    public Flight findById(Long id) {
        return flightRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Flight not found: " + id));
    }

    @Transactional
    public Flight create(FlightRequest req) {
        Long agencyId = AgencyContext.getCurrentAgencyId();
        if (agencyId == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Current user has no agency assigned. Contact a system administrator.");
        Flight flight = new Flight();
        flight.setAgencyId(agencyId);
        applyRequest(flight, req);
        Flight saved = flightRepository.save(flight);
        saveLegs(saved.getId(), req.getLegs());
        updateShares(saved.getId(), req.getSharedWith());
        return saved;
    }

    @Transactional
    public Flight update(Long id, FlightRequest req) {
        Flight flight = findById(id);
        applyRequest(flight, req);
        Flight saved = flightRepository.save(flight);
        if (req.getLegs() != null) {
            saveLegs(saved.getId(), req.getLegs());
        }
        if (req.getSharedWith() != null) {
            updateShares(saved.getId(), req.getSharedWith());
        }
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        findById(id);
        flightRepository.deleteById(id);
    }

    @Transactional
    public void updateShares(Long flightId, List<Long> agencyIds) {
        shareRepository.deleteByContentTypeAndContentId("flight", flightId);
        shareRepository.flush(); // force DELETE before re-INSERT to avoid unique(content_type, content_id, target_agency_id) violation
        if (agencyIds != null) {
            for (Long agencyId : agencyIds) {
                ContentShare share = new ContentShare();
                share.setContentType("flight");
                share.setContentId(flightId);
                share.setTargetAgencyId(agencyId);
                shareRepository.save(share);
            }
        }
    }

    public List<Long> getShares(Long flightId) {
        return shareRepository.findTargetAgencyIdsByContentTypeAndContentId("flight", flightId);
    }

    public Flight save(Flight flight) {
        flight.setAgencyId(AgencyContext.getCurrentAgencyId());
        return flightRepository.save(flight);
    }

    private void applyRequest(Flight flight, FlightRequest req) {
        flight.setFareAdult(req.getFareAdult());
        flight.setFareChild(req.getFareChild());
        flight.setFareInfant(req.getFareInfant());
        flight.setTaxTotal(req.getTaxTotal());
        flight.setCostAdult(req.getCostAdult());
        flight.setCostChild(req.getCostChild());
        flight.setCostInfant(req.getCostInfant());
        flight.setBaggageInfo(req.getBaggageInfo());
        flight.setExtras(req.getExtras());
        flight.setGroupName(req.getGroupName());
        flight.setStatus(req.getStatus() != null ? req.getStatus() : "draft");
        flight.setSeatQuota(req.getSeatQuota());
        flight.setContactPersonPhone(req.getContactPersonPhone());
        flight.setContactPersonEmail(req.getContactPersonEmail());
        flight.setAgentDiscountPercent(req.getAgentDiscountPercent());
        flight.setGroupType(req.getGroupType() != null ? req.getGroupType() : "ONE_WAY");
        flight.setSectorOrigin(req.getSectorOrigin());
        flight.setSectorDestination(req.getSectorDestination());
    }

    private void saveLegs(Long flightId, List<FlightRequest.LegRequest> legReqs) {
        flightLegRepository.deleteByFlightId(flightId);
        flightLegRepository.flush(); // force DELETE before INSERTs to avoid unique(flight_id, leg_order) violation
        if (legReqs == null || legReqs.isEmpty()) return;
        for (int i = 0; i < legReqs.size(); i++) {
            FlightRequest.LegRequest lr = legReqs.get(i);
            if (lr.getOrigin() == null || lr.getDestination() == null) continue;
            FlightLeg leg = new FlightLeg();
            leg.setFlightId(flightId);
            leg.setLegOrder(i + 1);
            leg.setOrigin(lr.getOrigin().toUpperCase().trim());
            leg.setDestination(lr.getDestination().toUpperCase().trim());
            leg.setDepartAt(lr.getDepartAt());
            leg.setArriveAt(lr.getArriveAt());
            leg.setBaggageKg(lr.getBaggageKg());
            leg.setAirlineId(lr.getAirlineId());
            leg.setFlightNumber(lr.getFlightNumber());
            leg.setPnrCode(lr.getPnrCode());
            leg.setAirlineCode(lr.getAirlineCode());
            leg.setFlightClass(lr.getFlightClass() != null ? lr.getFlightClass() : "economy");
            leg.setHandCarryKg(lr.getHandCarryKg());
            flightLegRepository.save(leg);
        }
    }
}
