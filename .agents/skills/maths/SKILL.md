---
name: maths
description: Master-level applied and theoretical mathematics. Covers linear algebra (eigenvalues, SVD, matrix factorizations), multivariate calculus, discrete mathematics, Bayesian probability distributions, and numerical optimization (gradient descent, Newton-Raphson).
---

# Higher Applied Mathematics & Mathematical Engineering

This skill provides exhaustive mathematical foundations, derivation structures, and algorithmic implementations across linear algebra, calculus, probability theory, and discrete structures.

---

## 1. Linear Algebra: Matrix Decompositions & Vector Spaces

### Singular Value Decomposition (SVD)
Any real matrix $A \in \mathbb{R}^{m \times n}$ can be factored into:

$$A = U \Sigma V^T$$

Where:
- $U \in \mathbb{R}^{m \times m}$ is an orthogonal matrix of left singular vectors ($U^T U = I_m$).
- $\Sigma \in \mathbb{R}^{m \times n}$ is a diagonal matrix containing non-negative singular values $\sigma_1 \ge \sigma_2 \ge \dots \ge \sigma_r > 0$.
- $V \in \mathbb{R}^{n \times n}$ is an orthogonal matrix of right singular vectors ($V^T V = I_n$).

#### Low-Rank Approximation (Eckart-Young-Mirsky Theorem):
The optimal rank-$k$ approximation ($k < r$) minimizing Frobenius norm $\|A - A_k\|_F$ is obtained by truncating to the top $k$ singular values:

$$A_k = \sum_{i=1}^k \sigma_i u_i v_i^T$$

### Eigendecomposition & Spectral Theorem
For a symmetric matrix $S \in \mathbb{R}^{n \times n}$ ($S = S^T$), all eigenvalues $\lambda_i$ are real, and eigenvectors $q_i$ form an orthonormal basis:

$$S = Q \Lambda Q^T = \sum_{i=1}^n \lambda_i q_i q_i^T$$

---

## 2. Multivariate Optimization & Gradient Descent Dynamics

### Taylor Expansion in Multiple Dimensions
For a twice continuously differentiable scalar field $f: \mathbb{R}^n \rightarrow \mathbb{R}$:

$$f(x + \Delta x) \approx f(x) + \nabla f(x)^T \Delta x + \frac{1}{2} \Delta x^T H(x) \Delta x$$

Where:
- $\nabla f(x) \in \mathbb{R}^n$ is the Gradient vector: $[\frac{\partial f}{\partial x_1}, \dots, \frac{\partial f}{\partial x_n}]^T$.
- $H(x) \in \mathbb{R}^{n \times n}$ is the Hessian matrix: $H_{ij} = \frac{\partial^2 f}{\partial x_i \partial x_j}$.

### Newton-Raphson Optimization Step
Setting the derivative of the quadratic approximation to zero yields the Newton step:

$$\Delta x = - [H(x)]^{-1} \nabla f(x)$$

Newton's method achieves quadratic convergence ($\epsilon_{k+1} \approx C \epsilon_k^2$) near local minima, compared to linear convergence in standard first-order gradient descent.

---

## 3. Probability Theory & Bayesian Inference

### Bayes' Theorem & Continuous Distributions
For parameter vector $\theta$ and observed evidence $D$:

$$P(\theta | D) = \frac{P(D | \theta) P(\theta)}{P(D)} = \frac{P(D | \theta) P(\theta)}{\int P(D | \theta') P(\theta') d\theta'}$$

- $P(\theta)$: Prior distribution.
- $P(D | \theta)$: Likelihood function.
- $P(\theta | D)$: Posterior distribution.
- $P(D)$: Evidence (marginal likelihood normalizing constant).

### Multivariate Gaussian Distribution
$$\mathcal{N}(x; \mu, \Sigma) = \frac{1}{(2\pi)^{d/2} |\Sigma|^{1/2}} \exp\left(-\frac{1}{2}(x - \mu)^T \Sigma^{-1} (x - \mu)\right)$$

Where $\mu \in \mathbb{R}^d$ is the mean vector and $\Sigma \in \mathbb{R}^{d \times d}$ is the symmetric positive-definite covariance matrix.

---

## 4. Mathematics Engineering Checklist

- [ ] **Condition Number ($\kappa(A)$)**: When solving linear systems $Ax = b$, verify $\kappa(A) = \frac{\sigma_{\max}}{\sigma_{\min}} \ll 10^{15}$ to prevent catastrophic numerical cancellation.
- [ ] **Positive Definiteness**: Verify all eigenvalues $\lambda_i > 0$ for covariance and metric tensors before taking Cholesky decomposition ($A = L L^T$).
- [ ] **Numerical Stability**: Compute softmax and log-likelihoods in log-space using the Log-Sum-Exp trick: $\ln\sum e^{x_i} = c + \ln\sum e^{x_i - c}$ where $c = \max(x_i)$.
