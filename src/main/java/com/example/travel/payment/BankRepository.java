package com.example.travel.payment;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BankRepository extends JpaRepository<Bank, Long> {
    List<Bank> findByActiveTrueOrderByTypeAscDisplayOrderAsc();
}
