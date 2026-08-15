# Computational Methods

Computational methods turn mathematical models into finite, executable calculations. A credible result requires a clear model, a suitable discretization, a stable solver, and evidence that numerical error is controlled.

This overview covers numerical ODEs, finite differences, finite volumes, spectral methods, finite elements, and computational fluid dynamics. The [Numerical Methods note](../../math/numerical-methods/numerical-methods.md) develops error, conditioning, linear algebra, root finding, quadrature, and ODE algorithms in greater detail.

## Prerequisites and notation

Assume calculus, matrices, ordinary and partial differential equations, basic programming, and dimensional analysis. Let $h$ be a spatial mesh size, $\Delta t$ a time step, $u$ the unknown field, $\mathbf{x}$ position, $t$ time, and $\mathcal{L}$ a differential operator. A continuous problem

$$
\mathcal{L}(u)=f
$$

becomes a finite algebraic problem

$$
\mathbf{A}(\Delta t,h)\mathbf{u}=\mathbf{b}.
$$

The residual is

$$
\mathbf{r}=\mathbf{b}-\mathbf{A}\mathbf{u}.
$$

A small residual verifies the discrete solve; it does not prove that the mesh, time step, or physical model is adequate.

## A trustworthy workflow

1. State the physical question, domain, initial and boundary conditions, parameters, units, and assumptions.
2. Choose a representation: time steps, grid points, control volumes, basis functions, or particles.
3. Derive the discrete equations, including boundary terms, before coding.
4. Choose a solver and stopping criteria appropriate to the matrix structure and stiffness.
5. Verify with residuals, limiting cases, conservation, manufactured solutions, and refinement.
6. Validate against measurements or an independently trusted result, including uncertainty.

For a quantity $Q$ with error $E(h)\approx Ch^p$, the observed order is

$$
p_{\mathrm{obs}}=\log_2\left|\frac{Q_h-Q_{h/2}}{Q_{h/2}-Q_{h/4}}\right|.
$$

Refinement should produce a predictable trend before extra digits are reported.

## Numerical ODE methods

An initial-value problem is

$$
\frac{d\mathbf{y}}{dt}=\mathbf{f}(t,\mathbf{y}),\qquad \mathbf{y}(t_0)=\mathbf{y}_0.
$$

Forward Euler is $\mathbf{y}_{n+1}=\mathbf{y}_n+\Delta t\,\mathbf{f}(t_n,\mathbf{y}_n)$. Its global error is $O(\Delta t)$. Classical RK4 has global error $O(\Delta t^4)$ for smooth, nonstiff problems. Adaptive Runge–Kutta methods change $\Delta t$ to meet a tolerance.

For $y'=\lambda y$, Euler gives $y_{n+1}=(1+\lambda\Delta t)y_n$, so stability requires $|1+\lambda\Delta t|<1$. Stiff problems often require implicit methods because fast decaying modes restrict explicit steps.

## Finite-difference methods

Finite differences replace derivatives with nearby point values:

$$
u'(x_i)\approx\frac{u_{i+1}-u_{i-1}}{2h}+O(h^2),
\qquad
u''(x_i)\approx\frac{u_{i-1}-2u_i+u_{i+1}}{h^2}+O(h^2).
$$

For $-kT''=q$, a uniform grid gives $-k(T_{i-1}-2T_i+T_{i+1})/h^2=q$. Dirichlet conditions prescribe a value; Neumann conditions prescribe a derivative or flux with the correct sign and units. Finite differences are efficient on regular grids but awkward for complex boundaries.

## Finite-volume methods

Finite-volume methods enforce conservation by integrating a balance law over each control volume. For $\partial_tu+\nabla\cdot\mathbf{F}=s$,

$$
\frac{d}{dt}\int_{V_i}u\,dV+\oint_{\partial V_i}\mathbf{F}\cdot\mathbf{n}\,dA=\int_{V_i}s\,dV.
$$

Flux leaving one cell enters its neighbor with the opposite sign. Reconstruction, numerical fluxes, slope limiting, time integration, and boundary fluxes still require careful choices, especially near shocks.

## Spectral methods

Spectral methods use global basis functions:

$$
u_N(x)=\sum_{n=0}^{N}a_n\phi_n(x).
$$

Fourier bases suit periodic domains; Chebyshev and Legendre polynomials suit many bounded domains. Smooth solutions can converge extremely rapidly, but discontinuities cause Gibbs oscillations. Pointwise products can create unresolved modes called aliasing; filtering, dealiasing, or accurate quadrature controls it.

## Finite-element methods

Finite elements use a weak form. For $-\nabla^2u=f$, a test function $v$ gives

$$
\int_\Omega\nabla v\cdot\nabla u\,d\Omega=\int_\Omega vf\,d\Omega+\text{boundary terms}.
$$

With $u_h=\sum_jN_jU_j$, assembly produces $\mathbf{K}\mathbf{U}=\mathbf{F}$. Element matrices are computed locally and joined through shared nodes. Dirichlet constraints modify the system; natural flux or traction conditions enter the weak form. Mesh distortion, under-integration, locking, and incorrect constraints are common failure modes.

## Computational fluid dynamics

CFD applies discretization and solvers to fluid conservation laws. A compressible conservative state may be written

$$
\frac{\partial\mathbf{U}}{\partial t}+\nabla\cdot\mathbf{F}(\mathbf{U})=\mathbf{S},
$$

where $\mathbf{U}$ contains density, momentum, and energy. A credible CFD study addresses geometry, mesh quality, fluxes, boundary conditions, time stepping, turbulence modeling, convergence, and verification. Mesh refinement cannot fix an incorrect turbulence model or inlet condition. Check conservation, residuals, quantities of interest, multiple meshes, and experimental uncertainty.

## Worked example: an explicit heat-equation step

For $\partial_tT=\alpha\partial_{xx}T$, centered space and forward Euler give

$$
T_i^{n+1}=T_i^n+r(T_{i-1}^n-2T_i^n+T_{i+1}^n),\qquad r=\frac{\alpha\Delta t}{h^2}.
$$

If the neighboring values are $100^\circ\mathrm{C}$ and $20^\circ\mathrm{C}$, the center is $60^\circ\mathrm{C}$, and $r=0.25$, then $T_i^{n+1}=60+0.25(100-120+20)=60^\circ\mathrm{C}$. The local curvature is zero. Stability for this one-dimensional explicit scheme requires $r\le\tfrac12$.

## Common mistakes

- Treating a small solver residual as proof of physical accuracy.
- Refining $h$ or $\Delta t$ without checking stability, roundoff, cost, and convergence.
- Applying a boundary condition with the wrong units or flux sign.
- Using a nonconservative pointwise scheme where balance is essential.
- Assuming spectral accuracy survives discontinuities without filtering or shock treatment.
- Using distorted finite elements, insufficient quadrature, or excessive constraints.
- Comparing CFD with measurements without matching definitions, locations, averaging, and uncertainty.
- Reporting precision unsupported by mesh, time-step, parameter, or measurement uncertainty.

## Practice problems and solutions

1. **Easy:** For $y'=-3y$, write one Euler step and state the largest stable positive $\Delta t$.
2. **Easy:** Derive the centered second-difference stencil and identify its order.
3. **Intermediate:** Explain why finite volume conserves a transported quantity across neighboring cells.
4. **Intermediate:** Choose spectral, finite difference, or finite element methods for a smooth periodic field, a rectangular grid, and a complex curved domain.
5. **Advanced:** Given $Q_h=10.4$, $Q_{h/2}=10.1$, and $Q_{h/4}=10.025$, estimate the observed order.
6. **Challenge:** Design verification and validation checks for CFD pressure drop through a pipe.

1. $y_{n+1}=(1-3\Delta t)y_n$ and stability gives $0<\Delta t<2/3$.
2. Taylor expansion gives $u''(x_i)=[u_{i-1}-2u_i+u_{i+1}]/h^2+O(h^2)$, so it is second order.
3. Each internal face flux has opposite signs for adjacent cells, so internal transfers cancel in the global sum.
4. Use spectral for the smooth periodic field, finite difference for the regular rectangular grid, and finite element for the curved domain.
5. The differences are $0.3$ and $0.075$; their ratio is $4$, so $p_{\mathrm{obs}}=\log_2(4)=2$.
6. Check residuals, conservation, mesh and time-step refinement, boundary sensitivity, an analytic fully developed-flow limit, and measured pressure drop under matched conditions and uncertainty.

## Summary

ODE methods advance states in time. Finite differences approximate derivatives at points. Finite volume balances fluxes over cells. Spectral methods use global bases. Finite elements enforce a weak form over elements. CFD combines these ideas with fluid physics, mesh design, and turbulence modeling. Every credible result needs appropriate assumptions, stability, convergence evidence, verification, and validation.
