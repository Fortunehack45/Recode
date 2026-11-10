---
name: research
description: Master-level academic, scientific, and technical research methodology. Covers primary source verification, RFC and specification cross-referencing, empirical evidence synthesis, citation trees, and cognitive bias neutralization.
---

# Systematic Technical & Scientific Research Methodology

This skill provides exhaustive guidance on conducting rigorous technical and scientific research, validating claims against primary specifications, and structuring evidence-backed syntheses.

---

## 1. Information Hierarchy & Source Verification Tiers

When conducting research to answer technical, scientific, or architectural questions, evaluate sources strictly according to this credibility hierarchy:

```
Tier 1: Canonical Standards & Primary Specifications
        (IETF RFCs, W3C Recommendations, ISO/IEC standards, language specifications)
        ▲
Tier 2: Source Code Repositories & Formal Documentation
        (Kernel commits, language runtime source, official API docs, verified changelogs)
        ▲
Tier 3: Peer-Reviewed Academic Literature & Technical Whitepapers
        (IEEE, ACM, arXiv preprints from verified institutions, VLDB, OSDI papers)
        ▲
Tier 4: Engineering Postmortems & Production Case Studies
        (Official engineering blogs of Netflix, Cloudflare, Meta, Google, Uber)
        ▲
Tier 5: Community Discussions & Aggregators (StackOverflow, Reddit, Medium)
        (Only to identify hypotheses or known bugs; never rely on as primary proof)
```

---

## 2. Citation Chaining & Forward/Backward Spec Analysis

### Backward Chaining (Provenance Tracking)
- When reading a technical assertion, trace every citation back to the original experimental paper or RFC.
- If a blog claims *"React 19 Server Actions serialize data over JSON"*, verify directly against the Next.js and React core flight protocol implementation in GitHub source code.

### Forward Chaining (Evolutionary Tracking)
- Check whether an RFC or standard has been updated, superseded, or obsoleted (e.g., HTTP/1.1 RFC 2616 $\rightarrow$ RFC 7230 $\rightarrow$ RFC 9112).
- Check language changelogs for feature deprecations across minor releases.

---

## 3. Cognitive Bias Neutralization in Technical Inquiry

1. **Confirmation Bias Defense**: Explicitly formulate the opposing hypothesis and search for disconfirming evidence (e.g., searching for *"PostgreSQL vs MySQL performance"* $\rightarrow$ also search *"scenarios where PostgreSQL query planner fails vs MySQL"*).
2. **Authority Bias Defense**: Even high-profile engineers and documentation can contain bugs or stale assumptions. Validate behavior with empirical reproduction scripts or unit tests.
3. **Survivorship Bias Defense**: Do not just analyze successful architectures; analyze postmortems of systems that collapsed under similar conditions.

---

## 4. Systematic Research Workflow

```markdown
Step 1: Problem Definition & Search String Formulation
        - Formulate exact keyword variants, official spec terms, and error codes.
Step 2: Source Retrieval & Triangulation
        - Gather at least 3 independent Tier-1/Tier-2 sources corroborating the behavior.
Step 3: Discrepancy Reconciliation
        - If documentation contradicts observed behavior, inspect the underlying runtime 
          or compiler source code to find the truth.
Step 4: Empirical Verification
        - Write a minimal reproducing code snippet or benchmark to confirm the findings.
Step 5: Structured Synthesis
        - Present findings with clear citations, boundary conditions, and actionable takeaways.
```

---

## 5. Research Quality Checklist

- [ ] **Primary Source Grounded**: Are conclusions backed by canonical RFCs, official specs, or runtime source?
- [ ] **Version Specificity**: Are library/language versions explicitly documented (e.g., Python 3.12, Go 1.22)?
- [ ] **Empirically Verified**: Has the behavior been validated against real runtime execution or compiler passes?
- [ ] **No Hallucinated Citations**: Are all cited links, RFC numbers, and API methods verified to exist?
