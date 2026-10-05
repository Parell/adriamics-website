import * as THREE from "three";

const canvas = document.querySelector("[data-hero-sphere]");

if (canvas) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1) * 0.38);

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
    sphere.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xe9eeee, transparent: true, opacity: 0.25 })));
    scene.add(sphere);

    const satellites = Array.from({ length: 18 }, (_, index) => ({
      radius: 1.52 + (index % 7) * 0.09,
      tilt: -0.9 + ((index * 0.37) % 1.8),
      speed: (index % 2 ? -1 : 1) * (0.006 + (index % 5) * 0.0035),
      phase: index * Math.PI * (3 - Math.sqrt(5)),
    })).map((satellite) => {
      const orbit = new THREE.Group();
      orbit.rotation.x = satellite.tilt;
      const point = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 6, 4),
        new THREE.MeshBasicMaterial({ color: 0xe9eeee, transparent: true, opacity: 0.9 }),
      );
      orbit.add(point);
      scene.add(orbit);
      return { ...satellite, point };
    });

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (!width || !height) return;
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
    const render = () => {
      const elapsed = clock.getElapsedTime();
      sphere.rotation.x = -0.24;
      sphere.rotation.y = 0.18 + elapsed * 0.03;
      for (const satellite of satellites) {
        const angle = satellite.phase + elapsed * satellite.speed;
        satellite.point.position.set(Math.cos(angle) * satellite.radius, 0, Math.sin(angle) * satellite.radius);
      }
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();
    canvas.parentElement.classList.add("is-rendered");
  } catch (error) {
    console.error("Could not initialize the Three.js hero sphere.", error);
  }
}
