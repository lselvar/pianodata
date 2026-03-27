package com.pianorep.service;

import com.pianorep.entity.SubscriptionStatus;
import com.pianorep.entity.User;
import com.pianorep.repository.UserRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripeService {

    @Value("${app.stripe.price-id}")
    private String priceId;

    @Value("${app.stripe.success-url}")
    private String successUrl;

    @Value("${app.stripe.cancel-url}")
    private String cancelUrl;

    private final UserRepository userRepository;

    public String createCheckoutSession(User user) throws StripeException {
        String customerId = ensureStripeCustomer(user);

        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setCustomer(customerId)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setPrice(priceId)
                        .setQuantity(1L)
                        .build())
                .setSuccessUrl(successUrl)
                .setCancelUrl(cancelUrl)
                .build();

        com.stripe.model.checkout.Session session =
                com.stripe.model.checkout.Session.create(params);
        return session.getUrl();
    }

    public String createPortalSession(User user) throws StripeException {
        com.stripe.param.billingportal.SessionCreateParams params =
                com.stripe.param.billingportal.SessionCreateParams.builder()
                        .setCustomer(user.getStripeCustomerId())
                        .setReturnUrl(cancelUrl)
                        .build();
        return com.stripe.model.billingportal.Session.create(params).getUrl();
    }

    @Transactional
    public void handleCheckoutComplete(com.stripe.model.checkout.Session session) {
        String customerId = session.getCustomer();
        userRepository.findByStripeCustomerId(customerId).ifPresent(user -> {
            user.setSubStatus(SubscriptionStatus.ACTIVE);
            user.setStripeSubscriptionId(session.getSubscription());
            userRepository.save(user);
            log.info("Subscription activated for user {}", user.getEmail());
        });
    }

    @Transactional
    public void handlePaymentSucceeded(Invoice invoice) {
        String customerId = invoice.getCustomer();
        userRepository.findByStripeCustomerId(customerId).ifPresent(user -> {
            user.setSubStatus(SubscriptionStatus.ACTIVE);
            if (invoice.getPeriodEnd() != null) {
                user.setCurrentPeriodEnd(
                        LocalDateTime.ofInstant(
                                Instant.ofEpochSecond(invoice.getPeriodEnd()),
                                ZoneOffset.UTC));
            }
            userRepository.save(user);
        });
    }

    @Transactional
    public void handleSubscriptionCancelled(Subscription subscription) {
        String customerId = subscription.getCustomer();
        userRepository.findByStripeCustomerId(customerId).ifPresent(user -> {
            user.setSubStatus(SubscriptionStatus.CANCELLED);
            userRepository.save(user);
            log.info("Subscription cancelled for user {}", user.getEmail());
        });
    }

    private String ensureStripeCustomer(User user) throws StripeException {
        if (user.getStripeCustomerId() != null) {
            return user.getStripeCustomerId();
        }
        CustomerCreateParams params = CustomerCreateParams.builder()
                .setEmail(user.getEmail())
                .setName(user.getDisplayName())
                .putMetadata("userId", String.valueOf(user.getId()))
                .build();
        Customer customer = Customer.create(params);
        user.setStripeCustomerId(customer.getId());
        userRepository.save(user);
        return customer.getId();
    }
}
