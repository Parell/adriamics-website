<!--
id: numerical-methods-11
note: math-numerical-methods
title: "Estimate a Function with Newton's Method"
skills: [Newton's Method, Root Finding]
-->

For $f(x)=x^2-2$, write one Newton step starting from $x_0=1$.

:::solution
$x_1=x_0-f(x_0)/f'(x_0)=1-(-1)/2=1.5$.
:::

<!--
id: numerical-methods-12
note: math-numerical-methods
title: "Identify Absolute Error"
skills: [Error Analysis]
-->

An approximation is $3.14$ and the exact value is $\pi$. Write its absolute error.

:::solution
The absolute error is $|3.14-\pi|\approx0.00159265$.
:::

<!--
id: numerical-methods-21
note: math-numerical-methods
title: "Apply Forward Euler"
skills: [ODE Solvers, Forward Euler]
-->

Use one forward-Euler step with $\Delta t=0.1$ for $y'=-2y$, $y(0)=3$.

:::solution
$y_1=y_0+\Delta t(-2y_0)=3+0.1(-6)=2.4$.
:::

<!--
id: numerical-methods-22
note: math-numerical-methods
title: "Check a Finite-Difference Units"
skills: [Finite Differences, Dimensional Analysis]
-->

What units must $\Delta x^2$ have if it appears in the denominator of a second spatial derivative approximation?

:::solution
If $x$ is measured in meters, $\Delta x^2$ has units $\mathrm{m^2}$, so the approximation has the units of the field divided by $\mathrm{m^2}$.
:::

<!--
id: numerical-methods-31
note: math-numerical-methods
title: "Interpret Convergence"
skills: [Convergence, Verification]
-->

Why does reducing a discretization step not by itself prove that a numerical result is physically correct?

:::solution
Refinement addresses discretization error, but model error, incorrect boundary data, instability, and implementation errors can remain.
:::
