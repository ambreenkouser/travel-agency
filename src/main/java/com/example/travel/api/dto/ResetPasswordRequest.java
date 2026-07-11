package com.example.travel.api.dto;

public record ResetPasswordRequest(String token, String newPassword) {}
