# 1. What a series is

A **series** is the sum of the terms of a sequence.

If $(a_n)$ is a sequence, the associated infinite series is

$$
\sum_{n=1}^{\infty} a_n
$$

More generally, any expression of the form

$$
\sum_{n=N}^{\infty} a_n
$$

is a series. The important question is not just what the terms are, but whether the partial sums approach a finite limit.

## Partial sums

The $n$th partial sum is

$$
s_n = \sum_{k=1}^{n} a_k
$$

The series converges if the sequence of partial sums converges:

$$
\sum_{n=1}^{\infty} a_n = S
\quad \Longleftrightarrow \quad
s_n \to S
$$

If the partial sums do not approach a finite limit, the series diverges.

## Why series matter

Series are used to:

- Approximate functions
- Model repeated accumulation
- Analyze signals, errors, and differential equations
- Build numerical methods
- Represent functions with polynomials

---

# 2. Core vocabulary

## Convergent and divergent

- A series is **convergent** if its partial sums approach a finite value.
- A series is **divergent** if it does not.

## Necessary condition for convergence

If

$$
\sum a_n
$$

converges, then

$$
\lim_{n\to\infty} a_n = 0
$$

This condition is necessary but not sufficient.

For example,

$$
\sum_{n=1}^{\infty} \frac{1}{n}
$$

diverges even though the terms go to $0$.

## Absolute and conditional convergence

A series $\sum a_n$ is:

- **Absolutely convergent** if $\sum |a_n|$ converges
- **Conditionally convergent** if $\sum a_n$ converges but $\sum |a_n|$ diverges

Absolute convergence is stronger and easier to work with. If a series converges absolutely, it converges.

## Rearrangement warning

For absolutely convergent series, rearranging terms does not change the sum.

For conditionally convergent series, rearranging terms can change the sum. This is one reason absolute convergence is preferred when possible.

---

# 3. Geometric and telescoping series

## Geometric series

The standard geometric series is

$$
\sum_{n=0}^{\infty} ar^n
$$

It converges when

$$
|r| < 1
$$

and its sum is

$$
\sum_{n=0}^{\infty} ar^n = \frac{a}{1-r}
$$

If the index starts at $n=1$, adjust the first term accordingly.

### Finite geometric sum

For $N \ge 1$,

$$
\sum_{n=0}^{N-1} ar^n = a\frac{1-r^N}{1-r}, \quad r \ne 1
$$

## Telescoping series

A telescoping series is one where successive terms cancel after rewriting.

Example:

$$
\sum_{n=1}^{\infty} \left(\frac{1}{n} - \frac{1}{n+1}\right)
$$

The partial sums are

$$
s_N = 1 - \frac{1}{N+1}
$$

so the series converges to $1$.

### Strategy for telescoping

1. Rewrite the term using partial fractions or algebra.
2. Expand the first few partial sums.
3. Identify cancellation.
4. Take the limit of the remaining terms.

---

# 4. Convergence tests

No single test works best in every case. Choose the test that matches the structure of the series.

## Divergence test

If

$$
\lim_{n\to\infty} a_n \ne 0
$$

or the limit does not exist, then

$$
\sum a_n
$$

diverges.

If the limit is $0$, the test is inconclusive.

## $p$-series

The $p$-series

$$
\sum_{n=1}^{\infty} \frac{1}{n^p}
$$

converges if and only if

$$
p > 1
$$

and diverges for $p \le 1$.

## Comparison test

For series with nonnegative terms, compare to a known benchmark series.

If $0 \le a_n \le b_n$ and $\sum b_n$ converges, then $\sum a_n$ converges.

If $0 \le b_n \le a_n$ and $\sum b_n$ diverges, then $\sum a_n$ diverges.

Use this when the terms look like a familiar rational or root expression.

## Limit comparison test

If $a_n, b_n > 0$ and

$$
\lim_{n\to\infty}\frac{a_n}{b_n} = c
$$

with $0 < c < \infty$, then $\sum a_n$ and $\sum b_n$ behave the same way.

This is useful when the terms have the same dominant growth rate.

## Integral test

If $a_n = f(n)$ where $f$ is positive, continuous, and decreasing on $[N,\infty)$, then

$$
\sum_{n=N}^{\infty} a_n
$$

and

$$
\int_N^{\infty} f(x)\,dx
$$

either both converge or both diverge.

This is especially useful for $p$-series-like terms and logarithmic modifications.

## Ratio test

For a series $\sum a_n$, consider

$$
L = \lim_{n\to\infty}\left|\frac{a_{n+1}}{a_n}\right|
$$

- If $L < 1$, the series converges absolutely.
- If $L > 1$ or $L = \infty$, the series diverges.
- If $L = 1$, the test is inconclusive.

Use this when factorials, exponentials, or powers of $n$ are present.

## Root test

Consider

$$
L = \lim_{n\to\infty}\sqrt[n]{|a_n|}
$$

with the same conclusions as the ratio test.

Use this when the $n$th power is built into the term.

## Alternating series test

For

$$
\sum (-1)^n b_n
\quad \text{or} \quad
\sum (-1)^{n+1} b_n
$$

if:

1. $b_n \ge 0$
2. $b_n$ is eventually decreasing
3. $b_n \to 0$

then the series converges.

This test does not guarantee absolute convergence.

## Absolute convergence check

If a series alternates or has mixed signs, first test

$$
\sum |a_n|
$$

If the absolute series converges, the original series converges absolutely.

---

# 5. Power series

A **power series** centered at $c$ has the form

$$
\sum_{n=0}^{\infty} a_n (x-c)^n
$$

It behaves like an infinite polynomial within its interval of convergence.

## Radius and interval of convergence

A power series converges:

- Absolutely for $|x-c| < R$
- Diverges for $|x-c| > R$
- Must be checked separately at the endpoints $x = c \pm R$

The number $R$ is the **radius of convergence**.

## Finding the radius

The ratio test is the standard tool. Compute

$$
\lim_{n\to\infty}\left|\frac{a_{n+1}(x-c)^{n+1}}{a_n(x-c)^n}\right|
$$

and solve for the values of $x$ that make the limit less than $1$.

## Differentiation and integration

Within the interval of convergence, a power series may be differentiated and integrated term by term.

If

$$
f(x)=\sum_{n=0}^{\infty} a_n(x-c)^n,
$$

then

$$
f'(x)=\sum_{n=1}^{\infty} n a_n (x-c)^{n-1}
$$

and

$$
\int f(x)\,dx = C + \sum_{n=0}^{\infty} \frac{a_n}{n+1}(x-c)^{n+1}
$$

as long as $x$ stays within the interval of convergence.

## Why power series are powerful

They convert difficult functions into algebraic objects that can be:

- Differentiated and integrated term by term
- Used for approximation
- Compared by coefficients
- Inserted into differential equations

---

# 6. Taylor and Maclaurin series

The Taylor series of a function $f$ centered at $a$ is

$$
f(x)=\sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$

If $a=0$, it is called a **Maclaurin series**.

## Common expansions

### Exponential

$$
e^x = \sum_{n=0}^{\infty}\frac{x^n}{n!}
$$

### Sine

$$
\sin x = \sum_{n=0}^{\infty} (-1)^n \frac{x^{2n+1}}{(2n+1)!}
$$

### Cosine

$$
\cos x = \sum_{n=0}^{\infty} (-1)^n \frac{x^{2n}}{(2n)!}
$$

### Binomial-type expansion

For $|x|<1$,

$$
\frac{1}{1-x} = \sum_{n=0}^{\infty} x^n
$$

and more generally, for real exponent $\alpha$,

$$
(1+x)^\alpha = \sum_{n=0}^{\infty} \binom{\alpha}{n} x^n
$$

where

$$
\binom{\alpha}{n} = \frac{\alpha(\alpha-1)\cdots(\alpha-n+1)}{n!}
$$

## Remainder and approximation

The Taylor polynomial of degree $N$ is

$$
P_N(x)=\sum_{n=0}^{N} \frac{f^{(n)}(a)}{n!}(x-a)^n
$$

The remainder is

$$
R_N(x)=f(x)-P_N(x)
$$

For many problems, a low-degree Taylor polynomial gives a useful local approximation.

### Error thinking

When approximating with a Taylor polynomial, ask:

1. How many terms are enough?
2. Is the next omitted term a good error estimate?
3. Is the point $x$ close enough to the center $a$?

---

# 7. Manipulating series

## Index shifting

Series are often easier to compare after rewriting them with the same index.

Example:

$$
\sum_{n=2}^{\infty} \frac{1}{n-1}
$$

Let $k=n-1$. Then the series becomes

$$
\sum_{k=1}^{\infty} \frac{1}{k}
$$

## Splitting and combining

Linearity holds where the series converge appropriately:

$$
\sum (a_n + b_n)=\sum a_n + \sum b_n
$$

$$
\sum c a_n = c\sum a_n
$$

Use this carefully. If the series are only conditionally convergent, rearrangement issues can matter.

## Termwise operations on power series

Within their interval of convergence, power series can be:

- Differentiated term by term
- Integrated term by term
- Shifted and reindexed
- Multiplied with care

This is the main route to deriving new series from known ones.

## Matching coefficients

If two power series are equal on an interval, then the coefficients of matching powers must be equal.

This method is useful for:

- Solving identities
- Deriving recurrence relations
- Extracting unknown coefficients

---

# 8. Common examples to know

## Harmonic series

$$
\sum_{n=1}^{\infty}\frac{1}{n}
$$

diverges.

## Alternating harmonic series

$$
\sum_{n=1}^{\infty}(-1)^{n+1}\frac{1}{n}
$$

converges conditionally.

## $p$-series template

$$
\sum_{n=1}^{\infty}\frac{1}{n^p}
$$

converges if $p>1$.

## Geometric template

$$
\sum_{n=0}^{\infty} ar^n = \frac{a}{1-r}, \quad |r|<1
$$

## Exponential, sine, cosine

These three are the most important Maclaurin series to memorize. Many other expansions come from differentiating or integrating them.

## Logarithm from geometric series

Starting from

$$
\frac{1}{1-x} = \sum_{n=0}^{\infty} x^n
$$

integrating term by term gives

$$
-\ln(1-x)=\sum_{n=1}^{\infty}\frac{x^n}{n}, \quad |x|<1
$$

This is a common derivation pattern.

---

# 9. Problem-solving workflow

## For convergence questions

1. Check the term limit: if $a_n \not\to 0$, stop and declare divergence.
2. Identify the shape:
   - Geometric
   - $p$-series
   - Alternating
   - Rational comparison
   - Factorial/exponential
3. Choose the most natural test.
4. If alternating, check absolute convergence first if possible.
5. If a power series is involved, find the interval first, then test endpoints separately.

## For Taylor/power series problems

1. Write the known base series.
2. Shift, differentiate, integrate, or substitute as needed.
3. Keep track of the center and radius.
4. Verify the final form by checking the first few terms.

## For approximation questions

1. Choose the center close to the evaluation point.
2. Use the lowest degree that gives acceptable accuracy.
3. Estimate the remainder or next term.
4. State the approximation clearly with its error context.

---

# 10. Pitfalls

- Confusing the term test with a convergence test. Terms going to $0$ are necessary, not sufficient.
- Forgetting to test endpoints of a power series interval.
- Using a ratio test and stopping at $L=1$ without another plan.
- Assuming alternating automatically means convergent absolutely.
- Dropping absolute values inside ratio or root tests.
- Reindexing incorrectly and changing the first few terms.
- Treating conditional convergence like absolute convergence when rearranging terms.
- Forgetting that termwise differentiation and integration are valid only inside the interval of convergence.

---

# 11. Formula sheet

## Core definitions

$$
s_n = \sum_{k=1}^{n} a_k
$$

$$
\sum_{n=1}^{\infty} a_n \text{ converges } \Longleftrightarrow s_n \text{ converges}
$$

## Geometric series

$$
\sum_{n=0}^{\infty} ar^n = \frac{a}{1-r}, \quad |r|<1
$$

## $p$-series

$$
\sum_{n=1}^{\infty}\frac{1}{n^p}
\begin{cases}
\text{converges}, & p>1 \\
\text{diverges}, & p\le 1
\end{cases}
$$

## Ratio test

$$
L = \lim_{n\to\infty}\left|\frac{a_{n+1}}{a_n}\right|
$$

## Root test

$$
L = \lim_{n\to\infty}\sqrt[n]{|a_n|}
$$

## Alternating series test

If $b_n \downarrow 0$, then

$$
\sum (-1)^n b_n
$$

converges.

## Taylor series

$$
f(x)=\sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x-a)^n
$$

## Maclaurin series

$$
f(x)=\sum_{n=0}^{\infty}\frac{f^{(n)}(0)}{n!}x^n
$$

## Standard Maclaurin series

$$
e^x=\sum_{n=0}^{\infty}\frac{x^n}{n!}
$$

$$
\sin x=\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n+1}}{(2n+1)!}
$$

$$
\cos x=\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n}}{(2n)!}
$$

$$
\frac{1}{1-x}=\sum_{n=0}^{\infty}x^n,\quad |x|<1
$$

$$
-\ln(1-x)=\sum_{n=1}^{\infty}\frac{x^n}{n},\quad |x|<1
$$

## Sources

- [OpenStax Mathematics](https://openstax.org/subjects/math)
- [Mathematics LibreTexts](https://math.libretexts.org/)
- Stewart, *Calculus: Early Transcendentals*
- Lay, *Linear Algebra and Its Applications*
- Rosen, *Discrete Mathematics and Its Applications*
- Boyce and DiPrima, *Elementary Differential Equations and Boundary Value Problems*
- Blitzstein and Hwang, *Introduction to Probability*
- [Parell GitHub repository](https://github.com/Parell/parell.github.io)