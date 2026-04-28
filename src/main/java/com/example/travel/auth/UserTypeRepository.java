package com.example.travel.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTypeRepository extends JpaRepository<UserType, Long> {
    Optional<UserType> findByName(String name);
    Optional<UserType> findByLevel(int level);
}
