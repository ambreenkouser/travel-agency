package com.example.travel.api;

import com.example.travel.payment.Bank;
import com.example.travel.payment.BankRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/banks")
public class BankRestController {

    private final BankRepository repository;

    public BankRestController(BankRepository repository) {
        this.repository = repository;
    }

    /** All active banks — available to any authenticated user (for dropdowns). */
    @GetMapping
    public List<Bank> list() {
        return repository.findByActiveTrueOrderByTypeAscDisplayOrderAsc();
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('super_admin')")
    public List<Bank> listAll() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('super_admin')")
    public Bank create(@RequestBody BankRequest req) {
        Bank bank = new Bank();
        apply(bank, req);
        return repository.save(bank);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('super_admin')")
    public Bank update(@PathVariable Long id, @RequestBody BankRequest req) {
        Bank bank = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Bank not found: " + id));
        apply(bank, req);
        return repository.save(bank);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('super_admin')")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    private void apply(Bank bank, BankRequest req) {
        bank.setName(req.name());
        bank.setShortName(req.shortName());
        bank.setType(req.type() != null ? req.type().toUpperCase() : "BANK");
        bank.setActive(req.active());
        bank.setDisplayOrder(req.displayOrder() != null ? req.displayOrder() : 0);
    }

    public record BankRequest(String name, String shortName, String type, boolean active, Integer displayOrder) {}
}
