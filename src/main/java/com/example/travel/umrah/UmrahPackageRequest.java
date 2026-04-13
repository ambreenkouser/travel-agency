package com.example.travel.umrah;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

public class UmrahPackageRequest {

    private String title;
    private Integer durationDays;
    private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal basePrice;
    private String status = "draft";
    private Map<String, Object> config;
    private Map<String, Object> extras;
    private BigDecimal priceChild;
    private BigDecimal priceInfant;
    private List<UmrahPackageAirlineRequest> airlines;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getDurationDays() { return durationDays; }
    public void setDurationDays(Integer durationDays) { this.durationDays = durationDays; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Map<String, Object> getConfig() { return config; }
    public void setConfig(Map<String, Object> config) { this.config = config; }
    public Map<String, Object> getExtras() { return extras; }
    public void setExtras(Map<String, Object> extras) { this.extras = extras; }
    public BigDecimal getPriceChild() { return priceChild; }
    public void setPriceChild(BigDecimal priceChild) { this.priceChild = priceChild; }
    public BigDecimal getPriceInfant() { return priceInfant; }
    public void setPriceInfant(BigDecimal priceInfant) { this.priceInfant = priceInfant; }
    public List<UmrahPackageAirlineRequest> getAirlines() { return airlines; }
    public void setAirlines(List<UmrahPackageAirlineRequest> airlines) { this.airlines = airlines; }
}
