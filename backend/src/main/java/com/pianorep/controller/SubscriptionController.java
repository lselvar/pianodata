package com.pianorep.controller;

import com.pianorep.dto.response.CheckoutResponse;
import com.pianorep.dto.response.SubscriptionStatusDto;
import com.pianorep.entity.User;
import com.pianorep.repository.UserRepository;
import com.pianorep.security.UserPrincipal;
import com.pianorep.service.StripeService;
import com.pianorep.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final StripeService stripeService;
    private final UserRepository userRepository;

    @GetMapping("/status")
    public ResponseEntity<SubscriptionStatusDto> getStatus(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = getUser(principal);
        subscriptionService.refreshStatus(user);

        return ResponseEntity.ok(SubscriptionStatusDto.builder()
                .status(user.getSubStatus())
                .trialStartDate(user.getTrialStartDate() != null
                        ? user.getTrialStartDate().toString() : null)
                .trialDaysRemaining(subscriptionService.trialDaysRemaining(user))
                .currentPeriodEnd(user.getCurrentPeriodEnd() != null
                        ? user.getCurrentPeriodEnd().toString() : null)
                .stripeCustomerId(user.getStripeCustomerId())
                .build());
    }

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> createCheckout(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = getUser(principal);
        try {
            String url = stripeService.createCheckoutSession(user);
            return ResponseEntity.ok(new CheckoutResponse(url));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create checkout session: " + e.getMessage());
        }
    }

    @PostMapping("/portal")
    public ResponseEntity<CheckoutResponse> createPortal(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = getUser(principal);
        if (user.getStripeCustomerId() == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            String url = stripeService.createPortalSession(user);
            return ResponseEntity.ok(new CheckoutResponse(url));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create portal session: " + e.getMessage());
        }
    }

    private User getUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
