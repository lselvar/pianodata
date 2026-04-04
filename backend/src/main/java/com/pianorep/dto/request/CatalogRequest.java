package com.pianorep.dto.request;

import lombok.Data;

@Data
public class CatalogRequest {
    // Required
    private String title;
    private String composer;
    private String originalSource;
    private String catalogName;

    // Optional
    private String movement;
    private String era;
    private String keyName;
    private String timeSignature;
    private String tempo;
    private String tempoSpeed;
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
}
