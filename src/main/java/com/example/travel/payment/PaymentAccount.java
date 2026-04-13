package com.example.travel.payment;

import com.example.travel.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "payment_accounts")
public class PaymentAccount extends AuditableEntity {

    @Column(nullable = false)
    private Long userId;

    private Long agencyId;

    private Long bankId;

    private String accountName;

    @Column(nullable = false)
    private String accountTitle;

    private String bankAccountNumber;

    private boolean active = true;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getAgencyId() { return agencyId; }
    public void setAgencyId(Long agencyId) { this.agencyId = agencyId; }
    public Long getBankId() { return bankId; }
    public void setBankId(Long bankId) { this.bankId = bankId; }
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
    public String getAccountTitle() { return accountTitle; }
    public void setAccountTitle(String accountTitle) { this.accountTitle = accountTitle; }
    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
