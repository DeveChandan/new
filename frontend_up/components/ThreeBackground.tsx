"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useTheme } from "next-themes"

export default function ThreeBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 35

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Dynamic texture generation for circular glowing points (avoids square edges)
    const createGlowTexture = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
        gradient.addColorStop(0, "rgba(255, 255, 255, 1)")
        gradient.addColorStop(0.15, "rgba(255, 255, 255, 0.9)")
        gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.3)")
        gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.05)")
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 64, 64)
      }
      return new THREE.CanvasTexture(canvas)
    }

    const glowTexture = createGlowTexture()

    // Particles Configuration
    const particleCount = 140
    const boundingRange = 60

    interface ParticleData {
      base: THREE.Vector3
      current: THREE.Vector3
      speed: number
      anglePhase: number
      colorType: "primary" | "secondary"
      numConnections: number
    }

    const particlesData: ParticleData[] = []
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    // Determine colors based on theme (Indigo + Teal/Cyan gradient mix)
    const isDark = theme === "dark"
    const colorPrimary = new THREE.Color(isDark ? "#818cf8" : "#4f46e5") // Indigo
    const colorSecondary = new THREE.Color(isDark ? "#22d3ee" : "#0891b2") // Teal/Cyan
    const lineColorObj = new THREE.Color(isDark ? "#6366f1" : "#818cf8")

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * boundingRange - boundingRange / 2
      const y = Math.random() * boundingRange - boundingRange / 2
      const z = Math.random() * (boundingRange * 0.6) - (boundingRange * 0.3)

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      const colorType = Math.random() > 0.4 ? "primary" : "secondary"
      const selectedColor = colorType === "primary" ? colorPrimary : colorSecondary
      selectedColor.toArray(colors, i * 3)

      particlesData.push({
        base: new THREE.Vector3(x, y, z),
        current: new THREE.Vector3(x, y, z),
        speed: 0.3 + Math.random() * 0.7,
        anglePhase: Math.random() * Math.PI * 2,
        colorType,
        numConnections: 0,
      })
    }

    // Particles Geometry & Material
    const particlesGeometry = new THREE.BufferGeometry()
    particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

    const particlesMaterial = new THREE.PointsMaterial({
      size: isDark ? 3.0 : 2.5,
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.95 : 0.8,
      map: glowTexture,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      alphaTest: 0.01,
      sizeAttenuation: true,
    })

    const pCloud = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(pCloud)

    // Lines Segment configuration
    const maxConnections = 5
    const minDistance = 15

    const linePositions = new Float32Array(particleCount * maxConnections * 2 * 3)
    const lineColors = new Float32Array(particleCount * maxConnections * 2 * 3)

    const linesGeometry = new THREE.BufferGeometry()
    linesGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3))
    linesGeometry.setAttribute("color", new THREE.BufferAttribute(lineColors, 3))

    const linesMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: isDark ? 0.28 : 0.16,
      linewidth: 1.5,
      blending: isDark ? THREE.AdditiveBlending : THREE.NormalBlending,
    })

    const lineSegments = new THREE.LineSegments(linesGeometry, linesMaterial)
    scene.add(lineSegments)

    // Mouse Tracking
    let mouseX = 0
    let mouseY = 0
    let targetMouseX = 0
    let targetMouseY = 0

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", handleMouseMove)

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight

      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener("resize", handleResize)

    // Animation variables
    let animationFrameId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const time = clock.getElapsedTime()

      // Smooth mouse coordinate interpolation (lerp)
      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05

      // Rotate camera gently based on mouse parallax
      camera.position.x += (mouseX * 15 - camera.position.x) * 0.03
      camera.position.y += (mouseY * 15 - camera.position.y) * 0.03
      camera.lookAt(scene.position)

      // Rotate overall systems slowly in space
      pCloud.rotation.y = time * 0.015
      pCloud.rotation.z = time * 0.005
      lineSegments.rotation.y = pCloud.rotation.y
      lineSegments.rotation.z = pCloud.rotation.z

      const posAttribute = particlesGeometry.getAttribute("position") as THREE.BufferAttribute
      const coords = posAttribute.array as Float32Array

      // Projection of mouse coordinates into 3D space plane to calculate local gravity / push
      const mouse3D = new THREE.Vector3(mouseX * 30, mouseY * 20, 0)

      // Update particle positions with sine waves and magnetic repulsion
      for (let i = 0; i < particleCount; i++) {
        const data = particlesData[i]

        // 1. Organic wave floating logic
        const offsetMultiplier = 2.0
        const waveX = Math.sin(time * 0.3 * data.speed + data.anglePhase) * offsetMultiplier
        const waveY = Math.cos(time * 0.25 * data.speed + data.anglePhase) * offsetMultiplier
        const waveZ = Math.sin(time * 0.15 * data.speed + data.anglePhase) * offsetMultiplier

        const targetPos = data.base.clone().add(new THREE.Vector3(waveX, waveY, waveZ))

        // 2. Cursor repulsion field logic (elastic spring push)
        const distToMouse = data.current.distanceTo(mouse3D)
        const repulsionRadius = 14.0

        if (distToMouse < repulsionRadius) {
          const pushDirection = data.current.clone().sub(mouse3D).normalize()
          const repulsionForce = (1.0 - distToMouse / repulsionRadius) * 4.5
          targetPos.add(pushDirection.multiplyScalar(repulsionForce))
        }

        // 3. Smoothly slide coordinate towards target position
        data.current.x += (targetPos.x - data.current.x) * 0.08
        data.current.y += (targetPos.y - data.current.y) * 0.08
        data.current.z += (targetPos.z - data.current.z) * 0.08

        coords[i * 3] = data.current.x
        coords[i * 3 + 1] = data.current.y
        coords[i * 3 + 2] = data.current.z

        data.numConnections = 0
      }

      posAttribute.needsUpdate = true

      // Update lines based on proximity
      let linePosIdx = 0
      let lineColIdx = 0

      const linePosAttribute = linesGeometry.getAttribute("position") as THREE.BufferAttribute
      const lineColAttribute = linesGeometry.getAttribute("color") as THREE.BufferAttribute
      const linePosArray = linePosAttribute.array as Float32Array
      const lineColArray = lineColAttribute.array as Float32Array

      for (let i = 0; i < particleCount; i++) {
        const p1 = particlesData[i]

        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particlesData[j]

          const dist = p1.current.distanceTo(p2.current)

          if (dist < minDistance) {
            if (p1.numConnections < maxConnections && p2.numConnections < maxConnections) {
              p1.numConnections++
              p2.numConnections++

              // Segment endpoints
              linePosArray[linePosIdx++] = p1.current.x
              linePosArray[linePosIdx++] = p1.current.y
              linePosArray[linePosIdx++] = p1.current.z

              linePosArray[linePosIdx++] = p2.current.x
              linePosArray[linePosIdx++] = p2.current.y
              linePosArray[linePosIdx++] = p2.current.z

              // Fade out connecting line segments based on distance
              const alpha = 1.0 - dist / minDistance
              const tempColor = lineColorObj.clone().multiplyScalar(alpha)

              tempColor.toArray(lineColArray, lineColIdx)
              tempColor.toArray(lineColArray, lineColIdx + 3)
              lineColIdx += 6
            }
          }
        }
      }

      // Hide unused line segments (reset coordinates)
      const totalLineVertices = particleCount * maxConnections * 2 * 3
      while (linePosIdx < totalLineVertices) {
        linePosArray[linePosIdx++] = 0
      }

      linePosAttribute.needsUpdate = true
      lineColAttribute.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("resize", handleResize)

      particlesGeometry.dispose()
      particlesMaterial.dispose()
      linesGeometry.dispose()
      linesMaterial.dispose()
      glowTexture.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [theme])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-0"
      style={{ overflow: "hidden" }}
    />
  )
}
