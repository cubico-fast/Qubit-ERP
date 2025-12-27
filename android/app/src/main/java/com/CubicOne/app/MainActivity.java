package com.CubicOne.app;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configurar WebView después de que se cree
        this.getBridge().getWebView().post(() -> {
            WebView webView = this.getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            
            // Habilitar zoom y gestos táctiles
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            
            // Mejorar rendimiento táctil
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            
            // Habilitar hardware acceleration para mejor rendimiento
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
            
            // Configurar viewport para mejor responsive
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(true);
            
            // Permitir que el contenido se ajuste a la pantalla
            settings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        });
    }
}
