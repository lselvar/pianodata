package com.pianorep.dto.response;

import com.pianorep.entity.SubscriptionStatus;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SubscriptionStatusDto {
    private SubscriptionStatus status;
    private String trialStartDate;
    private Integer trialDaysRemaining;
    private String currentPeriodEnd;
    private String stripeCustomerId;
}
