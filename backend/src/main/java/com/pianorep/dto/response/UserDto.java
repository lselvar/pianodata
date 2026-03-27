package com.pianorep.dto.response;

import com.pianorep.entity.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserDto {
    private Long id;
    private String email;
    private String displayName;
    private String avatarUrl;
    private SubscriptionStatus subscriptionStatus;
    private Integer trialDaysRemaining;
    private String currentPeriodEnd;
    private List<String> roles;
}
