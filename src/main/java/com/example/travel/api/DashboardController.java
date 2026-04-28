package com.example.travel.api;

import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import com.example.travel.booking.Booking;
import com.example.travel.booking.BookingRepository;
import com.example.travel.booking.BookingStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    public DashboardController(BookingRepository bookingRepository,
                               UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository    = userRepository;
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public DashboardStatsDto stats(
            @AuthenticationPrincipal AuthUserDetails principal,
            @RequestParam(defaultValue = "30")  int days,
            @RequestParam(required = false) Long agentId) {

        Long currentUserId = principal.getUserId();

        // Collect visible agent IDs: self + direct child agents
        List<User> children = userRepository.findByParentId(currentUserId);
        List<AgentOption> agentOptions = new ArrayList<>();
        agentOptions.add(new AgentOption(currentUserId, "My Bookings"));
        for (User child : children) {
            String name = ((child.getFirstName() != null ? child.getFirstName() + " " : "") + (child.getLastName() != null ? child.getLastName() : "")).trim();
            agentOptions.add(new AgentOption(child.getId(), name.isEmpty() ? child.getEmail() : name));
        }

        List<Long> targetUserIds = new ArrayList<>();
        if (agentId != null && isVisibleAgent(agentId, currentUserId, children)) {
            targetUserIds.add(agentId);
        } else {
            targetUserIds.add(currentUserId);
            children.forEach(c -> targetUserIds.add(c.getId()));
        }

        // Time range
        Instant cutoff = Instant.now().minusSeconds((long) days * 86400);

        // Load bookings for target users within time range
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> targetUserIds.contains(b.getBookedByUserId()))
                .filter(b -> b.getCreatedAt() != null && b.getCreatedAt().isAfter(cutoff))
                .collect(Collectors.toList());

        // Build daily activity and revenue maps
        Map<String, Long>       countByDate   = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueByDate = new LinkedHashMap<>();
        Map<String, BigDecimal> costByDate    = new LinkedHashMap<>();

        // Pre-fill all days in range
        for (int i = days - 1; i >= 0; i--) {
            String d = LocalDate.now(ZoneOffset.UTC).minusDays(i).format(DateTimeFormatter.ISO_LOCAL_DATE);
            countByDate.put(d, 0L);
            revenueByDate.put(d, BigDecimal.ZERO);
            costByDate.put(d, BigDecimal.ZERO);
        }

        for (Booking b : bookings) {
            if (b.getStatus() == BookingStatus.CANCELLED) continue;
            String d = b.getCreatedAt().atZone(ZoneOffset.UTC).toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
            if (!countByDate.containsKey(d)) continue;
            countByDate.merge(d, 1L, Long::sum);
            if (b.getGrossTotal() != null) {
                revenueByDate.merge(d, b.getGrossTotal(), BigDecimal::add);
            }
            // Extract cost from pricingSnapshot if present
            BigDecimal cost = extractCost(b);
            if (cost != null) {
                costByDate.merge(d, cost, BigDecimal::add);
            }
        }

        List<DayStats> activity = new ArrayList<>();
        for (String d : countByDate.keySet()) {
            BigDecimal revenue = revenueByDate.get(d);
            BigDecimal cost    = costByDate.get(d);
            BigDecimal profit  = revenue != null && cost != null ? revenue.subtract(cost) : null;
            activity.add(new DayStats(d, countByDate.get(d), revenue, cost, profit));
        }

        // Summary totals (non-cancelled in range)
        long   totalBookings = bookings.stream().filter(b -> b.getStatus() != BookingStatus.CANCELLED).count();
        long   confirmed     = bookings.stream().filter(b -> b.getStatus() == BookingStatus.CONFIRMED).count();
        BigDecimal totalRevenue = bookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED && b.getGrossTotal() != null)
                .map(Booking::getGrossTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalCost = bookings.stream()
                .filter(b -> b.getStatus() != BookingStatus.CANCELLED)
                .map(this::extractCost)
                .filter(c -> c != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Booking history (most recent first, max 50)
        List<BookingHistoryRow> history = bookings.stream()
                .sorted((a, bk) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (bk.getCreatedAt() == null) return -1;
                    return bk.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(50)
                .map(b -> new BookingHistoryRow(
                        b.getId(),
                        b.getBookableType(),
                        b.getBookableId(),
                        b.getStatus() != null ? b.getStatus().name() : null,
                        b.getGrossTotal(),
                        extractCost(b),
                        b.getCreatedAt(),
                        b.getBookedByUserId()
                ))
                .collect(Collectors.toList());

        return new DashboardStatsDto(
                totalBookings, confirmed, totalRevenue, totalCost,
                totalRevenue.subtract(totalCost),
                activity, history, agentOptions
        );
    }

    private boolean isVisibleAgent(Long agentId, Long currentUserId, List<User> children) {
        if (agentId.equals(currentUserId)) return true;
        return children.stream().anyMatch(c -> c.getId().equals(agentId));
    }

    private BigDecimal extractCost(Booking b) {
        Map<String, Object> snapshot = b.getPricingSnapshot();
        if (snapshot == null) return null;
        Object c = snapshot.get("totalCost");
        if (c instanceof Number) return new BigDecimal(c.toString());
        return null;
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────

    public record DashboardStatsDto(
            long totalBookings,
            long confirmedBookings,
            BigDecimal totalRevenue,
            BigDecimal totalCost,
            BigDecimal totalProfit,
            List<DayStats> activityByDate,
            List<BookingHistoryRow> bookingHistory,
            List<AgentOption> agentOptions
    ) {}

    public record DayStats(
            String date,
            long count,
            BigDecimal revenue,
            BigDecimal cost,
            BigDecimal profit
    ) {}

    public record BookingHistoryRow(
            Long id,
            String bookableType,
            Long bookableId,
            String status,
            BigDecimal grossTotal,
            BigDecimal cost,
            Instant createdAt,
            Long bookedByUserId
    ) {}

    public record AgentOption(Long id, String name) {}
}
