import { useRef, useEffect, useCallback } from 'react'
import { Application, Graphics, BlurFilter } from 'pixi.js'

interface RoomProps {
  children?: React.ReactNode
}

// Color palette from spec
const COLORS = {
  skyGradientTop: 0xffb6c1,    // Soft pink
  skyGradientBottom: 0xffb347,  // Amber
  ocean: 0x4a7c8c,              // Muted teal
  sand: 0xe8d5b7,               // Beige
  wallShadow: 0x1a1f3c,         // Navy
  wallLight: 0x2d3a5f,          // Lighter navy
  curtain: 0xf5e6d3,            // Cream
  plant: 0x4a6741,              // Muted green
  plantPot: 0xc4785a,           // Terracotta
}

export function Room({ children }: RoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const animationRef = useRef<number>(0)

  // Create animated dust motes
  const createDustMotes = useCallback((app: Application): Graphics[] => {
    const motes: Graphics[] = []
    const numMotes = 15

    for (let i = 0; i < numMotes; i++) {
      const mote = new Graphics()
      mote.circle(0, 0, Math.random() * 1.5 + 0.5)
      mote.fill({ color: 0xffffff, alpha: Math.random() * 0.3 + 0.1 })

      // Position in the light beam area
      mote.x = app.screen.width * 0.2 + Math.random() * app.screen.width * 0.3
      mote.y = Math.random() * app.screen.height * 0.8

      // Store animation data
      ;(mote as any).baseY = mote.y
      ;(mote as any).driftSpeed = Math.random() * 0.0005 + 0.0002
      ;(mote as any).driftPhase = Math.random() * Math.PI * 2
      ;(mote as any).floatSpeed = Math.random() * 0.0003 + 0.0001

      app.stage.addChild(mote)
      motes.push(mote)
    }

    return motes
  }, [])

  // Draw the bedroom scene
  const drawRoom = useCallback((app: Application) => {
    const { width, height } = app.screen

    // Background wall (dark navy)
    const wall = new Graphics()
    wall.rect(0, 0, width, height)
    wall.fill(COLORS.wallShadow)
    app.stage.addChild(wall)

    // Window opening - lighter background for sky
    const windowX = width * 0.05
    const windowY = height * 0.1
    const windowW = width * 0.45
    const windowH = height * 0.75

    // Sky gradient (simplified - solid color with overlay)
    const sky = new Graphics()
    sky.rect(windowX, windowY, windowW, windowH)
    sky.fill(COLORS.skyGradientBottom)
    app.stage.addChild(sky)

    // Sky gradient overlay (pink at top)
    const skyOverlay = new Graphics()
    skyOverlay.rect(windowX, windowY, windowW, windowH * 0.4)
    skyOverlay.fill({ color: COLORS.skyGradientTop, alpha: 0.6 })
    app.stage.addChild(skyOverlay)

    // Ocean
    const oceanY = windowY + windowH * 0.65
    const ocean = new Graphics()
    ocean.rect(windowX, oceanY, windowW, windowH * 0.35)
    ocean.fill(COLORS.ocean)
    app.stage.addChild(ocean)

    // Distant mountains/hills
    const mountains = new Graphics()
    mountains.moveTo(windowX, oceanY)
    mountains.lineTo(windowX + windowW * 0.2, oceanY - height * 0.08)
    mountains.lineTo(windowX + windowW * 0.4, oceanY - height * 0.05)
    mountains.lineTo(windowX + windowW * 0.6, oceanY - height * 0.1)
    mountains.lineTo(windowX + windowW * 0.8, oceanY - height * 0.06)
    mountains.lineTo(windowX + windowW, oceanY)
    mountains.lineTo(windowX, oceanY)
    mountains.fill({ color: 0x3d4a6b, alpha: 0.8 })
    app.stage.addChild(mountains)

    // Palm tree silhouette (left side of window)
    const palm = new Graphics()
    palm.moveTo(windowX + windowW * 0.1, windowY + windowH)
    palm.lineTo(windowX + windowW * 0.12, windowY + windowH * 0.3)
    palm.lineTo(windowX + windowW * 0.14, windowY + windowH)
    palm.fill(0x2a3a4a)

    // Palm fronds
    const frondColor = 0x2a3a4a
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.4
      const frondLength = windowW * 0.15
      const startX = windowX + windowW * 0.12
      const startY = windowY + windowH * 0.3

      palm.moveTo(startX, startY)
      palm.quadraticCurveTo(
        startX + Math.cos(angle) * frondLength * 0.5,
        startY + Math.sin(angle) * frondLength * 0.3,
        startX + Math.cos(angle + 0.2) * frondLength,
        startY + Math.sin(angle + 0.2) * frondLength
      )
      palm.stroke({ color: frondColor, width: 3 })
    }
    app.stage.addChild(palm)

    // Window frame
    const frame = new Graphics()
    frame.rect(windowX - 4, windowY - 4, windowW + 8, windowH + 8)
    frame.stroke({ color: COLORS.wallLight, width: 8 })
    app.stage.addChild(frame)

    // Window divider (vertical)
    const divider = new Graphics()
    divider.moveTo(windowX + windowW * 0.5, windowY)
    divider.lineTo(windowX + windowW * 0.5, windowY + windowH)
    divider.stroke({ color: COLORS.wallLight, width: 4 })
    app.stage.addChild(divider)

    // Curtain (right side, semi-transparent)
    const curtain = new Graphics()
    curtain.moveTo(windowX + windowW, windowY - 10)
    curtain.lineTo(windowX + windowW + width * 0.08, windowY - 10)
    curtain.quadraticCurveTo(
      windowX + windowW + width * 0.06,
      windowY + windowH * 0.5,
      windowX + windowW + width * 0.08,
      windowY + windowH + 20
    )
    curtain.lineTo(windowX + windowW, windowY + windowH + 20)
    curtain.fill({ color: COLORS.curtain, alpha: 0.85 })
    app.stage.addChild(curtain)

    // Left curtain
    const curtainLeft = new Graphics()
    curtainLeft.moveTo(windowX, windowY - 10)
    curtainLeft.lineTo(windowX - width * 0.05, windowY - 10)
    curtainLeft.quadraticCurveTo(
      windowX - width * 0.03,
      windowY + windowH * 0.5,
      windowX - width * 0.04,
      windowY + windowH + 20
    )
    curtainLeft.lineTo(windowX, windowY + windowH + 20)
    curtainLeft.fill({ color: COLORS.curtain, alpha: 0.85 })
    app.stage.addChild(curtainLeft)

    // Light beam from window (warm glow)
    const lightBeam = new Graphics()
    lightBeam.moveTo(windowX, windowY + windowH)
    lightBeam.lineTo(windowX + windowW, windowY + windowH)
    lightBeam.lineTo(width * 0.5, height)
    lightBeam.lineTo(0, height)
    lightBeam.fill({ color: COLORS.skyGradientBottom, alpha: 0.15 })
    const blur = new BlurFilter({ strength: 20 })
    lightBeam.filters = [blur]
    app.stage.addChild(lightBeam)

    // Floor
    const floor = new Graphics()
    floor.rect(0, height * 0.85, width, height * 0.15)
    floor.fill({ color: 0x3d2c4e, alpha: 0.3 })
    app.stage.addChild(floor)

    // Indoor plant (bottom left corner)
    const potY = height * 0.7
    const potX = windowX + windowW + width * 0.05

    const pot = new Graphics()
    pot.moveTo(potX, potY)
    pot.lineTo(potX + 30, potY + 40)
    pot.lineTo(potX - 30, potY + 40)
    pot.fill(COLORS.plantPot)
    app.stage.addChild(pot)

    // Plant leaves
    const plantLeaves = new Graphics()
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * 0.5
      const leafLength = 50 + Math.random() * 20

      plantLeaves.moveTo(potX, potY - 5)
      plantLeaves.quadraticCurveTo(
        potX + Math.cos(angle) * leafLength * 0.6,
        potY - leafLength * 0.3,
        potX + Math.cos(angle) * leafLength,
        potY - leafLength * 0.8
      )
      plantLeaves.stroke({ color: COLORS.plant, width: 8, cap: 'round' })
    }
    app.stage.addChild(plantLeaves)

    // Create dust motes
    return createDustMotes(app)
  }, [createDustMotes])

  useEffect(() => {
    if (!containerRef.current) return

    let dustMotes: Graphics[] = []
    let time = 0

    const initPixi = async () => {
      const app = new Application()

      await app.init({
        background: COLORS.wallShadow,
        resizeTo: containerRef.current!,
        antialias: false, // Pixel art style
        resolution: 1,
      })

      containerRef.current!.appendChild(app.canvas)
      appRef.current = app

      dustMotes = drawRoom(app)

      // Animation loop for dust motes and subtle movements
      const animate = () => {
        time += 16 // Approximate 60fps timing

        dustMotes.forEach((mote) => {
          const m = mote as any
          // Gentle floating and drifting
          mote.y = m.baseY + Math.sin(time * m.floatSpeed + m.driftPhase) * 30
          mote.x += Math.sin(time * m.driftSpeed) * 0.3
          mote.alpha = 0.1 + Math.sin(time * 0.001 + m.driftPhase) * 0.1

          // Reset if out of bounds
          if (mote.x > app.screen.width * 0.6) {
            mote.x = app.screen.width * 0.15
          }
        })

        animationRef.current = requestAnimationFrame(animate)
      }

      animate()
    }

    initPixi()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (appRef.current) {
        appRef.current.destroy(true)
        appRef.current = null
      }
    }
  }, [drawRoom])

  return (
    <div className="relative w-full h-full">
      {/* PixiJS Canvas Container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* React overlay for UI components */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
