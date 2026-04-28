package com.example.travel.api;

import com.example.travel.api.dto.ChangePasswordRequest;
import com.example.travel.api.dto.UpdateProfileRequest;
import com.example.travel.api.dto.UserDto;
import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.User;
import com.example.travel.auth.UserRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/me")
public class MeRestController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public MeRestController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public UserDto me(@AuthenticationPrincipal AuthUserDetails principal) {
        return toDto(principal.getUser(), principal);
    }

    @PatchMapping
    public UserDto updateProfile(
            @AuthenticationPrincipal AuthUserDetails principal,
            @RequestBody UpdateProfileRequest req) {
        User user = userRepository.findById(principal.getUserId()).orElseThrow();
        if (req.firstName() != null && !req.firstName().isBlank()) {
            user.setFirstName(req.firstName().trim());
        }
        if (req.lastName() != null && !req.lastName().isBlank()) {
            user.setLastName(req.lastName().trim());
        }
        if (req.email() != null && !req.email().isBlank() && !req.email().equals(user.getEmail())) {
            if (userRepository.existsByEmail(req.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
            }
            user.setEmail(req.email().trim());
        }
        userRepository.save(user);
        return toDto(user, principal);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @AuthenticationPrincipal AuthUserDetails principal,
            @RequestBody ChangePasswordRequest req) {
        User user = userRepository.findById(principal.getUserId()).orElseThrow();
        if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
    }

    private UserDto toDto(User user, AuthUserDetails principal) {
        List<String> authorities = principal.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .collect(Collectors.toList());
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                principal.getAgencyId(),
                authorities
        );
    }
}
