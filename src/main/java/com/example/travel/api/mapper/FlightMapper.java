package com.example.travel.api.mapper;

import com.example.travel.api.dto.FlightDto;
import com.example.travel.flight.Flight;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FlightMapper {

    @Mapping(source = "airline.code", target = "airlineCode")
    @Mapping(source = "airline.name", target = "airlineName")
    @Mapping(target = "origin",        ignore = true)
    @Mapping(target = "destination",   ignore = true)
    @Mapping(target = "departAt",      ignore = true)
    @Mapping(target = "arriveAt",      ignore = true)
    @Mapping(target = "availableSeats",ignore = true)
    @Mapping(target = "legs",          ignore = true)
    FlightDto toDto(Flight flight);
}
