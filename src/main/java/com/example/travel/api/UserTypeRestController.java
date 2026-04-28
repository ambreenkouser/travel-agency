package com.example.travel.api;

import com.example.travel.auth.AuthUserDetails;
import com.example.travel.auth.UserType;
import com.example.travel.auth.UserTypeRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user-types")
public class UserTypeRestController {

    private final UserTypeRepository userTypeRepository;

    public UserTypeRestController(UserTypeRepository userTypeRepository) {
        this.userTypeRepository = userTypeRepository;
    }

    /** All user types — used for display / reference. */
    @GetMapping
    public List<UserType> list() {
        return userTypeRepository.findAll();
    }

    /** Types the current user is allowed to create.
     *  super_admin (level 1) can create any type below level 1.
     *  Others can only create exactly one level below themselves.
     */
    @GetMapping("/allowed")
    public List<UserType> allowed(@AuthenticationPrincipal AuthUserDetails principal) {
        int myLevel = principal.getUserTypeLevel();
        return userTypeRepository.findAll().stream()
                .filter(ut -> myLevel == 1 ? ut.getLevel() > 1 : ut.getLevel() == myLevel + 1)
                .collect(Collectors.toList());
    }
}
