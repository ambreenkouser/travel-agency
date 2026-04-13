package com.example.travel.api.mapper;

import com.example.travel.api.dto.FlightDto;
import com.example.travel.flight.Airline;
import com.example.travel.flight.Flight;
import com.example.travel.flight.Route;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-10T16:42:43+0500",
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
        String origin = null;
        String destination = null;
        Integer durationMins = null;
        String routeType = null;
        Long id = null;
        OffsetDateTime departAt = null;
        OffsetDateTime arriveAt = null;
        BigDecimal fareAdult = null;
        BigDecimal fareChild = null;
        BigDecimal fareInfant = null;
        BigDecimal taxTotal = null;
        String baggageInfo = null;
        String status = null;
        Map<String, Object> extras = null;
        Integer seatQuota = null;

        airlineCode = flightAirlineCode( flight );
        airlineName = flightAirlineName( flight );
        origin = flightRouteOrigin( flight );
        destination = flightRouteDestination( flight );
        durationMins = flightRouteDurationMins( flight );
        routeType = flightRouteRouteType( flight );
        id = flight.getId();
        departAt = flight.getDepartAt();
        arriveAt = flight.getArriveAt();
        fareAdult = flight.getFareAdult();
        fareChild = flight.getFareChild();
        fareInfant = flight.getFareInfant();
        taxTotal = flight.getTaxTotal();
        baggageInfo = flight.getBaggageInfo();
        status = flight.getStatus();
        Map<String, Object> map = flight.getExtras();
        if ( map != null ) {
            extras = new LinkedHashMap<String, Object>( map );
        }
        seatQuota = flight.getSeatQuota();

        Integer availableSeats = null;

        FlightDto flightDto = new FlightDto( id, airlineCode, airlineName, origin, destination, durationMins, departAt, arriveAt, fareAdult, fareChild, fareInfant, taxTotal, baggageInfo, status, routeType, extras, seatQuota, availableSeats );

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

    private String flightRouteOrigin(Flight flight) {
        if ( flight == null ) {
            return null;
        }
        Route route = flight.getRoute();
        if ( route == null ) {
            return null;
        }
        String origin = route.getOrigin();
        if ( origin == null ) {
            return null;
        }
        return origin;
    }

    private String flightRouteDestination(Flight flight) {
        if ( flight == null ) {
            return null;
        }
        Route route = flight.getRoute();
        if ( route == null ) {
            return null;
        }
        String destination = route.getDestination();
        if ( destination == null ) {
            return null;
        }
        return destination;
    }

    private Integer flightRouteDurationMins(Flight flight) {
        if ( flight == null ) {
            return null;
        }
        Route route = flight.getRoute();
        if ( route == null ) {
            return null;
        }
        Integer durationMins = route.getDurationMins();
        if ( durationMins == null ) {
            return null;
        }
        return durationMins;
    }

    private String flightRouteRouteType(Flight flight) {
        if ( flight == null ) {
            return null;
        }
        Route route = flight.getRoute();
        if ( route == null ) {
            return null;
        }
        String routeType = route.getRouteType();
        if ( routeType == null ) {
            return null;
        }
        return routeType;
    }
}
