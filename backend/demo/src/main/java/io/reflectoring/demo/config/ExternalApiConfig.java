package io.reflectoring.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "external.api")
public class ExternalApiConfig {
    private String openWeatherKey;
    private String usgsUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";
    private String nasaEonetUrl = "https://eonet.gsfc.nasa.gov/api/v3/events";
    private String openWeatherUrl = "https://api.openweathermap.org/data/2.5/weather";
    // Coordinates used for One Call API weather alerts (default: central India)
    private String openWeatherLat = "20.5937";
    private String openWeatherLon = "78.9629";
}
