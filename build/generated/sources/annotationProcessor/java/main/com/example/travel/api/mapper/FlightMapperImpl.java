package com.example.travel.api.mapper;

import com.example.travel.api.dto.FlightDto;
import com.example.travel.api.dto.FlightLegDto;
import com.example.travel.flight.Airline;
import com.example.travel.flight.Flight;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-28T22:11:58+0500",
    comments = "version: 1.5.5.Final, compiler: IncrementalProcessingEnvironment from gradle-language-java-8.14.jar, environment: Java 18.0.2.1 (Oracle Corporation)"
)
@Component
public class FlightMapperImpl implements FlightMapper {

    @Override
    public FlightDto toDto(Flight flight) {
        if ( flight == null ) {
            return null;
        }

        String airlineCode = null;
        String airlineName = null;
        Long id = null;
        BigDecimal fareAdult = null;
        BigDecimal fareChild = null;
        BigDecimal fareInfant = null;
        BigDecimal taxTotal = null;
        BigDecimal costAdult = null;
        BigDecimal costChild = null;
        BigDecimal costInfant = null;
        String baggageInfo = null;
        String flightNumber = null;
        String pnrCode = null;
        String groupName = null;
        String status = null;
        Map<String, Object> extras = null;
        Integer seatQuota = null;
        String contactPersonPhone = null;
        String contactPersonEmail = null;
        String flightClass = null;

        airlineCode = flightAirlineCode( flight );
        airlineName = flightAirlineName( flight );
        id = flight.getId();
        fareAdult = flight.getFareAdult();
        fareChild = flight.getFareChild();
        fareInfant = flight.getFareInfant();
        taxTotal = flight.getTaxTotal();
        costAdult = flight.getCostAdult();
        costChild = flight.getCostChild();
        costInfant = flight.getCostInfant();
        baggageInfo = flight.getBaggageInfo();
        flightNumber = flight.getFlightNumber();
        pnrCode = flight.getPnrCode();
        groupName = flight.getGroupName();
        status = flight.getStatus();
        Map<String, Object> map = flight.getExtras();
        if ( map != null ) {
            extras = new LinkedHashMap<String, Object>( map );
        }
        seatQuota = flight.getSeatQuota();
        contactPersonPhone = flight.getContactPersonPhone();
        contactPersonEmail = flight.getContactPersonEmail();
        flightClass = flight.getFlightClass();

        String origin = null;
        String destination = null;
        OffsetDateTime departAt = null;
        OffsetDateTime arriveAt = null;
        Integer availableSeats = null;
        List<FlightLegDto> legs = null;
        String airlineLogoUrl = null;

        FlightDto flightDto = new FlightDto( id, airlineCode, airlineName, airlineLogoUrl, origin, destination, departAt, arriveAt, fareAdult, fareChild, fareInfant, taxTotal, costAdult, costChild, costInfant, baggageInfo, flightNumber, pnrCode, groupName, status, extras, seatQuota, availableSeats, legs, contactPersonPhone, contactPersonEmail, flightClass );

        return flightDto;
    }

    private String flightAirlineCode(Flight flight) {
        if ( flight == null ) {
            return null;
        }
        Airline airline = flight.getAirline();
        if ( airline == null ) {
            return null;
        }
        String code = airline.getCode();
        if ( code == null ) {
            return null;
        }
        return code;
    }

    private String flightAirlineName(Flight flight) {
        if ( flight == null ) {
            return null;
        }
        Airline airline = flight.getAirline();
        if ( airline == null ) {
            return null;
        }
        String name = airline.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
