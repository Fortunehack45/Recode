---
name: chemistry
description: Master-level chemistry and cheminformatics engineering. Covers molecular graph representations, SMILES/InChI parsing, RDKit descriptor calculation (MW, LogP, TPSA), reaction stoichiometry, chemical thermodynamics (Gibbs free energy), and reaction kinetics.
---

# Chemistry & Cheminformatics Engineering

This skill provides exhaustive guidance on chemical computation, molecular modeling, reaction kinetics, and cheminformatics workflows using modern standards.

---

## 1. Molecular Graph Theory & String Representations

A molecule is mathematically represented as an attributed graph $G = (V, E)$ where:
- Vertices $V$ correspond to atoms, annotated with atomic number $Z$, formal charge $q$, explicit/implicit hydrogens $H$, and stereochemical parity ($R/S$).
- Edges $E$ correspond to covalent bonds, annotated with bond order ($1, 2, 3$, aromatic) and cis/trans stereoisomerism ($E/Z$).

### SMILES & Canonical InChI
- **Simplified Molecular-Input Line-Entry System (SMILES)**:
  - Benzene: `c1ccccc1`
  - Aspirin (Acetylsalicylic Acid): `CC(=O)Oc1ccccc1C(=O)O`
  - Chirality: `@` (counter-clockwise) and `@@` (clockwise) about a chiral center.
- **InChI (International Chemical Identifier)**: Layered canonical representation invariant to drawing orientation:
  - Formula layer: `/c` (skeleton connectivity), `/h` (hydrogen placement), `/q` (charge), `/b` (double-bond stereochemistry), `/t` (tetrahedral stereocenters).

---

## 2. RDKit Molecular Descriptors & Drug-Likeness (Lipinski Rule of 5)

Lipinski's Rule of Five defines physicochemical constraints for orally active human drugs:
1. Molecular Weight ($\text{MW}$) $\le 500\,\text{g/mol}$
2. Octanol-Water Partition Coefficient ($\text{LogP}$) $\le 5$
3. Hydrogen Bond Donors ($\text{HBD}$) $\le 5$ (sum of $\text{OH}$ and $\text{NH}$ groups)
4. Hydrogen Bond Acceptors ($\text{HBA}$) $\le 10$ (sum of $\text{O}$ and $\text{N}$ atoms)

### RDKit Python Automation:
```python
from rdkit import Chem
from rdkit.Chem import Descriptors, Crippen, Lipinski

def evaluate_drug_likeness(smiles: str) -> dict:
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid SMILES string: {smiles}")

    mw = Descriptors.MolWt(mol)
    clogp = Crippen.MolLogP(mol)
    hbd = Lipinski.NumHDonors(mol)
    hba = Lipinski.NumHAcceptors(mol)
    tpsa = Descriptors.TPSA(mol) # Topological Polar Surface Area (< 140 Å²)
    rotatable_bonds = Lipinski.NumRotatableBonds(mol)

    violations = sum([
        mw > 500.0,
        clogp > 5.0,
        hbd > 5,
        hba > 10
    ])

    return {
        "molecular_weight": mw,
        "clogp": clogp,
        "hbd": hbd,
        "hba": hba,
        "tpsa": tpsa,
        "rotatable_bonds": rotatable_bonds,
        "lipinski_violations": violations,
        "passes_lipinski": violations <= 1,
    }
```

---

## 3. Chemical Thermodynamics & Reaction Equilibrium

### Gibbs Free Energy & Equilibrium Constant
The spontaneity of a reaction at constant temperature and pressure is governed by the change in Gibbs Free Energy $\Delta G$:

$$\Delta G^\circ = \Delta H^\circ - T\Delta S^\circ$$

Where $\Delta H^\circ$ is standard enthalpy, $T$ is absolute temperature in Kelvin, and $\Delta S^\circ$ is entropy change.

The equilibrium constant $K_{\text{eq}}$ is directly related to $\Delta G^\circ$:

$$\Delta G^\circ = -RT \ln(K_{\text{eq}}) \implies K_{\text{eq}} = \exp\left(-\frac{\Delta G^\circ}{RT}\right)$$

Where $R = 8.314462618\,\text{J}/(\text{mol}\cdot\text{K})$.

### Arrhenius Rate Kinetics
The rate constant $k$ of a chemical reaction depends exponentially on the activation energy $E_a$:

$$k = A \exp\left(-\frac{E_a}{RT}\right)$$

---

## 4. Chemistry Engineering Checklist

- [ ] **Atom Conservation**: Ensure chemical reaction equations balance mass and charge across all reactants and products.
- [ ] **Stereochemical Integrity**: Explicitly specify chiral stereocenters using `@` / `@@` in SMILES or explicit wedge/dash bonds in Molfiles.
- [ ] **Aromaticity Model Consistency**: Ensure consistent aromaticity detection (e.g., Kekulé vs. Hückel $4n+2$ $\pi$-electron aromaticity).
