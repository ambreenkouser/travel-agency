package com.example.travel.api.mapper;

import com.example.travel.api.dto.HajjPackageDto;
import com.example.travel.hajj.HajjPackage;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PackageMapper {

    HajjPackageDto toDto(HajjPackage hajjPackage);
}
