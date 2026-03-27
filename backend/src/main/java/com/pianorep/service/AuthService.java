package com.pianorep.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.pianorep.dto.response.AuthResponse;
import com.pianorep.dto.response.UserDto;
import com.pianorep.entity.Role;
import com.pianorep.entity.SubscriptionStatus;
import com.pianorep.entity.User;
import com.pianorep.repository.RoleRepository;
import com.pianorep.repository.UserRepository;
import com.pianorep.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Value("${app.admin.emails}")
    private String adminEmails;

    private final GoogleTokenVerifier googleTokenVerifier;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SubscriptionService subscriptionService;

    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(idToken);

        String googleId = payload.getSubject();
        String email    = payload.getEmail();
        String name     = (String) payload.get("name");
        String picture  = (String) payload.get("picture");

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email).map(existing -> {
                    // Link existing account to this Google ID on first Google login
                    existing.setGoogleId(googleId);
                    if (existing.getDisplayName() == null) existing.setDisplayName(name);
                    if (existing.getAvatarUrl() == null) existing.setAvatarUrl(picture);
                    return existing;
                }))
                .orElseGet(() -> createGoogleUser(googleId, email, name, picture));

        // Update avatar if changed
        if (!Objects.equals(user.getAvatarUrl(), picture)) {
            user.setAvatarUrl(picture);
        }

        // Record login timestamp
        user.setLastLoginAt(LocalDateTime.now(ZoneOffset.UTC));

        // Auto-assign ROLE_ADMIN for designated admin emails
        ensureAdminRole(user);

        // Check/update trial status
        subscriptionService.refreshStatus(user);

        String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        return AuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .expiresIn(jwtExpirationMs / 1000)
                .user(toUserDto(user))
                .build();
    }

    public UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        subscriptionService.refreshStatus(user);
        return toUserDto(user);
    }

    private void ensureAdminRole(User user) {
        Set<String> adminList = Set.copyOf(Arrays.asList(adminEmails.split(",")));
        if (!adminList.contains(user.getEmail())) return;
        boolean alreadyAdmin = user.getRoles().stream()
                .anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
        if (!alreadyAdmin) {
            roleRepository.findByName("ROLE_ADMIN").ifPresent(role -> {
                user.getRoles().add(role);
                userRepository.save(user);
                log.info("Assigned ROLE_ADMIN to {}", user.getEmail());
            });
        }
    }

    private User createGoogleUser(String googleId, String email, String name, String picture) {
        log.info("Creating new Google user: {}", email);
        User user = new User();
        user.setGoogleId(googleId);
        user.setEmail(email);
        user.setUsername(email);
        user.setDisplayName(name);
        user.setAvatarUrl(picture);
        user.setTrialStartDate(LocalDateTime.now(ZoneOffset.UTC));
        user.setSubStatus(SubscriptionStatus.TRIAL);

        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Default role ROLE_USER not found"));
        user.getRoles().add(userRole);

        return userRepository.save(user);
    }

    public UserDto toUserDto(User user) {
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName())
                .toList();
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .displayName(user.getDisplayName())
                .avatarUrl(user.getAvatarUrl())
                .subscriptionStatus(user.getSubStatus())
                .trialDaysRemaining(subscriptionService.trialDaysRemaining(user))
                .currentPeriodEnd(user.getCurrentPeriodEnd() != null
                        ? user.getCurrentPeriodEnd().toString() : null)
                .roles(roles)
                .build();
    }
}
