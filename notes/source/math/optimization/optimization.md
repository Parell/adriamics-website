# Optimization

Optimization chooses the best feasible value of a function. It appears whenever a model must balance cost, energy, time, error, mass, risk, or performance. The basic problem is

$$
\min_{\mathbf{x}\in\mathcal{F}} f(\mathbf{x}),
$$

where \(f\) is the objective and \(\mathcal{F}\) is the feasible set defined by constraints. Maximization is minimization of \(-f\). The vector \(\mathbf{x}\) contains the decision variables.

This module uses [Multivariable Differential Calculus](/notes/subjects/math/multivariable-calculus/multivariable-differential-calculus/), [Matrices](/notes/subjects/math/matrices/), [Eigenvalues](/notes/subjects/math/eigenvalues/), and [Numerical Methods](/notes/subjects/math/numerical-methods/).

## 1. Unconstrained optimization

For an interior local minimum of a differentiable function,

$$
\nabla f(\mathbf{x}^*)=\mathbf{0}.
$$

This is necessary, not sufficient. The Hessian test classifies a stationary point:

| Hessian at \(\mathbf{x}^*\) | Conclusion |
|---|---|
| \(\nabla^2 f\succ0\) | strict local minimum |
| \(\nabla^2 f\prec0\) | strict local maximum |
| indefinite | saddle point |
| semidefinite | test may be inconclusive |

In one variable this reduces to \(f'(x^*)=0\): if \(f''(x^*)>0\), the point is a local minimum. A global minimum must also be compared with boundary behavior and other candidates. A minimum is guaranteed on a compact feasible set when \(f\) is continuous.

## 2. Convexity

A set \(\mathcal{F}\) is convex if every line segment between two feasible points remains feasible:

$$
\mathbf{x},\mathbf{y}\in\mathcal{F},\quad 0\le t\le1
\implies t\mathbf{x}+(1-t)\mathbf{y}\in\mathcal{F}.
$$

A differentiable function is convex when

$$
f(\mathbf{y})\ge f(\mathbf{x})+\nabla f(\mathbf{x})^{\mathsf T}(\mathbf{y}-\mathbf{x}).
$$

If it is twice differentiable, \(\nabla^2f(\mathbf{x})\succeq0\) everywhere is sufficient. Positive definiteness gives strict convexity. For a convex objective over a convex feasible set, every local minimum is global; therefore \(\nabla f(\mathbf{x}^*)=0\) is sufficient for an unconstrained optimum. Strict convexity gives at most one minimizer.

The eigenvalues of the Hessian reveal curvature: the smallest eigenvalue is a lower curvature bound and the largest is an upper bound. A quadratic

$$
f(\mathbf{x})=\tfrac12\mathbf{x}^{\mathsf T}Q\mathbf{x}+\mathbf{c}^{\mathsf T}\mathbf{x}+d
$$

is convex exactly when the symmetric matrix \(Q\succeq0\).

## 3. Gradient methods

The negative gradient is the direction of steepest local decrease. Gradient descent uses

$$
\mathbf{x}_{k+1}=\mathbf{x}_k-\alpha_k\nabla f(\mathbf{x}_k),
$$

where \(\alpha_k>0\) is a step size. A fixed step can be fast or unstable; backtracking line search starts with a trial step and reduces it until the sufficient-decrease condition

$$
f(\mathbf{x}_k-\alpha\mathbf{g}_k)\le f(\mathbf{x}_k)-c\alpha\|\mathbf{g}_k\|^2
$$

holds, with \(0<c<1\). Stop when both \(\|\nabla f\|\) and the change in \(f\) are small. Poor scaling creates long zig-zag paths; preconditioning or rescaling variables helps.

## 4. Newton and quasi-Newton methods

Newton's method minimizes the local quadratic model. With \(H_k=\nabla^2f(\mathbf{x}_k)\), solve

$$
H_k\mathbf{p}_k=-\nabla f(\mathbf{x}_k),
\qquad
\mathbf{x}_{k+1}=\mathbf{x}_k+\alpha_k\mathbf{p}_k.
$$

Near a well-behaved solution, full Newton steps can converge quadratically. Computing and factorizing a Hessian is expensive, and an indefinite Hessian can produce an ascent direction, so line searches or trust regions are common.

Quasi-Newton methods build an approximation \(B_k\approx(\nabla^2f)^{-1}\) from gradient changes, avoiding explicit second derivatives:

$$
\mathbf{x}_{k+1}=\mathbf{x}_k-\alpha_kB_k\nabla f(\mathbf{x}_k).
$$

The BFGS update is a standard choice; limited-memory BFGS (L-BFGS) stores only a few vectors and works well for large problems. Newton is usually the fastest near a solution when its derivatives are affordable; gradient descent is simpler and cheaper per iteration.

## 5. Constrained optimization

Constraints may be equalities \(h_j(\mathbf{x})=0\), inequalities \(g_i(\mathbf{x})\le0\), or bounds such as \(\ell\le\mathbf{x}\le u\). For equality constraints, the Lagrangian is

$$
\mathcal{L}(\mathbf{x},\boldsymbol\lambda)=f(\mathbf{x})+\boldsymbol\lambda^{\mathsf T}\mathbf{h}(\mathbf{x}).
$$

At a regular constrained optimum,

$$
\nabla f(\mathbf{x}^*)+J_{\mathbf h}(\mathbf{x}^*)^{\mathsf T}\boldsymbol\lambda^*=0,
\qquad \mathbf h(\mathbf{x}^*)=\mathbf0.
$$

For inequalities, the Karush–Kuhn–Tucker conditions add multipliers \(\boldsymbol\mu\ge0\):

$$
\nabla f+J_{\mathbf h}^{\mathsf T}\boldsymbol\lambda+J_{\mathbf g}^{\mathsf T}\boldsymbol\mu=0,
\quad \mathbf h=0,\quad \mathbf g\le0,\quad \mu_i g_i=0.
$$

The last condition is complementary slackness: an inactive constraint has zero multiplier. For convex problems with suitable constraint qualifications, KKT conditions are necessary and sufficient for global optimality.

## 6. Linear programming

A linear program has linear objective and constraints:

$$
\min_{\mathbf{x}}\ \mathbf{c}^{\mathsf T}\mathbf{x}
\quad\text{subject to}\quad A\mathbf{x}\le\mathbf{b},\quad \mathbf{x}\ge\mathbf0.
$$

Its feasible region is a polyhedron. If a finite optimum exists, at least one optimum occurs at a vertex, which motivates the simplex method. Interior-point methods move through the interior and are effective for large sparse problems. Linear programming models allocation, blending, routing, scheduling, and diet or portfolio constraints.

## 7. Quadratic programming

Quadratic programming uses a quadratic objective with linear constraints:

$$
\min_{\mathbf{x}}\ \tfrac12\mathbf{x}^{\mathsf T}Q\mathbf{x}+\mathbf{c}^{\mathsf T}\mathbf{x}
\quad\text{subject to}\quad A\mathbf{x}\le\mathbf{b},\quad E\mathbf{x}=\mathbf{d}.
$$

When \(Q\succeq0\), this is a convex QP and KKT conditions characterize the global solution. Least squares with bounds, mean–variance portfolios, and model predictive control are common examples. If \(Q\) is indefinite, the problem may have multiple local minima and requires a nonconvex solver.

## 8. Multi-objective optimization

Real designs often optimize several objectives, such as low cost and low mass. Write

$$
\min_{\mathbf{x}\in\mathcal F}\big(f_1(\mathbf{x}),\ldots,f_m(\mathbf{x})\big).
$$

A feasible point is **Pareto optimal** if no objective can be improved without worsening at least one other objective. The set of such solutions is the Pareto front. A practical scalarization is the weighted sum

$$
\min_{\mathbf{x}\in\mathcal F}\sum_{i=1}^m w_i\,\widetilde f_i(\mathbf{x}),
\qquad w_i\ge0,
$$

where normalized objectives \(\widetilde f_i\) prevent units or scale from silently determining the result. Varying the weights traces supported Pareto points; constraint or goal-programming formulations can recover tradeoffs that weighted sums miss. Always report the chosen weights, normalization, and the resulting tradeoff.

## 9. Practical workflow

1. Define variables, units, objective, constraints, and whether each quantity is to be minimized or maximized.
2. Check feasibility, scaling, convexity, differentiability, and whether a global solution is expected.
3. Choose a solver: LP/QP for their structured models; gradient, Newton, or quasi-Newton for smooth problems; a constrained method when feasibility must be maintained.
4. Verify the result using objective value, gradient or KKT residuals, constraint violations, bounds, and sensitivity to initial guesses and tolerances.
5. Check the model: an accurately solved optimization problem can still produce a poor decision if the objective, constraints, or data are wrong.

### Checkpoint

You are ready to apply these methods when you can distinguish local from global optimality, use a Hessian to recognize convexity, derive a KKT system, select a method for an LP or QP, and explain a Pareto tradeoff.
