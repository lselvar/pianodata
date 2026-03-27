package com.pianorep.service;

import com.pianorep.entity.SubscriptionStatus;
import com.pianorep.entity.User;
import com.pianorep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    @Value("${app.trial.days}")
    private int trialDays;

    private final UserRepository userRepository;

    @Transactional
    public void refreshStatus(User user) {
        // Admins never expire
        if (isAdmin(user)) return;

        if (user.getSubStatus() != SubscriptionStatus.TRIAL) return;

        // Backfill missing trial start date (e.g. users imported without one)
        if (user.getTrialStartDate() == null) {
            user.setTrialStartDate(LocalDateTime.now(ZoneOffset.UTC));
            userRepository.save(user);
            return;
        }

        LocalDateTime trialEnd = user.getTrialStartDate().plusDays(trialDays);
        if (LocalDateTime.now(ZoneOffset.UTC).isAfter(trialEnd)) {
            user.setSubStatus(SubscriptionStatus.EXPIRED);
            userRepository.save(user);
        }
    }

    public boolean hasAccess(User user) {
        // Admins always have access regardless of subscription status
        if (isAdmin(user)) return true;
        return user.getSubStatus() == SubscriptionStatus.TRIAL
                || user.getSubStatus() == SubscriptionStatus.ACTIVE;
    }

    public int trialDaysRemaining(User user) {
        if (isAdmin(user)) return -1; // sentinel: unlimited
        if (user.getSubStatus() != SubscriptionStatus.TRIAL || user.getTrialStartDate() == null) {
            return 0;
        }
        // Compare dates (not datetimes) so signup day shows full trialDays remaining
        LocalDate trialEnd = user.getTrialStartDate().toLocalDate().plusDays(trialDays);
        long days = ChronoUnit.DAYS.between(LocalDate.now(ZoneOffset.UTC), trialEnd);
        return (int) Math.max(0, days);
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equals(r.getName()));
    }
}
