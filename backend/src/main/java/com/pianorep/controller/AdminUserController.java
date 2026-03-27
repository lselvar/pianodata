package com.pianorep.controller;

import com.pianorep.dto.request.UpdateUserRequest;
import com.pianorep.dto.response.PageResponse;
import com.pianorep.dto.response.UserSummaryDto;
import com.pianorep.entity.Role;
import com.pianorep.entity.User;
import com.pianorep.repository.RoleRepository;
import com.pianorep.repository.UserRepository;
import com.pianorep.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ROLE_ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<PageResponse<UserSummaryDto>> list(
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {

        size = Math.min(size, 100);
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "lastLoginAt"));

        Specification<User> spec = (root, query, cb) -> {
            if (!StringUtils.hasText(q)) return cb.conjunction();
            String like = "%" + q.toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("email")), like),
                    cb.like(cb.lower(root.get("displayName")), like)
            );
        };

        Page<UserSummaryDto> result = userRepository.findAll(spec, pageable)
                .map(u -> UserSummaryDto.from(u, subscriptionService.trialDaysRemaining(u)));

        return ResponseEntity.ok(PageResponse.from(result));
    }

    @Transactional
    @PutMapping("/{id}")
    public ResponseEntity<UserSummaryDto> update(@PathVariable Long id,
                                                 @RequestBody UpdateUserRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (req.getSubscriptionStatus() != null) {
            user.setSubStatus(req.getSubscriptionStatus());
        }

        if (req.getAdmin() != null) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                    .orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found"));
            if (req.getAdmin()) {
                user.getRoles().add(adminRole);
            } else {
                user.getRoles().removeIf(r -> "ROLE_ADMIN".equals(r.getName()));
            }
        }

        userRepository.save(user);
        return ResponseEntity.ok(UserSummaryDto.from(user, subscriptionService.trialDaysRemaining(user)));
    }
}
