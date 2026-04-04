package com.pianorep.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BulkUploadResult {
    private int created;
    private int skipped;
    private int imagesStored;
    private List<String> errors;
}
