/**
 * NexGrade - 3D Gradient & Interactive Parallax Background Engine
 * Supports 60 FPS WebGL 3D terrain wave rendering for Dark & Light modes.
 */

(function () {
  'use strict';

  // Palette Configurations for Dark and Light Themes
  const THEME_PALETTES = {
    'dark': {
      bg: 0x090d16,
      mesh: 0x6366f1,
      wireframe: 0xa855f7,
      orb1: 0xa855f7,
      orb2: 0xec4899,
      orb3: 0x06b6d4,
      light1: 0x9333ea,
      light2: 0xec4899,
      fogDensity: 0.018
    },
    'light': {
      bg: 0xf8fafc,
      mesh: 0x818cf8,
      wireframe: 0xc084fc,
      orb1: 0x818cf8,
      orb2: 0xf472b6,
      orb3: 0x38bdf8,
      light1: 0x6366f1,
      light2: 0xa855f7,
      fogDensity: 0.012
    }
  };

  let activeThemeKey = 'dark';
  let canvas, scene, camera, renderer;
  let planeMesh, wireframeMesh, particleSystem;
  let light1, light2, orb1, orb2, orb3;
  let mouseX = 0, mouseY = 0;
  let targetMouseX = 0, targetMouseY = 0;
  let windowHalfX = window.innerWidth / 2;
  let windowHalfY = window.innerHeight / 2;
  let isThreeAvailable = false;

  function initEngine() {
    canvas = document.getElementById('bg-3d-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-3d-canvas';
      document.body.prepend(canvas);
    }

    // Check if initial body data-theme is set
    const currentMode = document.body.getAttribute('data-theme') || 'dark';
    activeThemeKey = (currentMode === 'light') ? 'light' : 'dark';

    // Check if Three.js is available
    if (typeof THREE !== 'undefined') {
      isThreeAvailable = true;
      initThreeScene();
    } else {
      console.warn('Three.js not found. Initializing 2D Canvas gradient fallback.');
      init2DCanvasFallback();
    }

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
  }

  /* ==========================================================================
     Three.js WebGL 3D Gradient Scene Implementation
     ========================================================================== */
  function initThreeScene() {
    scene = new THREE.Scene();
    const palette = THEME_PALETTES[activeThemeKey];
    scene.background = new THREE.Color(palette.bg);
    scene.fog = new THREE.FogExp2(palette.bg, palette.fogDensity);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -15, 35);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    // 1. Interactive Wavy Parametric Terrain Mesh
    const planeGeo = new THREE.PlaneGeometry(120, 120, 48, 48);
    const planeMat = new THREE.MeshPhongMaterial({
      color: palette.mesh,
      emissive: (activeThemeKey === 'light') ? 0xe2e8f0 : 0x050714,
      specular: 0xffffff,
      shininess: 40,
      side: THREE.DoubleSide,
      flatShading: true,
      transparent: true,
      opacity: 0.75
    });

    planeMesh = new THREE.Mesh(planeGeo, planeMat);
    planeMesh.rotation.x = -Math.PI / 2.8;
    planeMesh.position.y = -18;
    scene.add(planeMesh);

    // Wireframe overlay
    const wireMat = new THREE.MeshBasicMaterial({
      color: palette.wireframe,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    wireframeMesh = new THREE.Mesh(planeGeo, wireMat);
    wireframeMesh.rotation.x = planeMesh.rotation.x;
    wireframeMesh.position.y = planeMesh.position.y;
    scene.add(wireframeMesh);

    // Store original Z coordinates for wave animation
    const posAttribute = planeGeo.attributes.position;
    planeGeo.userData = { originalZ: [] };
    for (let i = 0; i < posAttribute.count; i++) {
      planeGeo.userData.originalZ.push(posAttribute.getZ(i));
    }

    // 2. Floating Glowing Gradient Orbs
    const sphereGeo = new THREE.SphereGeometry(4, 32, 32);
    
    const matOrb1 = new THREE.MeshStandardMaterial({
      color: palette.orb1,
      roughness: 0.1,
      metalness: 0.8,
      emissive: palette.orb1,
      emissiveIntensity: 0.4
    });
    orb1 = new THREE.Mesh(sphereGeo, matOrb1);
    orb1.position.set(-18, 10, -10);
    scene.add(orb1);

    const matOrb2 = new THREE.MeshStandardMaterial({
      color: palette.orb2,
      roughness: 0.2,
      metalness: 0.6,
      emissive: palette.orb2,
      emissiveIntensity: 0.4
    });
    orb2 = new THREE.Mesh(sphereGeo, matOrb2);
    orb2.scale.set(1.4, 1.4, 1.4);
    orb2.position.set(22, 5, -20);
    scene.add(orb2);

    const matOrb3 = new THREE.MeshStandardMaterial({
      color: palette.orb3,
      roughness: 0.3,
      metalness: 0.5,
      emissive: palette.orb3,
      emissiveIntensity: 0.3
    });
    orb3 = new THREE.Mesh(sphereGeo, matOrb3);
    orb3.scale.set(0.8, 0.8, 0.8);
    orb3.position.set(0, 18, -25);
    scene.add(orb3);

    // 3. Ambient Dynamic Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    light1 = new THREE.PointLight(palette.light1, 2.5, 80);
    light1.position.set(-20, 20, 20);
    scene.add(light1);

    light2 = new THREE.PointLight(palette.light2, 2.5, 80);
    light2.position.set(20, -10, 20);
    scene.add(light2);

    // 4. Ambient 3D Particle Dust Field
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 140;
      particlePos[i + 1] = (Math.random() - 0.5) * 100;
      particlePos[i + 2] = (Math.random() - 0.5) * 100;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: (activeThemeKey === 'light') ? 0x64748b : 0xffffff,
      size: 0.65,
      transparent: true,
      opacity: 0.45
    });

    particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    animateThree();
  }

  function animateThree(timestamp) {
    requestAnimationFrame(animateThree);
    const time = (timestamp || performance.now()) * 0.0012;

    // Smooth Mouse Camera Parallax
    mouseX += (targetMouseX - mouseX) * 0.04;
    mouseY += (targetMouseY - mouseY) * 0.04;

    camera.position.x = mouseX * 0.015;
    camera.position.y = -15 + (-mouseY * 0.015);
    camera.lookAt(0, 0, 0);

    if (planeMesh) {
      const geo = planeMesh.geometry;
      const pos = geo.attributes.position;
      const origZ = geo.userData.originalZ;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const zWave = Math.sin(x * 0.15 + time * 1.5) * 2.2 + Math.cos(y * 0.15 + time * 1.2) * 2.2;
        pos.setZ(i, origZ[i] + zWave);
      }
      pos.needsUpdate = true;
    }

    if (orb1) {
      orb1.position.x = -18 + Math.cos(time * 0.8) * 6;
      orb1.position.y = 10 + Math.sin(time * 1.1) * 4;
    }
    if (orb2) {
      orb2.position.x = 22 + Math.sin(time * 0.7) * 8;
      orb2.position.y = 5 + Math.cos(time * 0.9) * 5;
    }
    if (orb3) {
      orb3.position.x = Math.sin(time * 0.5) * 15;
      orb3.position.y = 18 + Math.cos(time * 0.6) * 3;
    }

    if (particleSystem) {
      particleSystem.rotation.y = time * 0.05;
      particleSystem.rotation.x = time * 0.02;
    }

    renderer.render(scene, camera);
  }

  // Live Theme Preset Color Switcher (Dark vs Light)
  window.switch3DTheme = function (themeName) {
    const theme = (themeName === 'light') ? 'light' : 'dark';
    activeThemeKey = theme;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('nexgrade_theme', theme);

    const palette = THEME_PALETTES[theme];

    if (isThreeAvailable && scene) {
      scene.background.setHex(palette.bg);
      if (scene.fog) {
        scene.fog.color.setHex(palette.bg);
        scene.fog.density = palette.fogDensity;
      }

      if (planeMesh) {
        planeMesh.material.color.setHex(palette.mesh);
        planeMesh.material.emissive.setHex((theme === 'light') ? 0xe2e8f0 : 0x050714);
      }
      if (wireframeMesh) wireframeMesh.material.color.setHex(palette.wireframe);

      if (orb1) {
        orb1.material.color.setHex(palette.orb1);
        orb1.material.emissive.setHex(palette.orb1);
      }
      if (orb2) {
        orb2.material.color.setHex(palette.orb2);
        orb2.material.emissive.setHex(palette.orb2);
      }
      if (orb3) {
        orb3.material.color.setHex(palette.orb3);
        orb3.material.emissive.setHex(palette.orb3);
      }
      if (light1) light1.color.setHex(palette.light1);
      if (light2) light2.color.setHex(palette.light2);
      if (particleSystem) {
        particleSystem.material.color.setHex((theme === 'light') ? 0x64748b : 0xffffff);
      }
    }
  };

  /* ==========================================================================
     Fallback 2D Animated Canvas Gradient Engine
     ========================================================================== */
  function init2DCanvasFallback() {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let angle = 0;
    function render2D() {
      requestAnimationFrame(render2D);
      angle += 0.008;

      ctx.clearRect(0, 0, width, height);
      const isLight = activeThemeKey === 'light';

      const grad1 = ctx.createRadialGradient(
        width * 0.3 + Math.cos(angle) * 150,
        height * 0.3 + Math.sin(angle) * 150,
        50,
        width * 0.3,
        height * 0.3,
        width * 0.6
      );
      grad1.addColorStop(0, isLight ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.4)');
      grad1.addColorStop(1, isLight ? 'rgba(248, 250, 252, 0)' : 'rgba(9, 13, 22, 0)');

      ctx.fillStyle = isLight ? '#f8fafc' : '#090d16';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);
    }

    render2D();
  }

  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    if (isThreeAvailable && camera && renderer) {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    } else if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  }

  function onMouseMove(event) {
    targetMouseX = event.clientX - windowHalfX;
    targetMouseY = event.clientY - windowHalfY;
  }

  function onTouchMove(event) {
    if (event.touches.length > 0) {
      targetMouseX = event.touches[0].clientX - windowHalfX;
      targetMouseY = event.touches[0].clientY - windowHalfY;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEngine);
  } else {
    initEngine();
  }
})();
