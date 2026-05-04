package com.pianorep.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class FilterOptionsDto {
    private List<String> composers;
    private List<String> eras;
    private Map<String, String> eraLabels;
    private List<String> keys;
    private List<String> tempoSpeeds;
    private List<String> levels;
    private List<String> levelSecundos;
    private List<Integer> ratings;
    private List<String> moods;
    private List<String> types;
    private List<String> etudes;
}
