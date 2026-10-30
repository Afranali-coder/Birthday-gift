import {
  Component,
  ElementRef,
  viewChild,
  output,
  inject,
  PLATFORM_ID,
  effect,
  OnDestroy,
  AfterViewInit,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as THREE from 'three';
import { ThemeService } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gift-canvas',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full h-full flex flex-col items-center justify-center select-none touch-none">
      <!-- 3D Canvas -->
      <canvas
        #giftCanvas
        tabindex="0"
        role="button"
        aria-label="3D Interactive Gift Box. Ghuma ke dekh aur click karke khol!"
        class="w-full h-full block cursor-grab active:cursor-grabbing outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 rounded-2xl"
        (pointerdown)="onPointerDown($event)"
        (pointermove)="onPointerMove($event)"
        (pointerup)="onPointerUp($event)"
        (pointercancel)="onPointerCancel()"
        (keydown.enter)="triggerOpen()"
        (keydown.space)="triggerOpen()"
      ></canvas>

      <!-- Interactive 3D Hint Badge -->
      @if (!isOpened()) {
        <div
          class="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-xs font-medium text-slate-300 pointer-events-none flex items-center gap-2 shadow-lg transition-opacity duration-300"
          [class.opacity-0]="isDragging()"
        >
          <mat-icon class="text-amber-400 !w-4 !h-4 !text-base animate-spin" style="animation-duration: 6s;">3d_rotation</mat-icon>
          <span>Drag to rotate 360° · Click to unwrap</span>
        </div>
      }
    </div>
  `
})
export class GiftCanvas implements AfterViewInit, OnDestroy {
  readonly giftCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('giftCanvas');
  readonly opened = output<void>();

  private readonly platformId = inject(PLATFORM_ID);
  readonly themeService = inject(ThemeService);
  private readonly soundService = inject(SoundService);

  readonly isOpened = signal<boolean>(false);
  readonly isDragging = signal<boolean>(false);

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private animFrameId: number | null = null;

  // Scene Objects
  private giftGroup: THREE.Group | null = null;
  private giftBodyMesh: THREE.Mesh | null = null;
  private lidGroup: THREE.Group | null = null;
  private lidBaseMesh: THREE.Mesh | null = null;
  private ribbonMeshes: THREE.Mesh[] = [];
  private bowLoops: THREE.Mesh[] = [];
  private bowCenterMesh: THREE.Mesh | null = null;
  private glowFloorMesh: THREE.Mesh | null = null;
  private starPoints: THREE.Points | null = null;
  private balloonsGroup: THREE.Group | null = null;
  private balloonMeshes: THREE.Mesh[] = [];
  private particleItems: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    spin: THREE.Vector3;
    material: THREE.MeshBasicMaterial;
    geometry: THREE.BufferGeometry;
  }[] = [];

  // Lights
  private keyLight: THREE.PointLight | null = null;
  private fillLight: THREE.PointLight | null = null;
  private rimLight: THREE.PointLight | null = null;
  private ambientLight: THREE.AmbientLight | null = null;

  // Interaction & Damping
  private startPoint = { x: 0, y: 0 };
  private prevPoint = { x: 0, y: 0 };
  private orbit = { x: 0.1, y: 0 };
  private orbitTarget = { x: 0.1, y: 0 };
  private movedDistance = 0;
  private startTime = 0;
  private openStartTime = 0;

  constructor() {
    // React to theme changes and update 3D material colors
    effect(() => {
      const theme = this.themeService.currentTheme();
      this.updateColors(theme);
    });
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initThree();
  }

  ngOnDestroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
    window.removeEventListener('resize', this.onResize);
  }

  private initThree() {
    const canvas = this.giftCanvas().nativeElement;
    const width = canvas.parentElement?.clientWidth || 500;
    const height = canvas.parentElement?.clientHeight || 400;

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0.4, 7.0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Lights
    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(this.ambientLight);

    const theme = this.themeService.currentTheme();

    this.keyLight = new THREE.PointLight(theme.hexGold, 3.2, 22);
    this.keyLight.position.set(-3.5, 4.5, 5);
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.PointLight(theme.hexSecondary, 2.5, 18);
    this.fillLight.position.set(4, 2.5, 3.5);
    this.scene.add(this.fillLight);

    this.rimLight = new THREE.PointLight(theme.hexAccent, 2.0, 16);
    this.rimLight.position.set(0, -3.5, -4);
    this.scene.add(this.rimLight);

    // Build Gift Box
    this.buildGiftBox();

    // Floating 3D Festive Balloons
    this.buildFloatingBalloons();

    // Orbiting Star Dust
    this.buildStarDust();

    // Handle Window Resize
    window.addEventListener('resize', this.onResize, { passive: true });
    this.onResize();

    // Start Animation Loop
    this.startTime = performance.now();
    this.tick(this.startTime);
  }

  private buildGiftBox() {
    if (!this.scene) return;
    const theme = this.themeService.currentTheme();

    this.giftGroup = new THREE.Group();
    this.scene.add(this.giftGroup);

    const boxW = 1.95;
    const boxH = 1.55;
    const boxD = 1.6;

    // Gift Body Material
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: theme.hexSecondary,
      roughness: 0.22,
      metalness: 0.15,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15
    });

    this.giftBodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boxW, boxH, boxD),
      bodyMaterial
    );
    this.giftBodyMesh.position.y = -0.12;
    this.giftGroup.add(this.giftBodyMesh);

    // Ribbon Material (Rich Shimmering Gold)
    const ribbonMaterial = new THREE.MeshPhysicalMaterial({
      color: theme.hexPrimary,
      roughness: 0.18,
      metalness: 0.55,
      clearcoat: 0.9
    });

    // Body Vertical Ribbon
    const bodyVertRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, boxH + 0.02, boxD + 0.02),
      ribbonMaterial
    );
    bodyVertRibbon.position.y = -0.12;
    this.giftGroup.add(bodyVertRibbon);
    this.ribbonMeshes.push(bodyVertRibbon);

    // Body Horizontal Ribbon
    const bodyHorizRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(boxW + 0.02, boxH + 0.02, 0.3),
      ribbonMaterial
    );
    bodyHorizRibbon.position.y = -0.12;
    this.giftGroup.add(bodyHorizRibbon);
    this.ribbonMeshes.push(bodyHorizRibbon);

    // LID GROUP
    this.lidGroup = new THREE.Group();
    this.lidGroup.position.set(0, 0.68, 0);
    this.giftGroup.add(this.lidGroup);

    const lidMaterial = new THREE.MeshPhysicalMaterial({
      color: theme.hexSecondary,
      roughness: 0.2,
      metalness: 0.18,
      clearcoat: 0.85
    });

    this.lidBaseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(boxW + 0.18, 0.38, boxD + 0.18),
      lidMaterial
    );
    this.lidBaseMesh.position.y = 0.03;
    this.lidGroup.add(this.lidBaseMesh);

    // Lid Ribbons
    const lidVertRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.4, boxD + 0.2),
      ribbonMaterial
    );
    lidVertRibbon.position.y = 0.03;
    this.lidGroup.add(lidVertRibbon);
    this.ribbonMeshes.push(lidVertRibbon);

    const lidHorizRibbon = new THREE.Mesh(
      new THREE.BoxGeometry(boxW + 0.2, 0.4, 0.32),
      ribbonMaterial
    );
    lidHorizRibbon.position.y = 0.03;
    this.lidGroup.add(lidHorizRibbon);
    this.ribbonMeshes.push(lidHorizRibbon);

    // BOW ON TOP (Multiple curved loops)
    for (const side of [-1, 1]) {
      const loop = new THREE.Mesh(
        new THREE.TorusGeometry(0.32, 0.08, 12, 32, Math.PI * 1.85),
        ribbonMaterial
      );
      loop.position.set(side * 0.24, 0.42, 0);
      loop.rotation.z = side * 0.5;
      loop.rotation.y = side * 0.15;
      this.lidGroup.add(loop);
      this.bowLoops.push(loop);

      // Secondary loop for extra luxury
      const subLoop = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.065, 10, 24, Math.PI * 1.8),
        ribbonMaterial
      );
      subLoop.position.set(side * 0.16, 0.38, side * 0.18);
      subLoop.rotation.z = side * 0.35;
      subLoop.rotation.x = side * 0.4;
      this.lidGroup.add(subLoop);
      this.bowLoops.push(subLoop);
    }

    // Bow Center Knot (Jewel sphere)
    const bowCenterMaterial = new THREE.MeshStandardMaterial({
      color: theme.hexAccent,
      roughness: 0.15,
      metalness: 0.7
    });
    this.bowCenterMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 16),
      bowCenterMaterial
    );
    this.bowCenterMesh.position.set(0, 0.38, 0);
    this.lidGroup.add(this.bowCenterMesh);

    // Soft Contact Glow Disc Underneath
    this.glowFloorMesh = new THREE.Mesh(
      new THREE.CircleGeometry(1.9, 48),
      new THREE.MeshBasicMaterial({
        color: theme.hexPrimary,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide
      })
    );
    this.glowFloorMesh.rotation.x = -Math.PI / 2;
    this.glowFloorMesh.position.y = -1.05;
    this.giftGroup.add(this.glowFloorMesh);
  }

  private buildFloatingBalloons() {
    if (!this.scene) return;
    const theme = this.themeService.currentTheme();
    this.balloonsGroup = new THREE.Group();
    this.scene.add(this.balloonsGroup);

    const balloonColors = [theme.hexPrimary, theme.hexSecondary, theme.hexAccent, theme.hexHighlight, theme.hexGold];
    const positions = [
      { x: -2.8, y: 1.6, z: -1.2, scale: 0.8 },
      { x: 2.9, y: 1.8, z: -1.0, scale: 0.85 },
      { x: -2.3, y: -0.6, z: 0.8, scale: 0.65 },
      { x: 2.6, y: -0.4, z: 0.5, scale: 0.7 },
      { x: 0.2, y: 2.6, z: -2.2, scale: 0.9 }
    ];

    positions.forEach((pos, idx) => {
      const balloon = new THREE.Group();
      balloon.position.set(pos.x, pos.y, pos.z);
      balloon.scale.setScalar(pos.scale);

      const sphereGeo = new THREE.SphereGeometry(0.48, 24, 20);
      sphereGeo.scale(1, 1.25, 1); // Egg shape
      const balloonMat = new THREE.MeshPhysicalMaterial({
        color: balloonColors[idx % balloonColors.length],
        roughness: 0.12,
        metalness: 0.1,
        clearcoat: 0.95
      });
      const body = new THREE.Mesh(sphereGeo, balloonMat);
      balloon.add(body);
      this.balloonMeshes.push(body);

      // Knot at bottom
      const knotGeo = new THREE.ConeGeometry(0.08, 0.1, 12);
      const knot = new THREE.Mesh(knotGeo, balloonMat);
      knot.position.y = -0.62;
      balloon.add(knot);

      // Balloon string
      const stringGeo = new THREE.CylinderGeometry(0.005, 0.005, 1.2, 6);
      const stringMat = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
      const stringMesh = new THREE.Mesh(stringGeo, stringMat);
      stringMesh.position.y = -1.22;
      balloon.add(stringMesh);

      this.balloonsGroup?.add(balloon);
    });
  }

  private buildStarDust() {
    if (!this.scene) return;
    const theme = this.themeService.currentTheme();
    const count = 300;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const palette = [theme.hexPrimary, theme.hexSecondary, theme.hexAccent, theme.hexHighlight, 0xffffff];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;

      const col = new THREE.Color(palette[i % palette.length]);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    this.starPoints = new THREE.Points(geometry, material);
    this.scene.add(this.starPoints);
  }

  private updateColors(theme: ReturnType<ThemeService['currentTheme']>) {
    if (!this.scene) return;

    // Update lights
    if (this.keyLight) this.keyLight.color.setHex(theme.hexGold);
    if (this.fillLight) this.fillLight.color.setHex(theme.hexSecondary);
    if (this.rimLight) this.rimLight.color.setHex(theme.hexAccent);

    // Update Gift Box Body & Lid
    if (this.giftBodyMesh) {
      (this.giftBodyMesh.material as THREE.MeshPhysicalMaterial).color.setHex(theme.hexSecondary);
    }
    if (this.lidBaseMesh) {
      (this.lidBaseMesh.material as THREE.MeshPhysicalMaterial).color.setHex(theme.hexSecondary);
    }

    // Update Ribbons & Bows
    this.ribbonMeshes.forEach(mesh => {
      (mesh.material as THREE.MeshPhysicalMaterial).color.setHex(theme.hexPrimary);
    });
    this.bowLoops.forEach(mesh => {
      (mesh.material as THREE.MeshPhysicalMaterial).color.setHex(theme.hexPrimary);
    });

    if (this.bowCenterMesh) {
      (this.bowCenterMesh.material as THREE.MeshStandardMaterial).color.setHex(theme.hexAccent);
    }

    if (this.glowFloorMesh) {
      (this.glowFloorMesh.material as THREE.MeshBasicMaterial).color.setHex(theme.hexPrimary);
    }

    // Update Balloons
    const balloonColors = [theme.hexPrimary, theme.hexSecondary, theme.hexAccent, theme.hexHighlight, theme.hexGold];
    this.balloonMeshes.forEach((mesh, i) => {
      (mesh.material as THREE.MeshPhysicalMaterial).color.setHex(balloonColors[i % balloonColors.length]);
    });
  }

  private onResize = () => {
    if (!this.renderer || !this.camera) return;
    const canvas = this.giftCanvas().nativeElement;
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = Math.max(parent.clientWidth, 280);
    const height = Math.max(parent.clientHeight, 280);

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.position.z = width < 500 ? 8.6 : 7.0;
    this.camera.updateProjectionMatrix();
  };

  private tick = (time: number) => {
    this.animFrameId = requestAnimationFrame(this.tick);
    if (!this.renderer || !this.scene || !this.camera) return;

    const elapsed = (time - this.startTime) / 1000;

    // Smooth Orbit Damping
    this.orbit.x += (this.orbitTarget.x - this.orbit.x) * 0.08;
    this.orbit.y += (this.orbitTarget.y - this.orbit.y) * 0.08;

    if (this.giftGroup && !this.isOpened()) {
      // Gentle floating animation
      this.giftGroup.rotation.y = elapsed * 0.22 + this.orbit.y;
      this.giftGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.06 + this.orbit.x;
      this.giftGroup.position.y = Math.sin(elapsed * 1.1) * 0.12;

      // Gentle lid wiggle
      if (this.lidGroup) {
        this.lidGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.02;
      }
    }

    // Floating Balloons wobble
    if (this.balloonsGroup) {
      this.balloonsGroup.children.forEach((balloon, idx) => {
        balloon.position.y += Math.sin(elapsed * 1.2 + idx * 1.3) * 0.002;
        balloon.rotation.z = Math.sin(elapsed * 0.8 + idx) * 0.04;
      });
    }

    // Star rotation
    if (this.starPoints) {
      this.starPoints.rotation.y = elapsed * 0.025;
      this.starPoints.rotation.x = Math.sin(elapsed * 0.02) * 0.05;
    }

    // Opening animation progress
    if (this.isOpened() && this.lidGroup) {
      const openProgress = Math.min((time - this.openStartTime) / 1000, 1.0);
      const ease = 1 - Math.pow(1 - openProgress, 3); // cubic ease out

      this.lidGroup.position.set(
        Math.sin(openProgress * Math.PI) * 1.2,
        0.68 + ease * 4.6,
        -ease * 3.2
      );
      this.lidGroup.rotation.set(ease * 1.4, ease * 3.2, ease * 0.8);

      if (this.giftBodyMesh) {
        const bodyScale = 1 + ease * 0.15;
        this.giftBodyMesh.scale.set(bodyScale, 1 + ease * 0.08, bodyScale);
      }
    }

    // Update active burst particles
    for (let i = this.particleItems.length - 1; i >= 0; i--) {
      const p = this.particleItems[i];
      p.velocity.y -= 0.0035; // gravity
      p.mesh.position.add(p.velocity);
      p.mesh.rotation.x += p.spin.x;
      p.mesh.rotation.y += p.spin.y;
      p.material.opacity -= 0.014;

      if (p.material.opacity <= 0) {
        this.scene.remove(p.mesh);
        p.geometry.dispose();
        p.material.dispose();
        this.particleItems.splice(i, 1);
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  private burstParticles() {
    if (!this.scene || !this.giftGroup) return;
    const theme = this.themeService.currentTheme();
    const colors = [theme.hexPrimary, theme.hexSecondary, theme.hexAccent, theme.hexHighlight, theme.hexGold];

    for (let i = 0; i < 90; i++) {
      const geo = new THREE.TetrahedronGeometry(0.04 + Math.random() * 0.07, 0);
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 1.0
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(this.giftGroup.position);
      mesh.position.x += (Math.random() - 0.5) * 1.5;
      mesh.position.y += (Math.random() - 0.5) * 1.2;
      mesh.position.z += (Math.random() - 0.5) * 1.5;
      this.scene.add(mesh);

      this.particleItems.push({
        mesh,
        geometry: geo,
        material: mat,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.15,
          0.05 + Math.random() * 0.16,
          (Math.random() - 0.5) * 0.15
        ),
        spin: new THREE.Vector3(
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2,
          (Math.random() - 0.5) * 0.2
        )
      });
    }
  }

  triggerOpen() {
    if (this.isOpened()) return;
    this.isOpened.set(true);
    this.openStartTime = performance.now();
    this.soundService.playPopSound();
    this.soundService.playChime();
    this.burstParticles();

    setTimeout(() => {
      this.opened.emit();
    }, 550);
  }

  resetGift() {
    this.isOpened.set(false);
    if (this.lidGroup) {
      this.lidGroup.position.set(0, 0.68, 0);
      this.lidGroup.rotation.set(0, 0, 0);
    }
    if (this.giftBodyMesh) {
      this.giftBodyMesh.scale.set(1, 1, 1);
    }
  }

  // Pointer Events
  onPointerDown(e: PointerEvent) {
    if (this.isOpened() || e.button !== 0) return;
    this.isDragging.set(true);
    this.movedDistance = 0;
    this.startPoint = { x: e.clientX, y: e.clientY };
    this.prevPoint = { x: e.clientX, y: e.clientY };
    const canvas = this.giftCanvas().nativeElement;
    canvas.setPointerCapture(e.pointerId);
  }

  onPointerMove(e: PointerEvent) {
    if (!this.isDragging()) return;
    const deltaX = e.clientX - this.prevPoint.x;
    const deltaY = e.clientY - this.prevPoint.y;
    this.movedDistance += Math.abs(deltaX) + Math.abs(deltaY);

    this.orbitTarget.y += deltaX * 0.009;
    this.orbitTarget.x = Math.max(-0.6, Math.min(0.6, this.orbitTarget.x + deltaY * 0.007));

    this.prevPoint = { x: e.clientX, y: e.clientY };
  }

  onPointerUp(e: PointerEvent) {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    const canvas = this.giftCanvas().nativeElement;
    if (canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }

    // If it was a click/tap without dragging, open it!
    if (this.movedDistance < 8) {
      this.triggerOpen();
    }
  }

  onPointerCancel() {
    this.isDragging.set(false);
  }
}
