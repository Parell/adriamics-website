---
auditors:
  - "@Parell"
status: draft
last_reviewed: 2026-05-22
sources: []
---
# 1. What a function is

A **function** is a rule that assigns each input exactly one output.

In set notation, a function from set $A$ to set $B$ is written

$$
f : A \to B
$$

and means that every element of the domain $A$ maps to one element in the codomain $B$.

The key requirement is **single-valued output**:

- One input can produce only one output.
- Different inputs can produce the same output.

Examples:

- $f(x) = x^2$ is a function.
- $g(x) = \pm \sqrt{x}$ is not a function if both signs are taken at once.
- The relation $y^2 = x$ is not a function of $x$ unless you restrict the branch.

## Vertical line test

A graph represents a function of $x$ if every vertical line intersects the graph at most once.

This is a fast visual check, but it is not a substitute for reasoning about the domain.

---

# 2. Notation, domain, codomain, and range

## Standard notation

If $f$ is a function, then

$$
f(x)
$$

means the output produced when the input is $x$.

Common language:

- **Independent variable**: the input, usually $x$
- **Dependent variable**: the output, usually $y = f(x)$

## Domain

The **domain** is the set of allowed inputs.

Typical restrictions:

- Denominators cannot be zero.
- Even roots require nonnegative radicands.
- Logarithms require positive arguments.
- Real-valued formulas may fail for certain inputs.

Example:

$$
f(x) = \frac{1}{x - 3}
$$

has domain $x \ne 3$.

## Codomain and range

The **codomain** is the target set declared for the function.

The **range** is the set of actual output values the function takes.

Example:

$$
f(x) = x^2
$$

as a function from $\mathbb{R} \to \mathbb{R}$ has range $[0,\infty)$.

Do not confuse codomain with range. The codomain is a design choice; the range is a result.

---

# 3. Reading and evaluating functions

## Evaluating at a point

To evaluate $f(a)$, substitute $a$ for every occurrence of the variable.

Example:

$$
f(x) = 2x^2 - 3x + 1
$$

Then

$$
f(4) = 2(4)^2 - 3(4) + 1 = 32 - 12 + 1 = 21
$$

## Function values from tables and graphs

From a table, read the output in the row matching the input.

From a graph:

- Find the input on the horizontal axis.
- Move vertically to the graph.
- Read the corresponding output.

## Interpreting units

In applications, the variable and output usually carry units.

Example:

- $t$ = time in seconds
- $h(t)$ = height in meters

Then $h(3)$ means the height after 3 seconds.

Keep units consistent when substituting values into formulas.

---

# 4. Common function families

## Polynomial functions

Polynomials have the form

$$
f(x) = a_n x^n + a_{n-1}x^{n-1} + \cdots + a_1 x + a_0
$$

where $n$ is a nonnegative integer.

Properties:

- Domain is all real numbers.
- Graphs are smooth and continuous.
- End behavior depends on the leading term $a_n x^n$.

## Rational functions

A rational function is a quotient of polynomials:

$$
f(x) = \frac{p(x)}{q(x)}
$$

Restrictions:

- $q(x) \ne 0$
- Vertical asymptotes may occur where the denominator is zero and the factor does not cancel
- Holes may occur where a common factor cancels

## Radical functions

Examples:

$$
f(x) = \sqrt{x}, \qquad g(x) = \sqrt[3]{x}
$$

Key idea:

- Even roots require nonnegative radicands in the real numbers.
- Odd roots are defined for all real inputs.

## Exponential and logarithmic functions

Exponential form:

$$
f(x) = a^x, \qquad a > 0,\ a \ne 1
$$

Logarithmic form:

$$
\log_a(x)
$$

These are inverse functions when the same base is used.

Important constraints:

- For $a^x$, the output is always positive.
- For $\log_a(x)$, the input must satisfy $x > 0$.

## Trigonometric functions

Common functions include

$$
\sin x,\ \cos x,\ \tan x
$$

They are periodic and appear in waves, rotation, and oscillation models.

---

# 5. Transformations and graph behavior

## Basic transformations

If $f(x)$ is a base graph, then:

$$
f(x) + k
$$
moves the graph up by $k$.

$$
f(x) - k
$$
moves it down by $k$.

$$
f(x - h)
$$
moves the graph right by $h$.

$$
f(x + h)
$$
moves the graph left by $h$.

$$
-f(x)
$$
reflects across the $x$-axis.

$$
f(-x)
$$
reflects across the $y$-axis.

## Stretching and shrinking

$$
a f(x)
$$
scales outputs vertically by $|a|$.

$$
f(bx)
$$
scales inputs horizontally by a factor of $1/|b|$.

## End behavior

End behavior describes what happens as $x \to \infty$ or $x \to -\infty$.

For polynomials, the leading term usually determines end behavior.

Example:

$$
f(x) = -2x^5 + 7x
$$

As $x \to \infty$, $f(x) \to -\infty$.
As $x \to -\infty$, $f(x) \to \infty$.

## Symmetry

A function is:

- **Even** if $f(-x) = f(x)$
- **Odd** if $f(-x) = -f(x)$

Graphically:

- Even functions are symmetric about the $y$-axis.
- Odd functions are symmetric about the origin.

---

# 6. Composition and inverse functions

## Composition

The composition of $f$ and $g$ is

$$
(f \circ g)(x) = f(g(x))
$$

Read it from the inside out:

1. Compute $g(x)$.
2. Substitute that result into $f$.

Example:

$$
f(x) = x^2 + 1,\qquad g(x) = 3x
$$

Then

$$
(f \circ g)(x) = f(3x) = (3x)^2 + 1 = 9x^2 + 1
$$

Composition is generally not commutative:

$$
f \circ g \ne g \circ f
$$

## Inverse functions

An inverse function reverses the effect of a function.

If $f$ has an inverse, then

$$
f^{-1}(f(x)) = x
\qquad \text{and} \qquad
f(f^{-1}(x)) = x
$$

Not every function has an inverse on its full domain. A function must be one-to-one to have an inverse function.

## Finding an inverse

A common algebraic workflow:

1. Write $y = f(x)$.
2. Swap $x$ and $y$.
3. Solve for $y$.
4. Rename the result $f^{-1}(x)$.

Example:

$$
y = 2x - 5
$$

Swap variables:

$$
x = 2y - 5
$$

Solve:

$$
y = \frac{x+5}{2}
$$

Thus

$$
f^{-1}(x) = \frac{x+5}{2}
$$

## One-to-one checks

A function is one-to-one if each output comes from exactly one input.

Quick checks:

- Horizontal line test on the graph
- Algebraic proof that $f(a) = f(b)$ implies $a = b$

---

# 7. Piecewise functions and modeling

## Piecewise definitions

A piecewise function uses different formulas on different parts of the domain.

Example:

$$
f(x) =
\begin{cases}
x^2, & x < 0 \\
2x + 1, & x \ge 0
\end{cases}
$$

When evaluating a piecewise function:

- First determine which condition the input satisfies.
- Then use the matching formula.

## Continuity at joins

For a piecewise function to be continuous at a breakpoint $x = c$:

$$
\lim_{x \to c^-} f(x) = \lim_{x \to c^+} f(x) = f(c)
$$

If the left and right values do not match, the graph has a jump or gap at the join.

## Modeling with functions

Functions are used to represent:

- Motion and position
- Cost and revenue
- Population growth
- Signal behavior
- Geometric relationships

Good models should state:

- What the input represents
- What the output represents
- The domain restrictions
- The units

---

# 8. Rates of change and calculus connections

## Average rate of change

The average rate of change of $f$ from $x=a$ to $x=b$ is

$$
\frac{f(b) - f(a)}{b - a}
$$

This is the slope of the secant line through the two points on the graph.

## Instantaneous rate of change

In calculus, the instantaneous rate of change is the derivative:

$$
f'(x)
$$

Interpreted as:

- Slope of the tangent line
- Local sensitivity of the output with respect to the input

## Why function behavior matters

Many calculus ideas depend on function properties:

- Domain restrictions affect differentiation and integration.
- Continuity is needed for many limit-based arguments.
- Symmetry can simplify analysis.

---

# 9. Problem-solving workflow

When working with functions, use a consistent checklist.

1. Identify the function type.
2. Determine the domain before doing algebra.
3. Simplify only after checking restrictions.
4. Evaluate carefully with parentheses.
5. Interpret the answer in context.
6. Verify whether the result is reasonable.

## Common pitfalls

- Forgetting domain restrictions from denominators, radicals, or logs
- Confusing range with codomain
- Replacing $f(x)$ with $f \cdot x$
- Applying transformations in the wrong direction
- Assuming every function is one-to-one
- Skipping units in applied problems

## Quick graph-reading workflow

1. Find intercepts if needed.
2. Check domain breaks and asymptotes.
3. Identify symmetry.
4. Mark turning points or key features.
5. Read outputs from the graph with the correct axis scale.

---

# 10. Formula sheet

## Definitions

$$
f : A \to B
$$

$$
f(x)
$$

$$
(f \circ g)(x) = f(g(x))
$$

$$
f^{-1}(f(x)) = x
$$

## Transformation rules

$$
f(x) + k \text{ shifts up}
$$

$$
f(x) - k \text{ shifts down}
$$

$$
f(x - h) \text{ shifts right}
$$

$$
f(x + h) \text{ shifts left}
$$

$$
-f(x) \text{ reflects across the } x\text{-axis}
$$

$$
f(-x) \text{ reflects across the } y\text{-axis}
$$

## Rate formulas

$$
\text{Average rate of change} = \frac{f(b) - f(a)}{b - a}
$$

$$
\text{Even: } f(-x) = f(x)
$$

$$
\text{Odd: } f(-x) = -f(x)
$$

## Domain reminders

- Rational: denominator $\ne 0$
- Even root: radicand $\ge 0$
- Logarithm: argument $> 0$
- Real-valued composition: inner output must lie in the outer domain
