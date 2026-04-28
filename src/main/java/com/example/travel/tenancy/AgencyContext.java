package com.example.travel.tenancy;

public final class AgencyContext {
    private static final ThreadLocal<Long>    CURRENT     = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> SUPER_ADMIN = new ThreadLocal<>();

    private AgencyContext() {}

    public static void setCurrentAgencyId(Long agencyId) { CURRENT.set(agencyId); }
    public static Long getCurrentAgencyId() { return CURRENT.get(); }

    public static void setSuperAdmin(boolean v) { SUPER_ADMIN.set(v); }
    /** True when the current request is made by a super_admin. */
    public static boolean isSuperAdmin() { return Boolean.TRUE.equals(SUPER_ADMIN.get()); }

    public static void clear() {
        CURRENT.remove();
        SUPER_ADMIN.remove();
    }
}
