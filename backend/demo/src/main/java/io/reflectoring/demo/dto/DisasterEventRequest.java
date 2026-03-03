package io.reflectoring.demo.dto;

import lombok.Data;

@Data
public class DisasterEventRequest {
    private String title;
    private String message;
    private String region;
}
