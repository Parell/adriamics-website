---
id: "math-systems-of-odes-11"
note: "math-systems-of-odes"
title: "Review: What a system of ODEs is"
type: "text"
answer: "mechanics and oscillations"
skills:
  - "1. What a system of ODEs is"
---

What core idea is introduced in **What a system of ODEs is**?

:::solution
One short answer is: mechanics and oscillations
:::

---
id: "math-systems-of-odes-12"
note: "math-systems-of-odes"
title: "Review: Initial value problems"
type: "text"
answer: "Most textbook systems are initial value problems : $$ \\mathbf{x}' = \\mathbf{f}(t, \\mathbf{x}), \\qquad \\mathbf{x}(t 0) = \\mathbf{x} 0 $$ An initial condition fixes the particular solution among the family of all solution…"
skills:
  - "Initial value problems"
---

What is the main idea of **Initial value problems**?

:::solution
One short answer is: Most textbook systems are initial value problems : $$ \mathbf{x}' = \mathbf{f}(t, \mathbf{x}), \qquad \mathbf{x}(t 0) = \mathbf{x} 0 $$ An initial condition fixes the particular solution among the family of all solution…
:::

---
id: "math-systems-of-odes-13"
note: "math-systems-of-odes"
title: "Review: Matrix form and solution structure"
type: "text"
answer: "Many systems can be written compactly with vectors and matrices."
skills:
  - "2. Matrix form and solution structure"
---

What is the main idea of **Matrix form and solution structure**?

:::solution
One short answer is: Many systems can be written compactly with vectors and matrices.
:::

---
id: "math-systems-of-odes-14"
note: "math-systems-of-odes"
title: "Review: Linear system"
type: "text"
answer: "$\\mathbf{x}(t)$ is the unknown vector"
skills:
  - "Linear system"
---

What is the main idea of **Linear system**?

:::solution
One short answer is: $\mathbf{x}(t)$ is the unknown vector
:::

---
id: "math-systems-of-odes-15"
note: "math-systems-of-odes"
title: "Review: Superposition"
type: "text"
answer: "if $\\mathbf{x} 1$ and $\\mathbf{x} 2$ are solutions, then $\\mathbf{x} 1 + \\mathbf{x} 2$ is also a solution"
skills:
  - "Superposition"
---

What is the main idea of **Superposition**?

:::solution
One short answer is: if $\mathbf{x} 1$ and $\mathbf{x} 2$ are solutions, then $\mathbf{x} 1 + \mathbf{x} 2$ is also a solution
:::

---
id: "math-systems-of-odes-16"
note: "math-systems-of-odes"
title: "Review: Dimension of the solution space"
type: "text"
answer: "For an $n \\times n$ first-order linear homogeneous system, the general solution depends on $n$ constants. Equivalently, you need $n$ independent initial conditions to determine a unique solution. ---"
skills:
  - "Dimension of the solution space"
---

What is the main idea of **Dimension of the solution space**?

:::solution
One short answer is: For an $n \times n$ first-order linear homogeneous system, the general solution depends on $n$ constants. Equivalently, you need $n$ independent initial conditions to determine a unique solution. ---
:::

---
id: "math-systems-of-odes-17"
note: "math-systems-of-odes"
title: "Review: Linear autonomous systems"
type: "text"
answer: "The canonical form is $$ \\mathbf{x}' = A\\mathbf{x} $$ with constant matrix $A$."
skills:
  - "3. Linear autonomous systems"
---

What is the main idea of **Linear autonomous systems**?

:::solution
One short answer is: The canonical form is $$ \mathbf{x}' = A\mathbf{x} $$ with constant matrix $A$.
:::

---
id: "math-systems-of-odes-18"
note: "math-systems-of-odes"
title: "Review: Why this case matters"
type: "text"
answer: "eigenvalues determine growth, decay, oscillation, and stability"
skills:
  - "Why this case matters"
---

What is the main idea of **Why this case matters**?

:::solution
One short answer is: eigenvalues determine growth, decay, oscillation, and stability
:::

---
id: "math-systems-of-odes-19"
note: "math-systems-of-odes"
title: "Review: Decoupling idea"
type: "text"
answer: "If you can find a change of variables that diagonalizes or simplifies $A$, the system may split into independent scalar ODEs. This is the linear-algebra viewpoint behind most solution methods. ---"
skills:
  - "Decoupling idea"
---

What is the main idea of **Decoupling idea**?

:::solution
One short answer is: If you can find a change of variables that diagonalizes or simplifies $A$, the system may split into independent scalar ODEs. This is the linear-algebra viewpoint behind most solution methods. ---
:::

---
id: "math-systems-of-odes-110"
note: "math-systems-of-odes"
title: "Review: Eigenvalues and eigenvectors"
type: "text"
answer: "For a homogeneous linear system $\\mathbf{x}' = A\\mathbf{x}$, try solutions of the form $$ \\mathbf{x}(t) = e^{\\lambda t}\\mathbf{v} $$ Substituting gives $$ \\lambda \\mathbf{v} = A\\mathbf{v} $$ so $\\lambda$ must be an eige…"
skills:
  - "4. Eigenvalues and eigenvectors"
---

What is the main idea of **Eigenvalues and eigenvectors**?

:::solution
One short answer is: For a homogeneous linear system $\mathbf{x}' = A\mathbf{x}$, try solutions of the form $$ \mathbf{x}(t) = e^{\lambda t}\mathbf{v} $$ Substituting gives $$ \lambda \mathbf{v} = A\mathbf{v} $$ so $\lambda$ must be an eige…
:::

---
id: "math-systems-of-odes-111"
note: "math-systems-of-odes"
title: "Review: General principle"
type: "text"
answer: "Each eigenpair $(\\lambda, \\mathbf{v})$ gives a solution $$ \\mathbf{x}(t) = e^{\\lambda t}\\mathbf{v} $$ If the eigenvalues are distinct and the matrix is diagonalizable, the general solution is a linear combination of the…"
skills:
  - "General principle"
---

What is the main idea of **General principle**?

:::solution
One short answer is: Each eigenpair $(\lambda, \mathbf{v})$ gives a solution $$ \mathbf{x}(t) = e^{\lambda t}\mathbf{v} $$ If the eigenvalues are distinct and the matrix is diagonalizable, the general solution is a linear combination of the…
:::

---
id: "math-systems-of-odes-112"
note: "math-systems-of-odes"
title: "Review: Real eigenvalues"
type: "text"
answer: "$\\lambda < 0$ gives exponential decay"
skills:
  - "Real eigenvalues"
---

What is the main idea of **Real eigenvalues**?

:::solution
One short answer is: $\lambda < 0$ gives exponential decay
:::

---
id: "math-systems-of-odes-113"
note: "math-systems-of-odes"
title: "Review: Complex eigenvalues"
type: "text"
answer: "If $$ \\lambda = \\alpha \\pm \\beta i $$ then solutions involve oscillation with exponential envelope: $$ e^{\\alpha t}(\\cos \\beta t,\\ \\sin \\beta t) $$ More precisely, a complex eigenpair produces two real solutions obtaine…"
skills:
  - "Complex eigenvalues"
---

What is the main idea of **Complex eigenvalues**?

:::solution
One short answer is: If $$ \lambda = \alpha \pm \beta i $$ then solutions involve oscillation with exponential envelope: $$ e^{\alpha t}(\cos \beta t,\ \sin \beta t) $$ More precisely, a complex eigenpair produces two real solutions obtaine…
:::

---
id: "math-systems-of-odes-114"
note: "math-systems-of-odes"
title: "Review: Repeated eigenvalues"
type: "text"
answer: "if there are enough independent eigenvectors, the matrix is still diagonalizable"
skills:
  - "Repeated eigenvalues"
---

What is the main idea of **Repeated eigenvalues**?

:::solution
One short answer is: if there are enough independent eigenvectors, the matrix is still diagonalizable
:::

---
id: "math-systems-of-odes-21"
note: "math-systems-of-odes"
title: "Review: The matrix exponential"
type: "text"
answer: "The exact solution of $$ \\mathbf{x}' = A\\mathbf{x}, \\qquad \\mathbf{x}(0)=\\mathbf{x} 0 $$ is $$ \\mathbf{x}(t)=e^{At}\\mathbf{x} 0 $$ where $e^{At}$ is the matrix exponential ."
skills:
  - "5. The matrix exponential"
---

What is the main idea of **The matrix exponential**?

:::solution
One short answer is: The exact solution of $$ \mathbf{x}' = A\mathbf{x}, \qquad \mathbf{x}(0)=\mathbf{x} 0 $$ is $$ \mathbf{x}(t)=e^{At}\mathbf{x} 0 $$ where $e^{At}$ is the matrix exponential .
:::

---
id: "math-systems-of-odes-22"
note: "math-systems-of-odes"
title: "Review: Definition"
type: "text"
answer: "$$ e^{At} = I + At + \\frac{(At)^2}{2!} + \\frac{(At)^3}{3!} + \\cdots $$ This is analogous to the scalar exponential series."
skills:
  - "Definition"
---

What core idea is introduced in **Definition**?

:::solution
One short answer is: $$ e^{At} = I + At + \frac{(At)^2}{2!} + \frac{(At)^3}{3!} + \cdots $$ This is analogous to the scalar exponential series.
:::

---
id: "math-systems-of-odes-23"
note: "math-systems-of-odes"
title: "Review: Diagonalizable case"
type: "text"
answer: "If $$ A = PDP^{-1} $$ with diagonal $D = \\operatorname{diag}(\\lambda 1,\\dots,\\lambda n)$, then $$ e^{At} = Pe^{Dt}P^{-1} $$ and $$ e^{Dt} = \\operatorname{diag}(e^{\\lambda 1 t}, \\dots, e^{\\lambda n t}) $$ This is the cle…"
skills:
  - "Diagonalizable case"
---

What is the main idea of **Diagonalizable case**?

:::solution
One short answer is: If $$ A = PDP^{-1} $$ with diagonal $D = \operatorname{diag}(\lambda 1,\dots,\lambda n)$, then $$ e^{At} = Pe^{Dt}P^{-1} $$ and $$ e^{Dt} = \operatorname{diag}(e^{\lambda 1 t}, \dots, e^{\lambda n t}) $$ This is the cle…
:::

---
id: "math-systems-of-odes-24"
note: "math-systems-of-odes"
title: "Review: Practical use"
type: "text"
answer: "diagonalization"
skills:
  - "Practical use"
---

What is the main idea of **Practical use**?

:::solution
One short answer is: diagonalization
:::

---
id: "math-systems-of-odes-25"
note: "math-systems-of-odes"
title: "Review: Nonhomogeneous linear systems"
type: "text"
answer: "The forced system $$ \\mathbf{x}' = A\\mathbf{x} + \\mathbf{g}(t) $$ combines natural dynamics from $A$ with external input $\\mathbf{g}(t)$."
skills:
  - "6. Nonhomogeneous linear systems"
---

What is the main idea of **Nonhomogeneous linear systems**?

:::solution
One short answer is: The forced system $$ \mathbf{x}' = A\mathbf{x} + \mathbf{g}(t) $$ combines natural dynamics from $A$ with external input $\mathbf{g}(t)$.
:::

---
id: "math-systems-of-odes-26"
note: "math-systems-of-odes"
title: "Review: General solution structure"
type: "text"
answer: "$\\mathbf{x} h$ solves the homogeneous system $\\mathbf{x}' = A\\mathbf{x}$"
skills:
  - "General solution structure"
---

What is the main idea of **General solution structure**?

:::solution
One short answer is: $\mathbf{x} h$ solves the homogeneous system $\mathbf{x}' = A\mathbf{x}$
:::

---
id: "math-systems-of-odes-27"
note: "math-systems-of-odes"
title: "Review: Variation of parameters"
type: "text"
answer: "If $\\Phi(t)$ is a fundamental matrix for $\\mathbf{x}' = A\\mathbf{x}$, then a particular solution can be written as $$ \\mathbf{x} p(t) = \\Phi(t)\\int \\Phi(t)^{-1}\\mathbf{g}(t)\\,dt $$ This is the matrix version of variatio…"
skills:
  - "Variation of parameters"
---

What is the main idea of **Variation of parameters**?

:::solution
One short answer is: If $\Phi(t)$ is a fundamental matrix for $\mathbf{x}' = A\mathbf{x}$, then a particular solution can be written as $$ \mathbf{x} p(t) = \Phi(t)\int \Phi(t)^{-1}\mathbf{g}(t)\,dt $$ This is the matrix version of variatio…
:::

---
id: "math-systems-of-odes-28"
note: "math-systems-of-odes"
title: "Review: Common forcing types"
type: "text"
answer: "constants"
skills:
  - "Common forcing types"
---

Name one common mistake the note warns about in **Common forcing types**.

:::solution
One short answer is: constants
:::

---
id: "math-systems-of-odes-29"
note: "math-systems-of-odes"
title: "Review: Phase portraits and stability"
type: "text"
answer: "For a two-dimensional autonomous system, the phase plane is the $(x,y)$ plane of states. A phase portrait shows representative trajectories."
skills:
  - "7. Phase portraits and stability"
---

What is the main idea of **Phase portraits and stability**?

:::solution
One short answer is: For a two-dimensional autonomous system, the phase plane is the $(x,y)$ plane of states. A phase portrait shows representative trajectories.
:::

---
id: "math-systems-of-odes-210"
note: "math-systems-of-odes"
title: "Review: Equilibria"
type: "text"
answer: "An equilibrium point satisfies $$ \\mathbf{f}(\\mathbf{x}^ ) = \\mathbf{0} $$ For a linear system $\\mathbf{x}' = A\\mathbf{x}$, the only equilibrium is usually the origin unless the system is degenerate."
skills:
  - "Equilibria"
---

What is the main idea of **Equilibria**?

:::solution
One short answer is: An equilibrium point satisfies $$ \mathbf{f}(\mathbf{x}^ ) = \mathbf{0} $$ For a linear system $\mathbf{x}' = A\mathbf{x}$, the only equilibrium is usually the origin unless the system is degenerate.
:::

---
id: "math-systems-of-odes-211"
note: "math-systems-of-odes"
title: "Review: Stability ideas"
type: "text"
answer: "stable if nearby trajectories stay nearby"
skills:
  - "Stability ideas"
---

What is the main idea of **Stability ideas**?

:::solution
One short answer is: stable if nearby trajectories stay nearby
:::

---
id: "math-systems-of-odes-212"
note: "math-systems-of-odes"
title: "Review: Classification for 2x2 systems"
type: "text"
answer: "Let the eigenvalues of $A$ be $\\lambda 1,\\lambda 2$."
skills:
  - "Classification for 2x2 systems"
---

What is the main idea of **Classification for 2x2 systems**?

:::solution
One short answer is: Let the eigenvalues of $A$ be $\lambda 1,\lambda 2$.
:::

---
id: "math-systems-of-odes-213"
note: "math-systems-of-odes"
title: "Review: Trace-determinant test for 2x2 systems"
type: "text"
answer: "For $$ A= \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} $$ define: $$ \\tau = \\operatorname{tr}(A)=a+d, \\qquad \\Delta = \\det(A)=ad-bc $$ Then the characteristic polynomial is $$ \\lambda^2 - \\tau \\lambda + \\Delta = 0 $$ an…"
skills:
  - "Trace-determinant test for 2x2 systems"
---

What is the main idea of **Trace-determinant test for 2x2 systems**?

:::solution
One short answer is: For $$ A= \begin{bmatrix} a & b \\ c & d \end{bmatrix} $$ define: $$ \tau = \operatorname{tr}(A)=a+d, \qquad \Delta = \det(A)=ad-bc $$ Then the characteristic polynomial is $$ \lambda^2 - \tau \lambda + \Delta = 0 $$ an…
:::

---
id: "math-systems-of-odes-214"
note: "math-systems-of-odes"
title: "Review: Nonlinear systems and linearization"
type: "text"
answer: "A nonlinear system has the form $$ \\mathbf{x}' = \\mathbf{f}(\\mathbf{x}) $$ or more generally $$ \\mathbf{x}' = \\mathbf{f}(t,\\mathbf{x}) $$ Nonlinear systems can have multiple equilibria, limit cycles, bifurcations, and b…"
skills:
  - "8. Nonlinear systems and linearization"
---

What is the main idea of **Nonlinear systems and linearization**?

:::solution
One short answer is: A nonlinear system has the form $$ \mathbf{x}' = \mathbf{f}(\mathbf{x}) $$ or more generally $$ \mathbf{x}' = \mathbf{f}(t,\mathbf{x}) $$ Nonlinear systems can have multiple equilibria, limit cycles, bifurcations, and b…
:::

---
id: "math-systems-of-odes-31"
note: "math-systems-of-odes"
title: "Review: Linearization"
type: "text"
answer: "Near an equilibrium point $\\mathbf{x}^ $, approximate the system by its Jacobian matrix: $$ \\mathbf{x}' \\approx J(\\mathbf{x}^ )(\\mathbf{x}-\\mathbf{x}^ ) $$ where $$ J(\\mathbf{x}) = \\left[ \\frac{\\partial f i}{\\partial x…"
skills:
  - "Linearization"
---

What is the main idea of **Linearization**?

:::solution
One short answer is: Near an equilibrium point $\mathbf{x}^ $, approximate the system by its Jacobian matrix: $$ \mathbf{x}' \approx J(\mathbf{x}^ )(\mathbf{x}-\mathbf{x}^ ) $$ where $$ J(\mathbf{x}) = \left[ \frac{\partial f i}{\partial x…
:::

---
id: "math-systems-of-odes-32"
note: "math-systems-of-odes"
title: "Review: Interpreting the linearization"
type: "text"
answer: "If the linearized system has eigenvalues with negative real part, the equilibrium is often locally asymptotically stable."
skills:
  - "Interpreting the linearization"
---

What is the main idea of **Interpreting the linearization**?

:::solution
One short answer is: If the linearized system has eigenvalues with negative real part, the equilibrium is often locally asymptotically stable.
:::

---
id: "math-systems-of-odes-33"
note: "math-systems-of-odes"
title: "Review: Caveat"
type: "text"
answer: "Linearization is a local tool. It tells you about behavior near an equilibrium, not the full global dynamics. ---"
skills:
  - "Caveat"
---

What is the main idea of **Caveat**?

:::solution
One short answer is: Linearization is a local tool. It tells you about behavior near an equilibrium, not the full global dynamics. ---
:::

---
id: "math-systems-of-odes-34"
note: "math-systems-of-odes"
title: "Review: Common modeling patterns"
type: "text"
answer: "Common modeling patterns"
skills:
  - "9. Common modeling patterns"
---

Name one common mistake the note warns about in **Common modeling patterns**.

:::solution
One short answer is: Common modeling patterns
:::

---
id: "math-systems-of-odes-35"
note: "math-systems-of-odes"
title: "Review: Coupled growth and decay"
type: "text"
answer: "If one variable feeds another, the system may look like $$ \\mathbf{x}' = A\\mathbf{x} $$ with off-diagonal terms representing interaction rates."
skills:
  - "Coupled growth and decay"
---

What is the main idea of **Coupled growth and decay**?

:::solution
One short answer is: If one variable feeds another, the system may look like $$ \mathbf{x}' = A\mathbf{x} $$ with off-diagonal terms representing interaction rates.
:::

---
id: "math-systems-of-odes-36"
note: "math-systems-of-odes"
title: "Review: Mass-spring systems"
type: "text"
answer: "Second-order equations often become first-order systems by introducing velocity."
skills:
  - "Mass-spring systems"
---

What is the main idea of **Mass-spring systems**?

:::solution
One short answer is: Second-order equations often become first-order systems by introducing velocity.
:::

---
id: "math-systems-of-odes-37"
note: "math-systems-of-odes"
title: "Review: Predator-prey models"
type: "text"
answer: "Typical nonlinear interactions are modeled by $$ \\begin{aligned} x' &= f(x,y) \\\\ y' &= g(x,y) \\end{aligned} $$ where growth of one species depends on the other."
skills:
  - "Predator-prey models"
---

What is the main idea of **Predator-prey models**?

:::solution
One short answer is: Typical nonlinear interactions are modeled by $$ \begin{aligned} x' &= f(x,y) \\ y' &= g(x,y) \end{aligned} $$ where growth of one species depends on the other.
:::

---
id: "math-systems-of-odes-38"
note: "math-systems-of-odes"
title: "Review: Electrical circuits"
type: "text"
answer: "In circuits with capacitors and inductors, Kirchhoff's laws often produce systems for charge and current. These are frequently linear with constant coefficients. ---"
skills:
  - "Electrical circuits"
---

What is the main idea of **Electrical circuits**?

:::solution
One short answer is: In circuits with capacitors and inductors, Kirchhoff's laws often produce systems for charge and current. These are frequently linear with constant coefficients. ---
:::

---
id: "math-systems-of-odes-39"
note: "math-systems-of-odes"
title: "Review: Problem-solving workflow"
type: "text"
answer: "When solving a system of ODEs, use a disciplined sequence."
skills:
  - "10. Problem-solving workflow"
---

According to the note, what sequence of steps is recommended in **Problem-solving workflow**?

:::solution
One short answer is: When solving a system of ODEs, use a disciplined sequence.
:::

---
id: "math-systems-of-odes-310"
note: "math-systems-of-odes"
title: "Review: Identify the type"
type: "text"
answer: "linear or nonlinear"
skills:
  - "1. Identify the type"
---

What is the main idea of **Identify the type**?

:::solution
One short answer is: linear or nonlinear
:::

---
id: "math-systems-of-odes-311"
note: "math-systems-of-odes"
title: "Review: Rewrite in matrix form"
type: "text"
answer: "Put the system into $$ \\mathbf{x}' = A\\mathbf{x} + \\mathbf{g}(t) $$ if possible."
skills:
  - "2. Rewrite in matrix form"
---

What is the main idea of **Rewrite in matrix form**?

:::solution
One short answer is: Put the system into $$ \mathbf{x}' = A\mathbf{x} + \mathbf{g}(t) $$ if possible.
:::

---
id: "math-systems-of-odes-312"
note: "math-systems-of-odes"
title: "Review: Find equilibria"
type: "text"
answer: "Set all derivatives to zero and solve the algebraic system."
skills:
  - "3. Find equilibria"
---

What is the main idea of **Find equilibria**?

:::solution
One short answer is: Set all derivatives to zero and solve the algebraic system.
:::

---
id: "math-systems-of-odes-313"
note: "math-systems-of-odes"
title: "Review: Compute eigenvalues"
type: "text"
answer: "For linear systems, compute the characteristic polynomial: $$ \\det(A-\\lambda I)=0 $$"
skills:
  - "4. Compute eigenvalues"
---

What is the main idea of **Compute eigenvalues**?

:::solution
One short answer is: For linear systems, compute the characteristic polynomial: $$ \det(A-\lambda I)=0 $$
:::

---
id: "math-systems-of-odes-314"
note: "math-systems-of-odes"
title: "Review: Build the solution basis"
type: "text"
answer: "eigenvectors if $A$ is diagonalizable"
skills:
  - "5. Build the solution basis"
---

What is the main idea of **Build the solution basis**?

:::solution
One short answer is: eigenvectors if $A$ is diagonalizable
:::

---
id: "math-systems-of-odes-41"
note: "math-systems-of-odes"
title: "Review: Apply initial conditions"
type: "text"
answer: "Substitute the initial state to determine the constants."
skills:
  - "6. Apply initial conditions"
---

What is the main idea of **Apply initial conditions**?

:::solution
One short answer is: Substitute the initial state to determine the constants.
:::

---
id: "math-systems-of-odes-42"
note: "math-systems-of-odes"
title: "Review: Interpret the result"
type: "text"
answer: "grows or decays"
skills:
  - "7. Interpret the result"
---

What is the main idea of **Interpret the result**?

:::solution
One short answer is: grows or decays
:::

---
id: "math-systems-of-odes-43"
note: "math-systems-of-odes"
title: "Review: Formula sheet"
type: "text"
answer: "Formula sheet"
skills:
  - "11. Formula sheet"
---

What core formulas or relations are summarized in **Formula sheet**?

:::solution
One short answer is: Formula sheet
:::

---
id: "math-systems-of-odes-44"
note: "math-systems-of-odes"
title: "Review: Homogeneous linear system"
type: "text"
answer: "$$ \\mathbf{x}' = A\\mathbf{x} $$"
skills:
  - "Homogeneous linear system"
---

What is the main idea of **Homogeneous linear system**?

:::solution
One short answer is: $$ \mathbf{x}' = A\mathbf{x} $$
:::

---
id: "math-systems-of-odes-45"
note: "math-systems-of-odes"
title: "Review: Exact solution"
type: "text"
answer: "$$ \\mathbf{x}(t)=e^{At}\\mathbf{x}(0) $$"
skills:
  - "Exact solution"
---

What is the main idea of **Exact solution**?

:::solution
One short answer is: $$ \mathbf{x}(t)=e^{At}\mathbf{x}(0) $$
:::

---
id: "math-systems-of-odes-46"
note: "math-systems-of-odes"
title: "Review: Matrix exponential"
type: "text"
answer: "$$ e^{At}=I+At+\\frac{(At)^2}{2!}+\\cdots $$"
skills:
  - "Matrix exponential"
---

What is the main idea of **Matrix exponential**?

:::solution
One short answer is: $$ e^{At}=I+At+\frac{(At)^2}{2!}+\cdots $$
:::

---
id: "math-systems-of-odes-47"
note: "math-systems-of-odes"
title: "Review: Eigenmode solution"
type: "text"
answer: "If $A\\mathbf{v}=\\lambda\\mathbf{v}$, then $$ \\mathbf{x}(t)=e^{\\lambda t}\\mathbf{v} $$"
skills:
  - "Eigenmode solution"
---

What is the main idea of **Eigenmode solution**?

:::solution
One short answer is: If $A\mathbf{v}=\lambda\mathbf{v}$, then $$ \mathbf{x}(t)=e^{\lambda t}\mathbf{v} $$
:::

---
id: "math-systems-of-odes-48"
note: "math-systems-of-odes"
title: "Review: Characteristic polynomial for 2x2 systems"
type: "text"
answer: "$$ \\lambda^2-\\operatorname{tr}(A)\\lambda+\\det(A)=0 $$"
skills:
  - "Characteristic polynomial for 2x2 systems"
---

What is the main idea of **Characteristic polynomial for 2x2 systems**?

:::solution
One short answer is: $$ \lambda^2-\operatorname{tr}(A)\lambda+\det(A)=0 $$
:::

---
id: "math-systems-of-odes-49"
note: "math-systems-of-odes"
title: "Review: Linearization near equilibrium"
type: "text"
answer: "$$ \\mathbf{x}' \\approx J(\\mathbf{x}^ )(\\mathbf{x}-\\mathbf{x}^ ) $$"
skills:
  - "Linearization near equilibrium"
---

What is the main idea of **Linearization near equilibrium**?

:::solution
One short answer is: $$ \mathbf{x}' \approx J(\mathbf{x}^ )(\mathbf{x}-\mathbf{x}^ ) $$
:::

---
id: "math-systems-of-odes-410"
note: "math-systems-of-odes"
title: "Review: Forced linear system"
type: "text"
answer: "$$ \\mathbf{x}' = A\\mathbf{x} + \\mathbf{g}(t) $$"
skills:
  - "Forced linear system"
---

What is the main idea of **Forced linear system**?

:::solution
One short answer is: $$ \mathbf{x}' = A\mathbf{x} + \mathbf{g}(t) $$
:::

---
id: "math-systems-of-odes-411"
note: "math-systems-of-odes"
title: "Review: Variation of parameters"
type: "text"
answer: "$$ \\mathbf{x} p(t)=\\Phi(t)\\int \\Phi(t)^{-1}\\mathbf{g}(t)\\,dt $$ ---"
skills:
  - "Variation of parameters"
---

What is the main idea of **Variation of parameters**?

:::solution
One short answer is: $$ \mathbf{x} p(t)=\Phi(t)\int \Phi(t)^{-1}\mathbf{g}(t)\,dt $$ ---
:::

---
id: "math-systems-of-odes-412"
note: "math-systems-of-odes"
title: "Review: Key pitfalls"
type: "text"
answer: "Mixing up vector solutions with scalar solutions"
skills:
  - "Key pitfalls"
---

Name one common mistake the note warns about in **Key pitfalls**.

:::solution
One short answer is: Mixing up vector solutions with scalar solutions
:::

---
id: "math-systems-of-odes-413"
note: "math-systems-of-odes"
title: "Review: Quick intuition"
type: "text"
answer: "Eigenvalues control time behavior."
skills:
  - "Quick intuition"
---

What is the main idea of **Quick intuition**?

:::solution
One short answer is: Eigenvalues control time behavior.
:::
