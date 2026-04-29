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
    date = "2026-04-28T22:11:59+0500",
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
        BigDecimal priceChild = null;
        BigDecimal priceInfant = null;
        Map<String, Object> compliance = null;
        Map<String, Object> extras = null;
        String contactPersonPhone = null;
        String contactPersonEmail = null;
        String packageClass = null;
        BigDecimal costAdult = null;
        BigDecimal costChild = null;
        BigDecimal costInfant = null;

        id = hajjPackage.getId();
        title = hajjPackage.getTitle();
        quotaTotal = hajjPackage.getQuotaTotal();
        quotaReserved = hajjPackage.getQuotaReserved();
        basePrice = hajjPackage.getBasePrice();
        priceChild = hajjPackage.getPriceChild();
        priceInfant = hajjPackage.getPriceInfant();
        Map<String, Object> map = hajjPackage.getCompliance();
        if ( map != null ) {
            compliance = new LinkedHashMap<String, Object>( map );
        }
        Map<String, Object> map1 = hajjPackage.getExtras();
        if ( map1 != null ) {
            extras = new LinkedHashMap<String, Object>( map1 );
        }
        contactPersonPhone = hajjPackage.getContactPersonPhone();
        contactPersonEmail = hajjPackage.getContactPersonEmail();
        packageClass = hajjPackage.getPackageClass();
        costAdult = hajjPackage.getCostAdult();
        costChild = hajjPackage.getCostChild();
        costInfant = hajjPackage.getCostInfant();

        HajjPackageDto hajjPackageDto = new HajjPackageDto( id, title, quotaTotal, quotaReserved, basePrice, priceChild, priceInfant, compliance, extras, contactPersonPhone, contactPersonEmail, packageClass, costAdult, costChild, costInfant );

        return hajjPackageDto;
    }
}
