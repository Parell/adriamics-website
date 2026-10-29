import * as THREE from "three";

const canvas = document.querySelector("[data-hero-sphere]");

if (canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1) * 0.38);
    renderer.setClearColor(0x191814, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.z = 7.2;

    const sphere = new THREE.Group();
    sphere.position.x = 0;
    sphere.rotation.set(-0.24, 0.18, 0.25);
    const radius = 1.3;
    const positions = [];
    const pointOnSphere = (theta, phi) => [
      radius * Math.sin(theta) * Math.cos(phi),
      radius * Math.cos(theta),
      radius * Math.sin(theta) * Math.sin(phi),
    ];
    const addSegment = (start, end) => positions.push(...start, ...end);
    const longitudeCount = 12;
    const longitudeSteps = 32;
    for (let meridian = 0; meridian < longitudeCount; meridian += 1) {
      const phi = Math.PI * 2 * meridian / longitudeCount;
      for (let step = 0; step < longitudeSteps; step += 1) {
        addSegment(pointOnSphere(Math.PI * step / longitudeSteps, phi), pointOnSphere(Math.PI * (step + 1) / longitudeSteps, phi));
      }
    }
    const latitudeCount = 8;
    const latitudeSteps = 64;
    for (let band = 1; band <= latitudeCount; band += 1) {
      const theta = Math.PI * band / (latitudeCount + 1);
      for (let step = 0; step < latitudeSteps; step += 1) {
        addSegment(pointOnSphere(theta, Math.PI * 2 * step / latitudeSteps), pointOnSphere(theta, Math.PI * 2 * (step + 1) / latitudeSteps));
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    // Keep the former .hero__drawing opacity in the materials so the full-screen
    // WebGL wrapper does not need its own translucent compositing layer.
    const drawingOpacity = 0.7;
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0xe9eeee, transparent: true, opacity: 0.25 * drawingOpacity });
    sphere.add(new THREE.LineSegments(geometry, gridMaterial));
    scene.add(sphere);

    const satellites = Array.from({ length: 48 }, (_, index) => ({
      radius: index < 18
        ? 1.52 + (index % 7) * 0.09
        : index < 30
          ? 2.15 + ((index - 18) % 6) * 0.16
          : 3.2 + ((index - 30) % 9) * 0.24,
      tilt: -0.9 + ((index * 0.37) % 1.8),
      speed: (index % 2 ? -1 : 1) * (0.006 + (index % 5) * 0.0035),
      phase: index * Math.PI * (3 - Math.sqrt(5)),
    })).map((satellite) => {
      const orbit = new THREE.Group();
      orbit.rotation.x = satellite.tilt;
      const point = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 6, 4),
        new THREE.MeshBasicMaterial({ color: 0xe9eeee, transparent: true, opacity: 0.9 * drawingOpacity }),
      );
      orbit.add(point);
      scene.add(orbit);
      return { ...satellite, point, material: point.material };
    });

    let renderedWidth = 0;
    let renderedHeight = 0;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
      if (width === renderedWidth && height === renderedHeight) return;
      renderedWidth = width;
      renderedHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 640 ? 8.5 : 7.2;
      sphere.position.x = 0;
      camera.updateProjectionMatrix();
    };
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener("resize", resize, { passive: true });

    const clock = new THREE.Clock();
    const introDuration = 1.45;
    const satelliteFadeDepth = 2.2;
    let warmupFrames = 0;
    const render = () => {
      const elapsed = clock.getElapsedTime();
      const intro = Math.min(elapsed / introDuration, 1);
      const settled = intro * intro * (3 - 2 * intro);
      // The first second assembles the dots from a brief, jittering scatter.
      const glitch = (1 - settled) * (Math.sin(elapsed * 63) * 0.13 + Math.sin(elapsed * 37) * 0.08);
      gridMaterial.opacity = 0.25 * drawingOpacity * settled;
      sphere.rotation.x = -0.24;
      sphere.rotation.y = 0.18 + elapsed * 0.01;
      for (let index = 0; index < satellites.length; index += 1) {
        const satellite = satellites[index];
        const angle = satellite.phase + elapsed * satellite.speed;
        const requestedScatter = 1 + (1 - settled) * (0.7 + Math.sin(index * 12.3) * 0.35);
        const cameraSafeScatter = Math.max(1, (camera.position.z - 2.5) / satellite.radius);
        const scatter = Math.min(requestedScatter, cameraSafeScatter);
        satellite.point.position.set(
          Math.cos(angle) * satellite.radius * scatter + Math.sin(elapsed * 51 + index * 4.1) * glitch,
          Math.cos(elapsed * 47 + index * 7.7) * glitch,
          Math.sin(angle) * satellite.radius * scatter + Math.cos(elapsed * 59 + index * 2.6) * glitch,
        );
        const { y, z } = satellite.point.position;
        const cameraDepth = camera.position.z - (y * Math.sin(satellite.tilt) + z * Math.cos(satellite.tilt));
        // Fade foreground dots before perspective magnifies them near the camera.
        satellite.point.visible = cameraDepth > satelliteFadeDepth;
        const foregroundFade = Math.min(1, Math.max(0, (cameraDepth - satelliteFadeDepth) / 1));
        satellite.material.opacity = 0.9 * drawingOpacity * Math.min(1, intro * 2.5) * foregroundFade;
      }
      renderer.render(scene, camera);
      warmupFrames += 1;
      if (warmupFrames === 3) canvas.classList.add("is-ready");
      requestAnimationFrame(render);
    };
    render();
  } catch (error) {
    console.error("Could not initialize the Three.js hero sphere.", error);
  }
}
