package com.example.travel.api.mapper;

import com.example.travel.api.dto.BookingDto;
import com.example.travel.api.dto.PassengerDto;
import com.example.travel.booking.Booking;
import com.example.travel.booking.Passenger;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BookingMapper {

    @Mapping(source = "status", target = "status", qualifiedByName = "statusToString")
    @Mapping(target = "bookedByName", ignore = true)
    @Mapping(target = "payment", ignore = true)
    BookingDto toDto(Booking booking);

    @Mapping(source = "type", target = "type", qualifiedByName = "passengerTypeToString")
    PassengerDto toPassengerDto(Passenger passenger);

    @org.mapstruct.Named("statusToString")
    default String statusToString(com.example.travel.booking.BookingStatus status) {
        return status == null ? null : status.name();
    }

    @org.mapstruct.Named("passengerTypeToString")
    default String passengerTypeToString(com.example.travel.booking.PassengerType type) {
        return type == null ? null : type.name();
    }
}
