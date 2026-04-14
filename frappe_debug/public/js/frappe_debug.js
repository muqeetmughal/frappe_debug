(function () {
    /**
     * FRAPPE POWER DEBUGGER
     * Optimized for Infintrix Technologies internal leverage.
     * Fix: Z-Index and Child Table Clipping.
     */

    const STORAGE_KEY = "infintrix_frappe_debug_settings";
    
    let settings = {
        debugEnabled: false,
        showHiddenFields: false,
        logValueChanges: false,
        highlightCustomFields: false,
    };

    // ===============================
    // CSS Injection
    // ===============================
    const injectStyles = () => {
        if (document.getElementById("infintrix-debug-styles")) return;
        const style = document.createElement("style");
        style.id = "infintrix-debug-styles";
        style.innerHTML = `
            /* Overlay Labels - High Z-Index for Child Tables */
            .fieldname-label-overlay {
                position: absolute;
                top: -14px; /* Slightly lower to avoid header overlap */
                left: 2px;
                background: #1f2937;
                color: #60a5fa;
                font-family: 'Monaco', 'Consolas', monospace;
                font-size: 9px;
                font-weight: bold;
                padding: 1px 4px;
                border-radius: 3px;
                z-index: 999999 !important; /* Nuclear option */
                pointer-events: auto;
                display: none;
                white-space: nowrap;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                border: 1px solid #3b82f6;
                line-height: 1;
            }
            
            /* Ensure child table cells don't clip the label */
            .grid-body .grid-row .data-column,
            .grid-body .grid-row td[data-fieldname],
            [data-fieldname] {
                overflow: visible !important;
            }

            [data-fieldname]:hover > .fieldname-label-overlay {
                display: flex !important;
                align-items: center;
                gap: 4px;
            }
            
            /* Hidden Field Highlighting */
            body.show-hidden-fields .hide, 
            body.show-hidden-fields .hidden,
            body.show-hidden-fields [style*="display: none"] {
                display: block !important;
                opacity: 0.5 !important;
                border: 1px dashed #ef4444 !important;
                pointer-events: auto !important;
                min-height: 20px;
                min-width: 50px;
            }

            /* Custom Field Highlighting */
            body.highlight-custom [data-fieldname^="custom_"] {
                outline: 2px dashed #f59e0b !important;
                background-color: rgba(245, 158, 11, 0.05) !important;
            }

            /* Toolbox Styling */
            #dev-toolbox-section {
                background: #ffffff;
                border-radius: 8px;
                border: 1px solid #d1d8dd;
                margin: 15px 0;
                padding: 12px;
                box-shadow: var(--shadow-sm);
            }
            .toolbox-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 6px 0;
                font-size: 12px;
                border-bottom: 1px solid #f3f4f6;
            }
            .toolbox-row:last-child { border-bottom: none; }
            .toolbox-checkbox { cursor: pointer; }
        `;
        document.head.appendChild(style);
    };

    // ===============================
    // Persistence & Toggles
    // ===============================
    function loadSettings() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) settings = { ...settings, ...JSON.parse(saved) };
        applyGlobalToggles();
    }

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        applyGlobalToggles();
    }

    function applyGlobalToggles() {
        document.body.classList.toggle("show-hidden-fields", settings.showHiddenFields);
        document.body.classList.toggle("highlight-custom", settings.highlightCustomFields);
    }

    // ===============================
    // UI Components
    // ===============================
    function createFieldLabel(fieldname, fieldtype) {
        const wrapper = document.createElement("div");
        wrapper.className = "fieldname-label-overlay";
        wrapper.innerHTML = `<span>${fieldname}</span>`;

        const copyBtn = document.createElement("button");
        copyBtn.innerText = "📋";
        copyBtn.style.cssText = "background:none;border:none;cursor:pointer;padding:0;font-size:10px;line-height:1;";
        copyBtn.title = `Type: ${fieldtype} - Click to copy name`;

        copyBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const el = document.createElement('textarea');
            el.value = fieldname;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            
            const original = copyBtn.innerText;
            copyBtn.innerText = "✅";
            setTimeout(() => copyBtn.innerText = original, 800);
        };

        wrapper.appendChild(copyBtn);
        return wrapper;
    }

    function attachToField(field) {
        if (field.classList.contains("label-injected")) return;
        
        const rawFieldname = field.getAttribute("data-fieldname");
        const fieldtype = field.getAttribute("data-fieldtype") || "data";
        
        // Filter noise
        if (!rawFieldname || /break|column|section|tab/.test(rawFieldname.toLowerCase())) return;

        field.classList.add("label-injected");
        if (getComputedStyle(field).position === "static") {
            field.style.position = "relative";
        }

        field.appendChild(createFieldLabel(rawFieldname, fieldtype));
        
        // Value Logger
        const input = field.querySelector("input, select, textarea");
        if (input) {
            input.addEventListener("change", () => {
                if (settings.debugEnabled && settings.logValueChanges) {
                    console.log(`%c[FrappeDev] ${rawFieldname}:`, "color: #3b82f6; font-weight: bold;", input.value);
                }
            });
        }
    }

    // ===============================
    // Sidebar & Observer
    // ===============================
    function setupToolbox() {
        const sidebar = document.querySelector(".layout-side-section, .page-side-column");
        if (!sidebar || document.getElementById("dev-toolbox-section")) return;

        const container = document.createElement("div");
        container.id = "dev-toolbox-section";
        container.innerHTML = `
            <div style="margin-bottom:8px; font-weight:bold; color:#1f2937; font-size:11px; text-transform:uppercase; display:flex; align-items:center; gap:5px;">
                <span style="color:#3b82f6;">🛠️</span> Infintrix Debugger
            </div>
        `;

        const options = [
            { id: "debugEnabled", label: "Master Debug" },
            { id: "showHiddenFields", label: "Show Hidden" },
            { id: "highlightCustomFields", label: "Highlight Custom" },
            { id: "logValueChanges", label: "Console Log Vals" }
        ];

        options.forEach(opt => {
            const row = document.createElement("div");
            row.className = "toolbox-row";
            row.innerHTML = `
                <span style="color:#4b5563;">${opt.label}</span>
                <input type="checkbox" class="toolbox-checkbox" ${settings[opt.id] ? "checked" : ""}>
            `;
            const cb = row.querySelector("input");
            cb.onchange = (e) => {
                settings[opt.id] = e.target.checked;
                saveSettings();
            };
            container.appendChild(row);
        });

        sidebar.appendChild(container);
    }

    let scanTimer;
    const observer = new MutationObserver(() => {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(() => {
            const fields = document.querySelectorAll("[data-fieldname]:not(.label-injected)");
            fields.forEach(attachToField);
            setupToolbox();
        }, 250);
    });

    // ===============================
    // Start
    // ===============================
    const init = () => {
        injectStyles();
        loadSettings();
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Initial scan
        document.querySelectorAll("[data-fieldname]").forEach(attachToField);
        setupToolbox();
    };

    if (document.readyState === "complete") init();
    else window.addEventListener("load", init);

})();