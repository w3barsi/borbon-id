import { type Student } from "~/app/columns";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const studentRouter = createTRPCRouter({
  getStudents: protectedProcedure
    .query(() => {
      return students.map(s => ({ ...s, fullName: [s.firstName, s.middleName, s.lastName].join(" ") }))

    }),
});


export const students: Student[] = [
  {
    lrn: "123456789012",
    grade: 10,
    section: "A",
    firstName: "John",
    middleName: "Michael",
    lastName: "Doe",
    emergencyName: "Jane Doe",
    emergencyNumber: "09171234567",
  },
  {
    lrn: "123456789012",
    grade: 10,
    section: "A",
    firstName: "John",
    middleName: "Michael",
    lastName: "Deer",
    emergencyName: "Jane Deer",
    emergencyNumber: "09171234567",
  },
  {
    lrn: "234567890123",
    grade: 11,
    section: "B",
    firstName: "Emily",
    middleName: "Rose",
    lastName: "Smith",
    emergencyName: "Robert Smith",
    emergencyNumber: "09281234568",
  },
  {
    lrn: "345678901234",
    grade: 12,
    section: "C",
    firstName: "Michael",
    lastName: "Johnson",
    emergencyName: "Lisa Johnson",
    emergencyNumber: "09391234569",
  },
  {
    lrn: "456789012345",
    grade: 9,
    section: "D",
    firstName: "Sarah",
    middleName: "Jane",
    lastName: "Williams",
    emergencyName: "Mark Williams",
    emergencyNumber: "09401234560",
  },
  {
    lrn: "567890123456",
    grade: 10,
    section: "E",
    firstName: "David",
    middleName: "Lee",
    lastName: "Brown",
    emergencyName: "Anna Brown",
    emergencyNumber: "09511234561",
  },
  {
    lrn: "678901234567",
    grade: 11,
    section: "F",
    firstName: "Jessica",
    lastName: "Jones",
    emergencyName: "Paul Jones",
    emergencyNumber: "09621234562",
  },
  {
    lrn: "789012345678",
    grade: 12,
    section: "G",
    firstName: "Daniel",
    middleName: "James",
    lastName: "Garcia",
    emergencyName: "Maria Garcia",
    emergencyNumber: "09731234563",
  },
  {
    lrn: "890123456789",
    grade: 9,
    section: "H",
    firstName: "Sophia",
    middleName: "Grace",
    lastName: "Martinez",
    emergencyName: "Carlos Martinez",
    emergencyNumber: "09841234564",
  },
  {
    lrn: "901234567890",
    grade: 10,
    section: "I",
    firstName: "Christopher",
    lastName: "Hernandez",
    emergencyName: "Diana Hernandez",
    emergencyNumber: "09951234565",
  },
  {
    lrn: "012345678901",
    grade: 11,
    section: "J",
    firstName: "Olivia",
    middleName: "Marie",
    lastName: "Lopez",
    emergencyName: "Francisco Lopez",
    emergencyNumber: "09061234566",
  },
];
