package com.example.travel.tenancy;

public final class AgencyContext {
    private static final ThreadLocal<Long> CURRENT = new ThreadLocal<>();

    private AgencyContext() {}

    public static void setCurrentAgencyId(Long agencyId) {
        CURRENT.set(agencyId);
    }

    public static Long getCurrentAgencyId() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
