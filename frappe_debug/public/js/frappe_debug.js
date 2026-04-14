

(function () {
    let debugEnabled = false;
    let showHiddenFields = false;
    let logValueChanges = false;
    let highlightCustomFields = false;

        const STORAGE_KEY = "frappe_debug_settings";

    // ===============================
    // LocalStorage Helpers
    // ===============================
    function loadSettings() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const settings = JSON.parse(saved);
            debugEnabled = settings.debugEnabled ?? false;
            showHiddenFields = settings.showHiddenFields ?? false;
            logValueChanges = settings.logValueChanges ?? false;
            highlightCustomFields = settings.highlightCustomFields ?? false;
        }
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            debugEnabled,
            showHiddenFields,
            logValueChanges,
            highlightCustomFields
        }));
    }


    // ===============================
    // Utility: Apply Styles
    // ===============================
    function applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    // ===============================
    // Utility: Create Checkbox
    // ===============================
    function createCheckboxControl(id, labelText, onChange) {
        const row = document.createElement("label");

        applyStyles(row, {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontWeight: "normal",
            marginBottom: "6px"
        });

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = id;
        const varName = id.replace("toggle-", "").replace(/-/g, "_");
        const settingsMap = {
            "field_debug": debugEnabled,
            "hidden_fields": showHiddenFields,
            "value_log": logValueChanges,
            "custom_highlight": highlightCustomFields
        };
        checkbox.checked = settingsMap[varName] || false;
        checkbox.onchange = (e) => {
            onChange(e);
            saveSettings();
        };

        const span = document.createElement("span");
        span.innerText = labelText;

        row.appendChild(checkbox);
        row.appendChild(span);

        return row;
    }

    // ===============================
    // Field Label Overlay
    // ===============================
    function createFieldLabel(fieldname, fieldtype, targetDoctype) {
    const label = document.createElement("div");
    label.className = "fieldname-label-overlay";
    
    let labelText = `${fieldname} (${fieldtype})`;
    if (targetDoctype) {
        labelText += ` → ${targetDoctype}`;
    }
    label.innerText = labelText;

    applyStyles(label, {
        position: "absolute",
        top: "0px",
        right: "0px",
        background: "rgba(33, 33, 33, 0.95)",
        color: "#fff",
        fontSize: "10px",
        padding: "2px 6px",
        borderRadius: "0 0 0 4px",
        zIndex: "9999",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        pointerEvents: "auto",
        fontFamily: "monospace",
        opacity: "0",
        transition: "opacity 0.1s ease-in-out",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        lineHeight: "1.2"
    });

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "Copy";

    applyStyles(copyBtn, {
        border: "none",
        background: "#4a90e2",
        color: "white",
        cursor: "pointer",
        borderRadius: "2px",
        padding: "1px 4px",
        fontSize: "9px"
    });

    copyBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();

        navigator.clipboard.writeText(fieldname)
            .then(() => {
                copyBtn.innerText = "Done!";
                setTimeout(() => copyBtn.innerText = "Copy", 1000);
            })
            .catch(() => {
                copyBtn.innerText = "Fail";
                setTimeout(() => copyBtn.innerText = "Copy", 1000);
            });
    };

    label.appendChild(copyBtn);
    return label;
}

    // ===============================
    // Attach Label to Field
    // ===============================
    function attachFieldDebugLabel(field, rawFieldname) {
        if (window.getComputedStyle(field).position === "static") {
            field.style.position = "relative";
        }

        const fieldtype = field.getAttribute("data-fieldtype") || "Unknown";
        const label = createFieldLabel(rawFieldname, fieldtype);

        field.appendChild(label);

        field.addEventListener("mouseenter", () => {
            if (!debugEnabled) return;

            label.style.opacity = "1";
            // console.log(`[Hover Debug] ${rawFieldname}`, field);
        });

        field.addEventListener("mouseleave", () => {
            label.style.opacity = "0";
        });
    }

    // ===============================
    // Real-time Value Logger
    // ===============================
    function attachValueLogger(field, fieldname) {
        const input = field.querySelector("input, select, textarea");

        if (!input || input.dataset.loggerAttached) return;

        input.dataset.loggerAttached = "1";

        input.addEventListener("change", () => {
            if (!debugEnabled || !logValueChanges) return;
            console.log(`[Value Changed] ${fieldname}:`, input.value);
        });

        input.addEventListener("input", () => {
            if (!debugEnabled || !logValueChanges) return;
            console.log(`[Typing] ${fieldname}:`, input.value);
        });
    }

    // ===============================
    // Show Hidden Fields
    // ===============================
    function toggleHiddenFields(show) {
        const hiddenFields = document.querySelectorAll(".hide, .hidden");

        hiddenFields.forEach(el => {
            if (show) {
                el.dataset.originalDisplay = el.style.display || "";
                el.style.display = "block";
                el.style.opacity = "0.55";
                el.style.pointerEvents = "none";
            } else {
                el.style.display = el.dataset.originalDisplay || "";
                el.style.opacity = "";
                el.style.pointerEvents = "";
            }
        });
    }

    // ===============================
    // Toggle Custom Field Highlighting
    // ===============================
    function toggleCustomFieldHighlight(show) {
        const customFields = document.querySelectorAll("[data-fieldname]");

        customFields.forEach(el => {
            const fieldname = el.getAttribute("data-fieldname")?.toLowerCase();
            if (fieldname?.startsWith("custom_")) {
                if (show) {
                    el.style.outline = "1px dashed #ff9800";
                    el.style.background = "rgba(255,152,0,0.05)";
                } else {
                    el.style.outline = "";
                    el.style.background = "";
                }
            }
        });
    }

    // ===============================
    // Scan Fields
    // ===============================
    function injectFieldLabels() {
        const fields = document.querySelectorAll("[data-fieldname]:not(.label-injected)");

        fields.forEach(field => {
            const rawFieldname = field.getAttribute("data-fieldname");
            const fieldname = rawFieldname?.toLowerCase();

            const isIgnored =
                !rawFieldname ||
                fieldname.startsWith("__") ||
                fieldname.includes("break") ||
                fieldname.includes("column") ||
                fieldname.includes("section") ||
                fieldname.includes("tab");

            if (isIgnored) return;

            field.classList.add("label-injected");

            // Highlight custom fields (only if enabled)
            if (highlightCustomFields && fieldname.startsWith("custom_")) {
                field.style.outline = "1px dashed #ff9800";
                field.style.background = "rgba(255,152,0,0.05)";
            }

            attachFieldDebugLabel(field, rawFieldname);
            attachValueLogger(field, rawFieldname);
        });
    }

    // ===============================
    // Sidebar Toolbox
    // ===============================
    function setupSidebarToolbox() {
        const sidebar = document.querySelector(".layout-side-section");

        if (!sidebar || document.getElementById("dev-toolbox-section")) return;

        const toolbox = document.createElement("div");
        toolbox.id = "dev-toolbox-section";

        applyStyles(toolbox, {
            marginTop: "20px",
            padding: "10px",
            borderTop: "1px solid #d1d8dd",
            fontSize: "12px"
        });

        const header = document.createElement("div");
        header.innerHTML = "<strong>🪲 DEVELOPER TOOLS</strong>";

        applyStyles(header, {
            marginBottom: "10px",
            color: "#8d99a6"
        });

        toolbox.appendChild(header);

        // Debug Toggle
        toolbox.appendChild(
            createCheckboxControl(
                "toggle-field-debug",
                "Field Debugging",
                (e) => {
                    debugEnabled = e.target.checked;
                    console.log(`[Dev Toolbox] Debug: ${debugEnabled ? "ON" : "OFF"}`);
                }
            )
        );

        // Show Hidden Fields
        toolbox.appendChild(
            createCheckboxControl(
                "toggle-hidden-fields",
                "Show Hidden Fields",
                (e) => {
                    showHiddenFields = e.target.checked;
                    toggleHiddenFields(showHiddenFields);
                }
            )
        );

        // Highlight Custom Fields
        toolbox.appendChild(
            createCheckboxControl(
                "toggle-custom-highlight",
                "Highlight Custom Fields",
                (e) => {
                    highlightCustomFields = e.target.checked;
                    toggleCustomFieldHighlight(highlightCustomFields);
                }
            )
        );

        // Value Logging
        toolbox.appendChild(
            createCheckboxControl(
                "toggle-value-log",
                "Log Value Changes",
                (e) => {
                    logValueChanges = e.target.checked;
                }
            )
        );

        sidebar.appendChild(toolbox);
    }

    // ===============================
    // Init Observer
    // ===============================
    function initObserver() {
        let timeout;

        const observer = new MutationObserver(() => {
            clearTimeout(timeout);

            timeout = setTimeout(() => {
                setupSidebarToolbox();
                injectFieldLabels();

                if (showHiddenFields) {
                    toggleHiddenFields(true);
                }
            }, 100);
        });

        const start = () => {
            loadSettings();
            setupSidebarToolbox();
            injectFieldLabels();
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        };

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", start);
        } else {
            start();
        }
    }

    // ===============================
    // Start
    // ===============================
    initObserver();

})();