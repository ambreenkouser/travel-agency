package com.example.travel.api.mapper;

import com.example.travel.api.dto.FlightDto;
import com.example.travel.flight.Flight;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FlightMapper {

    @Mapping(source = "airline.code", target = "airlineCode")
    @Mapping(source = "airline.name", target = "airlineName")
    @Mapping(source = "route.origin", target = "origin")
    @Mapping(source = "route.destination", target = "destination")
    @Mapping(source = "route.durationMins", target = "durationMins")
    @Mapping(source = "route.routeType", target = "routeType")
    @Mapping(target = "availableSeats", ignore = true)
    FlightDto toDto(Flight flight);
}
