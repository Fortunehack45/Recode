---
name: legal-and-compliance
description: Master legal engineering and software compliance. Covers Terms of Service, Privacy Policies (GDPR, CCPA/CPRA, COPPA), End User License Agreements (EULA), Open Source licensing (MIT, Apache 2.0, GPLv3, AGPLv3), and SaaS contracts.
---

# Legal Engineering, Software Compliance & Drafting

This skill provides exhaustive legal architectures, contract templates, and compliance frameworks for software products, cloud services, and developer tooling.

---

## 1. Terms of Service (ToS) Architecture & Clauses

A robust SaaS Terms of Service must contain these non-negotiable legal pillars:

### 1. Acceptance of Terms & Eligibility
- Explicit agreement via clickwrap (affirmative checkbox, e.g., *"I have read and agree to the Terms of Service"*). Never rely solely on browsewrap.
- Minimum age requirement (e.g., 13 or 16 depending on jurisdiction).

### 2. User Accounts & Security Obligations
- User responsibility for credential confidentiality.
- Immediate notice obligation upon discovery of unauthorized access.
- Right to suspend or terminate accounts for breach of conduct.

### 3. Acceptable Use Policy (AUP)
Explicitly prohibit:
- Reverse engineering, decompiling, or disassembling proprietary binaries (subject to local reverse-engineering exceptions for interoperability).
- Automated scraping, rate limit bypassing, or denial-of-service attacks.
- Using services to train competing foundation artificial intelligence models without express commercial authorization.
- Transmitting malware, illegal contraband, or infringing intellectual property.

### 4. Intellectual Property & Customer Data Ownership
- **Customer IP**: The customer retains all right, title, and interest in and to their proprietary data, source code, and assets uploaded to the service.
- **Provider IP**: The provider retains all right, title, and interest in the service, APIs, documentation, software, and brand trademarks.
- **Feedback License**: A perpetual, irrevocable, worldwide, royalty-free license to use suggestions, comments, or feedback submitted by users.

### 5. Limitation of Liability & Warranty Disclaimers
```markdown
THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES 
OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES 
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

IN NO EVENT SHALL THE COMPANY, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY 
INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES (INCLUDING LOSS OF 
PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES) ARISING FROM OR RELATING 
TO YOUR ACCESS TO OR USE OF THE SERVICE. IN NO EVENT SHALL THE TOTAL AGGREGATE LIABILITY 
EXCEED THE GREATER OF ONE HUNDRED DOLLARS ($100 USD) OR THE AMOUNT PAID BY YOU TO 
THE COMPANY IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
```

---

## 2. Privacy Policy Compliance (GDPR, CCPA/CPRA, COPPA)

### European Union GDPR Compliance (Articles 13 & 14)
- **Lawful Bases for Processing**:
  - *Contractual Necessity* (delivering core software functionality).
  - *Legitimate Interest* (fraud prevention, infrastructure stability).
  - *Consent* (cookies, analytics, marketing opt-ins).
- **Data Subject Rights**:
  - Right of Access (Art. 15), Rectification (Art. 16), Erasure / "Right to be Forgotten" (Art. 17).
  - Right to Data Portability (Art. 20) in a structured, machine-readable format (JSON/CSV).
- **Data Protection Officer & Controller Contact**: Disclose the full corporate legal entity name, jurisdiction, and official privacy contact email.

### California Consumer Privacy Act (CCPA/CPRA)
- Provide a clear `"Do Not Sell or Share My Personal Information"` link if tracking cookies are deployed.
- Disclose categories of personal information collected over the past 12 months.

---

## 3. Open Source Licensing Matrix & Compatibility

| License | Copyleft Type | Commercial Use | Patent Grant | Sublicensing | Derivative Works Release |
|---|---|---|---|---|---|
| **MIT** | Permissive | Allowed | Not specified | Allowed | Permissive (Keep copyright notice) |
| **Apache 2.0** | Permissive | Allowed | **Explicit** | Allowed | Permissive (Must state changes + notice) |
| **BSD 3-Clause** | Permissive | Allowed | Not specified | Allowed | Permissive (No endorsement using names) |
| **GPLv3** | Strong Copyleft | Allowed | **Explicit** | Forbidden | **Mandatory** under same GPLv3 |
| **AGPLv3** | Network Copyleft | Allowed | **Explicit** | Forbidden | **Mandatory** even if hosted over SaaS |

### Critical Licensing Traps:
- **AGPLv3 Contamination**: Linking an AGPLv3 library inside proprietary SaaS backend services triggers Section 13 network interaction provisions, obligating you to open-source your entire backend source code to all network users.
- **Apache 2.0 vs GPLv2**: Apache 2.0 is incompatible with pure GPLv2 (due to patent termination clauses), but compatible with GPLv3.

---

## 4. Legal Compliance Checklist

- [ ] **Affirmative Clickwrap**: User must click "Agree" or "Create Account" with a clear link to Terms and Privacy Policy.
- [ ] **Account Deletion Pipeline**: User data can be purged within 30 days of deletion request to satisfy GDPR/CCPA.
- [ ] **Third-Party Disclosures**: All sub-processors (Stripe, AWS, PostHog, OpenAI, Supabase) are explicitly enumerated in the Privacy Policy.
- [ ] **Governing Law & Forum**: Include governing law clause (e.g., State of Delaware, England & Wales) and mandatory binding arbitration / class action waiver where legally enforceable.
