import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // ═══════════════════════════════════════════════
    // 0) ADMIN USER
    // ═══════════════════════════════════════════════
    const hashedPassword = await bcrypt.hash("crrt2026", 12);
    await prisma.user.upsert({
        where: { email: "admin@crrt.ma" },
        update: {},
        create: {
            name: "CRRT Admin",
            email: "admin@crrt.ma",
            password: hashedPassword,
            role: "admin",
        },
    });
    console.log("  ✓ Admin user (admin@crrt.ma / crrt2026)");

    // ═══════════════════════════════════════════════
    // 1) THEME SETTINGS (singleton)
    // ═══════════════════════════════════════════════
    await prisma.themeSettings.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            primaryColor: "#F97316",
            backgroundColor: "#0F172A",
            accentColor: "#F97316",
            radius: 16,
            shadowStrength: "medium",
            glassIntensity: "medium",
            noiseOverlay: "subtle",
            motionLevel: "standard",
            heroVariant: "A",
            cardVariant: "elevated",
            timelineVariant: "blueprint",
        },
    });
    console.log("  ✓ ThemeSettings");

    // ═══════════════════════════════════════════════
    // 2) HOME CONFIG (singleton)
    // ═══════════════════════════════════════════════
    await prisma.homeConfig.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            missionText:
                "Building the future of robotics and technology at ENSA Agadir since 2008. We design, build, and compete.",
            tagline: "Our robots never sleep.",
            trackTagMap: JSON.stringify([
                { tag: "arduino", label: "Arduino & Embedded", icon: "cpu" },
                { tag: "ai", label: "AI & Machine Learning", icon: "brain" },
                { tag: "mini-projet", label: "Mini-Projets", icon: "rocket" },
                { tag: "competition", label: "Competitions", icon: "trophy" },
                { tag: "iot", label: "IoT & Smart Systems", icon: "wifi" },
            ]),
        },
    });
    console.log("  ✓ HomeConfig");

    // ═══════════════════════════════════════════════
    // 3) TAGS (unified across content)
    // ═══════════════════════════════════════════════
    const tagData = [
        { name: "arduino", labelEn: "Arduino", labelFr: "Arduino", labelAr: "أردوينو", color: "#0ea5e9", icon: "cpu" },
        { name: "ai", labelEn: "AI & ML", labelFr: "IA & ML", labelAr: "ذكاء اصطناعي", color: "#8b5cf6", icon: "brain" },
        { name: "mini-projet", labelEn: "Mini-Project", labelFr: "Mini-Projet", labelAr: "مشروع صغير", color: "#10b981", icon: "rocket" },
        { name: "competition", labelEn: "Competition", labelFr: "Compétition", labelAr: "مسابقة", color: "#f97316", icon: "trophy" },
        { name: "raspberry-pi", labelEn: "Raspberry Pi", labelFr: "Raspberry Pi", labelAr: "راسبيري باي", color: "#ec4899", icon: "server" },
        { name: "robotics", labelEn: "Robotics", labelFr: "Robotique", labelAr: "الروبوتيات", color: "#f59e0b", icon: "bot" },
        { name: "iot", labelEn: "IoT", labelFr: "IdO", labelAr: "إنترنت الأشياء", color: "#06b6d4", icon: "wifi" },
        { name: "python", labelEn: "Python", labelFr: "Python", labelAr: "بايثون", color: "#3b82f6", icon: "code" },
        { name: "pcb-design", labelEn: "PCB Design", labelFr: "Conception PCB", labelAr: "تصميم الدوائر", color: "#14b8a6", icon: "circuit-board" },
        { name: "3d-printing", labelEn: "3D Printing", labelFr: "Impression 3D", labelAr: "طباعة ثلاثية", color: "#a855f7", icon: "printer" },
    ];

    const tags: Record<string, { id: string }> = {};
    for (const t of tagData) {
        tags[t.name] = await prisma.tag.upsert({
            where: { name: t.name },
            update: {},
            create: t,
        });
    }
    console.log("  ✓ Tags (10)");

    // ═══════════════════════════════════════════════
    // 4) EVENTS (6 events covering all types)
    // ═══════════════════════════════════════════════
    const event1 = await prisma.event.upsert({
        where: { slug: "arduino-training-2026" },
        update: {},
        create: {
            title: "Arduino Fundamentals Training",
            slug: "arduino-training-2026",
            description:
                "Hands-on training covering Arduino basics, sensors, actuators, and serial communication. Perfect for beginners entering the embedded world.",
            content: `## Day 1: Getting Started

### Setting Up Your Environment
- Install Arduino IDE 2.x
- Connect your Arduino Uno
- Upload your first sketch (Blink)

### Digital I/O
- Understanding pins: INPUT vs OUTPUT
- LED circuits with resistors
- Push buttons and debouncing

### Exercise: Traffic Light
Build a traffic light system with 3 LEDs that cycles automatically.

## Day 2: Sensors & Communication

### Analog Sensors
- Reading analog values with \`analogRead()\`
- Potentiometers, LDRs, and temperature sensors
- Mapping values with \`map()\`

### Serial Communication
- \`Serial.begin()\` and \`Serial.println()\`
- Debugging with Serial Monitor
- Sending commands from PC to Arduino

### LCD Displays
- Wiring a 16×2 LCD with I2C
- Displaying sensor data in real-time

### Final Mini-Project
Build a temperature monitor that displays readings on LCD and sends data via serial.

\`\`\`cpp
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  Serial.begin(9600);
}

void loop() {
  int raw = analogRead(A0);
  float tempC = (raw * 5.0 / 1024.0 - 0.5) * 100;
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(tempC, 1);
  lcd.print(" C  ");
  Serial.println(tempC);
  delay(1000);
}
\`\`\``,
            type: "training",
            status: "published",
            location: "ENSA Agadir — Salle TP Informatique",
            startDate: new Date("2026-03-15T09:00:00"),
            endDate: new Date("2026-03-16T17:00:00"),
            capacity: 30,
            published: true,
        },
    });

    const event2 = await prisma.event.upsert({
        where: { slug: "ai-conference-2026" },
        update: {},
        create: {
            title: "AI & Robotics Conference 2026",
            slug: "ai-conference-2026",
            description:
                "Annual conference featuring industry speakers on artificial intelligence, computer vision, and autonomous systems. Open to students and professionals.",
            content: `## Morning Session — 08:30 to 12:30

### Opening Keynote: The Future of AI in Morocco
Dr. Amina El Fassi — INPT Rabat
An overview of Morocco's AI strategy and the role universities play in developing AI talent.

### Computer Vision in Production
Prof. Youssef Berrada — UM6P
From academic research to deployed systems: lessons learned building CV pipelines at scale.

### Coffee Break & Networking
10:30 – 11:00

### Panel Discussion: Ethics in AI
Moderated by Dr. Laila Bennis with industry panelists.

## Afternoon Session — 14:00 to 18:00

### Reinforcement Learning Workshop
Karim Tazi — ML Engineer, OCP Group
Hands-on workshop using OpenAI Gym and stable-baselines3.

### Natural Language Processing for Arabic
Dr. Hassan Ouazzani — EMI Rabat
Challenges and breakthroughs in Arabic NLP, with live demos.

### Closing Ceremony & Awards
Best poster presentation and best demo awards.`,
            type: "conference",
            status: "published",
            location: "ENSA Agadir — Amphithéâtre A",
            startDate: new Date("2026-04-20T08:30:00"),
            endDate: new Date("2026-04-20T18:00:00"),
            capacity: 200,
            published: true,
        },
    });

    const event3 = await prisma.event.upsert({
        where: { slug: "robotics-competition-2026" },
        update: {},
        create: {
            title: "CRRT Robotics Challenge 2026",
            slug: "robotics-competition-2026",
            description:
                "Annual inter-university robotics competition. Build an autonomous robot that can navigate an obstacle course, collect objects, and return to base.",
            content: `## Competition Rules

### General
1. Teams of 2–4 members (at least 1 from ENSA Agadir)
2. Robot must be fully autonomous — no remote control
3. Maximum dimensions: 30×30×30 cm
4. Weight limit: 2 kg
5. Time limit: 3 minutes per run

### Arena
- 2×3 meter flat surface with black track lines
- 4 colored objects placed randomly
- Start zone and return zone marked with tape

### Scoring
| Action | Points |
|--------|--------|
| Complete lap | 20 |
| Object collected | 10 |
| Return to base | 15 |
| Time bonus (<90s) | 5 |

### Judging Criteria
- Reliability and repeatability
- Code quality and documentation
- Design innovation
- Presentation (5-minute pitch after run)

## Schedule

### Day 1 — Qualification Rounds
09:00–12:00 — Technical inspection
14:00–18:00 — Qualification runs (each team gets 3 attempts)

### Day 2 — Finals
09:00–12:00 — Semi-finals (top 8 teams)
14:00–16:00 — Grand finale (top 4)
16:30–17:30 — Awards ceremony + closing`,
            type: "competition",
            status: "published",
            location: "ENSA Agadir — Hall Principal",
            startDate: new Date("2026-05-10T09:00:00"),
            endDate: new Date("2026-05-11T17:00:00"),
            capacity: 50,
            published: true,
        },
    });

    const event4 = await prisma.event.upsert({
        where: { slug: "raspberry-pi-workshop-2026" },
        update: {},
        create: {
            title: "Raspberry Pi & Linux Workshop",
            slug: "raspberry-pi-workshop-2026",
            description:
                "Introduction to single-board computers. Learn Linux basics, GPIO programming, and build a smart home sensor hub.",
            content: `## Workshop Outline

### Part 1: Linux Fundamentals
- Flashing Raspberry Pi OS
- Terminal navigation and package management
- SSH and remote access

### Part 2: GPIO Programming
- Controlling LEDs and reading sensors with Python
- Using RPi.GPIO and gpiozero libraries
- I2C and SPI communication

### Part 3: Build a Sensor Hub
- Connect DHT22 (temp/humidity), BMP280 (pressure), and PIR (motion)
- Log data to a SQLite database
- Serve a real-time dashboard with Flask`,
            type: "workshop",
            status: "published",
            location: "ENSA Agadir — Salle TP Électronique",
            startDate: new Date("2026-06-05T09:00:00"),
            endDate: new Date("2026-06-05T17:00:00"),
            capacity: 25,
            published: true,
        },
    });

    const event5 = await prisma.event.upsert({
        where: { slug: "pcb-design-training-2026" },
        update: {},
        create: {
            title: "PCB Design with KiCad",
            slug: "pcb-design-training-2026",
            description:
                "Learn to design professional PCBs using KiCad 8. From schematic capture to manufacturing-ready Gerber files.",
            content: `## Topics Covered

### Schematic Capture
- Component symbols and libraries
- Wiring and net labels
- Electrical rules check (ERC)

### PCB Layout
- Footprint assignment
- Trace routing (manual and auto)
- Design rules check (DRC)
- Ground planes and via placement

### Manufacturing
- Generating Gerber files
- BOM and pick-and-place files
- Choosing a PCB fab (JLCPCB, PCBWay)`,
            type: "training",
            status: "published",
            location: "ENSA Agadir — Salle TP Informatique",
            startDate: new Date("2026-07-12T09:00:00"),
            endDate: new Date("2026-07-12T17:00:00"),
            capacity: 20,
            published: true,
        },
    });

    const event6 = await prisma.event.upsert({
        where: { slug: "iot-hackathon-2026" },
        update: {},
        create: {
            title: "IoT Innovation Hackathon",
            slug: "iot-hackathon-2026",
            description:
                "48-hour hackathon building IoT solutions for smart campus challenges. Prizes worth 10,000 MAD.",
            content: `## Themes

### Smart Campus
- Classroom occupancy monitoring
- Energy consumption optimization
- Smart parking system

### Agriculture Tech
- Soil moisture monitoring at scale
- Automated irrigation
- Crop disease detection with edge AI

## Schedule

### Friday Evening — Kickoff
18:00 — Registration
19:00 — Theme reveal and team formation
20:00 — Hacking begins

### Saturday — Build Day
08:00 — Breakfast & check-in
12:00 — Lunch + mentor sessions
18:00 — Progress pitches (2 min each)

### Sunday — Demo Day
09:00 — Final polish
12:00 — Demo presentations (5 min + 3 min Q&A)
14:00 — Judging & awards ceremony`,
            type: "competition",
            status: "published",
            location: "ENSA Agadir — Incubateur",
            startDate: new Date("2026-11-15T18:00:00"),
            endDate: new Date("2026-11-17T15:00:00"),
            capacity: 100,
            published: true,
        },
    });

    console.log("  ✓ Events (6)");

    // ═══════════════════════════════════════════════
    // 5) EVENT SPEAKERS
    // ═══════════════════════════════════════════════
    const speakerData = [
        { eventId: event2.id, name: "Dr. Amina El Fassi", role: "Keynote Speaker", bio: "AI researcher and associate professor at INPT Rabat. Led Morocco's first autonomous vehicle pilot.", order: 0 },
        { eventId: event2.id, name: "Prof. Youssef Berrada", role: "Speaker", bio: "Computer vision lab lead at UM6P. Published 30+ papers in top-tier CV venues.", order: 1 },
        { eventId: event2.id, name: "Karim Tazi", role: "Workshop Lead", bio: "ML engineer at OCP Group. Builds production RL systems for industrial automation.", order: 2 },
        { eventId: event2.id, name: "Dr. Laila Bennis", role: "Panel Moderator", bio: "Ethics in AI researcher. Author of 'Responsible AI in North Africa'.", order: 3 },
        { eventId: event2.id, name: "Dr. Hassan Ouazzani", role: "Speaker", bio: "NLP researcher at EMI Rabat. Creator of the ArabicBERT open-source model.", order: 4 },
        { eventId: event3.id, name: "Prof. Mohammed Alami", role: "Judge", bio: "Robotics professor at ENSA Agadir. Founded the embedded systems lab.", order: 0 },
        { eventId: event3.id, name: "Eng. Nadia Hakim", role: "Judge", bio: "Senior engineer at Royal Air Maroc. Expertise in autonomous systems.", order: 1 },
    ];
    for (const s of speakerData) {
        await prisma.eventSpeaker.create({ data: s });
    }
    console.log("  ✓ Speakers (7)");

    // ═══════════════════════════════════════════════
    // 6) PROJECTS (6 projects)
    // ═══════════════════════════════════════════════
    const project1 = await prisma.project.upsert({
        where: { slug: "line-follower-v3" },
        update: {},
        create: {
            title: "Line Follower Robot v3",
            slug: "line-follower-v3",
            description:
                "Third iteration of our autonomous line-following robot with PID control and custom IR sensor array.",
            content: `## Overview

Fast, reliable line-following robot using 8 IR sensors and a PID control algorithm. Won 2nd place at the 2025 National Robotics Competition.

## Technical Details

- **MCU**: Arduino Mega 2560
- **Sensors**: Custom 8-channel QRE1113 IR reflectance array on a dedicated PCB
- **Motors**: Pololu micro metal gearmotors with encoders (50:1 ratio)
- **Driver**: DRV8833 dual H-bridge
- **Power**: 2S LiPo 7.4V 800mAh
- **Frame**: Custom 3D-printed chassis (PLA+)

## PID Implementation

\`\`\`cpp
float Kp = 25.0, Ki = 0.01, Kd = 15.0;
float error, lastError = 0, integral = 0;

void loop() {
  int position = readSensorArray(); // 0-7000
  error = position - 3500;
  integral += error;
  float derivative = error - lastError;
  float correction = Kp * error + Ki * integral + Kd * derivative;

  int leftSpeed  = BASE_SPEED + correction;
  int rightSpeed = BASE_SPEED - correction;
  setMotors(constrain(leftSpeed, 0, 255), constrain(rightSpeed, 0, 255));
  lastError = error;
}
\`\`\`

## Results

| Metric | v2 | v3 |
|--------|----|----|
| Lap time (avg) | 38s | 24s |
| Track completion | 85% | 98% |
| Max speed | 0.6 m/s | 1.1 m/s |`,
            status: "completed",
            stackTags: JSON.stringify(["Arduino", "C++", "PID Control", "PCB Design", "3D Printing"]),
            year: 2025,
            repoUrl: "https://github.com/crrt-ensa/line-follower-v3",
            published: true,
        },
    });

    const project2 = await prisma.project.upsert({
        where: { slug: "smart-greenhouse" },
        update: {},
        create: {
            title: "Smart Greenhouse Monitor",
            slug: "smart-greenhouse",
            description:
                "IoT-based greenhouse monitoring system with automated irrigation and climate control. Deployed at ENSA Agadir's botany department.",
            content: `## Overview

Complete IoT solution for greenhouse monitoring using ESP32 and environmental sensors. The system monitors temperature, humidity, soil moisture, and light intensity, then triggers automated irrigation and ventilation.

## Architecture

\`\`\`
[Sensors] → [ESP32] → [MQTT Broker] → [Node.js API] → [React Dashboard]
                                         ↓
                                    [InfluxDB]
\`\`\`

## Hardware

| Component | Model | Qty |
|-----------|-------|-----|
| MCU | ESP32-WROOM-32 | 3 |
| Temp/Humidity | DHT22 | 6 |
| Soil Moisture | Capacitive v1.2 | 4 |
| Light | BH1750 | 2 |
| Relay | 4-channel 5V | 2 |
| Pump | 12V peristaltic | 2 |
| Fan | 12V 80mm | 2 |

## Features

- Real-time monitoring dashboard with historical charts
- Automated irrigation when soil moisture drops below threshold
- Ventilation control based on temperature and humidity
- Telegram bot alerts for critical conditions
- Data export to CSV for analysis`,
            status: "ongoing",
            repoUrl: "https://github.com/crrt-ensa/smart-greenhouse",
            demoUrl: "https://greenhouse.crrt.ma",
            stackTags: JSON.stringify(["ESP32", "MQTT", "React", "Node.js", "InfluxDB", "Telegram API"]),
            year: 2026,
            published: true,
        },
    });

    const project3 = await prisma.project.upsert({
        where: { slug: "autonomous-drone" },
        update: {},
        create: {
            title: "Autonomous Delivery Drone",
            slug: "autonomous-drone",
            description:
                "Research project exploring autonomous navigation using computer vision and GPS for campus delivery scenarios.",
            content: `## Vision

Design and build a delivery drone prototype capable of autonomous navigation between predefined waypoints on the ENSA Agadir campus.

## Current Status

- ✅ Frame assembly and motor testing
- ✅ GPS waypoint navigation (tested in simulation)
- ✅ ArUco marker landing pad detection
- 🔄 Obstacle avoidance with depth camera
- 🔄 Package drop mechanism
- ⬜ Full autonomous flight test

## Technical Stack

- **Flight Controller**: Pixhawk 4 (PX4 firmware)
- **Companion Computer**: Raspberry Pi 4 (8GB)
- **Camera**: Intel RealSense D435i
- **Framework**: ROS 2 Humble + MAVROS
- **CV Pipeline**: OpenCV + TensorFlow Lite for object detection

## Safety Protocols

1. Geofence boundaries set to campus area
2. Return-to-launch on signal loss
3. Maximum altitude: 30m
4. Mandatory manual override switch`,
            status: "ongoing",
            repoUrl: "https://github.com/crrt-ensa/autonomous-drone",
            demoUrl: "https://drone-demo.crrt.ma",
            stackTags: JSON.stringify(["Python", "OpenCV", "ROS 2", "Pixhawk", "TensorFlow Lite", "Raspberry Pi"]),
            year: 2026,
            published: true,
        },
    });

    const project4 = await prisma.project.upsert({
        where: { slug: "robotic-arm-v2" },
        update: {},
        create: {
            title: "6-DOF Robotic Arm",
            slug: "robotic-arm-v2",
            description:
                "Desktop robotic arm with 6 degrees of freedom, inverse kinematics, and a teach-and-playback system.",
            content: `## Overview

A 6-DOF robotic arm built with 3D-printed parts and MG996R servos. Features inverse kinematics, a teach-and-playback mode, and a web-based control interface.

## Specifications

| Parameter | Value |
|-----------|-------|
| DOF | 6 |
| Reach | 45 cm |
| Payload | 200g |
| Servos | MG996R × 6 |
| Controller | Arduino Mega + Servo Shield |
| Interface | Web UI (React + WebSocket) |

## Features

- Forward and inverse kinematics
- Teach mode: manually position arm, record waypoints
- Playback mode: replay recorded sequences
- Web interface with 3D visualization
- G-code parsing for simple CNC tasks`,
            status: "completed",
            repoUrl: "https://github.com/crrt-ensa/robotic-arm",
            stackTags: JSON.stringify(["Arduino", "React", "WebSocket", "3D Printing", "Kinematics"]),
            year: 2025,
            published: true,
        },
    });

    const project5 = await prisma.project.upsert({
        where: { slug: "smart-parking" },
        update: {},
        create: {
            title: "Smart Campus Parking",
            slug: "smart-parking",
            description:
                "IoT parking system using ultrasonic sensors and ESP32 to detect available spots and display them on a web dashboard.",
            content: `## Problem

ENSA Agadir's parking lot has 80 spaces but no way to know availability. Students waste 15+ minutes circling.

## Solution

Ultrasonic sensors at each bay, connected to ESP32 nodes via I2C, reporting to a central dashboard.

## Tech Stack

- ESP32 nodes (1 per 4 bays)
- HC-SR04 ultrasonic sensors
- MQTT for communication
- Next.js dashboard with real-time updates
- LED indicators at parking entrance`,
            status: "ongoing",
            repoUrl: "https://github.com/crrt-ensa/smart-parking",
            stackTags: JSON.stringify(["ESP32", "MQTT", "Next.js", "Ultrasonic", "IoT"]),
            year: 2026,
            published: true,
        },
    });

    const project6 = await prisma.project.upsert({
        where: { slug: "maze-solver-robot" },
        update: {},
        create: {
            title: "Maze Solver Robot",
            slug: "maze-solver-robot",
            description:
                "Autonomous robot that maps and solves unknown mazes using wall-following and flood-fill algorithms.",
            content: `## Algorithms

### Wall Following (right-hand rule)
Simple strategy for simply-connected mazes. The robot always keeps the right wall in contact.

### Flood Fill
Optimal path finding: the robot maps the maze on first run, then computes the shortest path using flood-fill and races through on second run.

## Hardware

- Arduino Nano Every
- 3× VL53L0X ToF distance sensors (front, left, right)
- N20 micro gear motors with encoders
- Custom PCB with DRV8833 driver
- 3D-printed chassis

## Competition Results

- 1st place: ENSA Agadir Internal (2025)
- 3rd place: Morocco National Micromouse (2025)`,
            status: "completed",
            repoUrl: "https://github.com/crrt-ensa/maze-solver",
            stackTags: JSON.stringify(["Arduino", "C++", "Flood Fill", "PCB Design", "ToF Sensors"]),
            year: 2025,
            published: true,
        },
    });

    console.log("  ✓ Projects (6)");

    // ═══════════════════════════════════════════════
    // 7) POSTS (6 blog articles)
    // ═══════════════════════════════════════════════
    await prisma.post.upsert({
        where: { slug: "getting-started-with-arduino" },
        update: {},
        create: {
            title: "Getting Started with Arduino: A Beginner's Guide",
            slug: "getting-started-with-arduino",
            excerpt: "Everything you need to know to start your Arduino journey — from unboxing to your first sensor project.",
            content: `## What is Arduino?

Arduino is an open-source electronics platform based on easy-to-use hardware and software. It's the gateway into embedded systems for millions of makers worldwide.

## Your First Sketch

\`\`\`cpp
// Blink — the "Hello, World!" of electronics
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
\`\`\`

## What You'll Need

| Item | Est. Cost |
|------|-----------|
| Arduino Uno R3 | 60 MAD |
| USB cable | 15 MAD |
| Breadboard | 20 MAD |
| Jumper wires | 15 MAD |
| LED kit | 10 MAD |
| Resistor kit | 10 MAD |

## Next Steps

1. Build a traffic light with 3 LEDs
2. Read a button input
3. Use a potentiometer to control LED brightness
4. Connect a temperature sensor (LM35 or TMP36)

> **Tip**: Join our Arduino training sessions every March. Check the Events page for the next one!`,
            published: true,
        },
    });

    await prisma.post.upsert({
        where: { slug: "pid-control-explained" },
        update: {},
        create: {
            title: "PID Control for Robotics: A Practical Guide",
            slug: "pid-control-explained",
            excerpt: "Understanding PID control loops for your robot projects. From theory to tuned line-follower.",
            content: `## What is PID?

PID (Proportional-Integral-Derivative) is a control loop mechanism that continuously calculates an error value and applies a correction to minimize it.

## The Three Terms

### Proportional (P)
- Reacts to the **current** error
- Larger error → stronger correction
- Too high → oscillation

### Integral (I)
- Reacts to the **accumulated** error over time
- Eliminates steady-state error
- Too high → overshoot and instability

### Derivative (D)
- Reacts to the **rate of change** of error
- Dampens oscillation
- Too high → noise sensitivity

## Tuning Method (Ziegler-Nichols)

1. Set Ki = 0, Kd = 0
2. Increase Kp until the system oscillates steadily
3. Note this critical Kp and the oscillation period Tu
4. Apply: Kp = 0.6×Ku, Ki = 2×Kp/Tu, Kd = Kp×Tu/8

## Code Example

\`\`\`cpp
float Kp = 25.0, Ki = 0.01, Kd = 15.0;
float error, lastError = 0, integral = 0;

void loop() {
  int position = readSensors();
  error = position - SETPOINT;
  integral += error;
  integral = constrain(integral, -1000, 1000); // anti-windup
  float derivative = error - lastError;
  float output = Kp * error + Ki * integral + Kd * derivative;
  applyMotors(output);
  lastError = error;
}
\`\`\``,
            published: true,
        },
    });

    await prisma.post.upsert({
        where: { slug: "computer-vision-basics" },
        update: {},
        create: {
            title: "Computer Vision with OpenCV and Python",
            slug: "computer-vision-basics",
            excerpt: "Fundamentals of computer vision: image processing, edge detection, and object recognition using OpenCV.",
            content: `## Getting Started

\`\`\`bash
pip install opencv-python numpy
\`\`\`

## Reading and Displaying Images

\`\`\`python
import cv2
import numpy as np

img = cv2.imread('robot.jpg')
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Edge detection
edges = cv2.Canny(gray, 50, 150)

cv2.imshow('Edges', edges)
cv2.waitKey(0)
\`\`\`

## Color Detection for Robot Navigation

\`\`\`python
hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

# Detect orange objects (like our line follower track)
lower_orange = np.array([10, 100, 100])
upper_orange = np.array([25, 255, 255])
mask = cv2.inRange(hsv, lower_orange, upper_orange)

contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
for c in contours:
    if cv2.contourArea(c) > 500:
        x, y, w, h = cv2.boundingRect(c)
        cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
\`\`\`

## Applications at CRRT

- Line detection for autonomous navigation
- ArUco marker detection for drone landing
- Object sorting for competition robots`,
            published: true,
        },
    });

    await prisma.post.upsert({
        where: { slug: "esp32-mqtt-tutorial" },
        update: {},
        create: {
            title: "ESP32 + MQTT: Building IoT Systems",
            slug: "esp32-mqtt-tutorial",
            excerpt: "How to connect ESP32 to an MQTT broker and build real-time IoT dashboards.",
            content: `## Why MQTT?

MQTT is a lightweight publish/subscribe messaging protocol perfect for IoT. It's used in our Smart Greenhouse and Smart Parking projects.

## Setting Up

\`\`\`cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "CRRT-Lab";
const char* password = "robotics2026";
const char* mqtt_server = "mqtt.crrt.ma";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) delay(500);

  client.setServer(mqtt_server, 1883);
  client.connect("esp32-sensor-01");
}

void loop() {
  float temp = readTemperature();
  char payload[32];
  snprintf(payload, sizeof(payload), "%.1f", temp);
  client.publish("greenhouse/zone1/temp", payload);
  delay(5000);
}
\`\`\`

## Architecture Pattern

\`\`\`
ESP32 → MQTT Broker → Node.js Backend → InfluxDB → Grafana
\`\`\``,
            published: true,
        },
    });

    await prisma.post.upsert({
        where: { slug: "3d-printing-for-robotics" },
        update: {},
        create: {
            title: "3D Printing for Robotics: Tips and Best Practices",
            slug: "3d-printing-for-robotics",
            excerpt: "Designing and printing custom parts for your robot projects. Material selection, tolerances, and assembly tips.",
            content: `## Why 3D Print?

Custom brackets, chassis, gears, and enclosures — 3D printing lets you iterate designs in hours, not weeks.

## Material Selection

| Material | Strength | Flexibility | Use Case |
|----------|----------|-------------|----------|
| PLA | Medium | Low | Prototypes, enclosures |
| PLA+ | High | Low | Structural parts |
| PETG | High | Medium | Outdoor, functional parts |
| TPU | Low | High | Wheels, bumpers, grippers |

## Design Tips for Robotics

1. **Tolerances**: Add 0.2mm clearance for press-fit holes
2. **Wall thickness**: Minimum 1.2mm (3 perimeters)
3. **Infill**: 20% for prototypes, 40-60% for structural
4. **Orientation**: Print motor mounts upright for layer strength
5. **Heat inserts**: Use M3 brass inserts for reusable threaded connections

## CRRT Lab Equipment

- **Printers**: Bambu Lab P1P × 2, Ender 3 S1 × 3
- **Materials**: PLA, PLA+, PETG, TPU available in the lab
- **Software**: Fusion 360 (free for students), BambuStudio`,
            published: true,
        },
    });

    await prisma.post.upsert({
        where: { slug: "ros2-getting-started" },
        update: {},
        create: {
            title: "Getting Started with ROS 2 for Mobile Robots",
            slug: "ros2-getting-started",
            excerpt: "Introduction to the Robot Operating System 2: nodes, topics, and your first robot simulation.",
            content: `## What is ROS 2?

ROS 2 (Robot Operating System 2) is not an actual OS — it's a middleware framework that provides tools, libraries, and conventions for building robot applications.

## Key Concepts

- **Nodes**: Processes that perform computation
- **Topics**: Named buses for message passing
- **Services**: Request/response communication
- **Actions**: Long-running tasks with feedback

## Installation (Ubuntu 22.04)

\`\`\`bash
sudo apt install ros-humble-desktop
source /opt/ros/humble/setup.bash
\`\`\`

## Your First Publisher

\`\`\`python
import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class HelloPublisher(Node):
    def __init__(self):
        super().__init__('hello_publisher')
        self.pub = self.create_publisher(String, 'hello', 10)
        self.timer = self.create_timer(1.0, self.publish)

    def publish(self):
        msg = String()
        msg.data = 'Hello from CRRT!'
        self.pub.publish(msg)

rclpy.init()
rclpy.spin(HelloPublisher())
\`\`\`

## Used in Our Projects

- Autonomous Delivery Drone (MAVROS bridge)
- Future: mobile robot navigation with Nav2`,
            published: true,
        },
    });

    console.log("  ✓ Posts (6)");

    // ═══════════════════════════════════════════════
    // 8) CONTENT TAGS (cross-references)
    // ═══════════════════════════════════════════════
    const contentTags = [
        { tagId: tags["arduino"].id, eventId: event1.id },
        { tagId: tags["ai"].id, eventId: event2.id },
        { tagId: tags["competition"].id, eventId: event3.id },
        { tagId: tags["robotics"].id, eventId: event3.id },
        { tagId: tags["raspberry-pi"].id, eventId: event4.id },
        { tagId: tags["iot"].id, eventId: event4.id },
        { tagId: tags["pcb-design"].id, eventId: event5.id },
        { tagId: tags["iot"].id, eventId: event6.id },
        { tagId: tags["arduino"].id, projectId: project1.id },
        { tagId: tags["pcb-design"].id, projectId: project1.id },
        { tagId: tags["3d-printing"].id, projectId: project1.id },
        { tagId: tags["iot"].id, projectId: project2.id },
        { tagId: tags["ai"].id, projectId: project3.id },
        { tagId: tags["robotics"].id, projectId: project3.id },
        { tagId: tags["python"].id, projectId: project3.id },
        { tagId: tags["arduino"].id, projectId: project4.id },
        { tagId: tags["3d-printing"].id, projectId: project4.id },
        { tagId: tags["iot"].id, projectId: project5.id },
        { tagId: tags["arduino"].id, projectId: project6.id },
        { tagId: tags["pcb-design"].id, projectId: project6.id },
    ];
    for (const ct of contentTags) {
        await prisma.contentTag.create({ data: ct });
    }
    console.log("  ✓ ContentTags (20)");

    // ═══════════════════════════════════════════════
    // 9) TIMELINE MILESTONES
    // ═══════════════════════════════════════════════
    const milestones = [
        { year: 2008, title: "CRRT Founded", description: "Club Robotique & Recherche Technologique established at ENSA Agadir by a group of 12 students passionate about electronics and robotics.", order: 0 },
        { year: 2010, title: "First Competition Win", description: "CRRT team wins the regional robotics competition in Casablanca, putting the club on the national map.", order: 1 },
        { year: 2012, title: "Electronics Lab Opened", description: "ENSA Agadir grants CRRT a dedicated lab space with oscilloscopes, soldering stations, and 3D printers.", order: 2 },
        { year: 2014, title: "AI Research Group", description: "Dedicated AI and machine learning subgroup created, beginning work on computer vision projects.", order: 3 },
        { year: 2016, title: "National Recognition", description: "CRRT receives the 'Best Engineering Club' award from the Moroccan Federation of Engineering Schools.", order: 4 },
        { year: 2018, title: "10th Anniversary Conference", description: "Celebrated with a national robotics conference hosting 300+ attendees and 12 university teams.", order: 5 },
        { year: 2020, title: "Online Pivot", description: "Launched virtual workshops and online competitions during COVID-19, reaching 500+ participants nationwide.", order: 6 },
        { year: 2022, title: "IoT Initiative", description: "Smart Campus IoT initiative launched with ESP32 sensor networks monitoring campus energy and parking.", order: 7 },
        { year: 2024, title: "International Participation", description: "CRRT team participates in the IEEE International Robotics Competition in Istanbul.", order: 8 },
        { year: 2025, title: "Drone Research Program", description: "Autonomous drone delivery research program started in partnership with UM6P and OCP Group.", order: 9 },
    ];
    for (const m of milestones) {
        await prisma.timelineMilestone.create({ data: m });
    }
    console.log("  ✓ Milestones (10)");

    // ═══════════════════════════════════════════════
    // 10) TEAM MEMBERS (current + alumni)
    // ═══════════════════════════════════════════════
    const members = [
        // Current Bureau 2025-2026
        { name: "Yassine El Amrani", role: "President", linkedIn: "https://linkedin.com/in/yassine-elamrani", order: 0 },
        { name: "Fatima Zahra Ouali", role: "Vice President", linkedIn: "https://linkedin.com/in/fz-ouali", order: 1 },
        { name: "Ahmed Benali", role: "Technical Lead", linkedIn: "https://linkedin.com/in/ahmed-benali", order: 2 },
        { name: "Sara Idrissi", role: "Communications Manager", linkedIn: "https://linkedin.com/in/sara-idrissi", order: 3 },
        { name: "Omar Tazi", role: "Treasurer", linkedIn: "https://linkedin.com/in/omar-tazi", order: 4 },
        { name: "Khadija Rachidi", role: "Events Coordinator", linkedIn: "https://linkedin.com/in/khadija-rachidi", order: 5 },
        { name: "Mehdi Lahlou", role: "AI Team Lead", linkedIn: "https://linkedin.com/in/mehdi-lahlou", order: 6 },
        { name: "Imane Berrada", role: "IoT Team Lead", linkedIn: "https://linkedin.com/in/imane-berrada", order: 7 },
        // Alumni
        { name: "Amine Kettani", role: "Founder", isAlumni: true, linkedIn: "https://linkedin.com/in/amine-kettani", order: 100 },
        { name: "Nadia Fassi Fehri", role: "President 2018-2020", isAlumni: true, linkedIn: "https://linkedin.com/in/nadia-ff", order: 101 },
        { name: "Rachid Mouline", role: "Technical Lead 2020-2022", isAlumni: true, linkedIn: "https://linkedin.com/in/rachid-mouline", order: 102 },
        { name: "Salma Alaoui", role: "President 2022-2024", isAlumni: true, linkedIn: "https://linkedin.com/in/salma-alaoui", order: 103 },
    ];
    for (const m of members) {
        await prisma.teamMember.create({ data: m });
    }
    console.log("  ✓ Team Members (12 — 8 current, 4 alumni)");

    // ═══════════════════════════════════════════════
    // 11) PARTNERS
    // ═══════════════════════════════════════════════
    const partners = [
        { name: "ENSA Agadir", logoUrl: "/partners/ensa.svg", website: "https://www.ensa-agadir.ac.ma", order: 0 },
        { name: "OCP Group", logoUrl: "/partners/ocp.svg", website: "https://www.ocpgroup.ma", order: 1 },
        { name: "Arduino", logoUrl: "/partners/arduino.svg", website: "https://www.arduino.cc", order: 2 },
        { name: "UM6P", logoUrl: "/partners/um6p.svg", website: "https://www.um6p.ma", order: 3 },
        { name: "Maroc Telecom", logoUrl: "/partners/iam.svg", website: "https://www.iam.ma", order: 4 },
        { name: "JLCPCB", logoUrl: "/partners/jlcpcb.svg", website: "https://jlcpcb.com", order: 5 },
    ];
    for (const p of partners) {
        await prisma.partner.create({ data: p });
    }
    console.log("  ✓ Partners (6)");

    // ═══════════════════════════════════════════════
    // 12) NAVIGATION
    // ═══════════════════════════════════════════════
    const navItems = [
        // Header
        { label: "Home", href: "/", order: 0, section: "header", visible: true },
        { label: "Events", href: "/events", order: 1, section: "header", visible: true },
        { label: "Projects", href: "/projects", order: 2, section: "header", visible: true },
        { label: "Blog", href: "/blog", order: 3, section: "header", visible: true },
        { label: "About", href: "/about", order: 4, section: "header", visible: true },
        // Footer
        { label: "Our Mission", href: "/about", order: 0, section: "footer", visible: true },
        { label: "Team", href: "/about#team", order: 1, section: "footer", visible: true },
        { label: "Timeline", href: "/about#timeline", order: 2, section: "footer", visible: true },
        { label: "Contact Us", href: "mailto:crrt@ensa-agadir.ac.ma", order: 3, section: "footer", visible: true },
    ];
    for (const n of navItems) {
        await prisma.navItem.create({ data: n });
    }
    console.log("  ✓ Navigation (9 items)");

    // ═══════════════════════════════════════════════
    // 13) FORMS (2 published with fields)
    // ═══════════════════════════════════════════════
    const trainingForm = await prisma.form.create({
        data: {
            title: "Arduino Training Registration",
            slug: "arduino-training-registration",
            description: "Register for our Arduino Fundamentals Training.",
            status: "published",
            version: 1,
            template: "training",
            fields: {
                create: [
                    { label: "Full Name", type: "text", required: true, placeholder: "Your full name", order: 0 },
                    { label: "Email", type: "text", required: true, placeholder: "your.email@ensa-agadir.ac.ma", order: 1 },
                    { label: "Student ID (CNE)", type: "text", required: true, placeholder: "R130...", order: 2 },
                    { label: "Year of Study", type: "select", required: true, options: "1ère année,2ème année,3ème année,4ème année,5ème année", order: 3 },
                    { label: "Filière", type: "select", required: true, options: "Génie Informatique,Génie Industriel,Génie Électrique,Génie Civil,Autre", order: 4 },
                    { label: "Prior Arduino Experience", type: "select", required: false, options: "None,Beginner,Intermediate,Advanced", order: 5 },
                    { label: "Do you have your own Arduino board?", type: "checkbox", required: false, placeholder: "Yes, I have an Arduino board", order: 6 },
                    { label: "Anything else we should know?", type: "textarea", required: false, placeholder: "Special needs, questions, etc.", order: 7 },
                ],
            },
        },
    });

    const competitionForm = await prisma.form.create({
        data: {
            title: "Robotics Competition Registration",
            slug: "robotics-competition-2026",
            description: "Register your team for the CRRT Robotics Challenge 2026.",
            status: "published",
            version: 1,
            template: "competition",
            fields: {
                create: [
                    { label: "Team Name", type: "text", required: true, placeholder: "Your team name", order: 0 },
                    { label: "Captain Name", type: "text", required: true, placeholder: "Team captain's full name", order: 1 },
                    { label: "Captain Email", type: "text", required: true, placeholder: "captain@ensa-agadir.ac.ma", order: 2 },
                    { label: "Captain Phone", type: "text", required: true, placeholder: "+212 6XX XXX XXX", order: 3 },
                    { label: "Number of Team Members", type: "select", required: true, options: "2,3,4", order: 4 },
                    { label: "Team Members (names and roles)", type: "textarea", required: true, placeholder: "List all members:\n- Name 1 — Role\n- Name 2 — Role", order: 5 },
                    { label: "University / School", type: "text", required: true, placeholder: "e.g. ENSA Agadir", order: 6 },
                    { label: "Robot Name", type: "text", required: false, placeholder: "Your robot's name (if decided)", order: 7 },
                    { label: "Brief Robot Description", type: "textarea", required: true, placeholder: "Describe your robot concept in 2-3 sentences", order: 8 },
                    { label: "Have you participated in CRRT competitions before?", type: "checkbox", required: false, placeholder: "Yes", order: 9 },
                ],
            },
        },
    });

    console.log("  ✓ Forms (2 published)");

    // ═══════════════════════════════════════════════
    // 14) FORM SUBMISSIONS (sample data)
    // ═══════════════════════════════════════════════
    const submissions = [
        {
            formId: trainingForm.id,
            status: "new",
            data: JSON.stringify({
                "Full Name": "Hamza Ait Brahim",
                "Email": "hamza.aitbrahim@ensa-agadir.ac.ma",
                "Student ID (CNE)": "R130456789",
                "Year of Study": "2ème année",
                "Filière": "Génie Informatique",
                "Prior Arduino Experience": "Beginner",
                "Do you have your own Arduino board?": "true",
                "Anything else we should know?": "",
            }),
        },
        {
            formId: trainingForm.id,
            status: "accepted",
            data: JSON.stringify({
                "Full Name": "Zineb El Khatiri",
                "Email": "zineb.elkhatiri@ensa-agadir.ac.ma",
                "Student ID (CNE)": "R130567890",
                "Year of Study": "1ère année",
                "Filière": "Génie Électrique",
                "Prior Arduino Experience": "None",
                "Do you have your own Arduino board?": "false",
                "Anything else we should know?": "I'm very excited to learn electronics!",
            }),
        },
        {
            formId: trainingForm.id,
            status: "in_review",
            data: JSON.stringify({
                "Full Name": "Mohammed Ezzahiri",
                "Email": "m.ezzahiri@ensa-agadir.ac.ma",
                "Student ID (CNE)": "R130678901",
                "Year of Study": "3ème année",
                "Filière": "Génie Industriel",
                "Prior Arduino Experience": "Intermediate",
                "Do you have your own Arduino board?": "true",
                "Anything else we should know?": "I'd like to bring my own sensor kit.",
            }),
        },
        {
            formId: competitionForm.id,
            status: "new",
            data: JSON.stringify({
                "Team Name": "NeuroBots",
                "Captain Name": "Younes Moustaid",
                "Captain Email": "y.moustaid@ensa-agadir.ac.ma",
                "Captain Phone": "+212 612 345 678",
                "Number of Team Members": "3",
                "Team Members (names and roles)": "- Younes Moustaid — Captain / Software\n- Aicha Belkacem — Hardware\n- Karim Idrissi — Mechanical",
                "University / School": "ENSA Agadir",
                "Robot Name": "NeuroRacer",
                "Brief Robot Description": "Autonomous line-following robot with PID control and obstacle avoidance using 3 ultrasonic sensors.",
                "Have you participated in CRRT competitions before?": "true",
            }),
        },
        {
            formId: competitionForm.id,
            status: "accepted",
            data: JSON.stringify({
                "Team Name": "Atlas Makers",
                "Captain Name": "Leila Amrani",
                "Captain Email": "l.amrani@est-agadir.ac.ma",
                "Captain Phone": "+212 623 456 789",
                "Number of Team Members": "4",
                "Team Members (names and roles)": "- Leila Amrani — Captain / AI\n- Saad Benali — Electronics\n- Nora Hajji — Software\n- Amine Kettani — Mechanical",
                "University / School": "EST Agadir",
                "Robot Name": "AtlasBot",
                "Brief Robot Description": "Maze-solving robot using flood-fill algorithm with custom ToF sensor array and ESP32.",
                "Have you participated in CRRT competitions before?": "false",
            }),
        },
    ];
    for (const s of submissions) {
        await prisma.formSubmission.create({ data: s });
    }
    console.log("  ✓ Form Submissions (5)");

    // ═══════════════════════════════════════════════
    // 15) MEDIA (sample entries)
    // ═══════════════════════════════════════════════
    const mediaItems = [
        { filename: "crrt-logo.svg", url: "/media/crrt-logo.svg", mimeType: "image/svg+xml", size: 4200, alt: "CRRT Logo", usedIn: "Theme Settings" },
        { filename: "arduino-training-cover.jpg", url: "/media/arduino-training-cover.jpg", mimeType: "image/jpeg", size: 245000, alt: "Arduino Training workshop photo", usedIn: "Event: Arduino Training", width: 1200, height: 800 },
        { filename: "line-follower-v3.jpg", url: "/media/line-follower-v3.jpg", mimeType: "image/jpeg", size: 320000, alt: "Line Follower Robot v3", usedIn: "Project: Line Follower v3", width: 1600, height: 900 },
        { filename: "ai-conference-2026.jpg", url: "/media/ai-conference-2026.jpg", mimeType: "image/jpeg", size: 180000, alt: "AI Conference 2026 poster", usedIn: "Event: AI Conference", width: 1200, height: 630 },
        { filename: "drone-prototype.jpg", url: "/media/drone-prototype.jpg", mimeType: "image/jpeg", size: 410000, alt: "Autonomous delivery drone prototype", usedIn: "Project: Autonomous Drone", width: 2000, height: 1333 },
        { filename: "crrt-lab-panorama.jpg", url: "/media/crrt-lab-panorama.jpg", mimeType: "image/jpeg", size: 520000, alt: "CRRT lab panoramic view", usedIn: "About page", width: 2400, height: 800 },
    ];
    for (const m of mediaItems) {
        await prisma.media.create({ data: m });
    }
    console.log("  ✓ Media (6 entries)");

    // ═══════════════════════════════════════════════
    // Update HomeConfig with featured project IDs
    // ═══════════════════════════════════════════════
    await prisma.homeConfig.update({
        where: { id: "default" },
        data: {
            featuredProjectIds: JSON.stringify([project1.id, project2.id, project3.id]),
            pinnedEventId: event1.id,
        },
    });
    console.log("  ✓ HomeConfig updated with featured projects + pinned event");

    console.log("\n✅ Full seed complete! Database populated with realistic CRRT data.\n");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
