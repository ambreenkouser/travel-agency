package com.example.travel.agency;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AgencyService {
    private final AgencyRepository repository;

    public AgencyService(AgencyRepository repository) {
        this.repository = repository;
    }

    public List<Agency> findAll() { return repository.findAll(); }

    public Agency findById(Long id) { return repository.findById(id).orElseThrow(); }

    @Transactional
    public Agency save(Agency agency) { return repository.save(agency); }
}
