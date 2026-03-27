package com.pianorep.dto.response;

import com.pianorep.entity.SubscriptionStatus;
import com.pianorep.entity.User;
import lombok.Data;

import java.util.List;

@Data
public class UserSummaryDto {
    private Long id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private SubscriptionStatus subscriptionStatus;
    private Integer trialDaysRemaining;
    private String currentPeriodEnd;
    private String lastLoginAt;
    private String trialStartDate;
    private List<String> roles;
    private boolean admin;

    public static UserSummaryDto from(User user, int trialDaysRemaining) {
        UserSummaryDto dto = new UserSummaryDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setSubscriptionStatus(user.getSubStatus());
        dto.setTrialDaysRemaining(trialDaysRemaining);
        dto.setCurrentPeriodEnd(user.getCurrentPeriodEnd() != null
                ? user.getCurrentPeriodEnd().toString() : null);
        dto.setLastLoginAt(user.getLastLoginAt() != null
                ? user.getLastLoginAt().toString() : null);
        dto.setTrialStartDate(user.getTrialStartDate() != null
                ? user.getTrialStartDate().toString() : null);
        List<String> roleNames = user.getRoles().stream()
                .map(r -> r.getName()).toList();
        dto.setRoles(roleNames);
        dto.setAdmin(roleNames.contains("ROLE_ADMIN"));
        return dto;
    }
}
