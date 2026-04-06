package com.example.travel.payment;

import com.example.travel.tenancy.AgencyContext;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository txRepository;

    public WalletService(WalletRepository walletRepository, WalletTransactionRepository txRepository) {
        this.walletRepository = walletRepository;
        this.txRepository = txRepository;
    }

    @Transactional
    public Wallet credit(Long walletId, BigDecimal amount, String currency, String reference) {
        Wallet wallet = walletRepository.findById(walletId).orElseThrow();
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);
        WalletTransaction tx = buildTx(wallet, WalletTransaction.Type.CREDIT, amount, currency, reference);
        txRepository.save(tx);
        return wallet;
    }

    @Transactional
    public Wallet debit(Long walletId, BigDecimal amount, String currency, String reference) {
        Wallet wallet = walletRepository.findById(walletId).orElseThrow();
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);
        WalletTransaction tx = buildTx(wallet, WalletTransaction.Type.DEBIT, amount, currency, reference);
        txRepository.save(tx);
        return wallet;
    }

    private WalletTransaction buildTx(Wallet wallet, WalletTransaction.Type type, BigDecimal amount, String currency, String reference) {
        WalletTransaction tx = new WalletTransaction();
        tx.setAgencyId(AgencyContext.getCurrentAgencyId());
        tx.setWalletId(wallet.getId());
        tx.setType(type);
        tx.setAmount(amount);
        tx.setCurrency(currency);
        tx.setReference(reference);
        return tx;
    }
}
