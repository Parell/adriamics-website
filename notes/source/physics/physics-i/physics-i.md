# What Physics I covers

Physics I is usually the first university-level mechanics course. The core goal is to describe how objects move and why they move using a small set of conservation laws and force laws.

The main themes are:

- Kinematics: describing motion without explaining its cause
- Dynamics: explaining motion with forces
- Conservation of energy and momentum
- Rotational motion and torque
- Gravitational motion and oscillations

The subject is not about memorizing a large number of formulas. Most problems reduce to:

1. Identify the system.
2. Draw the relevant forces or motion quantities.
3. Choose the correct conservation or Newtonian principle.
4. Solve algebraically and check units.

---

# Units, vectors, and notation

## SI base quantities

| Quantity | Symbol | SI unit |
| --- | --- | --- |
| Length | $x, y, r$ | m |
| Mass | $m$ | kg |
| Time | $t$ | s |
| Velocity | $\vec v$ | m/s |
| Acceleration | $\vec a$ | m/s$^2$ |
| Force | $\vec F$ | N = kg m/s$^2$ |
| Work / energy | $W, E$ | J = N m |
| Power | $P$ | W = J/s |
| Momentum | $\vec p$ | kg m/s |
| Torque | $\tau$ | N m |

## Scalars and vectors

- A scalar has magnitude only: mass, time, temperature, energy.
- A vector has magnitude and direction: displacement, velocity, force, momentum.

Write vectors in component form when possible:

$$
\vec A = A_x \hat i + A_y \hat j + A_z \hat k
$$

Magnitude:

$$
|\vec A| = \sqrt{A_x^2 + A_y^2 + A_z^2}
$$

## Coordinate choice

Pick axes that simplify the problem. A good axis choice can eliminate trigonometry and reduce sign mistakes.

Common conventions:

- Positive $x$ to the right
- Positive $y$ upward
- Positive angular direction counterclockwise

Be consistent once the axes are chosen.

---

# One-dimensional kinematics

Kinematics describes motion in terms of position, velocity, and acceleration.

## Definitions

Displacement:

$$
\Delta x = x_f - x_i
$$

Average velocity:

$$
\bar v = \frac{\Delta x}{\Delta t}
$$

Instantaneous velocity:

$$
v = \frac{dx}{dt}
$$

Average acceleration:

$$
\bar a = \frac{\Delta v}{\Delta t}
$$

Instantaneous acceleration:

$$
a = \frac{dv}{dt} = \frac{d^2x}{dt^2}
$$

## Constant-acceleration equations

If acceleration is constant, the following equations apply:

$$
v = v_0 + at
$$

$$
x = x_0 + v_0 t + \frac{1}{2}at^2
$$

$$
v^2 = v_0^2 + 2a(x-x_0)
$$

$$
x - x_0 = \frac{(v_0 + v)}{2}t
$$

These are valid only when acceleration does not change during the interval.

## Interpretation tips

- Velocity is the slope of the position-time graph.
- Acceleration is the slope of the velocity-time graph.
- The area under a velocity-time graph gives displacement.
- The area under an acceleration-time graph gives change in velocity.

## Free-fall as a special case

Near Earth, the acceleration from gravity is approximately constant:

$$
a = -g \approx -9.8\ \text{m/s}^2
$$

if upward is positive.

---

# Two-dimensional motion and projectiles

In two dimensions, motion is analyzed independently along perpendicular axes.

## Component method

For a vector $\vec v$ at angle $\theta$ above the positive $x$-axis:

$$
v_x = v \cos \theta, \qquad v_y = v \sin \theta
$$

Reconstruct the magnitude and direction from components:

$$
v = \sqrt{v_x^2 + v_y^2}
$$

$$
\theta = \tan^{-1}\!\left(\frac{v_y}{v_x}\right)
$$

## Projectile motion

For ideal projectile motion, neglect air resistance. The only acceleration is gravity.

Horizontal motion:

$$
a_x = 0,\qquad v_x = \text{constant}
$$

Vertical motion:

$$
a_y = -g
$$

## Useful projectile results

If a projectile is launched from and lands at the same height:

Time of flight:

$$
T = \frac{2v_0 \sin\theta}{g}
$$

Maximum height:

$$
H = \frac{v_0^2 \sin^2\theta}{2g}
$$

Range:

$$
R = \frac{v_0^2 \sin 2\theta}{g}
$$

## Common mistake

Do not use the magnitude of velocity in every equation. The $x$ and $y$ components evolve differently, and they must be solved separately.

---

# Newton's laws and free-body diagrams

Newton's laws connect forces and motion.

## Newton's laws

1. Inertia: if the net force is zero, velocity is constant.
2. Dynamics: net force equals mass times acceleration.
3. Action-reaction: forces between two bodies are equal in magnitude and opposite in direction.

Mathematically:

$$
\sum \vec F = m \vec a
$$

For components:

$$
\sum F_x = ma_x, \qquad \sum F_y = ma_y
$$

## Free-body diagram workflow

1. Isolate the object.
2. Draw only external forces acting on it.
3. Choose axes aligned with the motion or surface if possible.
4. Resolve angled forces into components.
5. Write one equation per axis.

## Common errors

- Including forces the object exerts on other bodies
- Omitting weight or normal force
- Confusing action-reaction pairs with balanced forces on the same body
- Forgetting to project angled forces onto axes

---

# Common forces

## Weight

The gravitational force near Earth is:

$$
\vec W = m\vec g
$$

Magnitude:

$$
W = mg
$$

## Normal force

The normal force is the contact force perpendicular to a surface. It is not always equal to $mg$.

Examples:

- On a horizontal surface with no vertical acceleration, $N = mg$
- On an incline, $N = mg\cos\theta$ if no other vertical components act

## Tension

Tension acts along a taut rope or cable and pulls away from the object.

Assumptions often used in introductory problems:

- Rope is massless
- Pulley is frictionless
- Tension is the same throughout one continuous rope

## Friction

Static friction:

$$
f_s \le \mu_s N
$$

Kinetic friction:

$$
f_k = \mu_k N
$$

Friction opposes relative motion or impending motion between surfaces.

## Springs

Hooke's law:

$$
F_s = -kx
$$

Here $k$ is the spring constant and $x$ is displacement from equilibrium.

The minus sign indicates a restoring force.

---

# Work, energy, and power

Energy methods are often simpler than direct force analysis when the question concerns speed, height, or turning points.

## Work

Work done by a constant force:

$$
W = \vec F \cdot \vec d = Fd\cos\theta
$$

For a variable force:

$$
W = \int \vec F \cdot d\vec r
$$

## Kinetic energy

$$
K = \frac{1}{2}mv^2
$$

## Work-energy theorem

Net work changes kinetic energy:

$$
W_{net} = \Delta K
$$

## Potential energy

Gravitational near Earth:

$$
U_g = mgh
$$

Spring potential:

$$
U_s = \frac{1}{2}kx^2
$$

## Conservation of mechanical energy

If only conservative forces act:

$$
K_i + U_i = K_f + U_f
$$

If nonconservative forces do work:

$$
K_i + U_i + W_{nc} = K_f + U_f
$$

## Power

Average power:

$$
\bar P = \frac{W}{\Delta t}
$$

Instantaneous power:

$$
P = \frac{dW}{dt} = \vec F \cdot \vec v
$$

## When to use energy

Use energy when:

- You want speed after moving through a height change
- A force changes with position
- Time is not explicitly required

Use Newton's laws when:

- You need acceleration or tension as a function of time
- Friction or constraints make the force balance essential

---

# Momentum, impulse, and collisions

Momentum is the quantity most useful when forces act over short times or when bodies collide.

## Momentum

$$
\vec p = m\vec v
$$

## Impulse

Impulse is force integrated over time:

$$
\vec J = \int \vec F\,dt
$$

For constant force:

$$
\vec J = \vec F\Delta t
$$

Impulse-momentum theorem:

$$
\vec J = \Delta \vec p
$$

## Conservation of momentum

If the net external impulse on a system is zero:

$$
\vec p_i = \vec p_f
$$

This is especially useful in explosions and collisions.

## Collision types

- Elastic: momentum and kinetic energy are both conserved
- Inelastic: momentum is conserved, kinetic energy is not
- Perfectly inelastic: objects stick together after collision

## One-dimensional perfectly inelastic collision

If two masses stick together:

$$
m_1 v_{1i} + m_2 v_{2i} = (m_1 + m_2)v_f
$$

## Common mistake

Momentum is a vector. Conservation must be applied separately in each direction.

---

# Rotation and torque

Rotational motion is the angular analogue of linear motion.

## Angular variables

Angular displacement:

$$
\theta
$$

Angular velocity:

$$
\omega = \frac{d\theta}{dt}
$$

Angular acceleration:

$$
\alpha = \frac{d\omega}{dt}
$$

For constant angular acceleration:

$$
\omega = \omega_0 + \alpha t
$$

$$
\theta = \theta_0 + \omega_0 t + \frac{1}{2}\alpha t^2
$$

$$
\omega^2 = \omega_0^2 + 2\alpha(\theta - \theta_0)
$$

## Link between linear and angular motion

For a point at radius $r$:

$$
s = r\theta
$$

$$
v = r\omega
$$

$$
a_t = r\alpha
$$

$$
a_c = \frac{v^2}{r} = r\omega^2
$$

## Torque

Torque measures the tendency of a force to cause rotation:

$$
\vec \tau = \vec r \times \vec F
$$

Magnitude:

$$
\tau = rF\sin\phi
$$

where $\phi$ is the angle between $\vec r$ and $\vec F$.

## Rotational dynamics

For a rigid body about a fixed axis:

$$
\sum \tau = I\alpha
$$

Here $I$ is the moment of inertia.

## Rotational kinetic energy

$$
K_{rot} = \frac{1}{2}I\omega^2
$$

## Rolling without slipping

Condition:

$$
v = r\omega
$$

Rolling problems often combine translation, rotation, and energy.

---

# Gravity and circular motion

## Universal gravitation

Newton's law of gravitation:

$$
F = G\frac{m_1 m_2}{r^2}
$$

Near Earth's surface:

$$
g = G\frac{M_E}{R_E^2}
$$

## Uniform circular motion

An object moving in a circle at constant speed still accelerates because its velocity direction changes.

Centripetal acceleration:

$$
a_c = \frac{v^2}{r} = \omega^2 r
$$

Centripetal force:

$$
F_c = m\frac{v^2}{r}
$$

This is not a new force. It is the net inward force required for circular motion.

## Common circular-motion sources of centripetal force

- Tension in a string
- Friction between tires and road
- Gravity in orbital motion
- Normal force in a loop or banked curve

## Orbit idea

For a circular orbit, gravity supplies the centripetal force:

$$
\frac{GMm}{r^2} = m\frac{v^2}{r}
$$

---

# Simple harmonic motion

Simple harmonic motion describes oscillations around stable equilibrium.

## Defining feature

The restoring force is proportional to displacement and opposite in direction:

$$
F = -kx
$$

For a mass-spring system:

$$
m\ddot x + kx = 0
$$

Angular frequency:

$$
\omega = \sqrt{\frac{k}{m}}
$$

Period:

$$
T = 2\pi\sqrt{\frac{m}{k}}
$$

## Useful energy form

Total mechanical energy in ideal SHM:

$$
E = \frac{1}{2}kA^2
$$

where $A$ is amplitude.

## Pendulum approximation

For small angles, a simple pendulum has period:

$$
T = 2\pi\sqrt{\frac{L}{g}}
$$

This approximation is accurate only for small angular displacements.

---

# Statics and equilibrium

Statics studies objects at rest or moving with constant velocity.

For equilibrium:

$$
\sum \vec F = 0
$$

and for rotational equilibrium:

$$
\sum \tau = 0
$$

## Strategy

1. Draw the free-body diagram.
2. Write force balances in each direction.
3. Choose a torque point that removes unknown forces when possible.
4. Solve the smallest useful system of equations.

## Typical statics problems

- Beams supported at two points
- Ladders against walls
- Hanging signs
- Center of mass and support forces

## Center of mass

For point masses on a line:

$$
x_{cm} = \frac{\sum m_i x_i}{\sum m_i}
$$

In two dimensions:

$$
x_{cm} = \frac{\sum m_i x_i}{\sum m_i}, \qquad y_{cm} = \frac{\sum m_i y_i}{\sum m_i}
$$

The center of mass is the effective point where translational motion can be tracked.

---

# Problem-solving workflow

Good mechanics solutions are usually built in the same order.

## 1. Identify the topic

Decide whether the problem is mainly about:

- Kinematics
- Forces
- Energy
- Momentum
- Rotation
- Gravity
- Oscillation

## 2. Draw the model

Use a diagram. Label:

- Known and unknown quantities
- Axes
- Angles
- Forces
- Initial and final states

## 3. Choose the governing principle

Examples:

- Constant acceleration equations
- $\sum F = ma$
- $W_{net} = \Delta K$
- $\vec p_i = \vec p_f$
- $\sum \tau = I\alpha$

## 4. Solve symbolically first

Keep variables until the end. This reduces algebra mistakes and makes unit checking easier.

## 5. Check the result

Sanity checks:

- Units are correct
- Direction and sign are reasonable
- Magnitude is physically plausible
- Limiting cases make sense

## 6. Interpret

Translate the answer back into the language of the problem. A correct number is not enough if the meaning is unclear.

---

# Formula summary

## Kinematics

$$
v = v_0 + at
$$

$$
x = x_0 + v_0 t + \frac{1}{2}at^2
$$

$$
v^2 = v_0^2 + 2a(x-x_0)
$$

## Forces

$$
\sum \vec F = m\vec a
$$

$$
f_k = \mu_k N
$$

$$
f_s \le \mu_s N
$$

$$
F_s = -kx
$$

## Energy

$$
K = \frac{1}{2}mv^2
$$

$$
W = \vec F \cdot \vec d
$$

$$
W_{net} = \Delta K
$$

$$
U_g = mgh
$$

$$
U_s = \frac{1}{2}kx^2
$$

$$
K_i + U_i + W_{nc} = K_f + U_f
$$

## Momentum

$$
\vec p = m\vec v
$$

$$
\vec J = \Delta \vec p
$$

$$
\vec p_i = \vec p_f
$$

## Rotation

$$
\omega = \omega_0 + \alpha t
$$

$$
\theta = \theta_0 + \omega_0 t + \frac{1}{2}\alpha t^2
$$

$$
\sum \tau = I\alpha
$$

$$
K_{rot} = \frac{1}{2}I\omega^2
$$

$$
v = r\omega
$$

$$
a_c = \frac{v^2}{r}
$$

## Gravity and oscillations

$$
F = G\frac{m_1 m_2}{r^2}
$$

$$
T_{spring} = 2\pi\sqrt{\frac{m}{k}}
$$

$$
T_{pendulum} = 2\pi\sqrt{\frac{L}{g}}
$$

---

## Common pitfalls

- Mixing up displacement and distance
- Using a speed equation when direction matters
- Assuming $N = mg$ in every contact problem
- Forgetting that friction and tension are forces, not constants
- Applying energy when the problem asks for a force or acceleration directly
- Forgetting that momentum is vector-valued
- Using a circular motion formula without checking whether the motion is actually circular

## Sources

- [OpenStax University Physics](https://openstax.org/subjects/science)
- [Physics LibreTexts](https://phys.libretexts.org/)
- Halliday, Resnick, and Walker, *Fundamentals of Physics*
- Serway and Jewett, *Physics for Scientists and Engineers*
- Griffiths, *Introduction to Electrodynamics*
- Griffiths, *Introduction to Quantum Mechanics*
- Taylor, *Classical Mechanics*
- [Parell GitHub repository](https://github.com/Parell/parell.github.io)