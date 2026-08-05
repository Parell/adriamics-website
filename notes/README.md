<p align="center">
  <a href="https://adriamics.com/notes/">
    <img src="..\assets\adriamics-logo.webp" alt="Adriamics" width="480" />
  </a>
</p>

<h1 align="center"><b>Universal Education</b> by Adriamics</h1>

UE Notes is a technical study library for math, physics, engineering and hopfully more.
It is designed as a practical review workspace, with focused subject notes, practice pages, and prerequisite maps.

## What This Is

This project is not a textbook.

It is a structured study system designed to help you learn concepts in order, review individual topics, practice with focused problem sets, and follow prerequisite maps.

No filler. No empty history. Just direct learning, rigorous reasoning, and proof of understanding.

If education is truly universal, then anyone can become an expert. What matters is not where you start, but whether you can prove what you understand with rigor.


## Layout

The site is organized into four top-level areas:

```
parell.github.io/
├── notes/
│   ├── source/     One place to update the structure of notes
│   ├── subjects/   HTML generated using the power of a build script
│   ├── index.html  The main site introduction
│   └── README.md   
└── .github/
    ├── ISSUE_TEMPLATE/
    ├── PULL_REQUEST_TEMPLATE.md
    ├── CODEOWNERS
    └── FUNDING.yml
```

**How It Works**

The site is generated from the content in `source/` and the site structure defined in `source/manifest.js`.
When notes or problem sets change, rebuild the site so the generated pages, search index, and sitemap stay in sync. Everything done with markdown files.

## Build

From the repository root:

```bash
node notes/build-notes.mjs
```

That command regenerates the notes pages, practice pages, concept maps, search index, and sitemap.

To install the build dependency:


```bash
npm install
npm run build:notes
```

## Contributing

See [Contribute](/notes/subjects/hidden/contribute/) for the preferred way to help.

Good contributions are small and specific:

- Fix a typo or unclear explanation
- Add one worked example
- Add a few practice problems
- Review a page for correctness
- Improve or add an interactive visualization
- Suggest a missing topic or course mapping

## Roadmap

- Try doing advertising in light mode
- Thermodynamic tables and plots
- Do the ideal gas interactive one but have the heat added be changeable visually so that you can make a turbine a rocket engine or a car engine with the same simulator.
- PhET for some and Desmos for others and Tables for Thermo, each needs there own slight special care, but those three are needed for better learning
- Professors/TAs, Find Student orgs

  - engineering/solid-mechanics
      - Stress and strain tensors
      - Generalized Hooke’s law
      - Principal stresses
      - Plane stress and plane strain
      - Yield criteria
      - Energy methods
      - Elasticity and plasticity

  - engineering/structural-analysis
      - Beam deflection
      - Indeterminate structures
      - Energy methods
      - Matrix structural analysis
      - Buckling
      - Finite-element introduction

  - engineering/metallurgy and manufacturing
      - Phase diagrams
      - Diffusion
      - Heat treatment
      - Solidification
      - Dislocations and strengthening
      - Fatigue and fracture
      - Casting
      - Forming
      - Machining
      - Welding
      - Additive manufacturing
      - Process selection

  - engineering/mechanisms
      - Shafts, fasteners, keys, and couplings
      - Bearings
      - Gears
      - Belts and chains
      - Springs
      - Fatigue design
      - Factor of safety
      - Four-bar linkages
      - Cams
      - Ratchets
      - Screw mechanisms
      - Mobility and degrees of freedom
      - Position, velocity, and acceleration analysis

  - engineering/tribology
      - Adhesive and abrasive wear
      - Boundary, mixed, and hydrodynamic lubrication
      - Stribeck curves
      - Contact mechanics
      - Bearing and seal design

  - engineering/vibrations
      - Single- and multi-degree-of-freedom systems
      - Damping
      - Forced response
      - Resonance
      - Modal analysis
      - Frequency-response functions

- engineering/electronics
      - Diodes and transistors
      - Operational amplifiers
      - Filters
      - Power electronics
      - Noise and grounding

  - engineering/embedded-systems
      - Signal conditioning
      - Microcontroller architecture
      - GPIO, timers, ADC, PWM
      - Interrupts
      - Communication protocols
      - Real-time constraints
      - Embedded software testing

  - engineering/digital-control and robotics-and-kinematics
      - Rigid-body transformations
      - Forward and inverse kinematics
      - Jacobians
      - Velocity and force mapping
      - Workspace and singularities
      - Trajectory generation
      - Discrete-time systems
      - Z-transform
      - Sampling and aliasing
      - Discrete PID
      - State-space models
      - Observers and Kalman filtering


      - Calculus of variations
      - Euler–Lagrange equations
      - Constraints and generalized forces
      - Noether’s theorem
      - Hamiltonian mechanics
      - Canonical transformations
      - Poisson brackets
      - Hamilton–Jacobi theory




    - computational/numerical-ode-methods
    - computational/finite-difference-methods
    - computational/finite-volume-methods
    - computational/spectral-methods
    - computational/finite-element-methods
    - computational/computational-fluid-dynamics




  - engineering/failure-analysis
      - Fracture modes
      - Fatigue
      - Corrosion
      - Wear
      - Overload and buckling
      - Root-cause analysis

  - engineering/reliability-engineering
      - Probability of failure
      - Weibull analysis
      - Series and parallel systems
      - Fault trees
      - FMEA and FMECA
      - Maintainability

  - engineering/engineering-safety
      - Hazard identification
      - Risk matrices
      - Layer-of-protection analysis
      - Human factors
      - Safety factors
      - Functional safety


1. Instrumented cantilever beam
    - Mechanics of materials
    - Strain gauges
    - Circuits
    - Data acquisition
    - Uncertainty
    - Fatigue and reliability

2. Temperature-controlled system
    - Heat transfer
    - Sensors
    - Embedded systems
    - Digital control
    - Parameter estimation

3. Two-wheeled robot
    - Dynamics
    - Kinematics
    - Motors and encoders
    - State-space control
    - Embedded systems

4. Wind-tunnel or pipe-flow study
    - Fluid mechanics
    - Dimensional analysis
    - CFD
    - Experimental design
    - Metrology

5. Satellite attitude-control model
    - Rigid-body dynamics
    - Euler angles and quaternions
    - Sensors and actuators
    - State estimation
    - Digital control

6. Failure-analysis case study
    - Materials science
    - Manufacturing
    - Fracture mechanics
    - Reliability
    - Safety engineering

          - Unconstrained and constrained optimization
      - Convexity
      - Gradient, Newton, and quasi-Newton methods
      - Linear and quadratic programming
      - Multi-objective optimization