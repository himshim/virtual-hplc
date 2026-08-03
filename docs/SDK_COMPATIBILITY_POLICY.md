# 📜 SDK Compatibility & Versioning Policy — LabPlugin SDK

This document defines the semver versioning, compatibility guarantees, breaking change policies, and upgrade paths for **LabPlugin SDK**.

---

## 1. Semver Versioning Scheme (`x.y.z`)

The platform SDK uses Semantic Versioning (`MAJOR.MINOR.PATCH`):

- **MAJOR (`x`)**: Breaking architectural changes to `core/` interfaces. Plugins requiring a higher major version than the platform are **rejected** during registration.
- **MINOR (`y`)**: Additive features (new optional capability flags, new UI extension points). Fully backward compatible with existing plugins.
- **PATCH (`z`)**: Bug fixes, performance optimizations, and documentation updates. Zero API contract changes.

---

## 2. Platform Compatibility Guarantee Matrix

| Platform SDK | Plugin `sdkVersion` | Platform Action | Rationale |
| :--- | :--- | :--- | :--- |
| `v1.0.0` | `1.0.0` | ✅ **ACCEPTED** | Exact match. |
| `v1.1.0` | `1.0.0` | ✅ **ACCEPTED** | Backward compatible. Platform provides defaults for new v1.1 features. |
| `v1.0.0` | `1.2.0` | ⚠️ **WARNING** | Minor mismatch. Platform ignores unsupported minor features. |
| `v1.0.0` | `2.0.0` | ❌ **REJECTED** | Major mismatch. Rejected by `PluginRegistry` to prevent runtime failure. |

---

---

## 4. Platform Change Governance Rules

- **Level 1 — Plugin Changes (Allowed Anytime)**:  
  New instruments, educational content, UI polish, graph enhancements, or notebook updates. No SDK approval needed.
- **Level 2 — Optional SDK Additions (Additive & Backward-Compatible)**:  
  New optional capability fields or extension points. Must maintain full backward compatibility for existing plugins.
- **Level 3 — Breaking SDK Changes (Requires Version Bump)**:  
  Breaking contract modifications to `core/` interfaces. Requires SDK major version bump, migration guide, compatibility notes, and test suite updates.

