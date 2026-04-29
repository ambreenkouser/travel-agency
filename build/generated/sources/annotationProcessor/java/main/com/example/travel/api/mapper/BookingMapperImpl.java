package com.example.travel.api.mapper;

import com.example.travel.api.dto.BookingDto;
import com.example.travel.api.dto.BookingPaymentDto;
import com.example.travel.api.dto.PassengerDto;
import com.example.travel.booking.Booking;
import com.example.travel.booking.Passenger;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-28T22:11:59+0500",
    comments = "version: 1.5.5.Final, compiler: IncrementalProcessingEnvironment from gradle-language-java-8.14.jar, environment: Java 18.0.2.1 (Oracle Corporation)"
)
@Component
public class BookingMapperImpl implements BookingMapper {

    @Override
    public BookingDto toDto(Booking booking) {
        if ( booking == null ) {
            return null;
        }

        String status = null;
        Long id = null;
        String bookableType = null;
        Long bookableId = null;
        BigDecimal grossTotal = null;
        BigDecimal netTotal = null;
        BigDecimal taxTotal = null;
        String currency = null;
        Instant createdAt = null;
        Instant expiresAt = null;
        List<PassengerDto> passengers = null;
        Long bookedByUserId = null;
        String paymentComment = null;
        Long approvedByUserId = null;

        status = statusToString( booking.getStatus() );
        id = booking.getId();
        bookableType = booking.getBookableType();
        bookableId = booking.getBookableId();
        grossTotal = booking.getGrossTotal();
        netTotal = booking.getNetTotal();
        taxTotal = booking.getTaxTotal();
        currency = booking.getCurrency();
        createdAt = booking.getCreatedAt();
        expiresAt = booking.getExpiresAt();
        passengers = passengerListToPassengerDtoList( booking.getPassengers() );
        bookedByUserId = booking.getBookedByUserId();
        paymentComment = booking.getPaymentComment();
        approvedByUserId = booking.getApprovedByUserId();

        String bookedByName = null;
        BookingPaymentDto payment = null;
        String bookableTitle = null;
        String flightNumber = null;
        String pnrCode = null;

        BookingDto bookingDto = new BookingDto( id, bookableType, bookableId, status, grossTotal, netTotal, taxTotal, currency, createdAt, expiresAt, passengers, bookedByUserId, bookedByName, paymentComment, approvedByUserId, payment, bookableTitle, flightNumber, pnrCode );

        return bookingDto;
    }

    @Override
    public PassengerDto toPassengerDto(Passenger passenger) {
        if ( passenger == null ) {
            return null;
        }

        String type = null;
        Long id = null;
        String firstName = null;
        String lastName = null;
        String passportNo = null;
        String nationality = null;
        LocalDate dateOfBirth = null;
        String seatNo = null;

        type = passengerTypeToString( passenger.getType() );
        id = passenger.getId();
        firstName = passenger.getFirstName();
        lastName = passenger.getLastName();
        passportNo = passenger.getPassportNo();
        nationality = passenger.getNationality();
        dateOfBirth = passenger.getDateOfBirth();
        seatNo = passenger.getSeatNo();

        PassengerDto passengerDto = new PassengerDto( id, type, firstName, lastName, passportNo, nationality, dateOfBirth, seatNo );

        return passengerDto;
    }

    protected List<PassengerDto> passengerListToPassengerDtoList(List<Passenger> list) {
        if ( list == null ) {
            return null;
        }

        List<PassengerDto> list1 = new ArrayList<PassengerDto>( list.size() );
        for ( Passenger passenger : list ) {
            list1.add( toPassengerDto( passenger ) );
        }

        return list1;
    }
}
