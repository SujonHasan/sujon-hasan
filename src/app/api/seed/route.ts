import { NextResponse } from "next/server";
import { saveAboutSingleton } from "@/lib/about";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import Skill from "@/models/Skill";
import Experience from "@/models/Experience";
import Education from "@/models/Education";
import Certification from "@/models/Certification";
import Contact from "@/models/Contact";
import Seo from "@/models/Seo";

export async function GET() {
  return seed();
}

export async function POST() {
  return seed();
}

async function seed() {
  if (process.env.NODE_ENV === "production" || process.env.ENABLE_SEED_ROUTE !== "true") {
    return NextResponse.json(
      { success: false, error: "Seed route is disabled" },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    // Create admin user
    const existingUser = await User.findOne({ email: "sujonhasan171@gmail.com" });
    if (!existingUser) {
      await User.create({
        name: "Md. Sujon Hasan",
        email: "sujonhasan171@gmail.com",
        password: "admin123456",
        role: "admin",
      });
    }

    // About
    await saveAboutSingleton({
      name: "Md. Sujon Hasan",
      tagline: "Full Stack Developer (MERN Stack)",
      bio: "<p>I’m a full-stack developer with a strong foundation in programming, data structures, and algorithms. I build scalable web applications using React, Next.js, Node.js, and MongoDB. I’ve solved 750+ problems in competitive programming, which has strengthened my problem-solving and analytical thinking. I enjoy learning new technologies and turning ideas into real-world applications</p>",
      heroDescription: "Building scalable web applications using modern technologies with strong problem-solving expertise.",
      profileImage: "",
      resumeUrl: "",
      resumeTemplate: "classic",
      stats: [
        { label: "Years Experience", value: "3+" },
        { label: "Projects Completed", value: "20+" },
        { label: "Happy Clients", value: "15+" },
        { label: "Technologies", value: "25+" },
      ],
      socialLinks: {
        github: "https://github.com/SujonHasan",
        linkedin: "https://www.linkedin.com/in/sujon-hasan/",
        twitter: "",
        facebook: "https://www.facebook.com/sujon7020",
        website: "",
      },
    });

    // Skills
    const skills = [
      { name: "React.js", category: "frontend", proficiency: 90, icon: "SiReact", order: 1 },
      { name: "Next.js", category: "frontend", proficiency: 85, icon: "SiNextdotjs", order: 2 },
      { name: "TypeScript", category: "frontend", proficiency: 80, icon: "SiTypescript", order: 3 },
      { name: "Tailwind CSS", category: "frontend", proficiency: 90, icon: "SiTailwindcss", order: 4 },
      { name: "JavaScript", category: "frontend", proficiency: 92, icon: "SiJavascript", order: 5 },
      { name: "HTML/CSS", category: "frontend", proficiency: 95, icon: "SiHtml5", order: 6 },
      { name: "Node.js", category: "backend", proficiency: 88, icon: "SiNodedotjs", order: 7 },
      { name: "Express.js", category: "backend", proficiency: 87, icon: "SiExpress", order: 8 },
      { name: "REST API", category: "backend", proficiency: 85, icon: "SiPostman", order: 9 },
      { name: "MongoDB", category: "database", proficiency: 85, icon: "SiMongodb", order: 10 },
      { name: "MySQL", category: "database", proficiency: 70, icon: "SiMysql", order: 11 },
      { name: "Firebase", category: "database", proficiency: 75, icon: "SiFirebase", order: 12 },
      { name: "Git & GitHub", category: "tools", proficiency: 85, icon: "SiGit", order: 13 },
      { name: "Docker", category: "tools", proficiency: 60, icon: "SiDocker", order: 14 },
      { name: "VS Code", category: "tools", proficiency: 90, icon: "SiVisualstudiocode", order: 15 },
      { name: "Figma", category: "tools", proficiency: 65, icon: "SiFigma", order: 16 },
    ];
    await Skill.deleteMany({});
    await Skill.insertMany(skills);

    // Projects
    const projects = [
      {
        title: "E-Commerce Platform",
        description: "<p>A full-featured e-commerce platform built with the MERN stack. Features include user authentication, product management, shopping cart, payment integration with Stripe, order tracking, and admin dashboard.</p>",
        shortDescription: "Full-featured MERN stack e-commerce with Stripe payments and admin dashboard.",
        technologies: ["React", "Node.js", "Express", "MongoDB", "Stripe", "Redux"],
        category: "fullstack",
        featured: true,
        order: 1,
        status: "published",
        liveUrl: "https://example.com",
        githubUrl: "https://github.com/SujonHasan",
      },
    ];
    await Project.deleteMany({});
    await Project.insertMany(projects);

    // Experience
    const experiences = [
      {
        company: "Druto Fintech Ltd",
        position: "Software Developer",
        description: "<p>Leading the development of web applications using MERN stack. Collaborating with cross-functional teams to deliver high-quality software solutions. Implementing CI/CD pipelines and maintaining code quality standards.</p>",
        startDate: new Date("2022-06-01"),
        endDate: null,
        current: true,
        location: "Dhaka, Bangladesh",
        technologies: ["React", "Next.js",  "TypeScript", "Node.js", "MongoDB"],
        order: 1,
      },
    ];
    await Experience.deleteMany({});
    await Experience.insertMany(experiences);

    // Education
    const education = [
      {
        institution: "Southeast University (SEU)",
        degree: "Bachelor of Science",
        field: "Computer Science & Engineering",
        startDate: new Date("2020-03-01"),
        endDate: new Date("2024-11-20"),
        current: false,
        grade: "CGPA: 3.39/4.00",
        description: "Focused on software engineering, data structures, algorithms, and web technologies.",
        order: 1,
      },
      {
        institution: "Dhaka Polytechnic Institute",
        degree: "Diploma in Engineering",
        field: "Electronics Engineering",
        startDate: new Date("2013-01-01"),
        endDate: new Date("2017-12-25"),
        current: false,
        grade: "GPA: 3.15/4.00",
        description: "",
        order: 2,
      },
    ];
    await Education.deleteMany({});
    await Education.insertMany(education);

    // Certifications
    const certifications = [
      {
        title: "Reactive Accelerator",
        issuer: "Coursera",
        issueDate: new Date("2021-06-15"),
        credentialUrl: "https://coursera.org",
        order: 1,
      },
    ];
    await Certification.deleteMany({});
    await Certification.insertMany(certifications);

    // Contact
    await Contact.findOneAndUpdate(
      {},
      {
        email: "sujonhasan171@gmail.com",
        phone: "+88 01719 707 020",
        address: "Dhaka, Bangladesh",
        availability: "Available for freelance work",
      },
      { upsert: true }
    );

    // SEO
    await Seo.findOneAndUpdate(
      { page: "home" },
      {
        page: "home",
        metaTitle: "Md. Sujon Hasan | Full Stack Developer (MERN Stack) | Portfolio",
        metaDescription:
          "Md. Sujon Hasan is a Full Stack Developer specializing in MERN stack. Explore 20+ projects, skills in React, Node.js, MongoDB, and professional experience.",
        keywords: [
          "Md. Sujon Hasan",
          "Full Stack Developer",
          "MERN Stack",
          "React Developer",
          "Node.js Developer",
          "Portfolio",
          "Web Developer Bangladesh",
        ],
        autoGenerate: true,
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully! Check .env.local for admin credentials.",
    });
  } catch (error) {
    console.error("Seed error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: "Failed to seed database", details: message }, { status: 500 });
  }
}
