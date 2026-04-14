# Frappe Debug

Make debugging easy in Frappe apps.

A lightweight developer toolbox for Frappe / ERPNext that helps you inspect fields, reveal hidden controls, log live values, and debug forms faster.

---

## Repository

:contentReference[oaicite:0]{index=0}: https://github.com/muqeetmughal/frappe_debug.git

---

# Features

- Field Name Overlay on hover
- Field Type Indicator (`Data`, `Link`, `Select`, `Table`, etc.)
- Copy Field Name button
- Highlight Custom Fields (`custom_*`)
- Show Hidden Fields
- Real-time Value Logger
- Dynamic DOM support using MutationObserver
- Lightweight and developer-friendly

---

# Installation

You can install this app using the :contentReference[oaicite:1]{index=1} CLI.

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app https://github.com/muqeetmughal/frappe_debug.git --branch version-16
bench install-app frappe_debug