# Robotics learning path

The project is best explored as five independent experiments. Each has an **objective**, a **theory** section, and a simple task that changes one source file.

## 1. Forward kinematics: where is the end effector?

**File:** `src/robot/kinematics.ts`

Coordinates are X/Z on the floor and Y upward. With upper-arm length `L1`, forearm length `L2`, base yaw `q0`, shoulder pitch `q1`, and relative elbow pitch `q2`:

```text
r = L1*cos(q1) + L2*cos(q1 + q2)
x = r*cos(q0)
z = r*sin(q0)
y = shoulderY + L1*sin(q1) + L2*sin(q1 + q2)
```

`forward(q)` also gives the elbow location used by the rendering adapter. Verify `HOME`, then rotate only q0 by +30°. The tip should rotate around the vertical base axis without changing Y.

**Exercise:** Add a `forward` test demonstrating that changing base yaw keeps the tip radius and height constant.

## 2. Image detection and camera calibration

**File:** `src/vision/camera.ts`

Camera rendering draws the cube into a 320 × 240 offscreen-style overhead image. `detectRed` reads the actual RGBA bytes from `getImageData()`, thresholds red pixels, and computes their mean pixel location:

```text
u = Σ(pixel x) / N
v = Σ(pixel y) / N
```

Calibrated orthographic image-to-world mapping:

```text
x = xmin + u/W * (xmax-xmin)
z = zmax - v/H * (zmax-zmin)
```

**Exercise:** Change the red threshold. Test how many red pixels survive an image with a dimmer red cube. Add random noise and plot centroid error as a function of noise magnitude.

**Next level:** Make the synthetic camera perspective instead of orthographic, then determine why a pixel alone cannot uniquely locate a 3D point without assumptions about depth or the observed plane.

## 3. Inverse kinematics: where should each joint go?

**File:** `src/robot/kinematics.ts`

For a target `(x,y,z)`:

```text
r = hypot(x,z)
h = y - shoulderY
cos(q2) = (r² + h² - L1² - L2²) / (2 L1 L2)
q2 = -acos(cos(q2))
q1 = atan2(h,r) - atan2(L2*sin(q2), L1 + L2*cos(q2))
q0 = atan2(z,x)
```

This uses the **elbow-down branch** of two geometric IK solutions. A target farther than `L1 + L2` from the shoulder is unreachable.

**Exercise:** Implement the opposite elbow branch. When is it feasible under the joint limits? Compare the two arm postures for a single tool location.

## 4. Joint control: how do we move smoothly?

**File:** `src/robot/kinematics.ts`

The simulator uses a discrete P velocity controller with a velocity saturation:

```text
q_dot = clamp(Kp * (q_des - q), -omega_max, omega_max)
q_next = q + dt * q_dot
```

The yaw error uses wrapped angles to select the shortest rotation. Each update also enforces angular joint limits. Controller gain determines how quickly commanded joints converge; the speed slider determines max angular speed.

**Exercise:** Repeat the same pick with gain `0.5`, `3`, `7`. Record the number of frames required to get below 1 cm tip error. Note why gain alone cannot overcome a hard velocity limit.

**Next level:** Add PI/PID joint control and demonstrate integral windup when saturation occurs. Add a disturbance to the true joint state.

## 5. Sequencing: pick, lift, and place

**File:** `src/sim/model.ts`

A deterministic state machine runs:

```text
scan → approach → descend → grasp → lift → transport → lower → release → home → complete
```

In the `grasp` state a proximity test checks the tip against the **actual object** (simulator ground truth); if sufficiently close, the object attaches. The target position used by motion planning still comes from the camera's detected RGB centroid. During transport, the object's visual position follows the end effector. The `release` state detaches it at the destination.

**Exercise:** Start from five different pixel positions. Record total completion time, max joint error, and success/failure. Add an out-of-workspace target to verify that your controller fails safely.

**Next level:** If you need real contact forces, introduce a rigid-body simulator instead of treating a cube as attached during grasp. This is the boundary between kinematics and dynamics.

## Suggested verification sequence

```sh
bun test
bun run check
bun run dev
```

Start with `tests/kinematics.test.mjs`, then `tests/vision.test.mjs`, and finally the full cycle in `tests/cycle.test.mjs`.

## Reading

- Original inspiration: https://github.com/Bhoomika229/vision-based-robotic-manipulation
- Shallot renderer: https://github.com/dylanebert/shallot
- Modern Robotics textbook: https://modernrobotics.northwestern.edu/
