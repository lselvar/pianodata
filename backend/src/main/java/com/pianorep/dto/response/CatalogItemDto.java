package com.pianorep.dto.response;

import com.pianorep.entity.Catalog;
import lombok.Data;

import java.util.Map;

@Data
public class CatalogItemDto {

    private static final Map<String, String> ERA_LABELS = Map.of(
            "B", "Baroque",
            "C", "Classical",
            "R", "Romantic",
            "M", "Modern",
            "CO", "Contemporary"
    );

    private static final Map<String, String> TEMPO_LABELS = Map.of(
            "S", "Slow",
            "M", "Medium",
            "F", "Fast"
    );

    private Integer id;
    private String title;
    private String movement;
    private String composer;
    private String originalSource;
    private String catalogName;
    private String era;
    private String eraLabel;
    private String keyName;
    private String timeSignature;
    private String tempo;
    private String tempoSpeed;
    private String tempoSpeedLabel;
    private String level;
    private String levelSecundo;
    private Integer rating;
    private String mood;
    private String type;
    private String etude;
    private String soloDuet;
    private String book;
    private String incipit;
    private String incipitSecundo;
    private String permissionStatus;
    private String bookLink1;
    private String bookLink2;
    private String bookLink3;
    private String bookLink4;
    private String bookLink5;
    private String booksByLevel;

    public static CatalogItemDto from(Catalog c) {
        CatalogItemDto dto = new CatalogItemDto();
        dto.setId(c.getId());
        dto.setTitle(c.getTitle());
        dto.setMovement(c.getMovement());
        dto.setComposer(c.getComposer());
        dto.setOriginalSource(c.getOriginalSource());
        dto.setCatalogName(c.getCatalogName());
        dto.setEra(c.getEra());
        dto.setEraLabel(ERA_LABELS.getOrDefault(c.getEra(), c.getEra()));
        dto.setKeyName(c.getKeyName());
        dto.setTimeSignature(c.getTimeSignature());
        dto.setTempo(c.getTempo());
        dto.setTempoSpeed(c.getTempoSpeed());
        dto.setTempoSpeedLabel(TEMPO_LABELS.getOrDefault(c.getTempoSpeed(), c.getTempoSpeed()));
        dto.setLevel(c.getLevel());
        dto.setLevelSecundo(c.getLevelSecundo());
        dto.setRating(c.getRating());
        dto.setMood(c.getMood());
        dto.setType(c.getType());
        dto.setEtude(c.getEtude());
        dto.setSoloDuet(c.getSoloDuet());
        dto.setBook(c.getBook());
        dto.setIncipit(c.getIncipit());
        dto.setIncipitSecundo(c.getIncipitSecundo());
        dto.setPermissionStatus(c.getPermissionStatus());
        dto.setBookLink1(c.getBookLink1());
        dto.setBookLink2(c.getBookLink2());
        dto.setBookLink3(c.getBookLink3());
        dto.setBookLink4(c.getBookLink4());
        dto.setBookLink5(c.getBookLink5());
        dto.setBooksByLevel(c.getBooksByLevel());
        return dto;
    }
}
