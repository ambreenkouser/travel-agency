package com.example.travel.api.mapper;

import com.example.travel.api.dto.HajjPackageDto;
import com.example.travel.hajj.HajjPackage;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-10T16:42:43+0500",
    comments = "version: 1.5.5.Final, compiler: IncrementalProcessingEnvironment from gradle-language-java-8.14.jar, environment: Java 18.0.2.1 (Oracle Corporation)"
)
@Component
public class PackageMapperImpl implements PackageMapper {

    @Override
    public HajjPackageDto toDto(HajjPackage hajjPackage) {
        if ( hajjPackage == null ) {
            return null;
        }

        Long id = null;
        String title = null;
        Integer quotaTotal = null;
        Integer quotaReserved = null;
        BigDecimal basePrice = null;
        Map<String, Object> compliance = null;

        id = hajjPackage.getId();
        title = hajjPackage.getTitle();
        quotaTotal = hajjPackage.getQuotaTotal();
        quotaReserved = hajjPackage.getQuotaReserved();
        basePrice = hajjPackage.getBasePrice();
        Map<String, Object> map = hajjPackage.getCompliance();
        if ( map != null ) {
            compliance = new LinkedHashMap<String, Object>( map );
        }

        HajjPackageDto hajjPackageDto = new HajjPackageDto( id, title, quotaTotal, quotaReserved, basePrice, compliance );

        return hajjPackageDto;
    }
}
