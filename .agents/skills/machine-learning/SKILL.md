---
name: machine-learning
description: Master-level machine learning and AI systems engineering. Covers Transformer architectures, PyTorch training/inference loops, quantization (GGUF, AWQ, FP8), parameter-efficient fine-tuning (LoRA/QLoRA), and Retrieval-Augmented Generation (RAG).
---

# Machine Learning & AI Systems Engineering

This skill provides exhaustive guidance on architecting, training, quantizing, and deploying modern machine learning models and foundation AI pipelines.

---

## 1. Transformer Architecture Mechanics & Scaled Dot-Product Attention

The core attention equation computes query-key similarity normalized by dimension scale $\sqrt{d_k}$:

$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}} + M\right)V$$

Where:
- $Q \in \mathbb{R}^{B \times H \times S \times d_k}$ (Queries)
- $K \in \mathbb{R}^{B \times H \times S \times d_k}$ (Keys)
- $V \in \mathbb{R}^{B \times H \times S \times d_v}$ (Values)
- $M$ is the causal attention mask ($-\infty$ above diagonal).

### FlashAttention-2 & Memory Bandwidth
Standard self-attention has $O(N^2)$ memory footprint from materializing the intermediate $S \times S$ attention matrix to HBM. FlashAttention tiles the computation using online softmax within SRAM:

$$m_{\text{new}} = \max(m_{\text{old}}, \max(S_i)), \quad d_{\text{new}} = d_{\text{old}} e^{m_{\text{old}} - m_{\text{new}}} + \sum e^{S_{ij} - m_{\text{new}}}$$

---

## 2. Parameter-Efficient Fine-Tuning (LoRA & QLoRA)

### Mathematical Formulation of Low-Rank Adaptation (LoRA)
Instead of fine-tuning the full weight matrix $W_0 \in \mathbb{R}^{d \times k}$, decompose the weight update $\Delta W$ into two low-rank matrices $B \in \mathbb{R}^{d \times r}$ and $A \in \mathbb{R}^{r \times k}$ where $r \ll \min(d, k)$:

$$W = W_0 + \Delta W = W_0 + \frac{\alpha}{r} (B \cdot A)$$

$A$ is initialized from $\mathcal{N}(0, \sigma^2)$ and $B$ is initialized to $0$, ensuring $\Delta W = 0$ at step 0.

### PyTorch LoRA Layer Implementation
```python
import torch
import torch.nn as nn
import math

class LoRALinear(nn.Module):
    def __init__(self, in_features: int, out_features: int, rank: int = 8, alpha: float = 16.0):
        super().__init__()
        self.linear = nn.Linear(in_features, out_features, bias=False)
        self.linear.weight.requires_grad = False # Freeze base weights

        self.rank = rank
        self.scaling = alpha / rank

        # Low-rank adapter matrices
        self.lora_A = nn.Parameter(torch.empty(rank, in_features))
        self.lora_B = nn.Parameter(torch.zeros(out_features, rank))

        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        base_out = self.linear(x)
        lora_out = (x @ self.lora_A.T @ self.lora_B.T) * self.scaling
        return base_out + lora_out
```

---

## 3. Quantization Mechanics (AWQ, GGUF, FP8)

- **Post-Training Quantization (PTQ)**: Scales weights from FP16 ($16\text{ bits}$) to INT4/INT8 via affine mapping:
  $$q = \text{round}\left(\frac{w}{S}\right) + Z$$
- **Activation-Aware Weight Quantization (AWQ)**: Identifies the top 1% salient weights by observing activation magnitudes and preserves them in higher precision while quantizing non-salient weights to INT4.
- **FP8 (E4M3 vs E5M2)**: E4M3 (4 exponent bits, 3 mantissa) is preferred for forward inference due to higher precision; E5M2 matches FP16 dynamic range and is preferred for gradients during backward pass.

---

## 4. Modern Retrieval-Augmented Generation (RAG) Architecture

A production RAG pipeline consists of:
1. **Hierarchical Document Chunking**: Chunk size 512-1024 tokens with 10% overlap, preserving markdown headers.
2. **Dense Vector Retrieval**: Cosine similarity over normalized embeddings (e.g., `text-embedding-3-large`).
3. **Sparse Lexical Retrieval (BM25)**: Complements semantic matching for exact keyword IDs and symbols.
4. **Reciprocal Rank Fusion (RRF)**:
   $$RRF\_Score(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$
5. **Cross-Encoder Reranking**: Re-scores top 30 retrieved chunks down to top 5 using a cross-encoder model (e.g., `bge-reranker-large`).

---

## 5. Machine Learning Engineering Checklist

- [ ] **Gradient Clipping**: Apply `torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)` to prevent exploding gradients.
- [ ] **Deterministic Seed**: Initialize random seeds across Python, NumPy, PyTorch CPU, and CUDA for reproducible runs.
- [ ] **Mixed Precision**: Utilize `torch.amp.autocast('cuda')` and `GradScaler` for training on modern Tensor Cores.
- [ ] **Data Pipeline Bottlenecks**: Verify `DataLoader(num_workers=4, pin_memory=True)` to prevent GPU compute starvation during batch feeding.
