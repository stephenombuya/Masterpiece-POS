package com.pos.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "pos")
@Getter @Setter
public class AppProperties {

    private Store store = new Store();
    private Tax tax = new Tax();
    private Receipts receipts = new Receipts();

    @Getter @Setter
    public static class Store {
        private String name = "RetailPOS Store";
        private String address = "Nairobi, Kenya";
        private String phone = "+254 700 000 000";
    }

    @Getter @Setter
    public static class Tax {
        private double rate = 0.16;
    }

    @Getter @Setter
    public static class Receipts {
        private String dir = "receipts";
    }
}
