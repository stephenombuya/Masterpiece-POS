package com.pos.desktop.util;

import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.stage.Stage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Centralised FXML scene switching.
 * Caches loaded scenes to avoid re-loading FXML on every navigation.
 */
public class ViewManager {

    private static final Logger log = LoggerFactory.getLogger(ViewManager.class);
    private static Stage primaryStage;
    private static final Map<String, Parent> viewCache = new HashMap<>();

    public static void init(Stage stage) {
        primaryStage = stage;
    }

    public static void navigate(String viewName) {
        try {
            Parent root = viewCache.computeIfAbsent(viewName, k -> {
                try {
                    FXMLLoader loader = new FXMLLoader(
                        ViewManager.class.getResource("/fxml/" + k + ".fxml")
                    );
                    return loader.load();
                } catch (IOException e) {
                    throw new RuntimeException("Cannot load view: " + k, e);
                }
            });

            Scene scene = primaryStage.getScene();
            if (scene == null) {
                scene = new Scene(root);
                scene.getStylesheets().add(
                    ViewManager.class.getResource("/css/style.css").toExternalForm()
                );
                primaryStage.setScene(scene);
            } else {
                scene.setRoot(root);
            }

            log.debug("Navigated to view: {}", viewName);
        } catch (Exception e) {
            log.error("Navigation failed for: {}", viewName, e);
            AlertUtil.error("Navigation Error", "Cannot load view: " + viewName);
        }
    }

    /** Clear cache and force re-load (useful after data changes). */
    public static void invalidateCache(String viewName) {
        viewCache.remove(viewName);
    }

    public static Stage getPrimaryStage() { return primaryStage; }
}


// ============================================================
// CurrencyUtil.java
// ============================================================
package com.pos.desktop.util;

import java.text.NumberFormat;
import java.util.Locale;

public class CurrencyUtil {

    private static final NumberFormat KES_FMT;

    static {
        KES_FMT = NumberFormat.getCurrencyInstance(new Locale("en", "KE"));
    }

    public static String format(double amount) {
        return KES_FMT.format(amount);
    }

    public static String format(Double amount) {
        return amount == null ? "KES 0.00" : format(amount.doubleValue());
    }
}


// ============================================================
// AlertUtil.java
// ============================================================
package com.pos.desktop.util;

import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;

import java.util.Optional;

public class AlertUtil {

    public static void info(String title, String message) {
        show(Alert.AlertType.INFORMATION, title, message);
    }

    public static void warn(String title, String message) {
        show(Alert.AlertType.WARNING, title, message);
    }

    public static void error(String title, String message) {
        show(Alert.AlertType.ERROR, title, message);
    }

    public static boolean confirm(String title, String message) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION, message, ButtonType.YES, ButtonType.NO);
        alert.setTitle(title);
        alert.setHeaderText(null);
        Optional<ButtonType> result = alert.showAndWait();
        return result.isPresent() && result.get() == ButtonType.YES;
    }

    private static void show(Alert.AlertType type, String title, String message) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(message);
        alert.showAndWait();
    }
}
