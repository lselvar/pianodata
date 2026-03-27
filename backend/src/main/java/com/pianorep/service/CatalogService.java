package com.pianorep.service;

import com.pianorep.dto.request.CatalogRequest;
import com.pianorep.dto.response.CatalogItemDto;
import com.pianorep.dto.response.FilterOptionsDto;
import com.pianorep.dto.response.PageResponse;
import com.pianorep.entity.Catalog;
import com.pianorep.repository.CatalogRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final CatalogRepository catalogRepository;

    private static final Map<String, String> ERA_LABELS = Map.of(
            "B", "Baroque",
            "C", "Classical",
            "R", "Romantic",
            "M", "Modern",
            "CO", "Contemporary"
    );

    public PageResponse<CatalogItemDto> search(
            String q, String composer, String era, String keyName,
            String mood, String type, String tempoSpeed, List<String> levels,
            int page, int size, String sort, String direction) {

        size = Math.min(size, 100);
        Sort.Direction dir = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        Specification<Catalog> spec = buildSpec(q, composer, era, keyName, mood, type, tempoSpeed, levels);
        Page<Catalog> result = catalogRepository.findAll(spec, pageable);
        Page<CatalogItemDto> dtoPage = result.map(CatalogItemDto::from);

        return PageResponse.from(dtoPage);
    }

    private Specification<Catalog> buildSpec(String q, String composer, String era,
                                              String keyName, String mood, String type,
                                              String tempoSpeed, List<String> levels) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (StringUtils.hasText(q)) {
                String like = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("composer")), like),
                        cb.like(cb.lower(root.get("catalogName")), like)
                ));
            }
            if (StringUtils.hasText(composer))
                predicates.add(cb.equal(root.get("composer"), composer));
            if (StringUtils.hasText(era))
                predicates.add(cb.equal(root.get("era"), era));
            if (StringUtils.hasText(keyName))
                predicates.add(cb.equal(root.get("keyName"), keyName));
            if (StringUtils.hasText(mood))
                predicates.add(cb.like(root.get("mood"), "%" + mood + "%"));
            if (StringUtils.hasText(type))
                predicates.add(cb.like(root.get("type"), "%" + type + "%"));
            if (StringUtils.hasText(tempoSpeed))
                predicates.add(cb.equal(root.get("tempoSpeed"), tempoSpeed));
            if (levels != null && !levels.isEmpty())
                predicates.add(root.get("level").in(levels));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public CatalogItemDto getById(Integer id) {
        return catalogRepository.findById(id)
                .map(CatalogItemDto::from)
                .orElseThrow(() -> new RuntimeException("Catalog item not found: " + id));
    }

    public FilterOptionsDto getFilterOptions() {
        return FilterOptionsDto.builder()
                .composers(catalogRepository.findDistinctComposers())
                .eras(catalogRepository.findDistinctEras())
                .eraLabels(ERA_LABELS)
                .keys(catalogRepository.findDistinctKeys())
                .tempoSpeeds(catalogRepository.findDistinctTempoSpeeds())
                .levels(catalogRepository.findDistinctLevels())
                .build();
    }

    // ── Admin methods ──────────────────────────────────────────────────────────

    @Transactional
    public CatalogItemDto create(CatalogRequest req, String username) {
        Catalog c = new Catalog();
        applyRequest(c, req);
        c.setCreateDateTime(LocalDateTime.now(ZoneOffset.UTC));
        c.setCreateUserName(username);
        return CatalogItemDto.from(catalogRepository.save(c));
    }

    @Transactional
    public CatalogItemDto update(Integer id, CatalogRequest req, String username) {
        Catalog c = catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catalog item not found: " + id));
        applyRequest(c, req);
        c.setUpdateDateTime(LocalDateTime.now(ZoneOffset.UTC));
        c.setUpdateUserName(username);
        return CatalogItemDto.from(catalogRepository.save(c));
    }

    @Transactional
    public void delete(Integer id) {
        if (!catalogRepository.existsById(id))
            throw new RuntimeException("Catalog item not found: " + id);
        catalogRepository.deleteById(id);
    }

    @Transactional
    public CatalogItemDto saveIncipitImage(Integer id, MultipartFile file, String imagesBasePath) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("File is empty");
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equals("image/png"))
            throw new IllegalArgumentException("Only PNG images are accepted");

        Catalog c = catalogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catalog item not found: " + id));

        String code = "i" + id;
        Path dest = Paths.get(imagesBasePath, code + ".png");
        Files.createDirectories(dest.getParent());
        Files.write(dest, file.getBytes());

        c.setIncipit(code);
        return CatalogItemDto.from(catalogRepository.save(c));
    }

    private void applyRequest(Catalog c, CatalogRequest req) {
        if (req.getTitle()             != null) c.setTitle(req.getTitle());
        if (req.getComposer()          != null) c.setComposer(req.getComposer());
        c.setCompArrangedFrom(req.getCompArrangedFrom());
        if (req.getCatalogName()       != null) c.setCatalogName(req.getCatalogName());
        if (req.getMovement()      != null) c.setMovement(req.getMovement());
        if (req.getEra()           != null) c.setEra(req.getEra());
        if (req.getKeyName()       != null) c.setKeyName(req.getKeyName());
        if (req.getTimeSignature() != null) c.setTimeSignature(req.getTimeSignature());
        if (req.getTempo()         != null) c.setTempo(req.getTempo());
        if (req.getTempoSpeed()    != null) c.setTempoSpeed(req.getTempoSpeed());
        if (req.getLevel()         != null) c.setLevel(req.getLevel());
        if (req.getRating()        != null) c.setRating(req.getRating());
        if (req.getMood()          != null) c.setMood(req.getMood());
        if (req.getType()          != null) c.setType(req.getType());
        if (req.getEtude()         != null) c.setEtude(req.getEtude());
        if (req.getBook()          != null) c.setBook(req.getBook());
        if (req.getPermissionStatus() != null) c.setPermissionStatus(req.getPermissionStatus());
        if (req.getBookLink1()     != null) c.setBookLink1(req.getBookLink1());
        if (req.getBookLink2()     != null) c.setBookLink2(req.getBookLink2());
        if (req.getBookLink3()     != null) c.setBookLink3(req.getBookLink3());
        if (req.getBookLink4()     != null) c.setBookLink4(req.getBookLink4());
        if (req.getBookLink5()     != null) c.setBookLink5(req.getBookLink5());
        if (req.getBooksByLevel()  != null) c.setBooksByLevel(req.getBooksByLevel());
    }
}
