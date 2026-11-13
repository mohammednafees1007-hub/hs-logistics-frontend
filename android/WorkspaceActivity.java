package com.hslogistics.workspace;

import android.app.Activity;
import android.app.DownloadManager;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.text.InputType;
import android.webkit.CookieManager;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.net.URI;

public class WorkspaceActivity extends Activity {
    private static final int PICK_FILES = 7;
    private WebView web;
    private URI workspace;
    private ValueCallback<Uri[]> fileResult;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        String address = getPreferences(MODE_PRIVATE).getString("workspace", "");
        if (address.isEmpty()) showSetup();
        else openWorkspace(URI.create(address));
    }

    private void showSetup() {
        if (web != null) {
            web.stopLoading();
            web.destroy();
            web = null;
        }
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        int padding = Math.round(24 * getResources().getDisplayMetrics().density);
        applyInsets(form, padding);
        TextView title = new TextView(this);
        title.setText("HS Logistics");
        title.setTextSize(26);
        form.addView(title);
        EditText address = new EditText(this);
        address.setHint("Private HTTPS workspace link");
        address.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        address.setSingleLine(true);
        form.addView(address);
        Button connect = new Button(this);
        connect.setText("Open workspace");
        connect.setOnClickListener(view -> {
            URI parsed = parseAddress(address.getText().toString().trim());
            if (parsed == null) {
                address.setError("Enter the workspace link starting with https://");
                return;
            }
            getPreferences(MODE_PRIVATE).edit().putString("workspace", parsed.toString()).apply();
            openWorkspace(parsed);
        });
        form.addView(connect);
        setContentView(form);
    }

    private URI parseAddress(String value) {
        try {
            URI uri = URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null
                || uri.getRawUserInfo() != null || uri.getRawQuery() != null
                || uri.getRawFragment() != null) return null;
            if (uri.getRawPath() != null && !uri.getRawPath().isEmpty()
                && !"/".equals(uri.getRawPath())) return null;
            return uri;
        } catch (IllegalArgumentException error) {
            return null;
        }
    }

    private boolean inWorkspace(Uri uri) {
        int port = uri.getPort() == -1 ? 443 : uri.getPort();
        int workspacePort = workspace.getPort() == -1 ? 443 : workspace.getPort();
        return "https".equalsIgnoreCase(uri.getScheme())
            && workspace.getHost().equalsIgnoreCase(uri.getHost()) && port == workspacePort;
    }

    private void openWorkspace(URI address) {
        workspace = address;
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        applyInsets(layout, 0);
        Button settings = new Button(this);
        settings.setText("HS Logistics  ·  Change workspace");
        settings.setPadding(32, 24, 32, 24);
        settings.setOnClickListener(view -> showSetup());
        layout.addView(settings);
        web = new WebView(this);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !inWorkspace(request.getUrl());
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams options) {
                if (fileResult != null) fileResult.onReceiveValue(null);
                fileResult = callback;
                try {
                    startActivityForResult(options.createIntent(), PICK_FILES);
                    return true;
                } catch (android.content.ActivityNotFoundException error) {
                    fileResult.onReceiveValue(null);
                    fileResult = null;
                    return true;
                }
            }
        });
        web.setDownloadListener((url, agent, disposition, type, length) -> {
            Uri uri = Uri.parse(url);
            if (!inWorkspace(uri)) return;
            String filename = URLUtil.guessFileName(url, disposition, type);
            DownloadManager.Request download = new DownloadManager.Request(uri);
            String cookies = CookieManager.getInstance().getCookie(url);
            if (cookies != null) download.addRequestHeader("Cookie", cookies);
            download.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, filename);
            download.setTitle(filename);
            download.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            try {
                getSystemService(DownloadManager.class).enqueue(download);
                Toast.makeText(this, "Downloading original", Toast.LENGTH_SHORT).show();
            } catch (RuntimeException error) {
                Toast.makeText(this, "Could not start download", Toast.LENGTH_SHORT).show();
            }
        });
        layout.addView(web, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(layout);
        web.loadUrl(address.toString());
    }

    private void applyInsets(LinearLayout layout, int padding) {
        layout.setPadding(padding, padding, padding, padding);
        if (Build.VERSION.SDK_INT >= 30) {
            layout.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(android.view.WindowInsets.Type.systemBars());
                view.setPadding(padding + bars.left, padding + bars.top,
                    padding + bars.right, padding + bars.bottom);
                return insets;
            });
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_FILES && fileResult != null) {
            fileResult.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileResult = null;
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
