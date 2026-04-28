package com.example.travel.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record CreateBookingRequest(
        String bookableType,
        Long bookableId,
        Long selectedAirlineId,
        Long selectedHotelId,
        BigDecimal extrasFee, // total extras cost pre-calculated by frontend (infant exemption already applied)
        List<PassengerRequest> passengers
) {}
