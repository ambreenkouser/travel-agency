package com.example.travel.api.mapper;

import com.example.travel.api.dto.FlightDto;
import com.example.travel.flight.Flight;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface FlightMapper {

    // airlineCode/Name/LogoUrl are derived from the first leg's airline at the REST layer
    @Mapping(target = "airlineCode",    ignore = true)
    @Mapping(target = "airlineName",    ignore = true)
    @Mapping(target = "airlineLogoUrl", ignore = true)
    @Mapping(target = "origin",         ignore = true)
    @Mapping(target = "destination",    ignore = true)
    @Mapping(target = "departAt",       ignore = true)
    @Mapping(target = "arriveAt",       ignore = true)
    @Mapping(target = "availableSeats", ignore = true)
    @Mapping(target = "legs",           ignore = true)
    FlightDto toDto(Flight flight);
}
