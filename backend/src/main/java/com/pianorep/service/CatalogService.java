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
import com.pianorep.dto.response.BulkUploadResult;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVRecord;
import org.springframework.dao.DataIntegrityViolationException;

import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

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
            String q, String composer, String catalogName, String era,
            List<String> levels, List<String> levelSecundos, List<Integer> ratings,
            String keyName, String timeSignature, String mood, String movement,
            String type, String etude, String tempoSpeed, List<String> soloDuets,
            int page, int size, String sort, String direction) {

        size = Math.min(size, 100);
        Sort.Direction dir = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        Specification<Catalog> spec = buildSpec(q, composer, catalogName, era, levels,
                levelSecundos, ratings, keyName, timeSignature, mood, movement, type, etude, tempoSpeed, soloDuets);
        Page<Catalog> result = catalogRepository.findAll(spec, pageable);
        Page<CatalogItemDto> dtoPage = result.map(CatalogItemDto::from);

        return PageResponse.from(dtoPage);
    }

    private Specification<Catalog> buildSpec(String q, String composer, String catalogName,
                                              String era, List<String> levels, List<String> levelSecundos,
                                              List<Integer> ratings, String keyName, String timeSignature,
                                              String mood, String movement, String type, String etude,
                                              String tempoSpeed, List<String> soloDuets) {
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
            if (StringUtils.hasText(catalogName))
                predicates.add(cb.like(cb.lower(root.get("catalogName")), "%" + catalogName.toLowerCase() + "%"));
            if (StringUtils.hasText(era))
                predicates.add(cb.equal(root.get("era"), era));
            if (levels != null && !levels.isEmpty())
                predicates.add(root.get("level").in(levels));
            if (levelSecundos != null && !levelSecundos.isEmpty())
                predicates.add(root.get("levelSecundo").in(levelSecundos));
            if (ratings != null && !ratings.isEmpty())
                predicates.add(root.get("rating").in(ratings));
            if (StringUtils.hasText(keyName))
                predicates.add(cb.equal(root.get("keyName"), keyName));
            if (StringUtils.hasText(timeSignature))
                predicates.add(cb.like(root.get("timeSignature"), "%" + timeSignature + "%"));
            if (StringUtils.hasText(mood))
                predicates.add(cb.like(root.get("mood"), "%" + mood + "%"));
            if (StringUtils.hasText(movement))
                predicates.add(cb.like(cb.lower(root.get("movement")), "%" + movement.toLowerCase() + "%"));
            if (StringUtils.hasText(type))
                predicates.add(cb.like(root.get("type"), "%" + type + "%"));
            if (StringUtils.hasText(etude))
                predicates.add(cb.like(cb.lower(root.get("etude")), "%" + etude.toLowerCase() + "%"));
            if (StringUtils.hasText(tempoSpeed))
                predicates.add(cb.equal(root.get("tempoSpeed"), tempoSpeed));
            if (soloDuets != null && !soloDuets.isEmpty())
                predicates.add(root.get("soloDuet").in(soloDuets));

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
                .levelSecundos(catalogRepository.findDistinctLevelSecundos())
                .ratings(catalogRepository.findDistinctRatings())
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
        c.setOriginalSource(req.getOriginalSource());
        if (req.getCatalogName()       != null) c.setCatalogName(req.getCatalogName());
        if (req.getMovement()      != null) c.setMovement(req.getMovement());
        if (req.getEra()           != null) c.setEra(req.getEra());
        if (req.getKeyName()       != null) c.setKeyName(req.getKeyName());
        if (req.getTimeSignature() != null) c.setTimeSignature(req.getTimeSignature());
        if (req.getTempo()         != null) c.setTempo(req.getTempo());
        if (req.getTempoSpeed()    != null) c.setTempoSpeed(req.getTempoSpeed());
        if (req.getLevel()         != null) c.setLevel(req.getLevel());
        c.setLevelSecundo(req.getLevelSecundo());
        if (req.getRating()        != null) c.setRating(req.getRating());
        if (req.getMood()          != null) c.setMood(req.getMood());
        if (req.getType()          != null) c.setType(req.getType());
        if (req.getEtude()         != null) c.setEtude(req.getEtude());
        c.setSoloDuet(req.getSoloDuet());
        if (req.getBook()          != null) c.setBook(req.getBook());
        if (req.getPermissionStatus() != null) c.setPermissionStatus(req.getPermissionStatus());
        if (req.getBookLink1()     != null) c.setBookLink1(req.getBookLink1());
        if (req.getBookLink2()     != null) c.setBookLink2(req.getBookLink2());
        if (req.getBookLink3()     != null) c.setBookLink3(req.getBookLink3());
        if (req.getBookLink4()     != null) c.setBookLink4(req.getBookLink4());
        if (req.getBookLink5()     != null) c.setBookLink5(req.getBookLink5());
        if (req.getBooksByLevel()  != null) c.setBooksByLevel(req.getBooksByLevel());
        if (StringUtils.hasText(req.getIncipit()))        c.setIncipit(req.getIncipit());
        if (StringUtils.hasText(req.getIncipitSecundo())) c.setIncipitSecundo(req.getIncipitSecundo());
    }

    // ── Bulk upload methods ────────────────────────────────────────────────────

    public BulkUploadResult bulkCreateFromCsv(MultipartFile file, String username) throws IOException {
        int created = 0, skipped = 0;
        List<String> errors = new ArrayList<>();

        // Strip UTF-8 BOM if present
        byte[] raw = file.getBytes();
        int start = 0;
        if (raw.length >= 3 && raw[0] == (byte) 0xEF && raw[1] == (byte) 0xBB && raw[2] == (byte) 0xBF)
            start = 3;
        String content = new String(raw, start, raw.length - start, StandardCharsets.UTF_8);

        CSVFormat fmt = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(true)
                .setTrim(true)
                .setIgnoreEmptyLines(true)
                .build();

        int rowNum = 1;
        try (Reader reader = new StringReader(content)) {
            for (CSVRecord rec : fmt.parse(reader)) {
                rowNum++;
                String title    = csvGet(rec, "TITLE");
                String composer = csvGet(rec, "COMPOSER");
                String catalog  = csvGet(rec, "CATALOG");

                if (title.isEmpty()) { skipped++; continue; }
                if (composer.isEmpty() || catalog.isEmpty()) {
                    errors.add("Row " + rowNum + ": missing COMPOSER or CATALOG — skipped");
                    skipped++;
                    continue;
                }

                try {
                    Catalog c = new Catalog();
                    c.setTitle(title);
                    c.setMovement(csvGet(rec, "MOVEMENT"));
                    c.setComposer(composer);
                    c.setOriginalSource(csvGet(rec, "ORIGINAL SOURCE"));
                    c.setCatalogName(catalog);
                    c.setEra(csvGet(rec, "ERA B, C, R, M"));
                    c.setKeyName(csvGet(rec, "KEY"));
                    c.setTimeSignature(csvGet(rec, "TIME SIGNATURE"));
                    c.setTempo(csvGet(rec, "TEMPO"));
                    c.setTempoSpeed(csvGet(rec, "TEMPO FAST, MED, SLOW"));
                    c.setLevel(csvGet(rec, "LEVEL"));
                    c.setLevelSecundo(csvGet(rec, "LEVEL SECONDO"));
                    String ratingStr = csvGet(rec, "RATING");
                    if (!ratingStr.isEmpty()) {
                        try { c.setRating(Integer.parseInt(ratingStr)); } catch (NumberFormatException ignored) {}
                    }
                    c.setMood(csvGet(rec, "MOOD"));
                    c.setType(csvGet(rec, "TYPE"));
                    c.setEtude(csvGet(rec, "ETUDE"));
                    c.setSoloDuet(csvGet(rec, "SOLO DUET"));
                    c.setBook(csvGet(rec, "BOOK"));
                    String incipitVal = csvGet(rec, "INCIPIT");
                    if (!incipitVal.isEmpty()) c.setIncipit(incipitVal);
                    String incipitSecVal = csvGet(rec, "INCIPIT SECONDO");
                    if (!incipitSecVal.isEmpty()) c.setIncipitSecundo(incipitSecVal);
                    c.setPermissionStatus(csvGet(rec, "PERMISSION STATUS"));
                    c.setBookLink1(csvGet(rec, "BOOK 1"));
                    c.setBookLink2(csvGet(rec, "BOOK 2"));
                    c.setBookLink3(csvGet(rec, "BOOK 3"));
                    c.setBookLink4(csvGet(rec, "BOOK 4"));
                    c.setBookLink5(csvGet(rec, "BOOK 5"));
                    c.setBooksByLevel(csvGet(rec, "BOOKS BY LEVEL"));
                    c.setCreateDateTime(LocalDateTime.now(ZoneOffset.UTC));
                    c.setCreateUserName(username);
                    catalogRepository.save(c);
                    created++;
                } catch (DataIntegrityViolationException e) {
                    skipped++; // duplicate — unique constraint violated
                } catch (Exception e) {
                    errors.add("Row " + rowNum + ": " + e.getMessage());
                }
            }
        }

        return BulkUploadResult.builder()
                .created(created).skipped(skipped).imagesStored(0).errors(errors).build();
    }

    public BulkUploadResult bulkStoreImages(MultipartFile zipFile, String imagesBasePath) throws IOException {
        int stored = 0;
        List<String> errors = new ArrayList<>();
        Path destDir = Paths.get(imagesBasePath);
        Files.createDirectories(destDir);

        try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    String name = Paths.get(entry.getName()).getFileName().toString();
                    if (name.toLowerCase().endsWith(".png")) {
                        try {
                            Files.write(destDir.resolve(name), zis.readAllBytes());
                            stored++;
                        } catch (Exception e) {
                            errors.add(name + ": " + e.getMessage());
                        }
                    }
                }
                zis.closeEntry();
            }
        }

        return BulkUploadResult.builder()
                .imagesStored(stored).created(0).skipped(0).errors(errors).build();
    }

    private String csvGet(CSVRecord rec, String header) {
        try {
            String v = rec.get(header);
            return v == null ? "" : v;
        } catch (IllegalArgumentException e) {
            return "";
        }
    }
}
