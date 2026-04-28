package com.example.travel.payment;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentAccountRepository extends JpaRepository<PaymentAccount, Long> {
    List<PaymentAccount> findByUserId(Long userId);
    List<PaymentAccount> findByUserIdAndActiveTrue(Long userId);
    List<PaymentAccount> findByUserIdIn(Collection<Long> userIds);
    List<PaymentAccount> findByUserIdInAndActiveTrue(Collection<Long> userIds);
}
