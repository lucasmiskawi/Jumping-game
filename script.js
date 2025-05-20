const FLOOR_HEIGHT = 48
const JUMP_FORCE = 800
const SPEED = 450

kaboom()
setBackground(141, 183, 255)
loadSprite("bean", "https://kaboomjs.com/sprites/bean.png")

let gameMode = "win" // default

function drawSun() {
  add([
    circle(48),
    pos(width() - 120, 120),
    color(255, 240, 0),
    fixed(),
    anchor("center"),
    z(-10),
  ])

  const beamCount = 12
  const beamRadius = 60
  const center = vec2(width() - 120, 120)

  for (let i = 0; i < beamCount; i++) {
    const angle = (2 * Math.PI / beamCount) * i
    const dx = Math.cos(angle) * beamRadius
    const dy = Math.sin(angle) * beamRadius

    add([
      rect(4, 12),
      pos(center.x + dx, center.y + dy),
      rotate((angle * 180) / Math.PI + 90),
      color(255, 240, 0),
      anchor("center"),
      fixed(),
      z(-11),
    ])
  }
}

scene("start", () => {
  const instructions = [
    [
      { text: "Press ", color: rgb(255, 255, 255) },
      { text: "SPACE", color: rgb(255, 255, 0) },
      { text: " to jump", color: rgb(255, 255, 255) },
    ],
    [
      { text: "Press ", color: rgb(255, 255, 255) },
      { text: "S", color: rgb(255, 255, 0) },
      { text: " to duck", color: rgb(255, 255, 255) },
    ],
    [
      { text: "Earn ", color: rgb(255, 255, 255) },
      { text: "5000", color: rgb(255, 255, 0) },
      { text: " points to win", color: rgb(255, 255, 255) },
    ],
    [
      { text: "Stars (", color: rgb(255, 255, 255) },
      { text: "★", color: rgb(255, 255, 0) },
      { text: ") give you a double jump", color: rgb(255, 255, 255) },
    ],
    [
      { text: "Press ", color: rgb(255, 255, 255) },
      { text: "W", color: rgb(255, 255, 0) },
      { text: " for Win Mode", color: rgb(255, 255, 255) },
    ],
    [
      { text: "Press ", color: rgb(255, 255, 255) },
      { text: "E", color: rgb(255, 255, 0) },
      { text: " for Endless Mode", color: rgb(255, 255, 255) },
    ],
  ]

  const lineHeight = 42
  const baseY = height() / 2 - (instructions.length * lineHeight) / 2

  instructions.forEach((parts, i) => {
    const fullText = parts.map(p => p.text).join("")
    let offset = 0

    parts.forEach(part => {
      add([
        text(part.text, { size: 32 }),
        pos(width() / 2 - fullText.length * 8 + offset, baseY + i * lineHeight),
        color(part.color),
        anchor("left"),
      ])
      offset += part.text.length * 16
    })
  })

  // Only allow W and E to start
  onKeyPress("w", () => {
    gameMode = "win"
    go("game")
  })
  onKeyPress("e", () => {
    gameMode = "endless"
    go("game")
  })
})

scene("win", () => {
  add([
    text("YOU WIN!", { size: 48 }),
    pos(width() / 2, height() / 2),
    anchor("center"),
  ])
  onKeyPress(() => go("start"))
  onClick(() => go("start"))
})

scene("game", () => {
  setGravity(2400)
  drawSun()

  let score = 0
  let jumpHeld = false
  let isDucking = false
  let lastObstacleType = null
  let duckStreak = 0
  let canDoubleJump = false

  const player = add([
    sprite("bean"),
    scale(0.7),
    pos(80, 40),
    area(),
    body(),
  ])

  function spawnCloud() {
    const y = rand(100, 140)
    add([
      rect(rand(80, 140), rand(24, 40), { radius: 24 }),
      pos(width() + 100, y),
      color(255, 255, 255),
      opacity(0.6),
      move(LEFT, rand(100, 140)),
      z(-5),
      offscreen({ destroy: true }),
    ])
  }

  function spawnCloudLoop() {
    spawnCloud()
    wait(rand(4.5, 6.5), spawnCloudLoop)
  }
  spawnCloudLoop()

  add([
    rect(width(), FLOOR_HEIGHT),
    pos(0, height()),
    anchor("botleft"),
    area(),
    body({ isStatic: true }),
    color(132, 101, 236),
  ])

  function spawnTree(x) {
    const treeHeight = rand(32, 56)
    add([
      rect(48, treeHeight),
      pos(x, height() - FLOOR_HEIGHT),
      anchor("botleft"),
      area(),
      color(238, 143, 203),
      move(LEFT, SPEED),
      offscreen({ destroy: true }),
      "obstacle",
    ])
    add([
      rect(48, 6),
      pos(x, height() - FLOOR_HEIGHT - treeHeight),
      anchor("botleft"),
      color(0, 180, 0),
      move(LEFT, SPEED),
      offscreen({ destroy: true }),
    ])
  }

  function spawnFloatingBlock(x) {
    const y = height() - FLOOR_HEIGHT - rand(30, 30)
    add([
      rect(32, 64),
      pos(x, y),
      anchor("botleft"),
      area(),
      color(255, 204, 0),
      move(LEFT, SPEED),
      offscreen({ destroy: true }),
      "obstacle",
    ])
  }

  function spawnDoubleJumpStar(x) {
    const y = height() - FLOOR_HEIGHT - rand(40, 80)

    const star = add([
      text("★", { size: 48 }),
      pos(x, y),
      color(255, 255, 255),
      scale(1),
      area(),
      anchor("center"),
      z(10),
      move(LEFT, SPEED),
      offscreen({ destroy: true }),
      "star",
    ])

    let dir = 1
    loop(0.3, () => {
      star.moveBy(0, dir * 4)
      dir *= -1
    })
  }

  function spawnObstacleLoop() {
    let spacing = rand(180, 200)
    const x = width() + spacing

    let type
    if (lastObstacleType === "duck") {
      duckStreak++
      if (duckStreak >= 2) {
        type = "tree"
        duckStreak = 0
      } else {
        type = rand() > 0.5 ? "duck" : "tree"
      }
    } else {
      type = rand() > 0.5 ? "duck" : "tree"
      duckStreak = 0
    }
    lastObstacleType = type

    if (type === "tree") {
      spawnTree(x)
    } else {
      spawnFloatingBlock(x)
    }

    if (rand() < 0.2) {
      spawnDoubleJumpStar(width() + 120)
    }

    wait(rand(0.4, 0.7), spawnObstacleLoop)
  }
  spawnObstacleLoop()

  onKeyPress("space", () => {
    if (player.isGrounded()) {
      player.jump(JUMP_FORCE)
      jumpHeld = true
    } else if (canDoubleJump) {
      player.jump(JUMP_FORCE)
      canDoubleJump = false
      jumpHeld = true
    }
  })
  onKeyRelease("space", () => jumpHeld = false)

  onClick(() => {
    if (player.isGrounded()) {
      player.jump(JUMP_FORCE)
      jumpHeld = true
    } else if (canDoubleJump) {
      player.jump(JUMP_FORCE)
      canDoubleJump = false
      jumpHeld = true
    }
  })

  onKeyDown("s", () => {
    if (!isDucking) {
      isDucking = true
      player.scaleTo(vec2(0.7, 0.35))
    }
  })
  onKeyRelease("s", () => {
    if (isDucking) {
      isDucking = false
      player.scaleTo(vec2(0.7, 0.7))
    }
  })

  player.onCollide("obstacle", () => {
    go("lose", score)
    burp()
    addKaboom(player.pos)
  })
  player.onCollide("star", (s) => {
    canDoubleJump = true
    destroy(s)
  })

  const scoreLabel = add([
    text(score),
    pos(24, 24),
  ])

  onUpdate(() => {
    score++
    scoreLabel.text = score

    if (!jumpHeld && player.isJumping() && player.vel.y < 0) {
      player.vel.y += 5400 * dt()
    }

    if (gameMode === "win" && score >= 5000) {
      go("win")
    }
  })
})

scene("lose", (score) => {
  add([
    sprite("bean"),
    pos(width() / 2, height() / 2 - 64),
    scale(2),
    anchor("center"),
  ])
  add([
    text(score),
    pos(width() / 2, height() / 2 + 64),
    scale(2),
    anchor("center"),
  ])
  onKeyPress(() => go("start"))
  onClick(() => go("start"))
})

go("start")
