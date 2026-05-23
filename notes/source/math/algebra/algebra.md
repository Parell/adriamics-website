---
auditors:
  - "@Parell"
status: draft
last_reviewed: 2026-05-22
sources: []
---

# Algebra

Algebra is the language of mathematical structure and symbolic reasoning. It turns patterns and quantitative relationships into expressions, equations, functions, and general rules that can be manipulated precisely.

## Table of contents

1. [Core ideas and notation](#toc-1)
2. [Expressions and algebraic manipulation](#toc-2)
3. [Linear equations and inequalities](#toc-3)
4. [Systems of equations](#toc-4)
5. [Exponents, radicals, and powers](#toc-5)
6. [Polynomials and factoring](#toc-6)
7. [Rational expressions](#toc-7)
8. [Quadratic equations and parabolas](#toc-8)
9. [Functions](#toc-9)
10. [Exponential and logarithmic relationships](#toc-10)
11. [Problem-solving workflow](#toc-11)
12. [Common pitfalls](#toc-12)
13. [Formula summary](#toc-13)

---

<a id="toc-1"></a>
# 1. Core ideas and notation

At its core, algebra replaces specific numbers with symbols so that one argument can describe many cases.

## Variables, constants, and parameters

- A **variable** represents a quantity that may change, such as $x$ or $t$.
- A **constant** is a fixed value, such as $2$, $\pi$, or $-7$.
- A **parameter** is a symbol treated as fixed within a problem, such as $m$ and $b$ in $y = mx + b$.

## Equality

An equation states that two expressions have the same value:

$$
2x + 3 = 11
$$

The goal is usually to find all values of the variable that make the statement true.

## Sets of numbers

| Set | Meaning | Examples |
| --- | --- | --- |
| Natural numbers | Counting numbers | $1, 2, 3, \dots$ |
| Integers | Whole numbers and negatives | $-3, 0, 8$ |
| Rational numbers | Ratios of integers | $\frac{3}{4}, -2, 0.125$ |
| Irrational numbers | Not expressible as ratios of integers | $\sqrt{2}, \pi$ |
| Real numbers | All rational and irrational numbers on the line | most elementary algebra values |

## Order of operations

Evaluate in this order:

1. Parentheses and grouped expressions
2. Exponents and roots
3. Multiplication and division
4. Addition and subtraction

Multiplication distributes over addition:

$$
a(b + c) = ab + ac
$$

This property is one of the most important tools in algebra.

---

<a id="toc-2"></a>
# 2. Expressions and algebraic manipulation

An **expression** is a combination of numbers, variables, and operations, but without an equals sign.

Examples:

$$
3x^2 - 5x + 2
$$

$$
\frac{2a - 1}{a + 4}
$$

## Like terms

Only like terms can be combined.

$$
4x + 7x = 11x
$$

but

$$
4x + 7x^2
$$

cannot be simplified by combining coefficients.

## Distributing and factoring

Distributing expands an expression:

$$
3(x - 4) = 3x - 12
$$

Factoring reverses the process:

$$
3x - 12 = 3(x - 4)
$$

## Fractions in algebra

To add algebraic fractions, use a common denominator:

$$
\frac{1}{x} + \frac{1}{x + 1}
= \frac{x + 1 + x}{x(x + 1)}
= \frac{2x + 1}{x(x + 1)}
$$

Restrictions matter. In the example above:

$$
x \ne 0, \quad x \ne -1
$$

## Identities

An **identity** is true for all allowed values of the variable.

Example:

$$
(a+b)^2 = a^2 + 2ab + b^2
$$

This is not an equation to solve; it is a pattern to use.

---

<a id="toc-3"></a>
# 3. Linear equations and inequalities

A **linear equation** has variables only to the first power.

## One-variable linear equations

Example:

$$
5x - 7 = 18
$$

Solve by isolating the variable:

$$
5x = 25
$$

$$
x = 5
$$

The same operation must be done to both sides to preserve equality.

## Equations with variables on both sides

Example:

$$
4x + 9 = 2x + 15
$$

Move variable terms together:

$$
2x + 9 = 15
$$

$$
2x = 6
$$

$$
x = 3
$$

## Literal equations

Sometimes the goal is to solve for one variable in terms of others.

Example:

$$
A = \frac{1}{2}bh
$$

Solve for $h$:

$$
2A = bh
$$

$$
h = \frac{2A}{b}
$$

## Inequalities

Solve inequalities much like equations, except for one crucial rule:

If you multiply or divide by a negative number, reverse the inequality sign.

Example:

$$
-2x > 8
$$

Divide by $-2$ and reverse the sign:

$$
x < -4
$$

## Interval notation

| Inequality | Interval |
| --- | --- |
| $x \ge 3$ | $[3, \infty)$ |
| $x < 2$ | $(-\infty, 2)$ |
| $-1 < x \le 4$ | $(-1, 4]$ |

---

<a id="toc-4"></a>
# 4. Systems of equations

A system asks for values that satisfy multiple equations at once.

## Two linear equations in two variables

General form:

$$
\begin{cases}
a_1x + b_1y = c_1 \\
a_2x + b_2y = c_2
\end{cases}
$$

## Main methods

| Method | Best use |
| --- | --- |
| Substitution | One variable is easy to isolate |
| Elimination | Coefficients line up well |
| Graphing | Visual interpretation is useful |

## Example: elimination

$$
\begin{cases}
2x + y = 7 \\
3x - y = 8
\end{cases}
$$

Add the equations:

$$
5x = 15
$$

$$
x = 3
$$

Substitute back:

$$
2(3) + y = 7 \Rightarrow y = 1
$$

So the solution is

$$
(x, y) = (3, 1)
$$

## Geometric meaning

- One solution: the lines intersect once
- No solution: the lines are parallel
- Infinitely many solutions: the equations describe the same line

---

<a id="toc-5"></a>
# 5. Exponents, radicals, and powers

Exponents compress repeated multiplication.

$$
a^n = \underbrace{a \cdot a \cdot a \cdots a}_{n \text{ factors}}
$$

## Exponent laws

For appropriate nonzero bases:

$$
a^m a^n = a^{m+n}
$$

$$
\frac{a^m}{a^n} = a^{m-n}
$$

$$
(a^m)^n = a^{mn}
$$

$$
(ab)^n = a^n b^n
$$

$$
a^{-n} = \frac{1}{a^n}
$$

$$
a^0 = 1
$$

## Rational exponents and radicals

$$
a^{1/n} = \sqrt[n]{a}
$$

$$
a^{m/n} = \sqrt[n]{a^m}
$$

For real-valued even roots, the radicand must be nonnegative:

$$
\sqrt{x}
$$

requires

$$
x \ge 0
$$

## Simplifying radicals

$$
\sqrt{72} = \sqrt{36 \cdot 2} = 6\sqrt{2}
$$

## Rationalizing a denominator

Example:

$$
\frac{1}{\sqrt{3}} = \frac{1}{\sqrt{3}} \cdot \frac{\sqrt{3}}{\sqrt{3}} = \frac{\sqrt{3}}{3}
$$

---

<a id="toc-6"></a>
# 6. Polynomials and factoring

A **polynomial** is a sum of terms of the form $ax^n$, where $n$ is a nonnegative integer.

Examples:

- Linear: $2x - 5$
- Quadratic: $x^2 - 4x + 4$
- Cubic: $x^3 + x$

## Special products

These patterns appear constantly:

$$
(a+b)^2 = a^2 + 2ab + b^2
$$

$$
(a-b)^2 = a^2 - 2ab + b^2
$$

$$
(a+b)(a-b) = a^2 - b^2
$$

## Common factoring methods

| Method | Example |
| --- | --- |
| Greatest common factor | $6x^2 + 9x = 3x(2x+3)$ |
| Difference of squares | $x^2 - 25 = (x-5)(x+5)$ |
| Trinomial factoring | $x^2 + 5x + 6 = (x+2)(x+3)$ |
| Grouping | $ax + ay + bx + by = (a+b)(x+y)$ |

## Zero-product property

If

$$
ab = 0
$$

then

$$
a = 0 \quad \text{or} \quad b = 0
$$

This is the key step after factoring an equation.

Example:

$$
x^2 - 5x + 6 = 0
$$

$$
(x-2)(x-3) = 0
$$

So

$$
x = 2 \quad \text{or} \quad x = 3
$$

---

<a id="toc-7"></a>
# 7. Rational expressions

A **rational expression** is a quotient of polynomials:

$$
\frac{P(x)}{Q(x)}
$$

where

$$
Q(x) \ne 0
$$

## Simplifying

Factor first, then cancel common factors.

$$
\frac{x^2 - 9}{x^2 - 3x}
= \frac{(x-3)(x+3)}{x(x-3)}
= \frac{x+3}{x}
$$

Restrictions from the original denominator remain:

$$
x \ne 0, \quad x \ne 3
$$

## Operations

### Multiplication

$$
\frac{a}{b} \cdot \frac{c}{d} = \frac{ac}{bd}
$$

### Division

$$
\frac{a}{b} \div \frac{c}{d} = \frac{a}{b} \cdot \frac{d}{c}
$$

### Addition and subtraction

Use a common denominator:

$$
\frac{2}{x} - \frac{1}{x+1}
= \frac{2(x+1) - x}{x(x+1)}
= \frac{x+2}{x(x+1)}
$$

## Rational equations

Typical workflow:

1. State denominator restrictions.
2. Multiply both sides by the least common denominator.
3. Solve the resulting equation.
4. Check for extraneous values that make a denominator zero.

---

<a id="toc-8"></a>
# 8. Quadratic equations and parabolas

A quadratic equation has the form

$$
ax^2 + bx + c = 0, \quad a \ne 0
$$

## Main solution methods

| Method | Best use |
| --- | --- |
| Factoring | Simple integer roots |
| Completing the square | Deriving structure or vertex form |
| Quadratic formula | General method |

## Completing the square

Start with

$$
x^2 + 6x - 7 = 0
$$

Move the constant:

$$
x^2 + 6x = 7
$$

Add $\left(\frac{6}{2}\right)^2 = 9$ to both sides:

$$
x^2 + 6x + 9 = 16
$$

$$
(x+3)^2 = 16
$$

$$
x+3 = \pm 4
$$

$$
x = 1 \quad \text{or} \quad x = -7
$$

## Quadratic formula

For

$$
ax^2 + bx + c = 0
$$

the solutions are

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

The discriminant

$$
\Delta = b^2 - 4ac
$$

determines the root type:

| Discriminant | Result |
| --- | --- |
| $\Delta > 0$ | two distinct real roots |
| $\Delta = 0$ | one repeated real root |
| $\Delta < 0$ | two complex roots |

## Graph interpretation

The graph of a quadratic function is a parabola.

Vertex form:

$$
y = a(x-h)^2 + k
$$

The vertex is

$$
(h, k)
$$

If $a > 0$, the parabola opens upward. If $a < 0$, it opens downward.

---

<a id="toc-9"></a>
# 9. Functions

A **function** assigns each input exactly one output.

Notation:

$$
f(x)
$$

is read "f of x."

## Domain and range

- The **domain** is the set of allowed inputs.
- The **range** is the set of outputs produced.

Example:

$$
f(x) = \frac{1}{x-2}
$$

Domain:

$$
x \ne 2
$$

## Evaluating functions

If

$$
f(x) = 3x^2 - 1
$$

then

$$
f(2) = 3(2)^2 - 1 = 11
$$

## Common function types

| Type | Example | Key feature |
| --- | --- | --- |
| Linear | $f(x)=mx+b$ | constant rate of change |
| Quadratic | $f(x)=ax^2+bx+c$ | parabolic graph |
| Rational | $f(x)=\frac{1}{x}$ | asymptotes, restrictions |
| Exponential | $f(x)=ab^x$ | multiplicative growth or decay |
| Absolute value | $f(x)=|x|$ | piecewise V-shape |

## Function composition

$$
(f \circ g)(x) = f(g(x))
$$

Example:

$$
f(x) = x+1, \quad g(x) = x^2
$$

Then

$$
(f \circ g)(x) = x^2 + 1
$$

## Inverse idea

An inverse undoes a function when it exists:

$$
f(f^{-1}(x)) = x
$$

Not every function has an inverse on its full domain.

---

<a id="toc-10"></a>
# 10. Exponential and logarithmic relationships

Exponential functions model repeated multiplication:

$$
f(x) = ab^x
$$

where $a \ne 0$, $b > 0$, and $b \ne 1$.

## Growth and decay

- If $b > 1$, the function grows.
- If $0 < b < 1$, the function decays.

## Logarithms

The logarithm is the inverse of exponentiation:

$$
y = \log_b x \quad \Longleftrightarrow \quad b^y = x
$$

Domain restriction:

$$
x > 0
$$

## Log laws

$$
\log_b(xy) = \log_b x + \log_b y
$$

$$
\log_b\left(\frac{x}{y}\right) = \log_b x - \log_b y
$$

$$
\log_b(x^r) = r \log_b x
$$

## Solving an exponential equation

Example:

$$
2^{x+1} = 16
$$

Since

$$
16 = 2^4
$$

we get

$$
x+1 = 4
$$

$$
x = 3
$$

## Solving a logarithmic equation

Example:

$$
\log_3(x-1) = 2
$$

Convert to exponential form:

$$
x - 1 = 3^2 = 9
$$

$$
x = 10
$$

Check the domain:

$$
x - 1 > 0
$$

so the solution is valid.

---

<a id="toc-11"></a>
# 11. Problem-solving workflow

When solving an algebra problem, use a disciplined sequence.

## General workflow

1. Identify the object: expression, equation, inequality, system, or function.
2. Note all restrictions on allowed values.
3. Simplify structure before solving: distribute, factor, combine like terms, or clear denominators.
4. Choose a method that matches the form.
5. Solve carefully and keep operations reversible when possible.
6. Check the result in the original statement, especially for rational, radical, or logarithmic problems.

## Choosing a method quickly

| Form you see | Likely method |
| --- | --- |
| Linear equation | isolate the variable |
| Quadratic set equal to zero | factor or use quadratic formula |
| Denominators with variables | multiply by LCD after stating restrictions |
| Square root present | isolate the radical, then square both sides |
| Two linear equations | substitution or elimination |
| Exponential equation | rewrite with common base or use logs |

## Example workflow: rational equation

Solve

$$
\frac{1}{x} + \frac{1}{2} = \frac{3}{4}
$$

Restrictions:

$$
x \ne 0
$$

Multiply both sides by $4x$:

$$
4 + 2x = 3x
$$

$$
x = 4
$$

Check:

$$
\frac{1}{4} + \frac{1}{2} = \frac{3}{4}
$$

Valid.

---

<a id="toc-12"></a>
# 12. Common pitfalls

- Combining unlike terms, such as treating $x + x^2$ as $2x^2$.
- Canceling terms across addition, such as
  $$
  \frac{x+3}{x} \ne 1+3
  $$
- Forgetting denominator restrictions in rational expressions.
- Losing the $\pm$ when taking square roots:
  $$
  x^2 = 9 \Rightarrow x = \pm 3
  $$
- Failing to reverse an inequality after dividing by a negative number.
- Squaring both sides and keeping an extraneous solution without checking.
- Applying log laws to sums incorrectly:
  $$
  \log(x+y) \ne \log x + \log y
  $$

---

<a id="toc-13"></a>
# 13. Formula summary

## Core identities

$$
a(b+c) = ab + ac
$$

$$
(a+b)^2 = a^2 + 2ab + b^2
$$

$$
(a-b)^2 = a^2 - 2ab + b^2
$$

$$
a^2 - b^2 = (a-b)(a+b)
$$

## Exponent rules

$$
a^m a^n = a^{m+n}
$$

$$
\frac{a^m}{a^n} = a^{m-n}
$$

$$
(a^m)^n = a^{mn}
$$

$$
a^{-n} = \frac{1}{a^n}
$$

$$
a^{m/n} = \sqrt[n]{a^m}
$$

## Linear and quadratic forms

$$
y = mx + b
$$

$$
ax^2 + bx + c = 0
$$

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

## Logarithms

$$
\log_b(xy) = \log_b x + \log_b y
$$

$$
\log_b\left(\frac{x}{y}\right) = \log_b x - \log_b y
$$

$$
\log_b(x^r) = r\log_b x
$$
