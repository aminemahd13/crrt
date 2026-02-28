import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // ─── Theme Settings (singleton) ────
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

    // ─── Home Config (singleton) ────
    await prisma.homeConfig.upsert({
        where: { id: "default" },
        update: {},
        create: {
            id: "default",
            missionText: "Club Robotique & Recherche Technologique — ENSA Agadir",
            tagline: "Our robots never sleep.",
            trackTagMap: JSON.stringify([
                { tag: "arduino", label: "Arduino & Embedded", icon: "cpu" },
                { tag: "ai", label: "AI & Machine Learning", icon: "brain" },
                { tag: "mini-projet", label: "Mini-Projets", icon: "rocket" },
                { tag: "competition", label: "Competitions", icon: "trophy" },
            ]),
        },
    });

    // ─── Tags ────
    const tagData = [
        { name: "arduino", labelEn: "Arduino", labelFr: "Arduino", color: "#0ea5e9", icon: "cpu" },
        { name: "ai", labelEn: "AI & ML", labelFr: "IA & ML", color: "#8b5cf6", icon: "brain" },
        { name: "mini-projet", labelEn: "Mini-Project", labelFr: "Mini-Projet", color: "#10b981", icon: "rocket" },
        { name: "competition", labelEn: "Competition", labelFr: "Compétition", color: "#f97316", icon: "trophy" },
        { name: "raspberry-pi", labelEn: "Raspberry Pi", labelFr: "Raspberry Pi", color: "#ec4899", icon: "server" },
        { name: "robotics", labelEn: "Robotics", labelFr: "Robotique", color: "#f59e0b", icon: "bot" },
    ];

    const tags = [];
    for (const t of tagData) {
        tags.push(
            await prisma.tag.upsert({
                where: { name: t.name },
                update: {},
                create: t,
            })
        );
    }

    // ─── Events ────
    const event1 = await prisma.event.upsert({
        where: { slug: "arduino-training-2026" },
        update: {},
        create: {
            title: "Arduino Fundamentals Training",
            slug: "arduino-training-2026",
            description: "Hands-on training covering Arduino basics, sensors, actuators, and serial communication.",
            content: "## Program\n\n### Day 1: Getting Started\n- Introduction to microcontrollers\n- Arduino IDE setup\n- Digital I/O\n- LED circuits\n\n### Day 2: Sensors & Communication\n- Analog sensors\n- Serial communication\n- LCD displays\n- Mini-project",
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
            title: "AI & Robotics Conference",
            slug: "ai-conference-2026",
            description: "Annual conference featuring industry speakers on artificial intelligence and autonomous systems.",
            content: "## Keynotes\n\n- **Deep Learning for Robotics** — Dr. Amina El Fassi\n- **Computer Vision in Production** — Prof. Youssef Berrada\n- **Reinforcement Learning Workshop** — Hands-on session",
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
            description: "Annual inter-university robotics competition. Build a robot that navigates an obstacle course.",
            content: "## Rules\n\n1. Teams of 2–4 members\n2. Robot must be autonomous\n3. Maximum dimensions: 30×30×30 cm\n4. Time limit: 3 minutes per run",
            type: "competition",
            status: "published",
            location: "ENSA Agadir — Hall Principal",
            startDate: new Date("2026-05-10T09:00:00"),
            endDate: new Date("2026-05-11T17:00:00"),
            capacity: 50,
            published: true,
        },
    });

    // ─── Event Speakers ────
    const speakers = [
        { eventId: event2.id, name: "Dr. Amina El Fassi", role: "Keynote Speaker", bio: "AI researcher at INPT Rabat", order: 0 },
        { eventId: event2.id, name: "Prof. Youssef Berrada", role: "Speaker", bio: "Computer Vision lab lead, UM6P", order: 1 },
        { eventId: event2.id, name: "Karim Tazi", role: "Workshop Lead", bio: "ML engineer, OCP Group", order: 2 },
    ];
    for (const s of speakers) {
        await prisma.eventSpeaker.create({ data: s });
    }

    // ─── Projects ────
    const project1 = await prisma.project.upsert({
        where: { slug: "line-follower-v3" },
        update: {},
        create: {
            title: "Line Follower Robot v3",
            slug: "line-follower-v3",
            description: "Third iteration of our autonomous line-following robot with PID control and IR sensor array.",
            content: "## Overview\n\nFast, reliable line-following robot using 8 IR sensors and a PID control algorithm.\n\n## Technical Details\n\n- **MCU**: Arduino Mega 2560\n- **Sensors**: QRE1113 IR reflectance array\n- **Motors**: N20 DC motors with L298N driver",
            status: "completed",
            stackTags: JSON.stringify(["Arduino", "C++", "PID Control", "PCB Design"]),
            year: 2025,
            published: true,
        },
    });

    const project2 = await prisma.project.upsert({
        where: { slug: "smart-greenhouse" },
        update: {},
        create: {
            title: "Smart Greenhouse Monitor",
            slug: "smart-greenhouse",
            description: "IoT-based greenhouse monitoring system with automated irrigation and climate control.",
            content: "## Overview\n\nComplete IoT solution for greenhouse monitoring using ESP32 and environmental sensors.\n\n## Features\n\n- Temperature & humidity monitoring\n- Automated irrigation\n- Web dashboard with real-time data",
            status: "ongoing",
            repoUrl: "https://github.com/crrt-ensa/smart-greenhouse",
            stackTags: JSON.stringify(["ESP32", "MQTT", "React", "Node.js", "InfluxDB"]),
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
            description: "Research project exploring autonomous navigation using computer vision and GPS.",
            content: "## Vision\n\nDelivery drone prototype with autonomous navigation via GPS and computer vision.\n\n## Status\n\n- Frame assembly complete\n- GPS waypoint navigation tested\n- CV module in development",
            status: "ongoing",
            repoUrl: "https://github.com/crrt-ensa/autonomous-drone",
            demoUrl: "https://drone-demo.crrt.ma",
            stackTags: JSON.stringify(["Python", "OpenCV", "ROS", "Pixhawk", "TensorFlow Lite"]),
            year: 2026,
            published: true,
        },
    });

    // ─── Posts ────
    await prisma.post.upsert({
        where: { slug: "getting-started-with-arduino" },
        update: {},
        create: {
            title: "Getting Started with Arduino: A Beginner's Guide",
            slug: "getting-started-with-arduino",
            excerpt: "Everything you need to start your Arduino journey.",
            content: "## Introduction\n\nArduino is the gateway into electronics for millions of makers.\n\n## Your First Sketch\n\n```cpp\nvoid setup() { pinMode(LED_BUILTIN, OUTPUT); }\nvoid loop() {\n  digitalWrite(LED_BUILTIN, HIGH); delay(1000);\n  digitalWrite(LED_BUILTIN, LOW); delay(1000);\n}\n```",
            published: true,
        },
    });

    await prisma.post.upsert({
        where: { slug: "pid-control-explained" },
        update: {},
        create: {
            title: "PID Control for Robotics",
            slug: "pid-control-explained",
            excerpt: "Understanding PID control loops for your robot projects.",
            content: "## What is PID?\n\nPID (Proportional-Integral-Derivative) is a control loop that continuously calculates an error value and applies a correction.\n\n## Tuning Tips\n\n1. Start with P only\n2. Add D to reduce oscillation\n3. Add I to eliminate steady-state error",
            published: true,
        },
    });

    await prisma.post.upsert({
        where: { slug: "computer-vision-basics" },
        update: {},
        create: {
            title: "Computer Vision with OpenCV and Python",
            slug: "computer-vision-basics",
            excerpt: "Fundamentals of computer vision: image processing, edge detection, and object recognition.",
            content: "## Getting Started\n\nOpenCV is the most popular library for computer vision.\n\n```python\nimport cv2\nimg = cv2.imread('robot.jpg')\ngray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\nedges = cv2.Canny(gray, 50, 150)\n```",
            published: true,
        },
    });

    // ─── Content Tags ────
    const arduinoTag = tags.find((t) => t.name === "arduino")!;
    const aiTag = tags.find((t) => t.name === "ai")!;
    const competitionTag = tags.find((t) => t.name === "competition")!;
    const roboticsTag = tags.find((t) => t.name === "robotics")!;

    const contentTags = [
        { tagId: arduinoTag.id, eventId: event1.id },
        { tagId: aiTag.id, eventId: event2.id },
        { tagId: competitionTag.id, eventId: event3.id },
        { tagId: roboticsTag.id, eventId: event3.id },
        { tagId: arduinoTag.id, projectId: project1.id },
        { tagId: roboticsTag.id, projectId: project2.id },
        { tagId: aiTag.id, projectId: project3.id },
        { tagId: roboticsTag.id, projectId: project3.id },
    ];
    for (const ct of contentTags) {
        await prisma.contentTag.create({ data: ct });
    }

    // ─── Timeline Milestones ────
    const milestones = [
        { year: 2008, title: "CRRT Founded", description: "Club Robotique & Recherche Technologique established at ENSA Agadir.", order: 0 },
        { year: 2010, title: "First Competition Win", description: "CRRT team wins regional robotics competition.", order: 1 },
        { year: 2014, title: "AI Lab Launched", description: "Dedicated AI research group created.", order: 2 },
        { year: 2018, title: "10th Anniversary", description: "Celebrated with national robotics conference.", order: 3 },
        { year: 2022, title: "IoT Initiative", description: "Smart Campus IoT initiative with ESP32 networks.", order: 4 },
        { year: 2025, title: "Drone Research", description: "Autonomous drone delivery research program started.", order: 5 },
    ];
    for (const m of milestones) {
        await prisma.timelineMilestone.create({ data: m });
    }

    // ─── Team Members ────
    const members = [
        { name: "Yassine El Amrani", role: "President", order: 0 },
        { name: "Fatima Zahra Ouali", role: "Vice President", order: 1 },
        { name: "Ahmed Benali", role: "Technical Lead", order: 2 },
        { name: "Sara Idrissi", role: "Communications", order: 3 },
        { name: "Omar Tazi", role: "Treasurer", order: 4 },
        { name: "Khadija Rachidi", role: "Events Coordinator", order: 5 },
    ];
    for (const m of members) {
        await prisma.teamMember.create({ data: m });
    }

    // ─── Partners ────
    const partners = [
        { name: "ENSA Agadir", logoUrl: "/partners/ensa.svg", website: "https://www.ensa-agadir.ac.ma", order: 0 },
        { name: "OCP Group", logoUrl: "/partners/ocp.svg", website: "https://www.ocpgroup.ma", order: 1 },
        { name: "Arduino", logoUrl: "/partners/arduino.svg", website: "https://www.arduino.cc", order: 2 },
    ];
    for (const p of partners) {
        await prisma.partner.create({ data: p });
    }

    // ─── Navigation ────
    const navItems = [
        { label: "Home", href: "/", order: 0, section: "main" },
        { label: "Events", href: "/events", order: 1, section: "main" },
        { label: "Projects", href: "/projects", order: 2, section: "main" },
        { label: "Blog", href: "/blog", order: 3, section: "main" },
        { label: "About", href: "/about", order: 4, section: "main" },
    ];
    for (const n of navItems) {
        await prisma.navItem.create({ data: n });
    }

    console.log("✅ Seed complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
