---
auditors:
  - "@Parell"
status: draft
last_reviewed: 2026-05-22
sources: []
---
# 1. What mathematical modeling is

Mathematical modeling is the process of representing a real-world system with mathematical structures so that the system can be analyzed, predicted, or optimized.

A good model is not the same as a perfect description of reality. It is a simplified representation built to answer a specific question.

Typical goals:

- Explain observed behavior
- Predict future behavior
- Estimate unknown quantities
- Compare competing scenarios
- Support decision-making under constraints

## What makes a model useful

A useful model is:

- Mathematically consistent
- Simple enough to analyze or compute
- Accurate enough for the intended purpose
- Transparent about assumptions and limitations

Modeling is always a tradeoff between fidelity and tractability. More detail usually increases realism, but it also increases complexity, uncertainty, and the risk of overfitting.

---

# 2. The modeling cycle

Most modeling problems follow a recurring cycle.

## 1. Define the question

Start with the specific quantity or relationship you want to understand.

Examples:

- How many customers will a business have next month?
- What load can a bridge support?
- What is the optimal production schedule?
- How does a disease spread through a population?

The question determines the variables, level of detail, and output format.

## 2. Identify variables and assumptions

Classify the quantities involved.

- **State variables** describe the system at a given time.
- **Inputs** are external influences or controls.
- **Parameters** are fixed or slowly varying quantities.
- **Outputs** are the quantities of interest.

Assumptions reduce reality to something mathematically manageable.

Examples of assumptions:

- The system is well mixed
- Growth is proportional to current size
- Friction is negligible
- Variables change continuously
- Effects are independent

## 3. Build the equations

Choose mathematical relationships based on known laws, empirical patterns, geometry, or constraints.

Common sources:

- Conservation laws
- Proportionality arguments
- Geometric relations
- Statistical fitting
- Optimization criteria

## 4. Solve or simulate

Depending on the model, use:

- Algebra
- Calculus
- Differential equations
- Linear algebra
- Numerical methods
- Statistical estimation

## 5. Check the result

Ask whether the result is:

- Dimensionally consistent
- Numerically plausible
- Stable under small changes
- Compatible with known behavior

## 6. Refine

If the model fails to capture important behavior, revise the assumptions, add variables, or change the structure.

The best models are often iterative, not one-shot.

---

# 3. Types of models

## Deterministic and stochastic

Deterministic models produce the same output for the same input.

Examples:

- Projectile motion without random wind
- Linear growth with fixed rate
- Many idealized optimization problems

Stochastic models include randomness.

Examples:

- Queueing systems
- Random walks
- Demand forecasting with uncertainty
- Epidemic spread with probabilistic contacts

## Static and dynamic

Static models describe one snapshot in time.

Dynamic models describe how a system evolves over time.

Examples:

- Static: equilibrium in a truss
- Dynamic: spring-mass motion
- Static: budget allocation
- Dynamic: inventory over time

## Continuous and discrete

Continuous models use variables that vary smoothly.

Examples:

- Temperature
- Position
- Concentration

Discrete models use countable steps or entities.

Examples:

- Graph models
- Difference equations
- Integer programming
- Markov chains

## Linear and nonlinear

Linear models are easier to solve and interpret, but they may be too simple.

A linear relation has the form

$$
y = mx + b
$$

or, more generally,

$$
Ax = b
$$

Nonlinear models can represent saturation, thresholds, feedback, and chaos.

Examples:

- Logistic growth
- Drag proportional to velocity squared
- Predator-prey systems

---

# 4. Core modeling tools

## Dimensional analysis

Units must be consistent. Dimensional analysis often reveals missing factors or incorrect formulas.

If two expressions are supposed to be equal, their dimensions must match.

Example:

$$
\text{distance} = \text{speed} \times \text{time}
$$

since

$$
[L] = [L/T][T]
$$

## Scaling and nondimensionalization

Scaling replaces raw variables with dimensionless combinations that expose the governing behavior.

This often reduces the number of parameters and helps identify dominant effects.

Example:

If

$$
\frac{dx}{dt} = ax
$$

then the timescale is roughly

$$
\tau \sim \frac{1}{a}
$$

## Conservation laws

Many models start from a balance statement:

$$
\text{change} = \text{inflow} - \text{outflow} + \text{generation} - \text{consumption}
$$

Examples:

- Mass balance
- Energy balance
- Momentum balance
- Population balance

## Functions and rates of change

If a quantity changes over time, its derivative often appears in the model.

For a state variable $x(t)$:

$$
\frac{dx}{dt}
$$

represents the instantaneous rate of change.

Common forms:

- Proportional growth: $\frac{dx}{dt} = kx$
- Logistic growth: $\frac{dx}{dt} = rx\left(1 - \frac{x}{K}\right)$
- Relaxation: $\frac{dx}{dt} = -k(x - x^*)$

## Systems of equations

Real models often involve multiple interacting variables:

$$
\frac{d\mathbf{x}}{dt} = f(\mathbf{x}, t, \mathbf{p})
$$

where $\mathbf{x}$ is the state vector and $\mathbf{p}$ is the parameter vector.

---

# 5. Parameter fitting and calibration

Parameters are numbers chosen so the model matches observed data.

## Calibration workflow

1. Choose the model structure
2. Collect data
3. Define the error measure
4. Estimate the parameters
5. Check fit quality
6. Test on new data if possible

## Least squares

If observed data are $(x_i, y_i)$ and the model predicts $\hat y_i = f(x_i; \theta)$, a common objective is

$$
S(\theta) = \sum_{i=1}^n \left(y_i - f(x_i; \theta)\right)^2
$$

The best-fit parameter vector $\theta$ minimizes $S(\theta)$.

For a linear model

$$
y = mx + b
$$

the least-squares fit chooses $m$ and $b$ to minimize the total squared residuals.

## Residuals

The residual at observation $i$ is

$$
r_i = y_i - \hat y_i
$$

Residual plots help reveal:

- Nonlinearity
- Heteroscedasticity
- Outliers
- Missing variables

## Overfitting and underfitting

- **Underfitting**: model is too simple to capture the pattern
- **Overfitting**: model is too flexible and captures noise instead of signal

A model should generalize, not just memorize the calibration data.

---

# 6. Validation and error analysis

Model validation checks whether the model is reliable for its intended use.

## Sources of error

- Measurement error
- Parameter uncertainty
- Structural error from simplifying assumptions
- Numerical approximation error
- Random variation

## Relative and absolute error

Absolute error:

$$
e_{abs} = |x - x_{true}|
$$

Relative error:

$$
e_{rel} = \frac{|x - x_{true}|}{|x_{true}|}
$$

## Sensitivity analysis

Sensitivity analysis measures how much the output changes when an input or parameter changes.

If a small parameter change causes a large output change, the model is sensitive and may require more careful calibration.

This is especially important near thresholds, bifurcations, or unstable equilibria.

## Validation tests

Useful checks include:

- Compare predictions against held-out data
- Compare limiting behavior to known special cases
- Check units and dimensions
- Perturb parameters and inspect stability
- Ask whether the model fails gracefully

---

# 7. Common model families

## Linear models

Linear models are the starting point for many applications.

General form:

$$
\mathbf{y} = A\mathbf{x} + \mathbf{b}
$$

Use linear models when the response is approximately proportional to the input over the relevant range.

## Differential equation models

Differential equations describe continuous change.

Example:

$$
\frac{dN}{dt} = rN
$$

This represents exponential growth or decay depending on the sign of $r$.

## Difference equation models

Difference equations model stepwise change:

$$
x_{n+1} = F(x_n)
$$

These are useful for seasonal data, recursive processes, and simulations.

## Optimization models

Optimization seeks the best value of an objective function subject to constraints.

General form:

$$
\min_x f(x)
$$

subject to

$$
g_i(x) \le 0,\quad h_j(x) = 0
$$

Applications:

- Scheduling
- Design
- Resource allocation
- Routing

## Graph and network models

Graph models represent connections between objects.

They are useful for:

- Transportation networks
- Social networks
- Dependency graphs
- Flow problems

Nodes represent entities and edges represent interactions.

## Probabilistic models

Probabilistic models represent uncertainty explicitly.

Examples:

- Bayesian inference
- Markov chains
- Hidden state models
- Monte Carlo simulation

---

# 8. Worked example: population growth

Suppose a population grows at a rate proportional to its current size.

## Model

Let $P(t)$ be the population. Then

$$
\frac{dP}{dt} = kP
$$

where $k$ is a constant growth rate.

## Solution

Separating variables gives

$$
\frac{1}{P}\,dP = k\,dt
$$

Integrating:

$$
\ln |P| = kt + C
$$

so

$$
P(t) = P_0 e^{kt}
$$

where $P_0$ is the initial population.

## Interpretation

- If $k > 0$, the population grows exponentially.
- If $k < 0$, the population decays exponentially.
- If growth saturates in reality, the exponential model eventually becomes inaccurate.

## Extension: logistic growth

A more realistic model with carrying capacity $K$ is

$$
\frac{dP}{dt} = rP\left(1 - \frac{P}{K}\right)
$$

This adds self-limiting behavior:

- Growth is nearly exponential when $P \ll K$
- Growth slows as $P$ approaches $K$
- The equilibrium $P = K$ is stable

---

# 9. Worked example: optimization model

Suppose a company wants to minimize cost while meeting a production target.

## Decision variable

Let $x$ be the number of units produced by machine A and $y$ the number produced by machine B.

## Objective

Minimize cost:

$$
C(x,y) = c_1x + c_2y
$$

## Constraints

Production requirement:

$$
x + y \geq P
$$

Capacity limits:

$$
0 \leq x \leq A
$$

$$
0 \leq y \leq B
$$

## Interpretation

This is a linear programming model if the objective and constraints are linear.

The solution typically occurs at a feasible corner point of the constraint region.

## Modeling lesson

The important part is not just solving the equations. It is making sure the variables, objective, and constraints correctly encode the real decision problem.

---

# 10. Common pitfalls

## Confusing correlation with causation

A fitted pattern does not automatically imply a causal relationship.

## Adding unnecessary complexity

More parameters do not automatically improve a model.

## Ignoring units

Dimensional mistakes often signal deeper conceptual errors.

## Using the model outside its validity range

Every model has an implicit domain of applicability.

Examples:

- Linear approximations near an operating point
- Ideal gas assumptions at moderate conditions
- Constant-rate growth models at early times

## Failing to test extremes

Check what the model predicts when:

- Inputs go to zero
- Inputs become very large
- Parameters change sign
- Constraints become tight

## Overlooking identifiability

If multiple parameter sets produce nearly the same output, the model may not be well determined by the available data.

---

# 11. Problem-solving checklist

Use this workflow when building or solving a model.

1. State the question precisely.
2. Define the variables and units.
3. List assumptions explicitly.
4. Decide whether the model is static, dynamic, deterministic, or stochastic.
5. Write the governing equations.
6. Add constraints and initial or boundary conditions.
7. Solve symbolically or numerically.
8. Check units, signs, and limiting cases.
9. Compare with data or known behavior.
10. Refine if necessary.

If the result looks strange, do not force the algebra. Re-check the assumptions first.

---

# 12. Formula summary

## Growth and decay

$$
\frac{dx}{dt} = kx
$$

$$
x(t) = x_0 e^{kt}
$$

## Logistic growth

$$
\frac{dx}{dt} = rx\left(1 - \frac{x}{K}\right)
$$

## Least squares objective

$$
S(\theta) = \sum_{i=1}^n \left(y_i - f(x_i; \theta)\right)^2
$$

## Relative error

$$
e_{rel} = \frac{|x - x_{true}|}{|x_{true}|}
$$

## General optimization problem

$$
\min_x f(x)
$$

subject to

$$
g_i(x) \le 0,\quad h_j(x) = 0
$$

## Balance law

$$
\text{change} = \text{inflow} - \text{outflow} + \text{generation} - \text{consumption}
$$

---

## Key idea

Modeling is the art of choosing the right simplification for the question being asked. Good models are not merely correct in principle; they are useful, testable, and honest about their limits.
