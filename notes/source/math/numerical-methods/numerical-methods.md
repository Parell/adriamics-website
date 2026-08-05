# Numerical Methods

Numerical methods are algorithms for obtaining useful numerical answers to mathematical problems that are difficult, impossible, or inefficient to solve symbolically. They turn models from mechanics, thermodynamics, electromagnetism, control, materials, FEM, and CFD into reproducible computations.

The central engineering question is not merely “what number did the computer return?” It is: **how accurately, reliably, and efficiently does that number represent the mathematical and physical problem?** A trustworthy computation separates modeling error, discretization error, roundoff error, and implementation error, then checks the result against limiting cases, conservation laws, measurements, or an independent method.

This guide is broad. Learn Modules 1–4 first; linear algebra, least squares, ODE solvers, and verification then provide the core workflow. Modules 8–10 develop the most useful advanced tools.

## Prerequisites

You should be comfortable with:

- algebra, functions, logarithms, and scientific notation
- limits, derivatives, integrals, and Taylor series
- vectors, matrices, determinants, and solving linear systems
- first-order ODEs and basic physical modeling
- basic programming concepts: variables, loops, functions, arrays, and plots
- units, dimensional analysis, and significant figures

Assume real-valued variables unless stated otherwise. A scalar is written in italic type, a vector in bold type, and a matrix in capital bold type. The norm \\(\\lVert\\cdot\\rVert\\) is usually the Euclidean norm unless another norm is named.

---

# 1. The numerical problem and the error budget

An exact mathematical problem may be written as

$$
\\text{find } u \\text{ such that } \\mathcal{F}(u)=0.
$$

Here \\(u\\) is the unknown and \\(\\mathcal{F}\\) is an equation, operator, or system. A numerical method replaces this problem with a finite computation producing an approximation \\(u_h\\), where \\(h\\) denotes a discretization scale such as a mesh spacing or time step.

## Four important errors

| Error | Meaning | Typical control |
|---|---|---|
| Modeling error | The equations or inputs do not describe reality exactly | Improve assumptions, parameters, or experiment |
| Discretization error | A continuous problem is replaced by a finite one | Refine \\(h\\), use a higher-order method |
| Roundoff error | Finite-precision arithmetic changes operations | Scaling, stable algorithms, higher precision |
| Programming error | The implementation does not match the algorithm | Tests, code review, independent checks |

The total error is not generally found by adding these terms exactly. They can reinforce or cancel, so report a justified estimate and the assumptions behind it.

For an exact value \\(u\\) and computed value \\(\\widehat u\\),

$$
e_{\\mathrm{abs}}=|\\widehat u-u|,
\\qquad
e_{\\mathrm{rel}}=\\frac{|\\widehat u-u|}{|u|}, \\quad u\\ne0.
$$

Absolute error has the units of \\(u\\); relative error is dimensionless. When \\(u\\) is unknown, compare two resolutions, use a known manufactured solution, or construct an a posteriori estimator.

## A reliable workflow

```text
physical question
      ↓
mathematical model and units
      ↓
discrete equations and algorithm
      ↓
implementation + residual checks
      ↓
refinement / sensitivity study
      ↓
comparison with theory, experiment, or another solver
```

---

# 2. Floating-point arithmetic

A computer stores a finite approximation to most real numbers. In a common binary floating-point system,

$$
\\operatorname{fl}(x)=(-1)^s(1.f)_2,2^e,
$$

where \\(s\\) is a sign bit, \\(f\\) stores a finite significand, and \\(e\\) is a bounded exponent. Let \\(\\varepsilon_{\\mathrm{mach}}\\) denote machine epsilon, the spacing scale near 1. Under the usual rounding model,

$$
\\operatorname{fl}(x\\mathbin{\\circ}y)=(x\\mathbin{\\circ}y)(1+\\delta),
\\qquad |\\delta|\\lesssim\\varepsilon_{\\mathrm{mach}},
$$

for an operation \\(\\circ\\) that does not overflow, underflow, or encounter exceptional values.

## Absolute versus relative representation

Numbers are spaced more widely as their magnitude grows. Thus floating point approximately preserves relative precision, not a fixed absolute increment. The number \\(1/10\\) usually has no finite binary representation, so repeated decimal-looking calculations can leave a tiny residual.

### Typical hazards

- **Cancellation:** subtracting nearly equal numbers destroys leading significant digits.
- **Overflow/underflow:** values exceed the representable range or become tiny enough to round to zero.
- **Non-associativity:** \\( (a+b)+c\\) may differ from \\(a+(b+c)\\).
- **False equality:** test \\( |a-b|\\le a_{\\mathrm{tol}}+r_{\\mathrm{tol}}|b|\\), not `a == b` for computed reals.

### Stable reformulation

The expression

$$
\\sqrt{x^2+1}-x
$$

loses accuracy for large positive \\(x\\). Multiply by the conjugate:

$$
\\sqrt{x^2+1}-x
=\\frac{1}{\\sqrt{x^2+1}+x}.
$$

The second form avoids subtracting nearly equal numbers.

### Example: summation

If a data set contains one value of size \\(10^8\\) and one million values of size \\(10^{-8}\\), naive summation can lose small contributions. Pairwise summation or compensated summation tracks a correction term and is often much more accurate. This matters in mass balances, energy integrals, and residual norms.

---

# 3. Root finding

Root finding solves

$$
f(x)=0.
$$

It appears in equilibrium calculations, nonlinear circuit equations, phase-change conditions, and intersections of curves.

## Bracketing methods

If \\(f\\) is continuous and \\(f(a)f(b)<0\\), the intermediate value theorem guarantees at least one root in \\([a,b]\\). Bisection repeatedly halves the interval:

$$
m_k=\\frac{a_k+b_k}{2},
$$

then retains the half interval whose endpoints have opposite signs. After \\(n\\) steps,

$$
|b_n-a_n|=\\frac{|b_0-a_0|}{2^n}.
$$

Thus bisection is slow but dependable. A function value near zero is not enough if the function is poorly scaled or the root is multiple.

## Newton's method

Linearize \\(f\\) at \\(x_k\\):

$$
f(x)\\approx f(x_k)+f'(x_k)(x-x_k).
$$

Setting this approximation to zero gives

$$
x_{k+1}=x_k-\\frac{f(x_k)}{f'(x_k)}.
$$

Near a simple root \\(r\\), Newton's method is usually quadratically convergent:

$$
|e_{k+1}|\\approx C|e_k|^2,
\\qquad e_k=x_k-r.
$$

It can diverge when the starting guess is poor, the derivative is small, or the function has a singularity. A safeguarded method combines Newton steps with a bracket.

## Secant method

When \\(f'\\) is unavailable, approximate it using two previous values:

$$
x_{k+1}=x_k-f(x_k)\\frac{x_k-x_{k-1}}{f(x_k)-f(x_{k-1})}.
$$

It avoids derivatives and has superlinear, but not quadratic, convergence near a simple root.

### Worked example: Newton iteration

Find the positive solution of \\(x^2-2=0\\), with \\(x_0=1.5\\). Here \\(f(x)=x^2-2\\) and \\(f'(x)=2x\\):

$$
x_{k+1}=\\frac12\\left(x_k+\\frac{2}{x_k}\\right).
$$

The sequence is

$$
1.5\\;\\to\\;1.4166667\\;\\to\\;1.4142157\\;\\to\\;1.4142136.
$$

The result agrees with \\(\\sqrt2\\) to the shown digits. A practical stop condition is both a small residual \\( |f(x_k)|\\) and a small step \\( |x_{k+1}-x_k|\\), with tolerances tied to the required units.

---

# 4. Differentiation and integration from data

Numerical differentiation estimates a slope from nearby function values. Numerical integration estimates accumulated area or work.

## Finite differences

Taylor expansion gives

$$
f(x+h)=f(x)+hf'(x)+\\frac{h^2}{2}f''(x)+O(h^3).
$$

Rearranging gives the forward difference:

$$
D_+f(x)=\\frac{f(x+h)-f(x)}{h}=f'(x)+O(h).
$$

Using values on both sides,

$$
D_0f(x)=\\frac{f(x+h)-f(x-h)}{2h}=f'(x)+O(h^2).
$$

The centered formula is formally more accurate, but decreasing \\(h\\) eventually increases roundoff because two nearly equal values are subtracted. There is an optimal intermediate \\(h\\), not “as small as possible.”

For the second derivative,

$$
f''(x)\\approx\\frac{f(x+h)-2f(x)+f(x-h)}{h^2}+O(h^2).
$$

## Quadrature

For equally spaced points \\(x_i=a+ih\\), the trapezoidal rule is

$$
\\int_a^b f(x)\\,dx\\approx h\\left[\\frac{f_0+f_n}{2}+\\sum_{i=1}^{n-1}f_i\\right],
$$

where \\(h=(b-a)/n\\). Its composite error for smooth \\(f\\) is \\(O(h^2)\\). Simpson's rule combines parabolic fits and, for even \\(n\\), is

$$
\\int_a^b f(x)\\,dx\\approx\\frac{h}{3}\\left[f_0+f_n+4\\sum_{i\\text{ odd}}f_i+2\\sum_{i\\text{ even},,0<i<n}f_i\\right],
$$

with error \\(O(h^4)\\) for sufficiently smooth functions.

### Worked example: trapezoidal work estimate

Suppose measured force values are \\(F=[0,100,160,180]\\,\\mathrm{N}\\) at displacements \\(x=[0,0.02,0.04,0.06]\\,\\mathrm{m}\\). With \\(h=0.02\\,\\mathrm{m}\\),

$$
W\\approx0.02\\left[\\frac{0+180}{2}+100+160\\right]=12.0\\,\\mathrm{J}.
$$

The result is an estimate of mechanical work; sensor bias, sampling resolution, interpolation assumptions, and hysteresis may dominate the quadrature error.

---

# 5. ODE solvers

An initial-value problem has the form

$$
\\frac{dy}{dt}=f(t,y),\\qquad y(t_0)=y_0.
$$

Here \\(t\\) is the independent variable, \\(y\\) may be a scalar or state vector, and \\(f\\) has units of \\(y\\) per unit time.

## Euler's method

Integrate over one step and approximate the derivative by its left endpoint:

$$
y(t_{n+1})=y(t_n)+\\int_{t_n}^{t_n+h}f(t,y(t))dt
\\approx y_n+h f(t_n,y_n).
$$

Thus

$$
y_{n+1}=y_n+h f(t_n,y_n).
$$

Euler has local truncation error \\(O(h^2)\\) and global error \\(O(h)\\). It is useful for understanding stability, but often too inaccurate for production work.

## Runge–Kutta methods

The classical fourth-order method evaluates four slopes:

$$
\\begin{aligned}
k_1&=f(t_n,y_n),\\\\
k_2&=f(t_n+h/2,y_n+hk_1/2),\\\\
k_3&=f(t_n+h/2,y_n+hk_2/2),\\\\
k_4&=f(t_n+h,y_n+hk_3),\\\\
y_{n+1}&=y_n+\\frac{h}{6}(k_1+2k_2+2k_3+k_4).
\\end{aligned}
$$

It has global error \\(O(h^4)\\) for smooth nonstiff problems. Adaptive methods estimate error by comparing formulas of different order and change \\(h\\) to meet a tolerance.

## Stability and stiffness

For the test equation \\(y'=\\lambda y\\), Euler gives

$$
y_{n+1}=(1+h\\lambda)y_n.
$$

Stability requires \\( |1+h\\lambda|<1\\). For real negative \\(\\lambda\\), this becomes \\(0<h<2/|\\lambda|\\). A stiff system may contain rapidly decaying modes that force an explicit method to use tiny steps even when the desired solution changes slowly. Implicit methods solve equations involving \\(y_{n+1}\\) and are often preferred for stiff thermal, chemical, and structural systems.

### Worked example: cooling

Newton cooling is \\(T'=-k(T-T_\\infty)\\). Let \\(T_0=80^\\circ\\mathrm C\\), \\(T_\\infty=20^\\circ\\mathrm C\\), \\(k=0.1\\,\\mathrm{min}^{-1}\\), and \\(h=1\\,\\mathrm{min}\\). Euler predicts

$$
T_1=80+1[-0.1(80-20)]=74^\\circ\\mathrm C.
$$

The exact value after one minute is \\(20+60e^{-0.1}\\approx74.29^\\circ\\mathrm C\\). The difference is time-discretization error, not evidence that the physical law is wrong.

---

# 6. Convergence, consistency, and verification

These words answer different questions.

- **Consistency:** does the discrete equation approach the differential equation as \\(h\\to0\\)?
- **Stability:** do small perturbations remain controlled during the computation?
- **Convergence:** does the numerical solution approach the exact solution as \\(h\\to0\\)?
- **Verification:** did we solve the equations correctly?
- **Validation:** are the equations an adequate description of the real system?

For a stable method, a standard equivalence principle says consistency plus stability implies convergence for many well-posed linear initial-value problems. It is not a universal license to skip testing nonlinear, ill-posed, or poorly implemented models.

If errors behave as \\(E(h)\\approx Ch^p\\), halving the step predicts

$$
\\frac{E(h)}{E(h/2)}\\approx2^p.
$$

Given results \\(Q_h,Q_{h/2},Q_{h/4}\\), an observed order is

$$
p_{\\mathrm{obs}}=\\log_2\\left|\\frac{Q_h-Q_{h/2}}{Q_{h/2}-Q_{h/4}}\\right|.
$$

This is a diagnostic, not a proof. Mesh refinement should show a stable trend, and the reported answer should not contain more digits than refinement supports.

## Verification tools

- compute the residual of the discrete equations
- compare with an exact solution or limiting case
- use a manufactured solution: choose \\(u\\), substitute it into the governing equation, and add the resulting source term
- compare independent implementations or solvers
- check conservation, symmetry, positivity, and dimensions

Validation compares predictions with experiments and includes uncertainty in both the measurement and the model parameters.

---

# 7. Conditioning and stability

**Conditioning** belongs to the mathematical problem: how sensitive is the answer to perturbed input? **Stability** belongs to the algorithm: how much error does the computation introduce or amplify?

For a scalar function \\(y=f(x)\\), a small perturbation gives

$$
\\frac{|\\delta y|}{|y|}\\approx\\left|\\frac{xf'(x)}{f(x)}\\right|\\frac{|\\delta x|}{|x|}.
$$

The factor \\(\\kappa=|xf'(x)/f(x)|\\) is a relative condition number. A large \\(\\kappa\\) means even a stable algorithm cannot produce many reliable digits from inaccurate data.

For a linear system \\(\\mathbf A\\mathbf x=\\mathbf b\\), the 2-norm condition number is

$$
\\kappa_2(\\mathbf A)=\\lVert\\mathbf A\\rVert_2\\lVert\\mathbf A^{-1}\\rVert_2
=\\frac{\\sigma_{\\max}}{\\sigma_{\\min}},
$$

when \\(\\mathbf A\\) is nonsingular. Singular value decomposition makes this ratio visible. Large \\(\\kappa\\) warns that input and roundoff errors may be amplified.

Scaling equations so variables and coefficients have comparable magnitudes often improves numerical behavior, but it does not cure an intrinsically ill-conditioned physical problem.

---

# 8. Direct linear algebra

Many discretized models reduce to

$$
\\mathbf A\\mathbf x=\\mathbf b,
$$

where \\(\\mathbf A\\in\\mathbb R^{n\\times n}\\), \\(\\mathbf x\\) is unknown, and \\(\\mathbf b\\) is known. Do not form \\(\\mathbf A^{-1}\\) just to solve a system; factorization is faster, more accurate, and reusable.

## LU factorization

Gaussian elimination transforms \\(\\mathbf A\\) into an upper-triangular matrix \\(\\mathbf U\\). The eliminated multipliers form a lower-triangular matrix \\(\\mathbf L\\):

$$
\\mathbf P\\mathbf A=\\mathbf L\\mathbf U.
$$

The permutation matrix \\(\\mathbf P\\) records row pivoting. Solve in three stages:

$$
\\mathbf L\\mathbf y=\\mathbf P\\mathbf b,\\qquad
\\mathbf U\\mathbf x=\\mathbf y.
$$

Partial pivoting swaps rows to avoid dividing by a small pivot. For dense matrices the work is approximately \\(O(n^3)\\) and storage \\(O(n^2)\\).

## Cholesky factorization

If \\(\\mathbf A\\) is symmetric positive definite,

$$
\\mathbf A=\\mathbf L\\mathbf L^T.
$$

It uses about half the work and storage of general LU and is common in diffusion, elasticity, and least-squares normal-equation contexts. It is not valid for an arbitrary symmetric or merely invertible matrix.

## QR factorization

QR writes

$$
\\mathbf A=\\mathbf Q\\mathbf R,
$$

where \\(\\mathbf Q^T\\mathbf Q=\\mathbf I\\) and \\(\\mathbf R\\) is upper triangular. Householder QR is preferred over classical Gram–Schmidt because it preserves orthogonality much better. QR is the standard stable tool for least squares.

---

# 9. Least squares and SVD

An overdetermined system has more equations than unknowns. Usually no exact \\(\\mathbf x\\) satisfies every measurement, so choose \\(\\mathbf x\\) minimizing the residual:

$$
\\min_{\\mathbf x}\\lVert\\mathbf A\\mathbf x-\\mathbf b\\rVert_2^2.
$$

Differentiating the squared norm gives

$$
\\phi(\\mathbf x)=(\\mathbf A\\mathbf x-\\mathbf b)^T(\\mathbf A\\mathbf x-\\mathbf b),
$$
$$
\\nabla\\phi=2\\mathbf A^T(\\mathbf A\\mathbf x-\\mathbf b).
$$
$$
\\nabla\\phi=0\\;\\Longrightarrow\\;\\mathbf A^T\\mathbf A\\mathbf x=\\mathbf A^T\\mathbf b.
$$

These are the normal equations, but forming \\(\\mathbf A^T\\mathbf A\\) squares the condition number. Use QR, or SVD when rank deficiency or severe ill-conditioning matters.

The singular value decomposition is

$$
\\mathbf A=\\mathbf U\\mathbf\\Sigma\\mathbf V^T,
$$

where \\(\\mathbf U,\\mathbf V\\) are orthogonal and \\(\\mathbf\\Sigma\\) contains nonnegative singular values \\(\\sigma_1\\ge\\cdots\\ge\\sigma_r\\). SVD reveals rank, identifies weakly observed directions, and gives the pseudoinverse

$$
\\mathbf A^+=\\mathbf V\\mathbf\\Sigma^+\\mathbf U^T.
$$

Small singular values can be truncated to regularize noisy inverse problems. This trades exact fit for reduced noise amplification and must be justified by the measurement uncertainty.

### Worked example: fitting a line

For measurements \\(y=mx+c\\) at \\(x=0,1,2\\) with \\(y=1.1,2.9,5.2\\),

$$
\\mathbf A=\\begin{bmatrix}0&1\\1&1\\2&1\\end{bmatrix},\\qquad
\\mathbf b=\\begin{bmatrix}1.1\\2.9\\5.2\\end{bmatrix}.
$$

Solving the least-squares problem gives approximately \\(m=2.05\\), \\(c=1.03\\). The residuals represent measurement scatter and model mismatch; they are not automatically numerical mistakes.

---

# 10. Iterative and sparse solvers

Large discretized PDE systems are often sparse: most entries of \\(\\mathbf A\\) are zero. Store only nonzero values and exploit the sparsity pattern; dense storage can be impossible.

## Stationary iterations

For \\(\\mathbf A=\\mathbf D+\\mathbf L+\\mathbf U\\), Jacobi iteration is

$$
\\mathbf x^{(k+1)}=\\mathbf D^{-1}\\left[\\mathbf b-(\\mathbf L+\\mathbf U)\\mathbf x^{(k)}\\right].
$$

Gauss–Seidel uses newly updated components immediately. Convergence depends on the iteration matrix \\(\\mathbf G\\): it requires \\(\\rho(\\mathbf G)<1\\), where \\(\\rho\\) is the spectral radius. Diagonal dominance or symmetric positive definiteness provides useful sufficient conditions in common cases.

## Krylov methods

Conjugate gradient (CG) is designed for symmetric positive-definite matrices. GMRES handles general nonsymmetric systems but stores a growing Krylov basis, so restarting is common. Preconditioning solves an easier related system to improve the spectrum:

$$
\\mathbf M^{-1}\\mathbf A\\mathbf x=\\mathbf M^{-1}\\mathbf b,
$$

where applying \\(\\mathbf M^{-1}\\) is cheap and \\(\\mathbf M\\) approximates \\(\\mathbf A\\). Good preconditioners often determine whether an iterative solver is practical.

Stop using a scaled residual such as

$$
\\frac{\\lVert\\mathbf b-\\mathbf A\\mathbf x_k\\rVert}{
\\lVert\\mathbf b\\rVert+\\lVert\\mathbf A\\rVert\\lVert\\mathbf x_k\\rVert}
\\le\\tau,
$$

but remember that a small residual does not guarantee a small solution error for an ill-conditioned matrix.

## Sparse matrices in real systems

Finite differences, finite volumes, and FEM connect each unknown only to nearby unknowns, producing banded or graph-structured matrices. Boundary conditions change rows and the right-hand side; careless treatment can destroy symmetry, conservation, or conditioning.

---

# 11. Engineering connections and model limits

| Area | Numerical task | Important caution |
|---|---|---|
| Mechanics | nonlinear equilibrium, structural FEM, dynamics | rigid-body modes and contact can be singular or nonsmooth |
| Thermodynamics / heat transfer | quadrature, diffusion equations, stiff transients | material properties may vary strongly with temperature |
| Electromagnetism | sparse Maxwell systems, field interpolation | gauges, boundaries, and wave resolution matter |
| Control | state-space simulation, discretization, optimization | sampling can destabilize a poorly discretized controller |
| Materials | constitutive fitting and nonlinear FE | data scatter and path dependence are physical, not just noise |
| FEM / CFD | mesh generation, linear systems, fluxes | conservation, mesh quality, and stabilization are essential |
| Machine learning | least squares, gradients, conditioning, optimization | training loss is not validation accuracy or physical validity |

Idealized models may assume smooth fields, constant properties, exact geometry, noiseless measurements, and infinite precision. Real systems have uncertainty, discontinuities, hysteresis, sensor bias, unresolved scales, and parameter variation. Numerical refinement cannot repair a wrong model or missing physics.

---

# 12. Common misconceptions and mistakes

- A smaller step is not automatically better: truncation error may decrease while roundoff and cost increase.
- More digits in printed output do not mean more accurate digits.
- Convergence of an iterative solver is not the same as convergence to the physically correct model.
- A small residual is not a small error when the system is ill-conditioned.
- Newton's method is not globally convergent; bracket or safeguard it when failure is costly.
- Cholesky requires positive definiteness, not merely symmetry.
- Normal equations are convenient but may be numerically inferior to QR or SVD.
- An interpolation or fit is not a derivation of the governing law.
- Verification asks whether the equations were solved correctly; validation asks whether the equations describe the experiment.
- Unit conversion must occur before numerical substitution; a solver cannot detect inconsistent units.

---

# 13. Concise summary

Numerical analysis links continuous models to finite computations. Start by defining the problem, scales, units, and acceptable error. Choose a method whose assumptions match the problem, analyze conditioning and stability, then verify by residuals, refinement, limiting cases, and independent comparisons. For large engineering systems, sparse storage, stable factorizations, preconditioning, and uncertainty-aware validation matter as much as the nominal algorithm.

# 14. Formula sheet

| Topic | Formula |
|---|---|
| Absolute error | \\(e_a=\\lvert\\widehat u-u\\rvert\\) |
| Relative error | \\(e_r=\\lvert\\widehat u-u\\rvert/\\lvert u\\rvert\\) |
| Bisection width | \\(w_n=w_0/2^n\\) |
| Newton | \\(x_{k+1}=x_k-f(x_k)/f'(x_k)\\) |
| Centered derivative | \\(f'(x)\\approx[f(x+h)-f(x-h)]/(2h)\\) |
| Trapezoidal rule | \\(h[(f_0+f_n)/2+\\sum_{1}^{n-1}f_i]\\) |
| Euler ODE step | \\(y_{n+1}=y_n+h f(t_n,y_n)\\) |
| LU | \\(\\mathbf P\\mathbf A=\\mathbf L\\mathbf U\\) |
| Cholesky | \\(\\mathbf A=\\mathbf L\\mathbf L^T\\) |
| QR | \\(\\mathbf A=\\mathbf Q\\mathbf R\\) |
| Least squares | \\(\\min_x\\lVert\\mathbf A\\mathbf x-\\mathbf b\\rVert_2\\) |
| SVD | \\(\\mathbf A=\\mathbf U\\mathbf\\Sigma\\mathbf V^T\\) |
| Condition number | \\(\\kappa_2(\\mathbf A)=\\sigma_{\\max}/\\sigma_{\\min}\\) |
| Residual | \\(\\mathbf r=\\mathbf b-\\mathbf A\\mathbf x\\) |

# 15. Glossary

- **Consistency:** local agreement of the discrete equations with the continuous equations as resolution improves.
- **Condition number:** sensitivity of the exact answer to perturbations in input.
- **Convergence:** approach of computed answers to the exact or target solution.
- **Discretization:** replacement of a continuous domain or operator by finite points, cells, or basis functions.
- **Ill-conditioned:** sensitive enough that small input errors can cause large output errors.
- **Preconditioner:** an auxiliary operator that makes an iterative problem easier to solve.
- **Residual:** the amount by which a computed solution fails to satisfy an equation.
- **Roundoff:** error caused by finite-precision representation and arithmetic.
- **Stability:** bounded response of an algorithm to perturbations.
- **Stiffness:** a time-dependent problem whose stable numerical solution requires very small steps for some methods.
- **Truncation error:** error from replacing an exact infinite or differential operation with a finite approximation.
- **Verification / validation:** checking the computation / checking the model against reality.

# 16. Practice problems

1. **Easy:** Use bisection on \\(f(x)=x^2-3\\) over \\([1,2]\\). How many steps guarantee an interval width below \\(10^{-4}\\)?
2. **Easy:** Derive the order of the forward difference from Taylor expansion.
3. **Intermediate:** Apply one RK4 step with \\(h=0.1\\) to \\(y'=-2y\\), \\(y(0)=1\\), and compare with \\(e^{-0.2}\\).
4. **Intermediate:** Explain why computing \\(\\sqrt{x^2+1}-x\\) directly is inaccurate for large \\(x\\), and give a stable form.
5. **Intermediate:** For \\(Q_h=1.20,Q_{h/2}=1.05,Q_{h/4}=1.0125\\), estimate observed order.
6. **Advanced:** Form the normal equations for fitting \\(y=a x^2+b x+c\\) to three or more data points, then explain why QR is preferred in noisy, ill-conditioned data.
7. **Advanced:** A heat equation discretization has a matrix with five nonzero diagonals. Explain why sparse storage and an appropriate preconditioner can change the feasible problem size by orders of magnitude.
8. **Challenge:** Design a verification and validation plan for a CFD prediction of pressure drop through a pipe, including mesh refinement, residuals, conservation, uncertainty, and experiment comparison.

## Short answers and solution outlines

1. Since \\(w_0=1\\), require \\(2^{-n}<10^{-4}\\), so \\(n>13.29\\); 14 steps suffice.
2. Expand \\(f(x+h)\\), subtract \\(f(x)\\), divide by \\(h\\): the leading neglected term is \\(hf''(x)/2\\), hence first order.
3. RK4 gives \\(y_1\\approx0.818733\\); exact value is \\(0.818731\\), an error of about \\(2.1\\times10^{-6}\\).
4. Rationalize to \\(1/(\\sqrt{x^2+1}+x)\\); this avoids catastrophic cancellation.
5. Differences are \\(0.15\\) and \\(0.0375\\); ratio 4, so \\(p_{\\rm obs}=\\log_2 4=2\\).
6. Use columns \\([x_i^2,x_i,1]^T\\); the normal equations are \\(A^TA\\theta=A^Ty\\). QR avoids squaring the condition number.
7. Store only nonzeros, use matrix-vector products proportional to the number of nonzeros, and choose \\(M\\) to reduce Krylov iterations.
8. Verify discretization and iterative convergence independently; check mass/momentum conservation and pressure-drop trends; validate against controlled measurements with uncertainty bars.

# 17. Recommended next topics

1. Linear algebra and eigenvalues
2. Ordinary differential equations and dynamical systems
3. Partial differential equations and finite differences
4. Finite element and finite volume methods
5. Probability, statistics, and uncertainty quantification
6. Optimization and control
7. Scientific programming, testing, and reproducible computational experiments
