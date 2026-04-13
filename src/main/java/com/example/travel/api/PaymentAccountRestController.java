package com.example.travel.api;

import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.UserRepository;
import com.example.travel.payment.PaymentAccount;
import com.example.travel.payment.PaymentAccountRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payment-accounts")
public class PaymentAccountRestController {

    private final PaymentAccountRepository repository;
    private final UserRepository userRepository;

    public PaymentAccountRestController(PaymentAccountRepository repository,
                                         UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    /** Returns the logged-in user's own payment accounts. */
    @GetMapping
    @PreAuthorize("hasAuthority('accounts:manage')")
    public List<PaymentAccount> myAccounts(@AuthenticationPrincipal AuthUserDetails principal) {
        return repository.findByUserId(principal.getUserId());
    }

    /**
     * Returns the parent user's active payment accounts.
     * Used by agents to see where to submit payment.
     */
    @GetMapping("/parent")
    @PreAuthorize("hasAuthority('bookings:create')")
    public List<PaymentAccount> parentAccounts(@AuthenticationPrincipal AuthUserDetails principal) {
        Long parentId = principal.getParentId();
        if (parentId == null) return List.of();
        return repository.findByUserIdAndActiveTrue(parentId);
    }

    /** Creates a new payment account for the logged-in user. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('accounts:manage')")
    public PaymentAccount create(@RequestBody CreateAccountRequest req,
                                  @AuthenticationPrincipal AuthUserDetails principal) {
        PaymentAccount account = new PaymentAccount();
        account.setUserId(principal.getUserId());
        account.setAgencyId(principal.getAgencyId());
        account.setAccountName(req.accountName());
        account.setBankId(req.bankId());
        account.setAccountTitle(req.accountTitle());
        account.setBankAccountNumber(req.bankAccountNumber());
        return repository.save(account);
    }

    /** Deletes the logged-in user's own payment account. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('accounts:manage')")
    public void delete(@PathVariable Long id,
                       @AuthenticationPrincipal AuthUserDetails principal) {
        PaymentAccount account = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Account not found"));
        if (!account.getUserId().equals(principal.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your account");
        }
        repository.delete(account);
    }

    public record CreateAccountRequest(String accountName, Long bankId, String accountTitle, String bankAccountNumber) {}
}
