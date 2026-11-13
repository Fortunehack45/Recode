---
name: 3d-modeling
description: Master-level 3D modeling, mesh topology, and procedural asset engineering. Covers quad-dominant edge flow, Catmull-Clark subdivision mechanics, procedural Geometry Nodes in Blender, non-destructive hard-surface booleans and weighted normals, UV unwrapping with uniform texel density, and glTF/GLB asset optimization.
---

# 3D Modeling, Topology & Procedural Asset Engineering

This skill provides exhaustive engineering rules for generating clean, deformable 3D geometry, procedural meshes, and production-ready assets.

---

## 1. Clean Quad Topology & Edge Flow Standards

### Core Topological Invariants
1. **All-Quad Mesh Policy**: Production models must consist of $\ge 98\%$ quads. Avoid N-gons ($> 4$ vertices) on any surface that bends or subdivides, as they cause unpredictable triangulation artifacts and pinching.
2. **Poles & Valence Management**:
   - Standard vertex valence: 4 connected edges.
   - **N-Poles (Valence 3)** and **E-Poles (Valence 5)** are necessary for redirecting edge flow, but **must never** be placed on high-deformation joints (elbows, knees, eyelids, mouth corners).
3. **Edge Loops for Deformation**:
   - Joint areas must have a minimum of 3 concentric edge loops to preserve volume during skeletal bending.

```mermaid
flowchart LR
    Primitive[Base Mesh / Primitive] --> EdgeFlow[Quad-Dominant Edge Loop Redirection]
    EdgeFlow --> NonDeform[Check High-Curvature Regions]
    NonDeform --> SubD[Catmull-Clark Subdivision Surface]
    SubD --> FinalMesh[Deformable Production Asset]
```

---

## 2. Procedural Geometry Nodes in Blender

When generating procedural 3D models via `blender_execute_python`:
- Construct nodes via `bpy.data.node_groups.new(type='GeometryNodeTree')`.
- Chain `Mesh to Curve` $\rightarrow$ `Curve to Mesh` (with circle profile) for cables, pipes, and procedural organic growth.
- Use `Distribute Points on Faces` $\rightarrow$ `Instance on Points` with random scale/rotation for vegetation, city grids, and scatter systems.
- Always apply `Realize Instances` prior to exporting assets to external game engines or glTF files.

---

## 3. Hard-Surface Modeling & Weighted Normals

- **Non-Destructive Boolean Workflow**:
  - Keep Boolean cutters live with the `Exact` solver for complex mechanical cuts.
  - Apply a small `Bevel` modifier with 2-3 segments and profile $0.70$ after Booleans to catch specular light highlights along sharp edges.
- **Weighted Normal Modifier**:
  - Enable `Auto Smooth` and apply `Weighted Normal` (Weight: 50, Keep Sharp enabled) to eliminate shading gradients across large flat planes without adding thousands of extra polygon bevel cuts.

---

## 4. UV Unwrapping & Texel Density Calibration

- **Seam Placement**:
  - Place seams in natural crevices, undercuts, and unexposed angles (inside legs, behind collars, bottom of props).
- **Uniform Texel Density**:
  - Standardize texel density across all assets in a scene (e.g. $10.24\text{ px/cm}$ for 2K textures on $2\text{m}$ assets) to avoid jarring resolution mismatches.
- **glTF / Draco Compression**:
  - Export web/mobile 3D models with glTF Draco or Meshopt quantization to reduce asset file sizes by up to $85\%$ without perceptible visual loss.
