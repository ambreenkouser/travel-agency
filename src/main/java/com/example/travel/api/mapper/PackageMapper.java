package com.example.travel.api.mapper;

import com.example.travel.api.dto.HajjPackageDto;
import com.example.travel.hajj.HajjPackage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PackageMapper {

    @Mapping(target = "hasImage", expression = "java(hajjPackage.getImageData() != null)")
    HajjPackageDto toDto(HajjPackage hajjPackage);
}
