---
id: "math-eigenvalues-11"
note: "math-eigenvalues"
title: "Review: Core idea"
type: "text"
answer: "$A$ acts on most vectors by changing both magnitude and direction."
skills:
  - "1. Core idea"
---

What core idea is introduced in **Core idea**?

:::solution
One short answer is: $A$ acts on most vectors by changing both magnitude and direction.
:::

---
id: "math-eigenvalues-12"
note: "math-eigenvalues"
title: "Review: Geometric meaning"
type: "text"
answer: "A stretch in the $x$-direction has eigenvectors on the coordinate axes."
skills:
  - "Geometric meaning"
---

What is the main idea of **Geometric meaning**?

:::solution
One short answer is: A stretch in the $x$-direction has eigenvectors on the coordinate axes.
:::

---
id: "math-eigenvalues-13"
note: "math-eigenvalues"
title: "Review: Characteristic equation"
type: "text"
answer: "Starting from $$ Av = \\lambda v $$ move everything to one side: $$ (A - \\lambda I)v = 0 $$ For a nonzero solution $v$ to exist, the matrix $A - \\lambda I$ must be singular."
skills:
  - "2. Characteristic equation"
---

What is the main idea of **Characteristic equation**?

:::solution
One short answer is: Starting from $$ Av = \lambda v $$ move everything to one side: $$ (A - \lambda I)v = 0 $$ For a nonzero solution $v$ to exist, the matrix $A - \lambda I$ must be singular.
:::

---
id: "math-eigenvalues-14"
note: "math-eigenvalues"
title: "Review: Why the determinant condition works"
type: "text"
answer: "The homogeneous system $$ (A - \\lambda I)v = 0 $$ has a nontrivial solution exactly when the coefficient matrix is not invertible. That is equivalent to determinant zero."
skills:
  - "Why the determinant condition works"
---

What is the main idea of **Why the determinant condition works**?

:::solution
One short answer is: The homogeneous system $$ (A - \lambda I)v = 0 $$ has a nontrivial solution exactly when the coefficient matrix is not invertible. That is equivalent to determinant zero.
:::

---
id: "math-eigenvalues-15"
note: "math-eigenvalues"
title: "Review: Example"
type: "text"
answer: "Let $$ A = \\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix} $$ Then $$ A - \\lambda I = \\begin{bmatrix} 4-\\lambda & 1 \\\\ 2 & 3-\\lambda \\end{bmatrix} $$ and $$ \\det(A - \\lambda I) = (4-\\lambda)(3-\\lambda) - 2 = \\lambda^2 - 7\\…"
skills:
  - "Example"
---

What is the main idea of **Example**?

:::solution
One short answer is: Let $$ A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix} $$ Then $$ A - \lambda I = \begin{bmatrix} 4-\lambda & 1 \\ 2 & 3-\lambda \end{bmatrix} $$ and $$ \det(A - \lambda I) = (4-\lambda)(3-\lambda) - 2 = \lambda^2 - 7\…
:::

---
id: "math-eigenvalues-16"
note: "math-eigenvalues"
title: "Review: Eigenvectors and eigenspaces"
type: "text"
answer: "Once an eigenvalue $\\lambda$ is known, find its eigenvectors by solving $$ (A - \\lambda I)v = 0 $$ The set of all eigenvectors for $\\lambda$, together with the zero vector, forms the eigenspace $$ E \\lambda = \\operatorn…"
skills:
  - "3. Eigenvectors and eigenspaces"
---

What is the main idea of **Eigenvectors and eigenspaces**?

:::solution
One short answer is: Once an eigenvalue $\lambda$ is known, find its eigenvectors by solving $$ (A - \lambda I)v = 0 $$ The set of all eigenvectors for $\lambda$, together with the zero vector, forms the eigenspace $$ E \lambda = \operatorn…
:::

---
id: "math-eigenvalues-17"
note: "math-eigenvalues"
title: "Review: Example continued"
type: "text"
answer: "For $$ A = \\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix} $$ and $\\lambda = 5$, $$ A - 5I = \\begin{bmatrix} -1 & 1 \\\\ 2 & -2 \\end{bmatrix} $$ Solve $$ \\begin{bmatrix} -1 & 1 \\\\ 2 & -2 \\end{bmatrix} \\begin{bmatrix} x \\\\ y…"
skills:
  - "Example continued"
---

What is the main idea of **Example continued**?

:::solution
One short answer is: For $$ A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix} $$ and $\lambda = 5$, $$ A - 5I = \begin{bmatrix} -1 & 1 \\ 2 & -2 \end{bmatrix} $$ Solve $$ \begin{bmatrix} -1 & 1 \\ 2 & -2 \end{bmatrix} \begin{bmatrix} x \\ y…
:::

---
id: "math-eigenvalues-18"
note: "math-eigenvalues"
title: "Review: Important restriction"
type: "text"
answer: "The zero vector is never called an eigenvector. If it were allowed, every scalar would become an eigenvalue candidate, which would destroy the definition. ---"
skills:
  - "Important restriction"
---

What is the main idea of **Important restriction**?

:::solution
One short answer is: The zero vector is never called an eigenvector. If it were allowed, every scalar would become an eigenvalue candidate, which would destroy the definition. ---
:::

---
id: "math-eigenvalues-19"
note: "math-eigenvalues"
title: "Review: Multiplicity"
type: "text"
answer: "Eigenvalues can repeat."
skills:
  - "4. Multiplicity"
---

What is the main idea of **Multiplicity**?

:::solution
One short answer is: Eigenvalues can repeat.
:::

---
id: "math-eigenvalues-110"
note: "math-eigenvalues"
title: "Review: Algebraic multiplicity"
type: "text"
answer: "The algebraic multiplicity of $\\lambda$ is its multiplicity as a root of the characteristic polynomial."
skills:
  - "Algebraic multiplicity"
---

What is the main idea of **Algebraic multiplicity**?

:::solution
One short answer is: The algebraic multiplicity of $\lambda$ is its multiplicity as a root of the characteristic polynomial.
:::

---
id: "math-eigenvalues-111"
note: "math-eigenvalues"
title: "Review: Geometric multiplicity"
type: "text"
answer: "The geometric multiplicity of $\\lambda$ is $$ \\dim(E \\lambda) = \\dim(\\operatorname{Null}(A - \\lambda I)) $$"
skills:
  - "Geometric multiplicity"
---

What is the main idea of **Geometric multiplicity**?

:::solution
One short answer is: The geometric multiplicity of $\lambda$ is $$ \dim(E \lambda) = \dim(\operatorname{Null}(A - \lambda I)) $$
:::

---
id: "math-eigenvalues-112"
note: "math-eigenvalues"
title: "Review: Fundamental inequality"
type: "text"
answer: "For each eigenvalue, $$ 1 \\le \\text{geometric multiplicity} \\le \\text{algebraic multiplicity} $$"
skills:
  - "Fundamental inequality"
---

What core idea is introduced in **Fundamental inequality**?

:::solution
One short answer is: For each eigenvalue, $$ 1 \le \text{geometric multiplicity} \le \text{algebraic multiplicity} $$
:::

---
id: "math-eigenvalues-113"
note: "math-eigenvalues"
title: "Review: Repeated eigenvalue example"
type: "text"
answer: "Consider $$ A = \\begin{bmatrix} 3 & 1 \\\\ 0 & 3 \\end{bmatrix} $$ Then $$ \\det(A - \\lambda I) = (3-\\lambda)^2 $$ So $\\lambda = 3$ has algebraic multiplicity $2$."
skills:
  - "Repeated eigenvalue example"
---

What is the main idea of **Repeated eigenvalue example**?

:::solution
One short answer is: Consider $$ A = \begin{bmatrix} 3 & 1 \\ 0 & 3 \end{bmatrix} $$ Then $$ \det(A - \lambda I) = (3-\lambda)^2 $$ So $\lambda = 3$ has algebraic multiplicity $2$.
:::

---
id: "math-eigenvalues-114"
note: "math-eigenvalues"
title: "Review: Determinant, trace, and invertibility"
type: "text"
answer: "Eigenvalues encode several global properties of a matrix."
skills:
  - "5. Determinant, trace, and invertibility"
---

What is the main idea of **Determinant, trace, and invertibility**?

:::solution
One short answer is: Eigenvalues encode several global properties of a matrix.
:::

---
id: "math-eigenvalues-21"
note: "math-eigenvalues"
title: "Review: Determinant"
type: "text"
answer: "For an $n \\times n$ matrix, $$ \\det(A) = \\lambda 1 \\lambda 2 \\cdots \\lambda n $$ counting algebraic multiplicity and allowing complex eigenvalues when needed."
skills:
  - "Determinant"
---

What is the main idea of **Determinant**?

:::solution
One short answer is: For an $n \times n$ matrix, $$ \det(A) = \lambda 1 \lambda 2 \cdots \lambda n $$ counting algebraic multiplicity and allowing complex eigenvalues when needed.
:::

---
id: "math-eigenvalues-22"
note: "math-eigenvalues"
title: "Review: Trace"
type: "text"
answer: "The trace is the sum of diagonal entries: $$ \\operatorname{tr}(A) = a {11} + a {22} + \\cdots + a {nn} $$ It also equals the sum of the eigenvalues: $$ \\operatorname{tr}(A) = \\lambda 1 + \\lambda 2 + \\cdots + \\lambda n $$"
skills:
  - "Trace"
---

What is the main idea of **Trace**?

:::solution
One short answer is: The trace is the sum of diagonal entries: $$ \operatorname{tr}(A) = a {11} + a {22} + \cdots + a {nn} $$ It also equals the sum of the eigenvalues: $$ \operatorname{tr}(A) = \lambda 1 + \lambda 2 + \cdots + \lambda n $$
:::

---
id: "math-eigenvalues-23"
note: "math-eigenvalues"
title: "Review: Invertibility test"
type: "text"
answer: "$0$ is an eigenvalue exactly when $Av = 0$ for some nonzero $v$."
skills:
  - "Invertibility test"
---

What is the main idea of **Invertibility test**?

:::solution
One short answer is: $0$ is an eigenvalue exactly when $Av = 0$ for some nonzero $v$.
:::

---
id: "math-eigenvalues-24"
note: "math-eigenvalues"
title: "Review: Triangular matrices"
type: "text"
answer: "If $A$ is upper or lower triangular, its eigenvalues are the diagonal entries. This is one of the fastest ways to read off eigenvalues by inspection. ---"
skills:
  - "Triangular matrices"
---

What is the main idea of **Triangular matrices**?

:::solution
One short answer is: If $A$ is upper or lower triangular, its eigenvalues are the diagonal entries. This is one of the fastest ways to read off eigenvalues by inspection. ---
:::

---
id: "math-eigenvalues-25"
note: "math-eigenvalues"
title: "Review: Diagonalization"
type: "text"
answer: "A matrix $A$ is diagonalizable if there exists an invertible matrix $P$ and a diagonal matrix $D$ such that $$ A = PDP^{-1} $$ The columns of $P$ are eigenvectors of $A$, and the corresponding diagonal entries of $D$ ar…"
skills:
  - "6. Diagonalization"
---

What is the main idea of **Diagonalization**?

:::solution
One short answer is: A matrix $A$ is diagonalizable if there exists an invertible matrix $P$ and a diagonal matrix $D$ such that $$ A = PDP^{-1} $$ The columns of $P$ are eigenvectors of $A$, and the corresponding diagonal entries of $D$ ar…
:::

---
id: "math-eigenvalues-26"
note: "math-eigenvalues"
title: "Review: Why diagonalization matters"
type: "text"
answer: "Diagonal matrices are easy to work with: $$ D^k = \\begin{bmatrix} \\lambda 1^k & 0 & \\cdots & 0 \\\\ 0 & \\lambda 2^k & \\cdots & 0 \\\\ \\vdots & \\vdots & \\ddots & \\vdots \\\\ 0 & 0 & \\cdots & \\lambda n^k \\end{bmatrix} $$ So if…"
skills:
  - "Why diagonalization matters"
---

What is the main idea of **Why diagonalization matters**?

:::solution
One short answer is: Diagonal matrices are easy to work with: $$ D^k = \begin{bmatrix} \lambda 1^k & 0 & \cdots & 0 \\ 0 & \lambda 2^k & \cdots & 0 \\ \vdots & \vdots & \ddots & \vdots \\ 0 & 0 & \cdots & \lambda n^k \end{bmatrix} $$ So if…
:::

---
id: "math-eigenvalues-27"
note: "math-eigenvalues"
title: "Review: Diagonalizability criterion"
type: "text"
answer: "$A$ has $n$ distinct eigenvalues."
skills:
  - "Diagonalizability criterion"
---

What is the main idea of **Diagonalizability criterion**?

:::solution
One short answer is: $A$ has $n$ distinct eigenvalues.
:::

---
id: "math-eigenvalues-28"
note: "math-eigenvalues"
title: "Review: Example"
type: "text"
answer: "Let $$ A = \\begin{bmatrix} 4 & 1 \\\\ 2 & 3 \\end{bmatrix} $$ with eigenpairs $$ \\lambda 1 = 5,\\quad v 1 = \\begin{bmatrix} 1 \\\\ 1 \\end{bmatrix} $$ and $$ \\lambda 2 = 2,\\quad v 2 = \\begin{bmatrix} 1 \\\\ -2 \\end{bmatrix} $$ T…"
skills:
  - "Example"
---

What is the main idea of **Example**?

:::solution
One short answer is: Let $$ A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix} $$ with eigenpairs $$ \lambda 1 = 5,\quad v 1 = \begin{bmatrix} 1 \\ 1 \end{bmatrix} $$ and $$ \lambda 2 = 2,\quad v 2 = \begin{bmatrix} 1 \\ -2 \end{bmatrix} $$ T…
:::

---
id: "math-eigenvalues-29"
note: "math-eigenvalues"
title: "Review: Special matrix classes"
type: "text"
answer: "Special matrix classes"
skills:
  - "7. Special matrix classes"
---

What is the main idea of **Special matrix classes**?

:::solution
One short answer is: Special matrix classes
:::

---
id: "math-eigenvalues-210"
note: "math-eigenvalues"
title: "Review: Symmetric matrices"
type: "text"
answer: "All eigenvalues are real."
skills:
  - "Symmetric matrices"
---

What is the main idea of **Symmetric matrices**?

:::solution
One short answer is: All eigenvalues are real.
:::

---
id: "math-eigenvalues-211"
note: "math-eigenvalues"
title: "Review: Projection matrices"
type: "text"
answer: "If $P$ satisfies $$ P^2 = P $$ then its eigenvalues can only be $$ 0 \\quad \\text{or} \\quad 1 $$ Reason: $$ Pv = \\lambda v \\quad \\Rightarrow \\quad P^2v = \\lambda^2 v $$ but also $$ P^2v = Pv = \\lambda v $$ so $$ \\lambda^…"
skills:
  - "Projection matrices"
---

What is the main idea of **Projection matrices**?

:::solution
One short answer is: If $P$ satisfies $$ P^2 = P $$ then its eigenvalues can only be $$ 0 \quad \text{or} \quad 1 $$ Reason: $$ Pv = \lambda v \quad \Rightarrow \quad P^2v = \lambda^2 v $$ but also $$ P^2v = Pv = \lambda v $$ so $$ \lambda^…
:::

---
id: "math-eigenvalues-212"
note: "math-eigenvalues"
title: "Review: Nilpotent matrices"
type: "text"
answer: "If $$ A^k = 0 $$ for some positive integer $k$, then every eigenvalue of $A$ is $0$."
skills:
  - "Nilpotent matrices"
---

What is the main idea of **Nilpotent matrices**?

:::solution
One short answer is: If $$ A^k = 0 $$ for some positive integer $k$, then every eigenvalue of $A$ is $0$.
:::

---
id: "math-eigenvalues-213"
note: "math-eigenvalues"
title: "Review: Orthogonal matrices"
type: "text"
answer: "If $Q^TQ = I$, then over $\\mathbb{C}$ every eigenvalue satisfies $$ \\lambda = 1 $$ For real orthogonal matrices, eigenvalues may be real or complex. Real eigenvalues can only be $$ 1 \\quad \\text{or} \\quad -1 $$ ---"
skills:
  - "Orthogonal matrices"
---

What is the main idea of **Orthogonal matrices**?

:::solution
One short answer is: If $Q^TQ = I$, then over $\mathbb{C}$ every eigenvalue satisfies $$ \lambda = 1 $$ For real orthogonal matrices, eigenvalues may be real or complex. Real eigenvalues can only be $$ 1 \quad \text{or} \quad -1 $$ ---
:::

---
id: "math-eigenvalues-214"
note: "math-eigenvalues"
title: "Review: Complex eigenvalues and real matrices"
type: "text"
answer: "Not every real matrix has real eigenvalues."
skills:
  - "8. Complex eigenvalues and real matrices"
---

What is the main idea of **Complex eigenvalues and real matrices**?

:::solution
One short answer is: Not every real matrix has real eigenvalues.
:::

---
id: "math-eigenvalues-31"
note: "math-eigenvalues"
title: "Review: Conjugate pairs"
type: "text"
answer: "If a real matrix has a complex eigenvalue $$ \\lambda = a + bi $$ then its complex conjugate $$ \\bar{\\lambda} = a - bi $$ is also an eigenvalue."
skills:
  - "Conjugate pairs"
---

What is the main idea of **Conjugate pairs**?

:::solution
One short answer is: If a real matrix has a complex eigenvalue $$ \lambda = a + bi $$ then its complex conjugate $$ \bar{\lambda} = a - bi $$ is also an eigenvalue.
:::

---
id: "math-eigenvalues-32"
note: "math-eigenvalues"
title: "Review: How to compute eigenvalues by hand"
type: "text"
answer: "How to compute eigenvalues by hand"
skills:
  - "9. How to compute eigenvalues by hand"
---

What is the main idea of **How to compute eigenvalues by hand**?

:::solution
One short answer is: How to compute eigenvalues by hand
:::

---
id: "math-eigenvalues-33"
note: "math-eigenvalues"
title: "Review: For a general matrix"
type: "text"
answer: "Form $A - \\lambda I$."
skills:
  - "For a general matrix"
---

What is the main idea of **For a general matrix**?

:::solution
One short answer is: Form $A - \lambda I$.
:::

---
id: "math-eigenvalues-34"
note: "math-eigenvalues"
title: "Review: For a $2 \\times 2$ matrix"
type: "text"
answer: "If $$ A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} $$ then $$ \\det(A - \\lambda I) = \\lambda^2 - (a+d)\\lambda + (ad-bc) $$ So the eigenvalues satisfy $$ \\lambda^2 - \\operatorname{tr}(A)\\lambda + \\det(A) = 0 $$ This i…"
skills:
  - "For a $2 \\times 2$ matrix"
---

What is the main idea of **For a $2 \times 2$ matrix**?

:::solution
One short answer is: If $$ A = \begin{bmatrix} a & b \\ c & d \end{bmatrix} $$ then $$ \det(A - \lambda I) = \lambda^2 - (a+d)\lambda + (ad-bc) $$ So the eigenvalues satisfy $$ \lambda^2 - \operatorname{tr}(A)\lambda + \det(A) = 0 $$ This i…
:::

---
id: "math-eigenvalues-35"
note: "math-eigenvalues"
title: "Review: Sanity checks"
type: "text"
answer: "The sum of eigenvalues equals $\\operatorname{tr}(A)$."
skills:
  - "Sanity checks"
---

What is the main idea of **Sanity checks**?

:::solution
One short answer is: The sum of eigenvalues equals $\operatorname{tr}(A)$.
:::

---
id: "math-eigenvalues-36"
note: "math-eigenvalues"
title: "Review: Common computational shortcut"
type: "text"
answer: "For triangular matrices, do not expand a full determinant. Read the eigenvalues directly from the diagonal. ---"
skills:
  - "Common computational shortcut"
---

Name one common mistake the note warns about in **Common computational shortcut**.

:::solution
One short answer is: For triangular matrices, do not expand a full determinant. Read the eigenvalues directly from the diagonal. ---
:::

---
id: "math-eigenvalues-37"
note: "math-eigenvalues"
title: "Review: Applications"
type: "text"
answer: "Applications"
skills:
  - "10. Applications"
---

What is the main idea of **Applications**?

:::solution
One short answer is: Applications
:::

---
id: "math-eigenvalues-38"
note: "math-eigenvalues"
title: "Review: Dynamical systems"
type: "text"
answer: "If $ \\lambda < 1$, the associated mode decays."
skills:
  - "Dynamical systems"
---

What is the main idea of **Dynamical systems**?

:::solution
One short answer is: If $ \lambda < 1$, the associated mode decays.
:::

---
id: "math-eigenvalues-39"
note: "math-eigenvalues"
title: "Review: Differential equations"
type: "text"
answer: "For systems such as $$ x'(t) = Ax(t) $$ eigenvalues describe growth, decay, and oscillation. Diagonalization can reduce the system to decoupled scalar equations."
skills:
  - "Differential equations"
---

What is the main idea of **Differential equations**?

:::solution
One short answer is: For systems such as $$ x'(t) = Ax(t) $$ eigenvalues describe growth, decay, and oscillation. Diagonalization can reduce the system to decoupled scalar equations.
:::

---
id: "math-eigenvalues-310"
note: "math-eigenvalues"
title: "Review: Principal directions"
type: "text"
answer: "Principal component analysis"
skills:
  - "Principal directions"
---

What is the main idea of **Principal directions**?

:::solution
One short answer is: Principal component analysis
:::

---
id: "math-eigenvalues-311"
note: "math-eigenvalues"
title: "Review: Markov chains"
type: "text"
answer: "For a stochastic matrix, $\\lambda = 1$ is especially important. The corresponding eigenvectors help describe steady states and long-run distributions. ---"
skills:
  - "Markov chains"
---

What is the main idea of **Markov chains**?

:::solution
One short answer is: For a stochastic matrix, $\lambda = 1$ is especially important. The corresponding eigenvectors help describe steady states and long-run distributions. ---
:::

---
id: "math-eigenvalues-312"
note: "math-eigenvalues"
title: "Review: Problem-solving workflow"
type: "text"
answer: "Use this checklist for most eigenvalue problems."
skills:
  - "11. Problem-solving workflow"
---

According to the note, what sequence of steps is recommended in **Problem-solving workflow**?

:::solution
One short answer is: Use this checklist for most eigenvalue problems.
:::

---
id: "math-eigenvalues-313"
note: "math-eigenvalues"
title: "Review: Step 1: Confirm the matrix is square"
type: "text"
answer: "If $A$ is not square, standard eigenvalues are not defined."
skills:
  - "Step 1: Confirm the matrix is square"
---

What is the main idea of **Step 1: Confirm the matrix is square**?

:::solution
One short answer is: If $A$ is not square, standard eigenvalues are not defined.
:::

---
id: "math-eigenvalues-314"
note: "math-eigenvalues"
title: "Review: Step 2: Form the characteristic polynomial"
type: "text"
answer: "Compute $$ \\det(A - \\lambda I) $$ and solve for $\\lambda$."
skills:
  - "Step 2: Form the characteristic polynomial"
---

What is the main idea of **Step 2: Form the characteristic polynomial**?

:::solution
One short answer is: Compute $$ \det(A - \lambda I) $$ and solve for $\lambda$.
:::

---
id: "math-eigenvalues-41"
note: "math-eigenvalues"
title: "Review: Step 3: Use structure before brute force"
type: "text"
answer: "Triangular"
skills:
  - "Step 3: Use structure before brute force"
---

What is the main idea of **Step 3: Use structure before brute force**?

:::solution
One short answer is: Triangular
:::

---
id: "math-eigenvalues-42"
note: "math-eigenvalues"
title: "Review: Step 4: Find eigenspaces"
type: "text"
answer: "For each eigenvalue, solve $$ (A - \\lambda I)v = 0 $$ using row reduction."
skills:
  - "Step 4: Find eigenspaces"
---

What is the main idea of **Step 4: Find eigenspaces**?

:::solution
One short answer is: For each eigenvalue, solve $$ (A - \lambda I)v = 0 $$ using row reduction.
:::

---
id: "math-eigenvalues-43"
note: "math-eigenvalues"
title: "Review: Step 5: Compare multiplicities"
type: "text"
answer: "If an eigenvalue repeats, check whether its eigenspace has enough dimension."
skills:
  - "Step 5: Compare multiplicities"
---

What is the main idea of **Step 5: Compare multiplicities**?

:::solution
One short answer is: If an eigenvalue repeats, check whether its eigenspace has enough dimension.
:::

---
id: "math-eigenvalues-44"
note: "math-eigenvalues"
title: "Review: Step 6: Decide whether diagonalization is possible"
type: "text"
answer: "Count the number of linearly independent eigenvectors."
skills:
  - "Step 6: Decide whether diagonalization is possible"
---

What is the main idea of **Step 6: Decide whether diagonalization is possible**?

:::solution
One short answer is: Count the number of linearly independent eigenvectors.
:::

---
id: "math-eigenvalues-45"
note: "math-eigenvalues"
title: "Review: Step 7: Verify with trace and determinant"
type: "text"
answer: "Use $$ \\sum \\lambda i = \\operatorname{tr}(A), \\qquad \\prod \\lambda i = \\det(A) $$ to catch arithmetic mistakes. ---"
skills:
  - "Step 7: Verify with trace and determinant"
---

What is the main idea of **Step 7: Verify with trace and determinant**?

:::solution
One short answer is: Use $$ \sum \lambda i = \operatorname{tr}(A), \qquad \prod \lambda i = \det(A) $$ to catch arithmetic mistakes. ---
:::

---
id: "math-eigenvalues-46"
note: "math-eigenvalues"
title: "Review: Formula sheet"
type: "text"
answer: "Formula sheet"
skills:
  - "12. Formula sheet"
---

What core formulas or relations are summarized in **Formula sheet**?

:::solution
One short answer is: Formula sheet
:::

---
id: "math-eigenvalues-47"
note: "math-eigenvalues"
title: "Review: Definitions"
type: "text"
answer: "$$ Av = \\lambda v,\\qquad v \\ne 0 $$ $$ (A - \\lambda I)v = 0 $$ $$ \\det(A - \\lambda I) = 0 $$ $$ E \\lambda = \\operatorname{Null}(A - \\lambda I) $$"
skills:
  - "Definitions"
---

What core idea is introduced in **Definitions**?

:::solution
One short answer is: $$ Av = \lambda v,\qquad v \ne 0 $$ $$ (A - \lambda I)v = 0 $$ $$ \det(A - \lambda I) = 0 $$ $$ E \lambda = \operatorname{Null}(A - \lambda I) $$
:::

---
id: "math-eigenvalues-48"
note: "math-eigenvalues"
title: "Review: Multiplicity"
type: "text"
answer: "$$ 1 \\le \\dim(E \\lambda) \\le \\text{algebraic multiplicity of } \\lambda $$"
skills:
  - "Multiplicity"
---

What is the main idea of **Multiplicity**?

:::solution
One short answer is: $$ 1 \le \dim(E \lambda) \le \text{algebraic multiplicity of } \lambda $$
:::

---
id: "math-eigenvalues-49"
note: "math-eigenvalues"
title: "Review: Determinant and trace"
type: "text"
answer: "$$ \\det(A) = \\lambda 1 \\lambda 2 \\cdots \\lambda n $$ $$ \\operatorname{tr}(A) = \\lambda 1 + \\lambda 2 + \\cdots + \\lambda n $$"
skills:
  - "Determinant and trace"
---

What is the main idea of **Determinant and trace**?

:::solution
One short answer is: $$ \det(A) = \lambda 1 \lambda 2 \cdots \lambda n $$ $$ \operatorname{tr}(A) = \lambda 1 + \lambda 2 + \cdots + \lambda n $$
:::

---
id: "math-eigenvalues-410"
note: "math-eigenvalues"
title: "Review: Invertibility"
type: "text"
answer: "$$ A \\text{ invertible } \\iff 0 \\text{ is not an eigenvalue} $$"
skills:
  - "Invertibility"
---

What is the main idea of **Invertibility**?

:::solution
One short answer is: $$ A \text{ invertible } \iff 0 \text{ is not an eigenvalue} $$
:::

---
id: "math-eigenvalues-411"
note: "math-eigenvalues"
title: "Review: Diagonalization"
type: "text"
answer: "$$ A = PDP^{-1} $$ $$ A \\text{ diagonalizable } \\iff A \\text{ has } n \\text{ linearly independent eigenvectors} $$ $$ A^k = PD^kP^{-1} $$"
skills:
  - "Diagonalization"
---

What is the main idea of **Diagonalization**?

:::solution
One short answer is: $$ A = PDP^{-1} $$ $$ A \text{ diagonalizable } \iff A \text{ has } n \text{ linearly independent eigenvectors} $$ $$ A^k = PD^kP^{-1} $$
:::

---
id: "math-eigenvalues-412"
note: "math-eigenvalues"
title: "Review: Real symmetric matrices"
type: "text"
answer: "$$ A = QDQ^T $$ with $Q$ orthogonal and $D$ diagonal."
skills:
  - "Real symmetric matrices"
---

What is the main idea of **Real symmetric matrices**?

:::solution
One short answer is: $$ A = QDQ^T $$ with $Q$ orthogonal and $D$ diagonal.
:::

---
id: "math-eigenvalues-413"
note: "math-eigenvalues"
title: "Review: Special cases"
type: "text"
answer: "For triangular $A$, eigenvalues are the diagonal entries. For $$ A = \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} $$ the characteristic polynomial is $$ \\lambda^2 - (a+d)\\lambda + (ad-bc) $$ ---"
skills:
  - "Special cases"
---

What is the main idea of **Special cases**?

:::solution
One short answer is: For triangular $A$, eigenvalues are the diagonal entries. For $$ A = \begin{bmatrix} a & b \\ c & d \end{bmatrix} $$ the characteristic polynomial is $$ \lambda^2 - (a+d)\lambda + (ad-bc) $$ ---
:::

---
id: "math-eigenvalues-414"
note: "math-eigenvalues"
title: "Review: Common mistakes to avoid"
type: "text"
answer: "Forgetting that eigenvalues are defined for square matrices."
skills:
  - "Common mistakes to avoid"
---

Name one common mistake the note warns about in **Common mistakes to avoid**.

:::solution
One short answer is: Forgetting that eigenvalues are defined for square matrices.
:::
