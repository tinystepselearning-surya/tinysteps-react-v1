/**
 * populateStudentData.ts
 * Script to populate Firestore with sample parents and students
 * Run with: npx tsx src/scripts/populateStudentData.ts
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Firebase config - replace with your actual config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample parent data
const parents = [
  {
    id: "parent-001",
    email: "alice.johnson@example.com",
    displayName: "Alice Johnson",
    role: "parent",
    phoneNumber: "+1-555-0101",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    childIds: ["kid1", "kid2"],
    subscription: "premium",
    preferredLanguage: "en"
  },
  {
    id: "parent-002",
    email: "bob.smith@example.com",
    displayName: "Bob Smith",
    role: "parent",
    phoneNumber: "+1-555-0102",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    childIds: ["kid3", "kid4"],
    subscription: "free",
    preferredLanguage: "en"
  },
  {
    id: "parent-003",
    email: "carol.davis@example.com",
    displayName: "Carol Davis",
    role: "parent",
    phoneNumber: "+1-555-0103",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    childIds: ["kid5"],
    subscription: "premium",
    preferredLanguage: "en"
  },
  {
    id: "parent-004",
    email: "david.wilson@example.com",
    displayName: "David Wilson",
    role: "parent",
    phoneNumber: "+1-555-0104",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    childIds: ["kid6", "kid7"],
    subscription: "basic",
    preferredLanguage: "en"
  },
  {
    id: "parent-005",
    email: "emma.brown@example.com",
    displayName: "Emma Brown",
    role: "parent",
    phoneNumber: "+1-555-0105",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    childIds: ["kid8", "kid9", "kid10"],
    subscription: "premium",
    preferredLanguage: "en"
  }
];

// Sample student data
const students = [
  {
    id: "kid1",
    name: "Sophia Johnson",
    displayName: "Sophia",
    ageYears: 4,
    gender: "female",
    grade: "Pre-K",
    parentIds: ["parent-001"],
    teacherId: "teacher-001",
    enrolledCourses: ["phonics", "grammar"],
    currentPhase: 1,
    avatarUrl: "/avatars/kid1.png",
    preferredSubjects: ["phonics"],
    learningStyle: "visual",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid2",
    name: "Liam Johnson",
    displayName: "Liam",
    ageYears: 6,
    gender: "male",
    grade: "1st Grade",
    parentIds: ["parent-001"],
    teacherId: "teacher-001",
    enrolledCourses: ["phonics", "grammar", "speaking"],
    currentPhase: 3,
    avatarUrl: "/avatars/kid2.png",
    preferredSubjects: ["speaking"],
    learningStyle: "auditory",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid3",
    name: "Emma Smith",
    displayName: "Emma",
    ageYears: 5,
    gender: "female",
    grade: "Kindergarten",
    parentIds: ["parent-002"],
    teacherId: "teacher-002",
    enrolledCourses: ["phonics"],
    currentPhase: 2,
    avatarUrl: "/avatars/kid3.png",
    preferredSubjects: ["phonics"],
    learningStyle: "kinesthetic",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid4",
    name: "Noah Smith",
    displayName: "Noah",
    ageYears: 7,
    gender: "male",
    grade: "2nd Grade",
    parentIds: ["parent-002"],
    teacherId: "teacher-002",
    enrolledCourses: ["phonics", "grammar", "spellbee"],
    currentPhase: 5,
    avatarUrl: "/avatars/kid4.png",
    preferredSubjects: ["spellbee"],
    learningStyle: "visual",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid5",
    name: "Olivia Davis",
    displayName: "Olivia",
    ageYears: 3,
    gender: "female",
    grade: "Pre-K",
    parentIds: ["parent-003"],
    teacherId: "teacher-001",
    enrolledCourses: ["phonics"],
    currentPhase: 0,
    avatarUrl: "/avatars/kid5.png",
    preferredSubjects: ["phonics"],
    learningStyle: "visual",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid6",
    name: "Ava Wilson",
    displayName: "Ava",
    ageYears: 8,
    gender: "female",
    grade: "3rd Grade",
    parentIds: ["parent-004"],
    teacherId: "teacher-003",
    enrolledCourses: ["phonics", "grammar", "speaking", "spellbee"],
    currentPhase: 7,
    avatarUrl: "/avatars/kid6.png",
    preferredSubjects: ["grammar", "spellbee"],
    learningStyle: "auditory",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid7",
    name: "Ethan Wilson",
    displayName: "Ethan",
    ageYears: 6,
    gender: "male",
    grade: "1st Grade",
    parentIds: ["parent-004"],
    teacherId: "teacher-003",
    enrolledCourses: ["phonics", "grammar"],
    currentPhase: 4,
    avatarUrl: "/avatars/kid7.png",
    preferredSubjects: ["grammar"],
    learningStyle: "kinesthetic",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid8",
    name: "Mia Brown",
    displayName: "Mia",
    ageYears: 5,
    gender: "female",
    grade: "Kindergarten",
    parentIds: ["parent-005"],
    teacherId: "teacher-001",
    enrolledCourses: ["phonics", "speaking"],
    currentPhase: 2,
    avatarUrl: "/avatars/kid8.png",
    preferredSubjects: ["speaking"],
    learningStyle: "visual",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid9",
    name: "Lucas Brown",
    displayName: "Lucas",
    ageYears: 7,
    gender: "male",
    grade: "2nd Grade",
    parentIds: ["parent-005"],
    teacherId: "teacher-002",
    enrolledCourses: ["phonics", "grammar", "spellbee"],
    currentPhase: 6,
    avatarUrl: "/avatars/kid9.png",
    preferredSubjects: ["phonics", "spellbee"],
    learningStyle: "auditory",
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "kid10",
    name: "Charlotte Brown",
    displayName: "Charlotte",
    ageYears: 4,
    gender: "female",
    grade: "Pre-K",
    parentIds: ["parent-005"],
    teacherId: "teacher-001",
    enrolledCourses: ["phonics"],
    currentPhase: 1,
    avatarUrl: "/avatars/kid10.png",
    preferredSubjects: ["phonics"],
    learningStyle: "kinesthetic",
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// Sample teacher data
const teachers = [
  {
    id: "teacher-001",
    email: "jane.teacher@tinysteps.com",
    displayName: "Ms. Jane Anderson",
    role: "teacher",
    specialization: ["phonics", "speaking"],
    yearsOfExperience: 8,
    studentIds: ["kid1", "kid2", "kid5", "kid8", "kid10"],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "teacher-002",
    email: "john.teacher@tinysteps.com",
    displayName: "Mr. John Martinez",
    role: "teacher",
    specialization: ["grammar", "spellbee"],
    yearsOfExperience: 5,
    studentIds: ["kid3", "kid4", "kid9"],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "teacher-003",
    email: "sarah.teacher@tinysteps.com",
    displayName: "Ms. Sarah Chen",
    role: "teacher",
    specialization: ["phonics", "grammar", "spellbee"],
    yearsOfExperience: 12,
    studentIds: ["kid6", "kid7"],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

async function populateData() {
  console.log("🚀 Starting data population...\n");

  try {
    // 1. Create parents
    console.log("📝 Creating parent accounts...");
    for (const parent of parents) {
      await setDoc(doc(db, "users", parent.id), parent);
      console.log(`✅ Created parent: ${parent.displayName} (${parent.email})`);
    }
    console.log(`✅ Created ${parents.length} parents\n`);

    // 2. Create teachers
    console.log("📝 Creating teacher accounts...");
    for (const teacher of teachers) {
      await setDoc(doc(db, "users", teacher.id), teacher);
      console.log(`✅ Created teacher: ${teacher.displayName}`);
    }
    console.log(`✅ Created ${teachers.length} teachers\n`);

    // 3. Create students
    console.log("📝 Creating student profiles...");
    for (const student of students) {
      await setDoc(doc(db, "students", student.id), student);
      
      // Initialize empty summary for each student
      await setDoc(doc(db, `students/${student.id}/summary/overall`), {
        lastUpdated: Date.now(),
        masteryPct: { phonics: 0, grammar: 0, speaking: 0, spellbee: 0 },
        weakestSkills: [],
        totalSessionsPlayed: 0,
        totalTimeMinutes: 0,
        currentStreak: 0,
        longestStreak: 0
      });

      console.log(`✅ Created student: ${student.name} (Age ${student.ageYears}, Phase ${student.currentPhase})`);
    }
    console.log(`✅ Created ${students.length} students\n`);

    console.log("🎉 Data population complete!");
    console.log("\n📊 Summary:");
    console.log(`   Parents: ${parents.length}`);
    console.log(`   Teachers: ${teachers.length}`);
    console.log(`   Students: ${students.length}`);
    console.log("\n🔗 Parent-Child Relationships:");
    parents.forEach(parent => {
      console.log(`   ${parent.displayName} → ${parent.childIds.length} child(ren)`);
    });

  } catch (error) {
    console.error("❌ Error populating data:", error);
    throw error;
  }
}

// Run the script
populateData()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
  });
