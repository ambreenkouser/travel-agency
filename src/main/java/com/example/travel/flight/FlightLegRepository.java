package com.example.travel.flight;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface FlightLegRepository extends JpaRepository<FlightLeg, Long> {

    List<FlightLeg> findByFlightIdOrderByLegOrder(Long flightId);

    @Transactional
    void deleteByFlightId(Long flightId);
}
