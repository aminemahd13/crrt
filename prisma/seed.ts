import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 0) ADMIN USER
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const hashedPassword = await bcrypt.hash("crrt2026", 12);
    await prisma.user.upsert({
        where: { email: "admin@crrt.ma" },
        update: {
            password: hashedPassword,
            mustRotatePassword: true,
        },
        create: {
            name: "CRRT Admin",
            email: "admin@crrt.ma",
            password: hashedPassword,
            role: "admin",
            mustRotatePassword: true,
        },
    });
    console.log("  âœ“ Admin user (admin@crrt.ma / crrt2026)");

    await prisma.user.upsert({
        where: { email: "member@crrt.ma" },
        update: {
            role: "member",
        },
        create: {
            name: "CRRT Member",
            email: "member@crrt.ma",
            password: hashedPassword,
            role: "member",
            phone: "+212600000000",
            bio: "Passionate about robotics and embedded systems",
            organization: "ENSA Agadir",
            city: "Agadir",
        },
    });
    console.log("  âœ“ Member user (member@crrt.ma / crrt2026)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 1) THEME SETTINGS (singleton)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
    console.log("  âœ“ ThemeSettings");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 2) HOME CONFIG (singleton)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await prisma.homeConfig.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            missionText:
                "Building the future of robotics and technology at ENSA Agadir since 2008. We design, build, and compete.",
            tagline: "Our robots never sleep.",
            trackTagMap: [
                { tag: "arduino", label: "Arduino & Embedded", icon: "cpu" },
                { tag: "ai", label: "AI & Machine Learning", icon: "brain" },
                { tag: "mini-projet", label: "Mini-Projets", icon: "rocket" },
                { tag: "competition", label: "Competitions", icon: "trophy" },
                { tag: "iot", label: "IoT & Smart Systems", icon: "wifi" },
            ],
        },
    });
    console.log("  âœ“ HomeConfig");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await prisma.aboutConfig.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            heroTitle: "About CRRT",
            storyText:
                "The Club Robotique & Recherche Technologique (CRRT) is ENSA Agadir's student-led engineering club, founded in 2008. We build robots, conduct research, and organize events that push the boundaries of what's possible with technology.",
            valueCards: [
                { title: "Innovation", desc: "Pushing boundaries through hands-on engineering and research." },
                { title: "Education", desc: "Training the next generation of engineers through workshops and mentoring." },
                { title: "Community", desc: "Building a network of passionate technologists across Morocco." },
            ],
            teamCurrentLabel: "Current Bureau",
            teamAlumniLabel: "Alumni",
            timelineHeading: "Since 2008",
        },
    });
    console.log("  - AboutConfig");

    await prisma.platformSettings.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            siteTitle: "CRRT - ENSA Agadir",
            siteUrl: "https://crrt.ensa-agadir.ac.ma",
            adminEmail: "contact@crrt.tech",
            smtpHost: process.env.SMTP_HOST ?? "smtp.purelymail.com",
            smtpPort: process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT, 10) : null,
            smtpFrom: process.env.SMTP_FROM ?? "CRRT <contact@crrt.tech>",
            imapHost: process.env.IMAP_HOST ?? "imap.purelymail.com",
            imapPort: process.env.IMAP_PORT ? Number.parseInt(process.env.IMAP_PORT, 10) : 993,
            imapSecure: process.env.IMAP_SECURE
                ? process.env.IMAP_SECURE.toLowerCase() !== "false"
                : true,
            imapFolderInbox: process.env.IMAP_FOLDER_INBOX ?? "INBOX",
            imapFolderSent: process.env.IMAP_FOLDER_SENT ?? "Sent",
            imapFolderDrafts: process.env.IMAP_FOLDER_DRAFTS ?? "Drafts",
            imapFolderArchive: process.env.IMAP_FOLDER_ARCHIVE ?? "Archive",
            imapFolderTrash: process.env.IMAP_FOLDER_TRASH ?? "Trash",
            imapSyncIntervalSeconds: process.env.IMAP_SYNC_INTERVAL_SECONDS
                ? Number.parseInt(process.env.IMAP_SYNC_INTERVAL_SECONDS, 10)
                : 30,
            imapInitialSyncDays: process.env.IMAP_INITIAL_SYNC_DAYS
                ? Number.parseInt(process.env.IMAP_INITIAL_SYNC_DAYS, 10)
                : 90,
        },
    });
    console.log("  âœ“ PlatformSettings");

    const templateSeeds = [
        {
            key: "registration-confirmed",
            name: "Event Registration - Confirmed",
            subject: "Registration confirmed for {{eventTitle}}",
            body: "<p>Hello {{name}},</p><p>Your registration for <strong>{{eventTitle}}</strong> is confirmed.</p><p>Status: {{status}}</p>",
        },
        {
            key: "registration-waitlisted",
            name: "Event Registration - Waitlisted",
            subject: "You're on the waitlist for {{eventTitle}}",
            body: "<p>Hello {{name}},</p><p>You are currently on the waitlist for <strong>{{eventTitle}}</strong>.</p><p>Status: {{status}}</p>",
        },
        {
            key: "registration-status-update",
            name: "Event Registration - Status Update",
            subject: "Status updated for {{eventTitle}}",
            body: "<p>Hello {{name}},</p><p>Your registration status for <strong>{{eventTitle}}</strong> is now: <strong>{{status}}</strong>.</p><p>{{note}}</p>",
        },
        {
            key: "form-submission-received",
            name: "Form Submission Received",
            subject: "Submission received: {{formTitle}}",
            body: "<p>Hello {{name}},</p><p>We received your submission for <strong>{{formTitle}}</strong>.</p>",
        },
    ] as const;
    for (const template of templateSeeds) {
        await prisma.emailTemplate.upsert({
            where: { key: template.key },
            update: {},
            create: {
                key: template.key,
                name: template.name,
                subject: template.subject,
                body: template.body,
            },
        });
    }
    console.log("  âœ“ Email templates");

    // 3) TAGS (unified across content)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const tagData = [
        { name: "arduino", labelEn: "Arduino", labelFr: "Arduino", labelAr: "Ø£Ø±Ø¯ÙˆÙŠÙ†Ùˆ", color: "#0ea5e9", icon: "cpu" },
        { name: "ai", labelEn: "AI & ML", labelFr: "IA & ML", labelAr: "Ø°ÙƒØ§Ø¡ Ø§ØµØ·Ù†Ø§Ø¹ÙŠ", color: "#8b5cf6", icon: "brain" },
        { name: "mini-projet", labelEn: "Mini-Project", labelFr: "Mini-Projet", labelAr: "Ù…Ø´Ø±ÙˆØ¹ ØµØºÙŠØ±", color: "#10b981", icon: "rocket" },
        { name: "competition", labelEn: "Competition", labelFr: "CompÃ©tition", labelAr: "Ù…Ø³Ø§Ø¨Ù‚Ø©", color: "#f97316", icon: "trophy" },
        { name: "raspberry-pi", labelEn: "Raspberry Pi", labelFr: "Raspberry Pi", labelAr: "Ø±Ø§Ø³Ø¨ÙŠØ±ÙŠ Ø¨Ø§ÙŠ", color: "#ec4899", icon: "server" },
        { name: "robotics", labelEn: "Robotics", labelFr: "Robotique", labelAr: "Ø§Ù„Ø±ÙˆØ¨ÙˆØªÙŠØ§Øª", color: "#f59e0b", icon: "bot" },
        { name: "iot", labelEn: "IoT", labelFr: "IdO", labelAr: "Ø¥Ù†ØªØ±Ù†Øª Ø§Ù„Ø£Ø´ÙŠØ§Ø¡", color: "#06b6d4", icon: "wifi" },
        { name: "python", labelEn: "Python", labelFr: "Python", labelAr: "Ø¨Ø§ÙŠØ«ÙˆÙ†", color: "#3b82f6", icon: "code" },
        { name: "pcb-design", labelEn: "PCB Design", labelFr: "Conception PCB", labelAr: "ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¯ÙˆØ§Ø¦Ø±", color: "#14b8a6", icon: "circuit-board" },
        { name: "3d-printing", labelEn: "3D Printing", labelFr: "Impression 3D", labelAr: "Ø·Ø¨Ø§Ø¹Ø© Ø«Ù„Ø§Ø«ÙŠØ©", color: "#a855f7", icon: "printer" },
    ];

    const tags: Record<string, { id: string }> = {};
    for (const t of tagData) {
        tags[t.name] = await prisma.tag.upsert({
            where: { name: t.name },
            update: {},
            create: t,
        });
    }
    console.log("  âœ“ Tags (10)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 4) EVENTS (minimal realistic set)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
- Wiring a 16Ã—2 LCD with I2C
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
            location: "ENSA Agadir â€” Salle TP Informatique",
            startDate: new Date("2026-03-15T09:00:00"),
            endDate: new Date("2026-03-16T17:00:00"),
            capacity: 30,
            published: true,
        },
    });

    const event2 = await prisma.event.upsert({
        where: { slug: "south-robotics-gathering-2026" },
        update: {},
        create: {
            title: "South Robotics Gathering 3rd Edition",
            slug: "south-robotics-gathering-2026",
            description:
                "Flagship scientific event organized by CRRT at ENSA Agadir. Theme: AI & Intelligent Robotics: From Mobility to Innovation.",
            content: `Three-day edition with talks, workshops, exhibitions, and robotics competitions.

Publicly announced dates: March 26-28, 2026.

Format:
- Scientific talks and debates
- Team competitions
- Project exhibition stands`,
            type: "conference",
            status: "published",
            location: "ENSA Agadir",
            startDate: new Date("2026-03-26T09:00:00"),
            endDate: new Date("2026-03-28T18:00:00"),
            capacity: 350,
            published: true,
        },
    });

    const event3 = await prisma.event.upsert({
        where: { slug: "south-robotics-gathering-2025" },
        update: {},
        create: {
            title: "South Robotics Gathering 2nd Edition",
            slug: "south-robotics-gathering-2025",
            description:
                "Second SRG edition at ENSA Agadir under the theme: Shaping Morocco's Future: Robotics Across Diverse Sectors.",
            content: `Two-day event held on April 11-12, 2025.

Highlights:
- Talks and workshops
- Robotics competitions (including Free Robotics and WarBot)
- Project exhibition and networking`,
            type: "conference",
            status: "published",
            location: "ENSA Agadir",
            startDate: new Date("2025-04-11T09:00:00"),
            endDate: new Date("2025-04-12T18:00:00"),
            capacity: 300,
            published: true,
        },
    });

    console.log("  - Events (3)");
    // 5) EVENT SPEAKERS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const speakerData = [
        { eventId: event3.id, name: "Youness Ahallal", role: "Speaker", order: 0 },
        { eventId: event3.id, name: "Wissam Jenkal", role: "Speaker", order: 1 },
        { eventId: event3.id, name: "Omar JNIOIH", role: "Speaker", order: 2 },
        { eventId: event3.id, name: "Hamza Guirrou", role: "Speaker", order: 3 },
        { eventId: event3.id, name: "Amine Saddik", role: "Speaker", order: 4 },
    ];
    for (const s of speakerData) {
        await prisma.eventSpeaker.create({ data: s });
    }
    console.log(`  - Speakers (${speakerData.length})`);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 6) PROJECTS (6 projects)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
            stackTags: ["Arduino", "C++", "PID Control", "PCB Design", "3D Printing"],
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
[Sensors] â†’ [ESP32] â†’ [MQTT Broker] â†’ [Node.js API] â†’ [React Dashboard]
                                         â†“
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
            stackTags: ["ESP32", "MQTT", "React", "Node.js", "InfluxDB", "Telegram API"],
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

- âœ… Frame assembly and motor testing
- âœ… GPS waypoint navigation (tested in simulation)
- âœ… ArUco marker landing pad detection
- ðŸ”„ Obstacle avoidance with depth camera
- ðŸ”„ Package drop mechanism
- â¬œ Full autonomous flight test

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
            stackTags: ["Python", "OpenCV", "ROS 2", "Pixhawk", "TensorFlow Lite", "Raspberry Pi"],
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
| Servos | MG996R Ã— 6 |
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
            stackTags: ["Arduino", "React", "WebSocket", "3D Printing", "Kinematics"],
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
            stackTags: ["ESP32", "MQTT", "Next.js", "Ultrasonic", "IoT"],
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
- 3Ã— VL53L0X ToF distance sensors (front, left, right)
- N20 micro gear motors with encoders
- Custom PCB with DRV8833 driver
- 3D-printed chassis

## Competition Results

- 1st place: ENSA Agadir Internal (2025)
- 3rd place: Morocco National Micromouse (2025)`,
            status: "completed",
            repoUrl: "https://github.com/crrt-ensa/maze-solver",
            stackTags: ["Arduino", "C++", "Flood Fill", "PCB Design", "ToF Sensors"],
            year: 2025,
            published: true,
        },
    });

    console.log("  âœ“ Projects (6)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 7) POSTS (6 blog articles)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await prisma.post.upsert({
        where: { slug: "getting-started-with-arduino" },
        update: {},
        create: {
            title: "Getting Started with Arduino: A Beginner's Guide",
            slug: "getting-started-with-arduino",
            excerpt: "Everything you need to know to start your Arduino journey â€” from unboxing to your first sensor project.",
            content: `## What is Arduino?

Arduino is an open-source electronics platform based on easy-to-use hardware and software. It's the gateway into embedded systems for millions of makers worldwide.

## Your First Sketch

\`\`\`cpp
// Blink â€” the "Hello, World!" of electronics
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
- Larger error â†’ stronger correction
- Too high â†’ oscillation

### Integral (I)
- Reacts to the **accumulated** error over time
- Eliminates steady-state error
- Too high â†’ overshoot and instability

### Derivative (D)
- Reacts to the **rate of change** of error
- Dampens oscillation
- Too high â†’ noise sensitivity

## Tuning Method (Ziegler-Nichols)

1. Set Ki = 0, Kd = 0
2. Increase Kp until the system oscillates steadily
3. Note this critical Kp and the oscillation period Tu
4. Apply: Kp = 0.6Ã—Ku, Ki = 2Ã—Kp/Tu, Kd = KpÃ—Tu/8

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
ESP32 â†’ MQTT Broker â†’ Node.js Backend â†’ InfluxDB â†’ Grafana
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

Custom brackets, chassis, gears, and enclosures â€” 3D printing lets you iterate designs in hours, not weeks.

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

- **Printers**: Bambu Lab P1P Ã— 2, Ender 3 S1 Ã— 3
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

ROS 2 (Robot Operating System 2) is not an actual OS â€” it's a middleware framework that provides tools, libraries, and conventions for building robot applications.

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

    console.log("  âœ“ Posts (6)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 8) CONTENT TAGS (cross-references)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const contentTags = [
        { tagId: tags["arduino"].id, eventId: event1.id },
        { tagId: tags["ai"].id, eventId: event2.id },
        { tagId: tags["competition"].id, eventId: event2.id },
        { tagId: tags["robotics"].id, eventId: event2.id },
        { tagId: tags["ai"].id, eventId: event3.id },
        { tagId: tags["competition"].id, eventId: event3.id },
        { tagId: tags["robotics"].id, eventId: event3.id },
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
    console.log(`  - ContentTags (${contentTags.length})`);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 9) TIMELINE MILESTONES
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
    console.log("  âœ“ Milestones (10)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 10) TEAM MEMBERS (current + alumni)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const members = [
        // Current Bureau 2025-2026
        { name: "Nour El Houda Boulondoum", role: "President", order: 0 },
        { name: "Ibtissame OUADIA", role: "Vice-President", order: 1 },
        { name: "Wissal Bahi", role: "General Secretary", order: 2 },
        { name: "Aymene Bermaki", role: "Treasurer", order: 3 },
        { name: "Fatima Zahra Lafssal", role: "Sponsorship Manager", order: 4 },
        { name: "Chaima Ait Allal", role: "Event Manager", order: 5 },
        { name: "Soufiane El Barji", role: "R&D Lead", order: 6 },
        { name: "Meryem Saidi", role: "Training Manager", order: 7 },
        { name: "Abdesslam Daddaha", role: "Electrical R&D Manager", order: 8 },
        { name: "Abdellatif Khobane", role: "Mechanical R&D Manager", order: 9 },
        { name: "Abdellah Oubihi", role: "Equipment Manager", order: 10 },
        // Alumni
        { name: "Amine Kettani", role: "Founder", isAlumni: true, linkedIn: "https://linkedin.com/in/amine-kettani", order: 100 },
        { name: "Nadia Fassi Fehri", role: "President 2018-2020", isAlumni: true, linkedIn: "https://linkedin.com/in/nadia-ff", order: 101 },
        { name: "Rachid Mouline", role: "Technical Lead 2020-2022", isAlumni: true, linkedIn: "https://linkedin.com/in/rachid-mouline", order: 102 },
        { name: "Salma Alaoui", role: "President 2022-2024", isAlumni: true, linkedIn: "https://linkedin.com/in/salma-alaoui", order: 103 },
    ];
    for (const m of members) {
        await prisma.teamMember.create({ data: m });
    }
    console.log("  - Team Members (15 - 11 current, 4 alumni)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 11) PARTNERS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
    console.log("  âœ“ Partners (6)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 12) NAVIGATION
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
        { label: "Contact Us", href: "mailto:contact@crrt.tech", order: 3, section: "footer", visible: true },
    ];
    for (const n of navItems) {
        await prisma.navItem.create({ data: n });
    }
    console.log("  âœ“ Navigation (9 items)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 13) FORMS (2 published with fields)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 13) RESOURCE CATEGORIES + RESOURCES (public + private)
    const resourceCategories = [
        {
            name: "Documentation",
            slug: "documentation",
            description: "Guides, handbooks, and onboarding material.",
            color: "#0EA5E9",
            icon: "book-open",
        },
        {
            name: "Repositories",
            slug: "repositories",
            description: "Codebases and templates used by CRRT teams.",
            color: "#22C55E",
            icon: "code-2",
        },
    ] as const;

    const categoryBySlug: Record<string, { id: string }> = {};
    for (const category of resourceCategories) {
        categoryBySlug[category.slug] = await prisma.resourceCategory.upsert({
            where: { slug: category.slug },
            update: {
                name: category.name,
                description: category.description,
                color: category.color,
                icon: category.icon,
            },
            create: category,
        });
    }

    const resources = [
        {
            title: "CRRT Starter Kit Handbook",
            slug: "crrt-starter-kit-handbook",
            description: "New member onboarding handbook for tools, safety, and contribution workflow.",
            url: "/media/crrt-starter-kit-handbook.pdf",
            type: "document",
            isPublic: true,
            categoryId: categoryBySlug.documentation.id,
        },
        {
            title: "Line Follower Firmware Template",
            slug: "line-follower-firmware-template",
            description: "Baseline firmware template used in internal line follower projects.",
            url: "https://github.com/crrt/line-follower-template",
            type: "repository",
            isPublic: true,
            categoryId: categoryBySlug.repositories.id,
        },
        {
            title: "Internal Electronics Procurement Sheet",
            slug: "internal-electronics-procurement-sheet",
            description: "Member-only budget and procurement planning sheet for electronics components.",
            url: "/media/internal-procurement-sheet.xlsx",
            type: "document",
            isPublic: false,
            categoryId: categoryBySlug.documentation.id,
        },
        {
            title: "Competition Judging Rubric (Members)",
            slug: "competition-judging-rubric-members",
            description: "Private rubric and scoring details shared with registered members.",
            url: "/media/competition-judging-rubric.pdf",
            type: "document",
            isPublic: false,
            categoryId: categoryBySlug.documentation.id,
        },
    ] as const;

    for (const resource of resources) {
        await prisma.resource.upsert({
            where: { slug: resource.slug },
            update: {
                title: resource.title,
                description: resource.description,
                url: resource.url,
                type: resource.type,
                isPublic: resource.isPublic,
                categoryId: resource.categoryId,
            },
            create: resource,
        });
    }
    console.log("  âœ“ Resources (4 - 2 public, 2 private)");

    // 14) FORMS (2 published with fields)
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
                    { label: "Year of Study", type: "select", required: true, options: "1Ã¨re annÃ©e,2Ã¨me annÃ©e,3Ã¨me annÃ©e,4Ã¨me annÃ©e,5Ã¨me annÃ©e", order: 3 },
                    { label: "FiliÃ¨re", type: "select", required: true, options: "GÃ©nie Informatique,GÃ©nie Industriel,GÃ©nie Ã‰lectrique,GÃ©nie Civil,Autre", order: 4 },
                    { label: "Prior Arduino Experience", type: "select", required: false, options: "None,Beginner,Intermediate,Advanced", order: 5 },
                    { label: "Do you have your own Arduino board?", type: "checkbox", required: false, placeholder: "Yes, I have an Arduino board", order: 6 },
                    { label: "Anything else we should know?", type: "textarea", required: false, placeholder: "Special needs, questions, etc.", order: 7 },
                ],
            },
        },
    });

    const competitionForm = await prisma.form.create({
        data: {
            title: "SRG 2026 Competition Registration",
            slug: "srg-2026-competition-registration",
            description: "Register your team for South Robotics Gathering 2026 competition tracks.",
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
                    { label: "Team Members (names and roles)", type: "textarea", required: true, placeholder: "List all members:\n- Name 1 â€” Role\n- Name 2 â€” Role", order: 5 },
                    { label: "University / School", type: "text", required: true, placeholder: "e.g. ENSA Agadir", order: 6 },
                    { label: "Robot Name", type: "text", required: false, placeholder: "Your robot's name (if decided)", order: 7 },
                    { label: "Brief Robot Description", type: "textarea", required: true, placeholder: "Describe your robot concept in 2-3 sentences", order: 8 },
                    { label: "Have you participated in CRRT competitions before?", type: "checkbox", required: false, placeholder: "Yes", order: 9 },
                ],
            },
        },
    });

    console.log("  âœ“ Forms (2 published)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 14) FORM SUBMISSIONS (sample data)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const submissions = [
        {
            formId: trainingForm.id,
            status: "new",
            data: {
                "Full Name": "Hamza Ait Brahim",
                "Email": "hamza.aitbrahim@ensa-agadir.ac.ma",
                "Student ID (CNE)": "R130456789",
                "Year of Study": "2Ã¨me annÃ©e",
                "FiliÃ¨re": "GÃ©nie Informatique",
                "Prior Arduino Experience": "Beginner",
                "Do you have your own Arduino board?": "true",
                "Anything else we should know?": "",
            },
        },
        {
            formId: trainingForm.id,
            status: "accepted",
            data: {
                "Full Name": "Zineb El Khatiri",
                "Email": "zineb.elkhatiri@ensa-agadir.ac.ma",
                "Student ID (CNE)": "R130567890",
                "Year of Study": "1Ã¨re annÃ©e",
                "FiliÃ¨re": "GÃ©nie Ã‰lectrique",
                "Prior Arduino Experience": "None",
                "Do you have your own Arduino board?": "false",
                "Anything else we should know?": "I'm very excited to learn electronics!",
            },
        },
        {
            formId: trainingForm.id,
            status: "in_review",
            data: {
                "Full Name": "Mohammed Ezzahiri",
                "Email": "m.ezzahiri@ensa-agadir.ac.ma",
                "Student ID (CNE)": "R130678901",
                "Year of Study": "3Ã¨me annÃ©e",
                "FiliÃ¨re": "GÃ©nie Industriel",
                "Prior Arduino Experience": "Intermediate",
                "Do you have your own Arduino board?": "true",
                "Anything else we should know?": "I'd like to bring my own sensor kit.",
            },
        },
        {
            formId: competitionForm.id,
            status: "new",
            data: {
                "Team Name": "NeuroBots",
                "Captain Name": "Younes Moustaid",
                "Captain Email": "y.moustaid@ensa-agadir.ac.ma",
                "Captain Phone": "+212 612 345 678",
                "Number of Team Members": "3",
                "Team Members (names and roles)": "- Younes Moustaid â€” Captain / Software\n- Aicha Belkacem â€” Hardware\n- Karim Idrissi â€” Mechanical",
                "University / School": "ENSA Agadir",
                "Robot Name": "NeuroRacer",
                "Brief Robot Description": "Autonomous line-following robot with PID control and obstacle avoidance using 3 ultrasonic sensors.",
                "Have you participated in CRRT competitions before?": "true",
            },
        },
        {
            formId: competitionForm.id,
            status: "accepted",
            data: {
                "Team Name": "Atlas Makers",
                "Captain Name": "Leila Amrani",
                "Captain Email": "l.amrani@est-agadir.ac.ma",
                "Captain Phone": "+212 623 456 789",
                "Number of Team Members": "4",
                "Team Members (names and roles)": "- Leila Amrani â€” Captain / AI\n- Saad Benali â€” Electronics\n- Nora Hajji â€” Software\n- Amine Kettani â€” Mechanical",
                "University / School": "EST Agadir",
                "Robot Name": "AtlasBot",
                "Brief Robot Description": "Maze-solving robot using flood-fill algorithm with custom ToF sensor array and ESP32.",
                "Have you participated in CRRT competitions before?": "false",
            },
        },
    ];
    for (const s of submissions) {
        await prisma.formSubmission.create({ data: s });
    }
    console.log("  âœ“ Form Submissions (5)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // 15) MEDIA (sample entries)
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    const mediaItems = [
        { filename: "crrt-logo.svg", url: "/media/crrt-logo.svg", mimeType: "image/svg+xml", size: 4200, alt: "CRRT Logo", usedIn: "Theme Settings" },
        { filename: "arduino-training-cover.jpg", url: "/media/arduino-training-cover.jpg", mimeType: "image/jpeg", size: 245000, alt: "Arduino Training workshop photo", usedIn: "Event: Arduino Training", width: 1200, height: 800 },
        { filename: "line-follower-v3.jpg", url: "/media/line-follower-v3.jpg", mimeType: "image/jpeg", size: 320000, alt: "Line Follower Robot v3", usedIn: "Project: Line Follower v3", width: 1600, height: 900 },
        { filename: "srg-2026-poster.jpg", url: "/media/srg-2026-poster.jpg", mimeType: "image/jpeg", size: 180000, alt: "South Robotics Gathering 2026 poster", usedIn: "Event: SRG 2026", width: 1200, height: 630 },
        { filename: "drone-prototype.jpg", url: "/media/drone-prototype.jpg", mimeType: "image/jpeg", size: 410000, alt: "Autonomous delivery drone prototype", usedIn: "Project: Autonomous Drone", width: 2000, height: 1333 },
        { filename: "crrt-lab-panorama.jpg", url: "/media/crrt-lab-panorama.jpg", mimeType: "image/jpeg", size: 520000, alt: "CRRT lab panoramic view", usedIn: "About page", width: 2400, height: 800 },
    ];
    for (const m of mediaItems) {
        await prisma.media.create({ data: m });
    }
    console.log("  âœ“ Media (6 entries)");

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // Update HomeConfig with featured project IDs
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    await prisma.homeConfig.update({
        where: { id: "default" },
        data: {
            featuredProjectIds: [project1.id, project2.id, project3.id],
            pinnedEventId: event1.id,
        },
    });
    console.log("  âœ“ HomeConfig updated with featured projects + pinned event");

    console.log("\nâœ… Full seed complete! Database populated with realistic CRRT data.\n");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


