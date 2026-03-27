package com.pianorep.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "catalog")
public class Catalog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "movement", nullable = false, length = 10)
    private String movement;

    @Column(name = "composer", nullable = false, length = 100)
    private String composer;

    @Column(name = "comp_arranged_from", length = 100)
    private String compArrangedFrom;

    @Column(name = "catalogName", nullable = false, length = 150)
    private String catalogName;

    @Column(name = "era", length = 2)
    private String era;

    @Column(name = "keyName", length = 20)
    private String keyName;

    @Column(name = "timeSignature", length = 10)
    private String timeSignature;

    @Column(name = "tempo", length = 200)
    private String tempo;

    @Column(name = "tempoSpeed", length = 1)
    private String tempoSpeed;

    @Column(name = "level", length = 200)
    private String level;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "mood", length = 200)
    private String mood;

    @Column(name = "type", length = 200)
    private String type;

    @Column(name = "etude", length = 200)
    private String etude;

    @Column(name = "book", length = 200)
    private String book;

    @Column(name = "incipit", nullable = true, length = 10)
    private String incipit;

    @Column(name = "permissionStatus", length = 200)
    private String permissionStatus;

    @Column(name = "bookLink1", length = 200)
    private String bookLink1;

    @Column(name = "bookLink2", length = 200)
    private String bookLink2;

    @Column(name = "bookLink3", length = 200)
    private String bookLink3;

    @Column(name = "bookLink4", length = 200)
    private String bookLink4;

    @Column(name = "bookLink5", length = 200)
    private String bookLink5;

    @Column(name = "booksByLevel", length = 200)
    private String booksByLevel;

    @Column(name = "createDateTime")
    private LocalDateTime createDateTime;

    @Column(name = "createUserName", length = 255)
    private String createUserName;

    @Column(name = "updateDateTime")
    private LocalDateTime updateDateTime;

    @Column(name = "updateUserName", length = 255)
    private String updateUserName;
}
