---
auditors:
  - "@Parell"
status: draft
last_reviewed: 2026-05-22
sources: []
---

## Table of contents

1. [What a system of ODEs is](#toc-1)
2. [Matrix form and solution structure](#toc-2)
3. [Linear autonomous systems](#toc-3)
4. [Eigenvalues and eigenvectors](#toc-4)
5. [The matrix exponential](#toc-5)
6. [Nonhomogeneous linear systems](#toc-6)
7. [Phase portraits and stability](#toc-7)
8. [Nonlinear systems and linearization](#toc-8)
9. [Common modeling patterns](#toc-9)
10. [Problem-solving workflow](#toc-10)
11. [Formula sheet](#toc-11)

---

<a id="toc-1"></a>
# 1. What a system of ODEs is

A **system of ordinary differential equations** is a set of coupled equations for two or more unknown functions of one independent variable, usually time $t$.

Example:

$$
\begin{aligned}
x'(t) &= f(t, x, y) \\
y'(t) &= g(t, x, y)
\end{aligned}
$$

The functions interact through the equations, so you usually cannot solve one equation first and the others later. The state of the system is the vector of unknowns:

$$
\mathbf{x}(t) =
\begin{bmatrix}
x_1(t) \\
x_2(t) \\
\vdots \\
x_n(t)
\end{bmatrix}
$$

Systems of ODEs appear in:

- mechanics and oscillations
- population models
- electrical circuits
- chemical kinetics
- fluid and thermal systems
- linear algebra and control theory

## Initial value problems

Most textbook systems are **initial value problems**:

$$
\mathbf{x}' = \mathbf{f}(t, \mathbf{x}), \qquad \mathbf{x}(t_0) = \mathbf{x}_0
$$

An initial condition fixes the particular solution among the family of all solutions.

---

<a id="toc-2"></a>
# 2. Matrix form and solution structure

Many systems can be written compactly with vectors and matrices.

## Linear system

A general linear system is

$$
\mathbf{x}' = A(t)\mathbf{x} + \mathbf{g}(t)
$$

where:

- $\mathbf{x}(t)$ is the unknown vector
- $A(t)$ is a coefficient matrix
- $\mathbf{g}(t)$ is a forcing vector

If $A$ is constant and $\mathbf{g}(t)=\mathbf{0}$, the system is **linear autonomous homogeneous**:

$$
\mathbf{x}' = A\mathbf{x}
$$

This is the most important case because it is fully analyzable with linear algebra.

## Superposition

For a homogeneous linear system:

- if $\mathbf{x}_1$ and $\mathbf{x}_2$ are solutions, then $\mathbf{x}_1 + \mathbf{x}_2$ is also a solution
- if $c$ is a constant, then $c\mathbf{x}_1$ is also a solution

That means the set of solutions forms a vector space.

## Dimension of the solution space

For an $n \times n$ first-order linear homogeneous system, the general solution depends on $n$ constants. Equivalently, you need $n$ independent initial conditions to determine a unique solution.

---

<a id="toc-3"></a>
# 3. Linear autonomous systems

The canonical form is

$$
\mathbf{x}' = A\mathbf{x}
$$

with constant matrix $A$.

## Why this case matters

The behavior of the system is controlled by the matrix $A$:

- eigenvalues determine growth, decay, oscillation, and stability
- eigenvectors determine invariant directions
- the matrix exponential gives the exact solution

For a $2 \times 2$ system,

$$
\begin{bmatrix}
x' \\
y'
\end{bmatrix}
=
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
$$

or equivalently,

$$
x' = ax + by, \qquad y' = cx + dy
$$

## Decoupling idea

If you can find a change of variables that diagonalizes or simplifies $A$, the system may split into independent scalar ODEs. This is the linear-algebra viewpoint behind most solution methods.

---

<a id="toc-4"></a>
# 4. Eigenvalues and eigenvectors

For a homogeneous linear system $\mathbf{x}' = A\mathbf{x}$, try solutions of the form

$$
\mathbf{x}(t) = e^{\lambda t}\mathbf{v}
$$

Substituting gives

$$
\lambda \mathbf{v} = A\mathbf{v}
$$

so $\lambda$ must be an eigenvalue of $A$ and $\mathbf{v}$ an associated eigenvector.

## General principle

Each eigenpair $(\lambda, \mathbf{v})$ gives a solution

$$
\mathbf{x}(t) = e^{\lambda t}\mathbf{v}
$$

If the eigenvalues are distinct and the matrix is diagonalizable, the general solution is a linear combination of these mode solutions.

## Real eigenvalues

If $\lambda \in \mathbb{R}$:

- $\lambda < 0$ gives exponential decay
- $\lambda > 0$ gives exponential growth
- $\lambda = 0$ gives neutral behavior in that mode

## Complex eigenvalues

If

$$
\lambda = \alpha \pm \beta i
$$

then solutions involve oscillation with exponential envelope:

$$
e^{\alpha t}(\cos \beta t,\ \sin \beta t)
$$

More precisely, a complex eigenpair produces two real solutions obtained from the real and imaginary parts.

## Repeated eigenvalues

Repeated eigenvalues require extra care:

- if there are enough independent eigenvectors, the matrix is still diagonalizable
- if not, you need generalized eigenvectors and Jordan form

In a defective $2 \times 2$ system, a second solution often has the form

$$
e^{\lambda t}(\mathbf{v} + t\mathbf{w})
$$

where $\mathbf{w}$ is a generalized eigenvector.

---

<a id="toc-5"></a>
# 5. The matrix exponential

The exact solution of

$$
\mathbf{x}' = A\mathbf{x}, \qquad \mathbf{x}(0)=\mathbf{x}_0
$$

is

$$
\mathbf{x}(t)=e^{At}\mathbf{x}_0
$$

where $e^{At}$ is the **matrix exponential**.

## Definition

$$
e^{At} = I + At + \frac{(At)^2}{2!} + \frac{(At)^3}{3!} + \cdots
$$

This is analogous to the scalar exponential series.

## Diagonalizable case

If

$$
A = PDP^{-1}
$$

with diagonal $D = \operatorname{diag}(\lambda_1,\dots,\lambda_n)$, then

$$
e^{At} = Pe^{Dt}P^{-1}
$$

and

$$
e^{Dt} = \operatorname{diag}(e^{\lambda_1 t}, \dots, e^{\lambda_n t})
$$

This is the cleanest computational route.

## Practical use

You often do not compute the full series. Instead, use:

- diagonalization
- eigenvector decomposition
- Jordan form when necessary
- software or a calculator for large systems

---

<a id="toc-6"></a>
# 6. Nonhomogeneous linear systems

The forced system

$$
\mathbf{x}' = A\mathbf{x} + \mathbf{g}(t)
$$

combines natural dynamics from $A$ with external input $\mathbf{g}(t)$.

## General solution structure

The solution is

$$
\mathbf{x}(t) = \mathbf{x}_h(t) + \mathbf{x}_p(t)
$$

where:

- $\mathbf{x}_h$ solves the homogeneous system $\mathbf{x}' = A\mathbf{x}$
- $\mathbf{x}_p$ is any particular solution of the full system

## Variation of parameters

If $\Phi(t)$ is a fundamental matrix for $\mathbf{x}' = A\mathbf{x}$, then a particular solution can be written as

$$
\mathbf{x}_p(t) = \Phi(t)\int \Phi(t)^{-1}\mathbf{g}(t)\,dt
$$

This is the matrix version of variation of parameters for scalar ODEs.

## Common forcing types

Forcing terms often include:

- constants
- polynomials
- exponentials
- sines and cosines
- combinations of the above

For constant-coefficient systems, undetermined coefficients can work when the forcing has a simple form.

---

<a id="toc-7"></a>
# 7. Phase portraits and stability

For a two-dimensional autonomous system, the **phase plane** is the $(x,y)$ plane of states. A **phase portrait** shows representative trajectories.

## Equilibria

An equilibrium point satisfies

$$
\mathbf{f}(\mathbf{x}^*) = \mathbf{0}
$$

For a linear system $\mathbf{x}' = A\mathbf{x}$, the only equilibrium is usually the origin unless the system is degenerate.

## Stability ideas

An equilibrium is:

- **stable** if nearby trajectories stay nearby
- **asymptotically stable** if nearby trajectories converge to it
- **unstable** if arbitrarily small perturbations can move away

For linear systems, the eigenvalues of $A$ determine this.

## Classification for 2x2 systems

Let the eigenvalues of $A$ be $\lambda_1,\lambda_2$.

| Eigenvalue pattern | Typical behavior |
| --- | --- |
| Both real, negative | Stable node |
| Both real, positive | Unstable node |
| Opposite signs | Saddle, unstable |
| Complex with negative real part | Stable spiral |
| Complex with positive real part | Unstable spiral |
| Purely imaginary | Center in the ideal linear case |

If one eigenvalue is zero or repeated, examine the eigenvectors and the full normal form carefully.

## Trace-determinant test for 2x2 systems

For

$$
A=
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
$$

define:

$$
\tau = \operatorname{tr}(A)=a+d, \qquad \Delta = \det(A)=ad-bc
$$

Then the characteristic polynomial is

$$
\lambda^2 - \tau \lambda + \Delta = 0
$$

and the discriminant is

$$
\tau^2 - 4\Delta
$$

This quickly tells you whether the eigenvalues are real or complex and whether the origin is stable.

---

<a id="toc-8"></a>
# 8. Nonlinear systems and linearization

A nonlinear system has the form

$$
\mathbf{x}' = \mathbf{f}(\mathbf{x})
$$

or more generally

$$
\mathbf{x}' = \mathbf{f}(t,\mathbf{x})
$$

Nonlinear systems can have multiple equilibria, limit cycles, bifurcations, and behavior that is not captured by linear theory alone.

## Linearization

Near an equilibrium point $\mathbf{x}^*$, approximate the system by its Jacobian matrix:

$$
\mathbf{x}' \approx J(\mathbf{x}^*)(\mathbf{x}-\mathbf{x}^*)
$$

where

$$
J(\mathbf{x}) =
\left[
\frac{\partial f_i}{\partial x_j}
\right]
$$

This produces a linear system that approximates the nonlinear system near the equilibrium.

## Interpreting the linearization

- If the linearized system has eigenvalues with negative real part, the equilibrium is often locally asymptotically stable.
- If it has an eigenvalue with positive real part, the equilibrium is unstable.
- If eigenvalues lie on the imaginary axis or are zero, linearization may be inconclusive.

## Caveat

Linearization is a local tool. It tells you about behavior near an equilibrium, not the full global dynamics.

---

<a id="toc-9"></a>
# 9. Common modeling patterns

## Coupled growth and decay

If one variable feeds another, the system may look like

$$
\mathbf{x}' = A\mathbf{x}
$$

with off-diagonal terms representing interaction rates.

## Mass-spring systems

Second-order equations often become first-order systems by introducing velocity.

For

$$
m x'' + c x' + kx = 0
$$

set

$$
u = x, \qquad v = x'
$$

Then

$$
u' = v, \qquad v' = -\frac{k}{m}u - \frac{c}{m}v
$$

This is a standard way to convert a higher-order ODE into a system.

## Predator-prey models

Typical nonlinear interactions are modeled by

$$
\begin{aligned}
x' &= f(x,y) \\
y' &= g(x,y)
\end{aligned}
$$

where growth of one species depends on the other. Equilibria are found by solving $x'=0$ and $y'=0$ simultaneously.

## Electrical circuits

In circuits with capacitors and inductors, Kirchhoff's laws often produce systems for charge and current. These are frequently linear with constant coefficients.

---

<a id="toc-10"></a>
# 10. Problem-solving workflow

When solving a system of ODEs, use a disciplined sequence.

## 1. Identify the type

Decide whether the system is:

- linear or nonlinear
- autonomous or nonautonomous
- homogeneous or forced
- one-dimensional, two-dimensional, or higher

## 2. Rewrite in matrix form

Put the system into

$$
\mathbf{x}' = A\mathbf{x} + \mathbf{g}(t)
$$

if possible.

## 3. Find equilibria

Set all derivatives to zero and solve the algebraic system.

## 4. Compute eigenvalues

For linear systems, compute the characteristic polynomial:

$$
\det(A-\lambda I)=0
$$

## 5. Build the solution basis

Use:

- eigenvectors if $A$ is diagonalizable
- generalized eigenvectors if not
- variation of parameters or undetermined coefficients for forcing

## 6. Apply initial conditions

Substitute the initial state to determine the constants.

## 7. Interpret the result

Check whether the solution:

- grows or decays
- oscillates
- approaches equilibrium
- matches the physical context

---

<a id="toc-11"></a>
# 11. Formula sheet

## Homogeneous linear system

$$
\mathbf{x}' = A\mathbf{x}
$$

## Exact solution

$$
\mathbf{x}(t)=e^{At}\mathbf{x}(0)
$$

## Matrix exponential

$$
e^{At}=I+At+\frac{(At)^2}{2!}+\cdots
$$

## Eigenmode solution

If $A\mathbf{v}=\lambda\mathbf{v}$, then

$$
\mathbf{x}(t)=e^{\lambda t}\mathbf{v}
$$

## Characteristic polynomial for 2x2 systems

$$
\lambda^2-\operatorname{tr}(A)\lambda+\det(A)=0
$$

## Linearization near equilibrium

$$
\mathbf{x}' \approx J(\mathbf{x}^*)(\mathbf{x}-\mathbf{x}^*)
$$

## Forced linear system

$$
\mathbf{x}' = A\mathbf{x} + \mathbf{g}(t)
$$

## Variation of parameters

$$
\mathbf{x}_p(t)=\Phi(t)\int \Phi(t)^{-1}\mathbf{g}(t)\,dt
$$

---

## Key pitfalls

- Mixing up vector solutions with scalar solutions
- Forgetting that one first-order system of size $n$ needs $n$ constants
- Using scalar intuition when eigenvectors are not enough
- Ignoring complex eigenvalues and their oscillatory interpretation
- Treating linearization as a global solution method
- Forgetting to apply initial conditions after finding the general solution

## Quick intuition

- Eigenvalues control time behavior.
- Eigenvectors control directions.
- The matrix exponential packages the whole solution.
- Nonlinear systems are often best understood locally by linearization.
