package com.pianorep.controller;

import com.pianorep.service.StripeService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    @Value("${app.stripe.webhook-secret}")
    private String webhookSecret;

    private final StripeService stripeService;

    @PostMapping(value = "/stripe", consumes = "application/json")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        log.info("Received Stripe event: {}", event.getType());

        switch (event.getType()) {
            case "checkout.session.completed" -> {
                Session session = (Session) event.getDataObjectDeserializer()
                        .getObject().orElseThrow();
                stripeService.handleCheckoutComplete(session);
            }
            case "invoice.payment_succeeded" -> {
                Invoice invoice = (Invoice) event.getDataObjectDeserializer()
                        .getObject().orElseThrow();
                stripeService.handlePaymentSucceeded(invoice);
            }
            case "customer.subscription.deleted" -> {
                Subscription sub = (Subscription) event.getDataObjectDeserializer()
                        .getObject().orElseThrow();
                stripeService.handleSubscriptionCancelled(sub);
            }
            default -> log.debug("Unhandled event type: {}", event.getType());
        }

        return ResponseEntity.ok("received");
    }
}
