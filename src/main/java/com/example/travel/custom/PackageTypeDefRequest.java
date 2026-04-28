package com.example.travel.custom;

import java.util.List;

public record PackageTypeDefRequest(
        String name,
        String description,
        String icon,
        Boolean active,
        List<Long> grantedAgencyIds
) {}
