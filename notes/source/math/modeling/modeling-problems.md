---
id: modeling-11
note: math-modeling
title: "Identify the Main Goal of a Model"
skills: [Modeling goals]
---

A model is built to estimate next month's demand from current sales data.

What main modeling goal is this?

:::solution
This is mainly a model for predicting future behavior.

The model uses current data to estimate what is likely to happen next month.
:::

---
id: modeling-12
note: math-modeling
title: "Classify a Random Demand Model"
skills: [Deterministic and stochastic]
---

A store demand model includes random day-to-day fluctuations.

Is this model deterministic or stochastic?

:::solution
It is stochastic.

A stochastic model includes randomness, and the demand changes unpredictably from day to day.
:::

---
id: modeling-13
note: math-modeling
title: "Classify an Inventory Snapshot"
skills: [Static and dynamic]
---

A one-day inventory report gives the number of items on hand at a single moment.

Is this model static or dynamic?

:::solution
It is static.

A static model describes one snapshot in time rather than how the system changes over time.
:::

---
id: modeling-14
note: math-modeling
title: "Classify a Temperature Reading"
skills: [Continuous and discrete]
---

Temperature changes smoothly throughout the day.

Is this quantity best modeled as continuous or discrete?

:::solution
It is continuous.

Temperature varies smoothly, so a continuous model is appropriate.
:::

---
id: modeling-15
note: math-modeling
title: "Identify a Linear Relation"
skills: [Linear and nonlinear]
---

Is the relation

$$
y = 3x - 2
$$

linear or nonlinear?

:::solution
It is linear.

It has the form $y = mx + b$, which is the standard linear form.
:::

---
id: modeling-16
note: math-modeling
title: "Compute Absolute Error"
skills: [Absolute error]
---

A model predicts $47$ when the true value is $50$.

What is the absolute error?

:::solution
Use the absolute error formula:

$$
e_{abs} = |x - x_{true}|
$$

So,

$$
|47 - 50| = 3
$$

The absolute error is $3$.
:::

---
id: modeling-17
note: math-modeling
title: "Compute Relative Error"
skills: [Relative error]
---

A model predicts $94$ when the true value is $100$.

What is the relative error?

:::solution
Use the relative error formula:

$$
e_{rel} = \frac{|x - x_{true}|}{|x_{true}|}
$$

So,

$$
e_{rel} = \frac{|94 - 100|}{100} = \frac{6}{100} = 0.06
$$

The relative error is $0.06$, or $6\%$.
:::

---
id: modeling-18
note: math-modeling
title: "Find a Residual"
skills: [Residuals]
---

A data point has observed value $18$ and model prediction $15$.

What is the residual?

:::solution
The residual is

$$
r_i = y_i - \hat y_i
$$

So,

$$
18 - 15 = 3
$$

The residual is $3$.
:::

---
id: modeling-19
note: math-modeling
title: "Tell Growth from the Sign"
skills: [Growth and decay]
---

In the model

$$
\frac{dP}{dt} = kP,
$$

the population is decreasing.

What sign must $k$ have?

:::solution
If the population is decreasing, then the rate of change is negative.

For $\frac{dP}{dt} = kP$, that means $k < 0$.

So $k$ must be negative.
:::

---
id: modeling-110
note: math-modeling
title: "Read a Logistic Carrying Capacity"
skills: [Logistic growth]
---

Consider the logistic model

$$
\frac{dP}{dt} = rP\left(1 - \frac{P}{800}\right).
$$

What is the carrying capacity, and what value does $P$ approach if the model is stable?

:::solution
The carrying capacity is the value in the denominator:

$$
K = 800
$$

In a stable logistic model, $P$ approaches the carrying capacity, so

$$
P \to 800.
$$
:::

---
id: modeling-21
note: math-modeling
title: "Write an Exponential Growth Model"
skills: [Differential equations, Growth and decay]
---

A population starts at $250$ and grows at a rate proportional to its size with growth rate $k = 0.04$.

Write the model for $P(t)$.

:::solution
For proportional growth, the solution has the form

$$
P(t) = P_0 e^{kt}
$$

Here $P_0 = 250$ and $k = 0.04$, so

$$
P(t) = 250e^{0.04t}.
$$
:::

---
id: modeling-22
note: math-modeling
title: "Set Up a Balance Equation"
skills: [Conservation laws, Differential equations]
---

A tank contains $60$ liters of water.

Water flows in at $9$ liters per hour and flows out at $4$ liters per hour.

Assuming no other sources, write the rate of change and the amount after $t$ hours.

:::solution
Use the balance law:

$$
\text{change} = \text{inflow} - \text{outflow}
$$

So the net rate is

$$
\frac{dV}{dt} = 9 - 4 = 5.
$$

With initial value $V(0)=60$, the amount after $t$ hours is

$$
V(t) = 60 + 5t.
$$
:::

---
id: modeling-23
note: math-modeling
title: "Find the Units of a Parameter"
skills: [Dimensional analysis]
---

In the equation

$$
\frac{dx}{dt} = kx,
$$

$x$ is measured in kilograms and $t$ is measured in hours.

What are the units of $k$?

:::solution
The left-hand side has units of kilograms per hour.

Since $kx$ must also have units of kilograms per hour and $x$ has units of kilograms, $k$ must have units of

$$
\frac{1}{\text{hour}}.
$$

So the units of $k$ are inverse hours.
:::

---
id: modeling-24
note: math-modeling
title: "Estimate the Timescale"
skills: [Scaling and nondimensionalization, Growth and decay]
---

If

$$
\frac{dx}{dt} = 0.25x,
$$

what is the rough timescale of the process?

:::solution
For proportional growth, the characteristic timescale is roughly

$$
\tau \sim \frac{1}{k}.
$$

Here $k = 0.25$, so

$$
\tau \sim \frac{1}{0.25} = 4.
$$

The rough timescale is $4$ time units.
:::

---
id: modeling-25
note: math-modeling
title: "Write a Least-Squares Objective"
skills: [Least squares, Residuals]
---

For the data points $(1,4)$, $(2,7)$, and $(3,8)$, use the linear model

$$
y = mx + b
$$

to write the least-squares objective function $S(m,b)$.

:::solution
The least-squares objective is the sum of squared residuals:

$$
S(m,b) = \sum_{i=1}^n \left(y_i - f(x_i; m,b)\right)^2.
$$

For the three data points, this becomes

$$
S(m,b) = (4 - (m+b))^2 + (7 - (2m+b))^2 + (8 - (3m+b))^2.
$$
:::

---
id: modeling-26
note: math-modeling
title: "Interpret a Curved Residual Plot"
skills: [Residuals, Validation and error analysis]
---

A linear fit leaves residuals that bend upward and then downward instead of scattering randomly around zero.

What does this suggest?

:::solution
The pattern suggests the model is missing structure.

In particular, the relationship is likely nonlinear, or an important variable may be missing.

A good residual plot for a linear model should look random, not curved.
:::

---
id: modeling-27
note: math-modeling
title: "Name the State Variables"
skills: [Modeling cycle, Systems of equations]
---

Two connected lakes each have a fish population that changes over time, and the populations affect one another.

What quantities should be in the state vector?

:::solution
The state vector should contain the two fish populations, one for each lake.

Because both quantities evolve together, a system of equations is appropriate.
:::

---
id: modeling-28
note: math-modeling
title: "Choose the Right Model Family"
skills: [Difference equations, Model families]
---

A store updates its inventory once each week using last week's stock and this week's sales.

Which model family is the best fit?

:::solution
A difference equation model is the best fit.

The updates happen in discrete weekly steps, so a step-by-step recursive rule matches the situation.
:::

---
id: modeling-31
note: math-modeling
title: "Choose a Model for Saturating Growth"
skills: [Logistic growth, Model families]
---

A fish population grows quickly at first, but it levels off near $500$ because the lake has limited food.

Which model family is most appropriate, and why?

:::solution
A logistic growth model is most appropriate.

The population starts with near-exponential growth, but the leveling off shows a carrying capacity, which is exactly what logistic growth models.
:::

---
id: modeling-32
note: math-modeling
title: "Set Up a Linear Programming Model"
skills: [Optimization models]
---

A factory makes tables and chairs.

Let $x$ be the number of tables and $y$ be the number of chairs.

Each table uses $3$ hours of machine time and each chair uses $1$ hour.

At most $12$ hours are available.

Each table costs \$40 to make and each chair costs \$10 to make, and the budget is at most \$160.

Write a linear programming model that maximizes the total number of items produced.

:::solution
Let the objective be to maximize total production:

$$
\max (x+y)
$$

The constraints are:

$$
3x + y \le 12
$$

$$
40x + 10y \le 160
$$

$$
x \ge 0,\quad y \ge 0.
$$

This is a linear programming model because the objective and constraints are linear.
:::

---
id: modeling-33
note: math-modeling
title: "Use a Conservation Law in a Tank"
skills: [Conservation laws, Linear models]
---

A tank starts with $90$ liters.

It gains $7$ liters per minute and loses $2$ liters per minute.

How much water is in the tank after $20$ minutes?

:::solution
The net change is

$$
7 - 2 = 5 \text{ liters per minute}.
$$

After $20$ minutes, the increase is

$$
5 \cdot 20 = 100.
$$

So the amount of water is

$$
90 + 100 = 190.
$$
:::

---
id: modeling-34
note: math-modeling
title: "Choose a Stochastic Model"
skills: [Probabilistic models, Deterministic and stochastic]
---

A clinic's patient arrivals vary unpredictably from hour to hour.

Why is a stochastic model more appropriate than a deterministic one?

:::solution
A stochastic model is better because the arrivals include randomness.

A deterministic model would give the same output every time from the same input, but the clinic's arrivals fluctuate unpredictably.
:::

---
id: modeling-35
note: math-modeling
title: "Use a Graph Model for Routing"
skills: [Graph and network models]
---

A delivery app represents intersections as points and roads as connections between them.

What model family is this, and what kinds of questions can it help answer?

:::solution
This is a graph or network model.

The intersections are nodes and the roads are edges.

It can help with routing, shortest-path questions, and flow problems.
:::

---
id: modeling-41
note: math-modeling
title: "Choose the Better Long-Term Model"
skills: [Logistic growth, Common pitfalls]
---

A population is $400$ now.

Model A is exponential:

$$
P(t) = 400e^{0.08t}
$$

Model B is logistic with a carrying capacity of $1200$.

If the population lives in a closed habitat, which model is more reasonable, and why?

:::solution
Model B is more reasonable.

In a closed habitat, resources are limited, so growth should eventually slow down.

The exponential model grows without bound, while the logistic model levels off at the carrying capacity.
:::

---
id: modeling-42
note: math-modeling
title: "Diagnose a Calibration Problem"
skills: [Overfitting and underfitting, Validation and error analysis]
---

A fitted model matches every calibration point exactly, but it performs poorly on new data and shows a clear pattern of errors.

What problem does this suggest?

:::solution
This suggests overfitting, because the model is too flexible and learned the calibration data too closely.

The clear error pattern on new data also suggests the model structure may be missing an important effect.
:::

---
id: modeling-43
note: math-modeling
title: "Balance at Equilibrium"
skills: [Conservation laws, Problem-solving checklist]
---

A model uses the balance law

$$
\text{change} = \text{inflow} - \text{outflow} + \text{generation} - \text{consumption}.
$$

If the quantity is not changing over time, what relationship must hold among the four terms?

:::solution
If the quantity is not changing, then the left-hand side is $0$.

So the balance law becomes

$$
0 = \text{inflow} - \text{outflow} + \text{generation} - \text{consumption}.
$$

Rearranging gives

$$
\text{inflow} + \text{generation} = \text{outflow} + \text{consumption}.
$$
:::

---
id: modeling-44
note: math-modeling
title: "Build a Modeling Plan"
skills: [Modeling cycle, Probabilistic models, Optimization models]
---

A business wants to forecast weekly demand, which has random swings, and then minimize production cost while respecting machine limits.

What main modeling components should be included?

:::solution
The model should include:

- A stochastic component for demand uncertainty
- A discrete time structure, since the forecast is weekly
- Decision variables for production
- An objective function for cost
- Constraints for machine limits
- Calibration using data
- Validation on new weeks of data

This combines forecasting with optimization.
:::
