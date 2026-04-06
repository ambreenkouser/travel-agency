package com.example.travel.agency;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/agencies")
public class AgencyController {

    private final AgencyService service;

    public AgencyController(AgencyService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('super_admin') or hasRole('master_agent')")
    public String list(Model model) {
        model.addAttribute("agencies", service.findAll());
        return "agencies/list";
    }

    @PostMapping
    @PreAuthorize("hasRole('super_admin') or hasRole('master_agent')")
    public String create(Agency agency) {
        service.save(agency);
        return "redirect:/agencies";
    }
}
