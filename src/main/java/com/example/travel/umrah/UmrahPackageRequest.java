package com.example.travel.umrah;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    private String contactPersonPhone;
    private String contactPersonEmail;
    private String packageClass = "economy";
    private BigDecimal costAdult;
    private BigDecimal costChild;
    private BigDecimal costInfant;
    private List<UmrahPackageAirlineRequest> airlines;
    private List<Long> sharedWith = new ArrayList<>();

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
    public String getContactPersonPhone() { return contactPersonPhone; }
    public void setContactPersonPhone(String contactPersonPhone) { this.contactPersonPhone = contactPersonPhone; }
    public String getContactPersonEmail() { return contactPersonEmail; }
    public void setContactPersonEmail(String contactPersonEmail) { this.contactPersonEmail = contactPersonEmail; }
    public String getPackageClass() { return packageClass; }
    public void setPackageClass(String packageClass) { this.packageClass = packageClass; }
    public BigDecimal getCostAdult() { return costAdult; }
    public void setCostAdult(BigDecimal costAdult) { this.costAdult = costAdult; }
    public BigDecimal getCostChild() { return costChild; }
    public void setCostChild(BigDecimal costChild) { this.costChild = costChild; }
    public BigDecimal getCostInfant() { return costInfant; }
    public void setCostInfant(BigDecimal costInfant) { this.costInfant = costInfant; }
    public List<UmrahPackageAirlineRequest> getAirlines() { return airlines; }
    public void setAirlines(List<UmrahPackageAirlineRequest> airlines) { this.airlines = airlines; }
    public List<Long> getSharedWith() { return sharedWith; }
    public void setSharedWith(List<Long> sharedWith) { this.sharedWith = sharedWith != null ? sharedWith : new ArrayList<>(); }
}
