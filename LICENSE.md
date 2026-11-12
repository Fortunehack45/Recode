# Recode Licensing Overview

**Copyright © 2026 Recode Contributors.**  
**Official Repository:** <https://github.com/Fortunehack45/Recode>

Recode is **Open Source Software**. All source code in this repository is made publicly available under OSI-approved open-source licenses so anyone can inspect, audit, build, modify, and contribute back to the project.

---

## 1. Applicable Open Source Licenses

Depending on the crate or package (as declared in each `Cargo.toml` or `package.json` manifest), Recode is governed by the following licenses:

1. **GNU General Public License v3.0 or later (`GPL-3.0-or-later`)** — see [`LICENSE-GPL`](LICENSE-GPL)  
   Applies to the Recode desktop application (`crates/recode`) and GPL-licensed workspace crates. If you distribute binaries or modified versions of GPL-covered components, you must provide complete corresponding source code under `GPL-3.0-or-later` and preserve all copyright and license notices.
2. **Apache License, Version 2.0 (`Apache-2.0`)** — see [`LICENSE-APACHE`](LICENSE-APACHE)  
   Applies to framework, SDK, and utility crates explicitly licensed under `Apache-2.0` (including `gpui`, `html_to_markdown`, `extension_api`, and `cli`) as well as JS/TS packages where specified.

In the event of any conflict between this overview and the full license texts in [`LICENSE-GPL`](LICENSE-GPL) and [`LICENSE-APACHE`](LICENSE-APACHE), the full license texts control.

---

## 2. Trademarks & Brand Protection (GPL-3.0 §7(e) / Apache-2.0 §6)

Open-source copyright licenses do **not** grant trademark rights. In accordance with Section 7(e) of the GNU General Public License v3.0 and Section 6 of the Apache License 2.0:

- You are free to fork, study, modify, and redistribute the open-source codebase under the terms of `GPL-3.0-or-later` / `Apache-2.0`.
- However, you may **not** distribute unofficial builds, modified forks, or derivative products using the **Recode** name, logos, application icons, splash graphics, domains, or application identifiers (`dev.recode.editor`) without prior written permission.
- Modified redistributions must remove Recode brand marks and use distinct project names and icons as detailed in our [Trademark Policy](legal/TRADEMARK_POLICY.md).

---

## 3. Contributions

Community contributions are welcome! All Pull Requests and patches are governed by our open-source [Contributor License Agreement (CLA)](legal/CONTRIBUTOR_LICENSE_AGREEMENT.md).

---

## 4. Third-Party Dependencies & Notices

Recode builds upon open-source libraries whose licenses and copyright notices are cataloged in [`DEPENDENCY_LICENSES.md`](DEPENDENCY_LICENSES.md) and [`DEPENDENCIES.md`](DEPENDENCIES.md). Required upstream copyright and permission notices preserved in `LICENSE-GPL`, `LICENSE-APACHE`, or individual source files are retained unchanged in full compliance with those licenses.
