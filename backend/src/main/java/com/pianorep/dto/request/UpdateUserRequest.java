package com.pianorep.dto.request;

import com.pianorep.entity.SubscriptionStatus;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private SubscriptionStatus subscriptionStatus;
    private Boolean admin;
}
