package com.pianorep.controller;

import com.pianorep.dto.response.CatalogItemDto;
import com.pianorep.dto.response.FilterOptionsDto;
import com.pianorep.dto.response.PageResponse;
import com.pianorep.entity.User;
import com.pianorep.exception.SubscriptionRequiredException;
import com.pianorep.repository.UserRepository;
import com.pianorep.security.UserPrincipal;
import com.pianorep.service.CatalogService;
import com.pianorep.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;
    private final SubscriptionService subscriptionService;
    private final UserRepository userRepository;

    @Value("${app.incipit.images-path}")
    private String imagesBasePath;

    @GetMapping("/search")
    public ResponseEntity<PageResponse<CatalogItemDto>> search(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String composer,
            @RequestParam(required = false) String catalogName,
            @RequestParam(required = false) String era,
            @RequestParam(required = false) List<String> levels,
            @RequestParam(required = false) List<String> levelSecundos,
            @RequestParam(required = false) List<Integer> ratings,
            @RequestParam(required = false) String keyName,
            @RequestParam(required = false) String timeSignature,
            @RequestParam(required = false) String mood,
            @RequestParam(required = false) String movement,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String etude,
            @RequestParam(required = false) String tempoSpeed,
            @RequestParam(required = false) List<String> soloDuets,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(defaultValue = "composer") String sort,
            @RequestParam(defaultValue = "asc") String direction) {

        checkSubscription(principal);

        PageResponse<CatalogItemDto> result = catalogService.search(
                q, composer, catalogName, era, levels, levelSecundos, ratings,
                keyName, timeSignature, mood, movement, type, etude, tempoSpeed, soloDuets,
                page, size, sort, direction);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CatalogItemDto> getById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        checkSubscription(principal);
        return ResponseEntity.ok(catalogService.getById(id));
    }

    @GetMapping("/incipit/{code}")
    public ResponseEntity<Resource> getIncipitImage(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable String code) {
        checkSubscription(principal);

        // Whitelist: only alphanumeric uppercase to prevent path traversal
        if (!code.matches("[a-zA-Z0-9]{2,10}")) {
            return ResponseEntity.badRequest().build();
        }

        java.nio.file.Path imagePath = Paths.get(imagesBasePath, code + ".png");
        Resource resource = new FileSystemResource(imagePath);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .cacheControl(CacheControl.maxAge(7, TimeUnit.DAYS))
                .body(resource);
    }

    @GetMapping("/filter-options")
    public ResponseEntity<FilterOptionsDto> getFilterOptions() {
        return ResponseEntity.ok(catalogService.getFilterOptions());
    }

    private void checkSubscription(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        subscriptionService.refreshStatus(user);
        if (!subscriptionService.hasAccess(user)) {
            throw new SubscriptionRequiredException(
                    "Your trial has expired. Please subscribe to continue.");
        }
    }
}
