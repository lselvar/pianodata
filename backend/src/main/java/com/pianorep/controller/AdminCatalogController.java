package com.pianorep.controller;

import com.pianorep.dto.request.CatalogRequest;
import com.pianorep.dto.response.BulkUploadResult;
import com.pianorep.dto.response.CatalogItemDto;
import com.pianorep.security.UserPrincipal;
import com.pianorep.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/admin/catalog")
@PreAuthorize("hasRole('ROLE_ADMIN')")
@RequiredArgsConstructor
public class AdminCatalogController {

    private final CatalogService catalogService;

    @Value("${app.incipit.images-path}")
    private String imagesBasePath;

    @PostMapping
    public ResponseEntity<CatalogItemDto> create(
            @RequestBody CatalogRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(catalogService.create(req, principal.getEmail()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CatalogItemDto> update(
            @PathVariable Integer id,
            @RequestBody CatalogRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(catalogService.update(id, req, principal.getEmail()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        catalogService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/incipit")
    public ResponseEntity<CatalogItemDto> uploadIncipit(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(catalogService.saveIncipitImage(id, file, imagesBasePath));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/incipit-secondo")
    public ResponseEntity<CatalogItemDto> uploadIncipitSecundo(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(catalogService.saveIncipitSecundoImage(id, file, imagesBasePath));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/bulk/csv")
    public ResponseEntity<BulkUploadResult> bulkUploadCsv(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        try {
            return ResponseEntity.ok(catalogService.bulkCreateFromCsv(file, principal.getEmail()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/bulk/images")
    public ResponseEntity<BulkUploadResult> bulkUploadImages(
            @RequestParam("file") MultipartFile file) {
        try {
            return ResponseEntity.ok(catalogService.bulkStoreImages(file, imagesBasePath));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
