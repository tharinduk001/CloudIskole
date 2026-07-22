/**
 * "About the founder" content for the about page. Kept out of the JSX for
 * the same reason as `content/home.ts` — wording and timeline entries can be
 * revised without touching layout.
 */

export const founder = {
  name: "Tharindu Kalhara",
  title:
    "Cloud & DevOps Platforms Engineer Intern · AWS Community Builder · Lecturer at IDET",
  photo: "https://res.cloudinary.com/dopkcplb3/image/upload/v1784009414/hero_y0uxv0.png",
  bio: [
    "Tharindu is a Cloud & DevOps Platforms Engineer currently interning while completing his Bachelor of ICT (Honours) in Software Engineering at the University of Sri Jayewardenepura. He has trained more than 5,000 students and professionals across classrooms, corporate teams and the cloud-native community - and built CloudIskole to bring that same practical, hands-on training to Sri Lankan students right after their A/Ls.",
    "He is an AWS Community Builder, a lecturer in Cloud Operations and AWS at the Institute of Digital Engineering Technology (IDET), and a DevRel engineer at CertDirectory.io. He founded CryptX, Sri Lanka's first island-wide Hackathon, CTF and Designathon, and has been recognised as a LinkedIn Rising Star (Sri Lanka) and a Top 10 Tech Voice in Sri Lanka.",
  ],
  education: [
    {
      period: "2023 - 2027",
      institution: "University of Sri Jayewardenepura",
      detail: "BICT (Hons) in Software Engineering, undergraduate",
    },
    {
      period: "2022 - 2023",
      institution: "University of Moratuwa",
      detail: "Trainee Full Stack Developer programme - completed all 6 courses",
    },
    {
      period: "2021",
      institution: "Richmond College, Galle",
      detail: "Engineering Technology stream - 4 A's, 4th rank in Galle District",
    },
  ],
  experience: [
    {
      period: "2026 - Present",
      role: "Cloud & DevOps Platforms Engineer Intern",
      org: "N-able",
    },
    { period: "2026 - Present", role: "Lecturer, Cloud Operations & AWS", org: "IDET" },
    { period: "2025 - Present", role: "DevRel Engineer", org: "CertDirectory.io" },
    { period: "2022 - 2023", role: "Associate", org: "OREL IT" },
  ],
  certifications: [
    "AWS Certified Cloud Practitioner",
    "KCNA: Kubernetes and Cloud Native Associate",
    "Microsoft Certified: Azure Fundamentals",
    "Multicloud Network Associate (Aviatrix)",
    "GitHub Foundations",
    "LFS158: Introduction to Kubernetes",
    "LFS101: Introduction to Linux",
    "SKF100: Understanding the OWASP Top 10 Security Threats",
  ],
};
