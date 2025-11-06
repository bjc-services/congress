import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const enumNeedyObjectsMaritalStatus = pgEnum(
  "enum_NeedyObjects_maritalStatus",
  ["נשוי", "רווק", "גרוש", "אלמן"],
);
export const enumNeedyObjectsType = pgEnum("enum_NeedyObjects_type", [
  "אברך",
  "נתמך מחלקת רווחה",
  "נתמך קמחא דפסחא",
  "גבאי",
  "רב קהילה",
  "בחור ישיבה",
  "מפונים",
  "משפחות חרבות ברזל",
]);
export const enumOrganizationObjectsType = pgEnum(
  "enum_OrganizationObjects_type",
  [
    "בית כנסת",
    "בית חב'ד",
    "כולל",
    "קהילה מקומית",
    "נציג הקונגרס",
    "מועדונית נשים",
    "אחר",
  ],
);
export const enumPaymentObjectsType = pgEnum("enum_PaymentObjects_type", [
  "כרטיס",
  "העברה בנקאית",
  "שיק",
  "אחר",
  "שובר",
]);
export const enumRhNeedyObjectsMaritalStatus = pgEnum(
  "enum_RH_NeedyObjects_maritalStatus",
  ["נשוי", "רווק", "גרוש", "אלמן"],
);
export const enumRhNeedyObjectsType = pgEnum("enum_RH_NeedyObjects_type", [
  "אברך",
  "נתמך מחלקת רווחה",
  "נתמך קמחא דפסחא",
]);
export const enumRhOrganizationObjectsType = pgEnum(
  "enum_RH_OrganizationObjects_type",
  [
    "בית כנסת",
    "בית חב'ד",
    "כולל",
    "קהילה מקומית",
    "נציג הקונגרס",
    "מועדונית נשים",
    "אחר",
  ],
);
export const enumRhPaymentObjectsType = pgEnum("enum_RH_PaymentObjects_type", [
  "כרטיס",
  "העברה בנקאית",
  "שיק",
  "אחר",
]);
export const enumRhStudentObjectsKollelType = pgEnum(
  "enum_RH_StudentObjects_kollelType",
  ["יום שלם", "חצי יום"],
);
export const enumRhSupportRecommendationObjectsRecommenderType = pgEnum(
  "enum_RH_SupportRecommendationObjects_recommenderType",
  ["מנהל", "רכז", "וועדת רווחה", "מחלקת רווחה"],
);
export const enumRhUserObjectsRole = pgEnum("enum_RH_UserObjects_role", [
  "מנהל",
  "רכז",
  "וועדת רווחה",
  "מחלקת רווחה",
]);
export const enumSPaymentObject2023SType = pgEnum(
  "enum_S_PaymentObject_2023s_type",
  ["כרטיס", "העברה בנקאית", "שיק", "אחר"],
);
export const enumSPaymentObject2024SType = pgEnum(
  "enum_S_PaymentObject_2024s_type",
  ["כרטיס", "העברה בנקאית", "שיק", "אחר"],
);
export const enumSPaymentObject2025SType = pgEnum(
  "enum_S_PaymentObject_2025s_type",
  ["כרטיס", "העברה בנקאית", "שיק", "אחר"],
);
export const enumSPaymentObjectsType = pgEnum("enum_S_PaymentObjects_type", [
  "כרטיס",
  "העברה בנקאית",
  "שיק",
  "אחר",
]);
export const enumSStudentObject2023SMaritalStatus = pgEnum(
  "enum_S_StudentObject_2023s_maritalStatus",
  ["נשוי", "רווק", "גרוש", "אלמן"],
);
export const enumSStudentObject2024SMaritalStatus = pgEnum(
  "enum_S_StudentObject_2024s_maritalStatus",
  ["נשוי", "רווק", "גרוש", "אלמן"],
);
export const enumSStudentObject2025SMaritalStatus = pgEnum(
  "enum_S_StudentObject_2025s_maritalStatus",
  ["נשוי", "רווק", "גרוש", "אלמן"],
);
export const enumSStudentObjectsMaritalStatus = pgEnum(
  "enum_S_StudentObjects_maritalStatus",
  ["נשוי", "רווק", "גרוש", "אלמן"],
);
export const enumSSupportObject2023SRecommenderType = pgEnum(
  "enum_S_SupportObject_2023s_recommenderType",
  ["מנהל", "temp", "רכז", "וועדת רווחה", "מחלקת רווחה"],
);
export const enumSSupportObject2024SRecommenderType = pgEnum(
  "enum_S_SupportObject_2024s_recommenderType",
  ["מנהל", "temp", "רכז", "וועדת רווחה", "מחלקת רווחה"],
);
export const enumSSupportObject2025SRecommenderType = pgEnum(
  "enum_S_SupportObject_2025s_recommenderType",
  ["מנהל", "temp", "רכז", "וועדת רווחה", "מחלקת רווחה"],
);
export const enumSSupportObjectsRecommenderType = pgEnum(
  "enum_S_SupportObjects_recommenderType",
  ["מנהל", "temp", "רכז", "וועדת רווחה", "מחלקת רווחה"],
);
export const enumSUserObject2023SRole = pgEnum("enum_S_UserObject_2023s_role", [
  "מנהל",
  "temp",
  "רכז",
  "וועדת רווחה",
  "מחלקת רווחה",
]);
export const enumSUserObject2024SRole = pgEnum("enum_S_UserObject_2024s_role", [
  "מנהל",
  "temp",
  "רכז",
  "וועדת רווחה",
  "מחלקת רווחה",
]);
export const enumSUserObject2025SRole = pgEnum("enum_S_UserObject_2025s_role", [
  "מנהל",
  "temp",
  "רכז",
  "וועדת רווחה",
  "מחלקת רווחה",
]);
export const enumSUserObjectsRole = pgEnum("enum_S_UserObjects_role", [
  "מנהל",
  "temp",
  "רכז",
  "וועדת רווחה",
  "מחלקת רווחה",
]);
export const enumStudentObjectsKollelType = pgEnum(
  "enum_StudentObjects_kollelType",
  ["יום שלם", "חצי יום", "ישיבה קטנה", "ישיבה גדולה"],
);
export const enumSupportRecommendationObjectsRecommenderType = pgEnum(
  "enum_SupportRecommendationObjects_recommenderType",
  ["מנהל", "רכז", "וועדת רווחה", "מחלקת רווחה"],
);
export const enumUserObjectsRole = pgEnum("enum_UserObjects_role", [
  "מנהל",
  "רכז",
  "וועדת רווחה",
  "מחלקת רווחה",
]);
export const enumWalPaymentObjectsType = pgEnum(
  "enum_WAL_PaymentObjects_type",
  ["העברה בנקאית", "שיק", "אחר"],
);
export const enumWalRequestObjectsHmo = pgEnum("enum_WAL_RequestObjects_HMO", [
  "מאוחדת",
  "מכבי",
  "לאומית",
  "כללית",
  "אחר",
]);
export const enumWalRequestObjectsMaritalStatus = pgEnum(
  "enum_WAL_RequestObjects_maritalStatus",
  ["נשוי/אה", "רווק/ה", "גרוש/ה", "אלמן/ה", "פרוד/ה"],
);
export const enumWalRequestObjectsResidenceType = pgEnum(
  "enum_WAL_RequestObjects_residenceType",
  ["בעלות", "שכירות", "עמידר", "הורים", "בית אבות"],
);
export const enumWalSupportObjectsRecommenderType = pgEnum(
  "enum_WAL_SupportObjects_recommenderType",
  ["מנהל", "temp"],
);
export const enumWalUserObjectsRole = pgEnum("enum_WAL_UserObjects_role", [
  "מנהל",
  "temp",
]);

export const sStudentObject2025S = pgTable("S_StudentObject_2025s", {
  id: serial().primaryKey().notNull(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  gender: varchar({ length: 255 }),
  ssn: varchar({ length: 255 }),
  maritalStatus: enumSStudentObject2025SMaritalStatus(),
  birthDate: timestamp({ withTimezone: true, mode: "string" }),
  countryOfBirth: varchar({ length: 255 }),
  aliahDate: timestamp({ withTimezone: true, mode: "string" }),
  address: varchar({ length: 255 }),
  city: varchar({ length: 255 }),
  zipCode: integer(),
  poBox: varchar("POBox", { length: 255 }),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  additionalPhone: varchar({ length: 255 }),
  academicInstitution: varchar({ length: 255 }),
  degree: varchar({ length: 255 }),
  schoolYear: integer(),
  faculty: varchar({ length: 255 }),
  tuition: integer(),
  college: varchar({ length: 255 }),
  collegeType: varchar({ length: 255 }),
  isMilitaryService: boolean(),
  isHaravotBarzelService: boolean(),
  isWifeHaravotBarzelService: boolean(),
  isCombat: boolean(),
  militaryJob: varchar({ length: 255 }),
  rank: varchar({ length: 255 }),
  monthOfMilitaryService: integer(),
  isWork: boolean(),
  workPlace: varchar({ length: 255 }),
  workPhone: varchar({ length: 255 }),
  workJob: varchar({ length: 255 }),
  salary: integer(),
  isPartnerWork: boolean(),
  partnerWorkPlace: varchar({ length: 255 }),
  partnerWorkPhone: varchar({ length: 255 }),
  partnerWorkJob: varchar({ length: 255 }),
  partnerSalary: integer(),
  fatherFirstName: varchar({ length: 255 }),
  fatherLastName: varchar({ length: 255 }),
  fatherSsn: varchar({ length: 255 }),
  motherFirstName: varchar({ length: 255 }),
  motherLastName: varchar({ length: 255 }),
  motherSsn: varchar({ length: 255 }),
  numberOfPersons: integer(),
  volunteeringPreferredArea: varchar({ length: 255 }),
  description: varchar({ length: 255 }),
  messages: varchar({ length: 255 }),
  newDocs: integer(),
  supportAmount: integer(),
  lastYearsStatus: varchar({ length: 255 }),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  firsttimestatement: boolean(),
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  bankAccountNo: bigint({ mode: "number" }),
  bankNo: integer(),
  bankBranchNo: integer(),
});

export const sDocumentObject2025S = pgTable(
  "S_DocumentObject_2025s",
  {
    id: serial().primaryKey().notNull(),
    fileName: varchar({ length: 255 }),
    doc: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2025S.id],
      name: "S_DocumentObject_2025s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sPaymentObject2025S = pgTable(
  "S_PaymentObject_2025s",
  {
    id: serial().primaryKey().notNull(),
    date: timestamp({ withTimezone: true, mode: "string" }),
    amount: integer(),
    type: enumSPaymentObject2025SType(),
    receiver: varchar({ length: 255 }),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    receiverSignatureDocId: integer(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.receiverSignatureDocId],
      foreignColumns: [sDocumentObject2025S.id],
      name: "S_PaymentObject_2025s_receiverSignatureDocId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2025S.id],
      name: "S_PaymentObject_2025s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObject2025S.id],
      name: "S_PaymentObject_2025s_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sUserObject2025S = pgTable("S_UserObject_2025s", {
  id: serial().primaryKey().notNull(),
  username: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  role: enumSUserObject2025SRole(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  isActive: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const sSupportObject2025S = pgTable(
  "S_SupportObject_2025s",
  {
    id: serial().primaryKey().notNull(),
    sum: integer(),
    recommendDate: timestamp({ withTimezone: true, mode: "string" }),
    recommenderType: enumSSupportObject2025SRecommenderType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    recommenderId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2025S.id],
      name: "S_SupportObject_2025s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.recommenderId],
      foreignColumns: [sUserObject2025S.id],
      name: "S_SupportObject_2025s_recommenderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sOfficeNoteObject2025S = pgTable(
  "S_OfficeNoteObject_2025s",
  {
    id: serial().primaryKey().notNull(),
    content: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2025S.id],
      name: "S_OfficeNoteObject_2025s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObject2025S.id],
      name: "S_OfficeNoteObject_2025s_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const couponCardObjects = pgTable(
  "CouponCardObjects",
  {
    id: integer().primaryKey().notNull(),
    value: integer(),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    paymentId: integer(),
    projectId: integer(),
    cardId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [paymentObjects.id],
      name: "CouponCardObjects_paymentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_CouponCardObjects_ProjectObjects",
    }),
  ],
);

export const documentObjects = pgTable(
  "DocumentObjects",
  {
    id: serial().primaryKey().notNull(),
    fileName: varchar({ length: 255 }),
    doc: varchar(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [needyObjects.id],
      name: "DocumentObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_DocumentObjects_ProjectObjects",
    }),
  ],
);

export const coordinatorObjects = pgTable(
  "CoordinatorObjects",
  {
    id: serial().primaryKey().notNull(),
    ssn: varchar({ length: 255 }),
    address: varchar({ length: 255 }),
    city: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    userId: integer(),
    organizationId: integer(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizationObjects.id],
      name: "CoordinatorObjects_organizationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userObjects.id],
      name: "CoordinatorObjects_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_CoordinatorObjects_ProjectObjects",
    }),
  ],
);

export const committeePersonObjects = pgTable(
  "CommitteePersonObjects",
  {
    id: serial().primaryKey().notNull(),
    ssn: varchar({ length: 255 }),
    name: varchar({ length: 255 }),
    phone: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    coordinatorId: integer(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.coordinatorId],
      foreignColumns: [coordinatorObjects.id],
      name: "CommitteePersonObjects_coordinatorId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "CommitteePersonObjects_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const rhOrganizationObjects = pgTable("RH_OrganizationObjects", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 255 }),
  address: varchar({ length: 255 }),
  city: varchar({ length: 255 }),
  type: enumRhOrganizationObjectsType(),
  organizationNo: varchar({ length: 255 }),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const rhPaymentObjects = pgTable(
  "RH_PaymentObjects",
  {
    id: serial().primaryKey().notNull(),
    date: timestamp({ withTimezone: true, mode: "string" }),
    amount: integer(),
    type: enumRhPaymentObjectsType(),
    receiver: varchar({ length: 255 }),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
    receiverSignatureDocId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [rhNeedyObjects.id],
      name: "RH_PaymentObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.receiverSignatureDocId],
      foreignColumns: [rhDocumentObjects.id],
      name: "RH_PaymentObjects_receiverSignatureDocId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [rhUserObjects.id],
      name: "RH_PaymentObjects_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const rhCouponCardObjects = pgTable(
  "RH_CouponCardObjects",
  {
    id: integer().primaryKey().notNull(),
    value: integer(),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    paymentId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.paymentId],
      foreignColumns: [rhPaymentObjects.id],
      name: "RH_CouponCardObjects_paymentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const paymentObjects = pgTable(
  "PaymentObjects",
  {
    id: serial().primaryKey().notNull(),
    date: timestamp({ withTimezone: true, mode: "string" }),
    amount: integer(),
    type: enumPaymentObjectsType(),
    receiver: varchar({ length: 255 }),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
    receiverSignatureDocId: integer(),
    userEnterId: integer(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_PaymentObjects_ProjectObjects",
    }),
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [needyObjects.id],
      name: "PaymentObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.receiverSignatureDocId],
      foreignColumns: [documentObjects.id],
      name: "PaymentObjects_receiverSignatureDocId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [userObjects.id],
      name: "PaymentObjects_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const needyObjects = pgTable(
  "NeedyObjects",
  {
    id: serial().primaryKey().notNull(),
    ssn: varchar({ length: 255 }),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    phone: varchar({ length: 255 }),
    mobilePhone: varchar({ length: 255 }),
    address: varchar({ length: 255 }),
    city: varchar({ length: 255 }),
    numberOfPersons: integer(),
    maritalStatus: enumNeedyObjectsMaritalStatus(),
    type: enumNeedyObjectsType(),
    description: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    creatorId: integer(),
    organizationId: integer(),
    projectId: integer(),
    messages: varchar(),
    newDocs: integer().default(0),
    email: varchar(),
    lastYearStatus: integer(),
    bankNo: integer(),
    bankBranchNo: integer(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    bankAccountNo: bigint({ mode: "number" }),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_NeedyObjects_ProjectObjects",
    }),
    foreignKey({
      columns: [table.creatorId],
      foreignColumns: [userObjects.id],
      name: "NeedyObjects_creatorId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizationObjects.id],
      name: "NeedyObjects_organizationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const organizationObjects = pgTable(
  "OrganizationObjects",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }),
    address: varchar({ length: 255 }),
    city: varchar({ length: 255 }),
    type: enumOrganizationObjectsType(),
    organizationNo: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_OrganizationObjects_ProjectObjects",
    }),
  ],
);

export const rhNeedyObjects = pgTable(
  "RH_NeedyObjects",
  {
    id: serial().primaryKey().notNull(),
    ssn: varchar({ length: 255 }),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    phone: varchar({ length: 255 }),
    mobilePhone: varchar({ length: 255 }),
    address: varchar({ length: 255 }),
    city: varchar({ length: 255 }),
    numberOfPersons: integer(),
    maritalStatus: enumRhNeedyObjectsMaritalStatus(),
    type: enumRhNeedyObjectsType(),
    description: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    creatorId: integer(),
    organizationId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.creatorId],
      foreignColumns: [rhUserObjects.id],
      name: "RH_NeedyObjects_creatorId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [rhOrganizationObjects.id],
      name: "RH_NeedyObjects_organizationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const rhStudentObjects = pgTable(
  "RH_StudentObjects",
  {
    id: serial().primaryKey().notNull(),
    kollelName: varchar({ length: 255 }),
    headOfTheKollelName: varchar({ length: 255 }),
    headOfTheKollelPhone: varchar({ length: 255 }),
    kollelType: enumRhStudentObjectsKollelType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [rhNeedyObjects.id],
      name: "RH_StudentObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const rhSupportRecommendationObjects = pgTable(
  "RH_SupportRecommendationObjects",
  {
    id: serial().primaryKey().notNull(),
    sum: integer(),
    recommendDate: timestamp({ withTimezone: true, mode: "string" }),
    recommenderType: enumRhSupportRecommendationObjectsRecommenderType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
    recommenderId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [rhNeedyObjects.id],
      name: "RH_SupportRecommendationObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.recommenderId],
      foreignColumns: [rhUserObjects.id],
      name: "RH_SupportRecommendationObjects_recommenderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const rhDocumentObjects = pgTable(
  "RH_DocumentObjects",
  {
    id: serial().primaryKey().notNull(),
    fileName: varchar({ length: 255 }),
    doc: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [rhNeedyObjects.id],
      name: "RH_DocumentObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const projectObjects = pgTable("ProjectObjects", {
  id: serial().primaryKey().notNull(),
  name: varchar({ length: 255 }),
  isActive: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const rhCoordinatorObjects = pgTable(
  "RH_CoordinatorObjects",
  {
    id: serial().primaryKey().notNull(),
    ssn: varchar({ length: 255 }),
    address: varchar({ length: 255 }),
    city: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    userId: integer(),
    organizationId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [rhOrganizationObjects.id],
      name: "RH_CoordinatorObjects_organizationId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [rhUserObjects.id],
      name: "RH_CoordinatorObjects_userId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sStudentObject2023S = pgTable("S_StudentObject_2023s", {
  id: serial().primaryKey().notNull(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  gender: varchar({ length: 255 }),
  ssn: varchar({ length: 255 }),
  maritalStatus: enumSStudentObject2023SMaritalStatus(),
  birthDate: timestamp({ withTimezone: true, mode: "string" }),
  countryOfBirth: varchar({ length: 255 }),
  aliahDate: timestamp({ withTimezone: true, mode: "string" }),
  address: varchar({ length: 255 }),
  city: varchar({ length: 255 }),
  zipCode: integer(),
  poBox: varchar("POBox", { length: 255 }),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  additionalPhone: varchar({ length: 255 }),
  academicInstitution: varchar({ length: 255 }),
  degree: varchar({ length: 255 }),
  schoolYear: integer(),
  faculty: varchar({ length: 255 }),
  tuition: integer(),
  college: varchar({ length: 255 }),
  collegeType: varchar({ length: 255 }),
  isMilitaryService: boolean(),
  isCombat: boolean(),
  militaryJob: varchar({ length: 255 }),
  rank: varchar({ length: 255 }),
  monthOfMilitaryService: integer(),
  isWork: boolean(),
  workPlace: varchar({ length: 255 }),
  workPhone: varchar({ length: 255 }),
  workJob: varchar({ length: 255 }),
  salary: integer(),
  isPartnerWork: boolean(),
  partnerWorkPlace: varchar({ length: 255 }),
  partnerWorkPhone: varchar({ length: 255 }),
  partnerWorkJob: varchar({ length: 255 }),
  partnerSalary: integer(),
  fatherFirstName: varchar({ length: 255 }),
  fatherLastName: varchar({ length: 255 }),
  fatherSsn: varchar({ length: 255 }),
  motherFirstName: varchar({ length: 255 }),
  motherLastName: varchar({ length: 255 }),
  motherSsn: varchar({ length: 255 }),
  numberOfPersons: integer(),
  volunteeringPreferredArea: varchar({ length: 255 }),
  description: varchar({ length: 255 }),
  supportAmount: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  messages: varchar(),
  newDocs: integer(),
});

export const sOfficeNoteObject2024S = pgTable(
  "S_OfficeNoteObject_2024s",
  {
    id: serial().primaryKey().notNull(),
    content: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2024S.id],
      name: "S_OfficeNoteObject_2024s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObject2024S.id],
      name: "S_OfficeNoteObject_2024s_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sStudentObject2024S = pgTable("S_StudentObject_2024s", {
  id: serial().primaryKey().notNull(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  gender: varchar({ length: 255 }),
  ssn: varchar({ length: 255 }),
  maritalStatus: enumSStudentObject2024SMaritalStatus(),
  birthDate: timestamp({ withTimezone: true, mode: "string" }),
  countryOfBirth: varchar({ length: 255 }),
  aliahDate: timestamp({ withTimezone: true, mode: "string" }),
  address: varchar({ length: 255 }),
  city: varchar({ length: 255 }),
  zipCode: integer(),
  poBox: varchar("POBox", { length: 255 }),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  additionalPhone: varchar({ length: 255 }),
  academicInstitution: varchar({ length: 255 }),
  degree: varchar({ length: 255 }),
  schoolYear: integer(),
  faculty: varchar({ length: 255 }),
  tuition: integer(),
  college: varchar({ length: 255 }),
  collegeType: varchar({ length: 255 }),
  isMilitaryService: boolean(),
  isCombat: boolean(),
  militaryJob: varchar({ length: 255 }),
  rank: varchar({ length: 255 }),
  monthOfMilitaryService: integer(),
  isWork: boolean(),
  workPlace: varchar({ length: 255 }),
  workPhone: varchar({ length: 255 }),
  workJob: varchar({ length: 255 }),
  salary: integer(),
  isPartnerWork: boolean(),
  partnerWorkPlace: varchar({ length: 255 }),
  partnerWorkPhone: varchar({ length: 255 }),
  partnerWorkJob: varchar({ length: 255 }),
  partnerSalary: integer(),
  fatherFirstName: varchar({ length: 255 }),
  fatherLastName: varchar({ length: 255 }),
  fatherSsn: varchar({ length: 255 }),
  motherFirstName: varchar({ length: 255 }),
  motherLastName: varchar({ length: 255 }),
  motherSsn: varchar({ length: 255 }),
  numberOfPersons: integer(),
  volunteeringPreferredArea: varchar({ length: 255 }),
  description: varchar({ length: 255 }),
  messages: varchar({ length: 255 }),
  newDocs: integer(),
  supportAmount: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  isHaravotBarzelService: boolean(),
  isWifeHaravotBarzelService: boolean(),
});

export const sDocumentObjects = pgTable(
  "S_DocumentObjects",
  {
    id: serial().primaryKey().notNull(),
    fileName: varchar({ length: 255 }),
    doc: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObjects.id],
      name: "S_DocumentObjects_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sOfficeNoteObjects = pgTable(
  "S_OfficeNoteObjects",
  {
    id: serial().primaryKey().notNull(),
    content: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObjects.id],
      name: "S_OfficeNoteObjects_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObjects.id],
      name: "S_OfficeNoteObjects_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sOfficeNoteObject2023S = pgTable(
  "S_OfficeNoteObject_2023s",
  {
    id: serial().primaryKey().notNull(),
    content: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2023S.id],
      name: "S_OfficeNoteObject_2023s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObject2023S.id],
      name: "S_OfficeNoteObject_2023s_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sPaymentObject2023S = pgTable(
  "S_PaymentObject_2023s",
  {
    id: serial().primaryKey().notNull(),
    date: timestamp({ withTimezone: true, mode: "string" }),
    amount: integer(),
    type: enumSPaymentObject2023SType(),
    receiver: varchar({ length: 255 }),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    receiverSignatureDocId: integer(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.receiverSignatureDocId],
      foreignColumns: [sDocumentObject2023S.id],
      name: "S_PaymentObject_2023s_receiverSignatureDocId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2023S.id],
      name: "S_PaymentObject_2023s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObject2023S.id],
      name: "S_PaymentObject_2023s_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sPaymentObject2024S = pgTable(
  "S_PaymentObject_2024s",
  {
    id: serial().primaryKey().notNull(),
    date: timestamp({ withTimezone: true, mode: "string" }),
    amount: integer(),
    type: enumSPaymentObject2024SType(),
    receiver: varchar({ length: 255 }),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    receiverSignatureDocId: integer(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.receiverSignatureDocId],
      foreignColumns: [sDocumentObject2024S.id],
      name: "S_PaymentObject_2024s_receiverSignatureDocId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2024S.id],
      name: "S_PaymentObject_2024s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObject2024S.id],
      name: "S_PaymentObject_2024s_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sPaymentObjects = pgTable(
  "S_PaymentObjects",
  {
    id: serial().primaryKey().notNull(),
    date: timestamp({ withTimezone: true, mode: "string" }),
    amount: integer(),
    type: enumSPaymentObjectsType(),
    receiver: varchar({ length: 255 }),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    receiverSignatureDocId: integer(),
    studentId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.receiverSignatureDocId],
      foreignColumns: [sDocumentObjects.id],
      name: "S_PaymentObjects_receiverSignatureDocId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObjects.id],
      name: "S_PaymentObjects_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [sUserObjects.id],
      name: "S_PaymentObjects_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sDocumentObject2024S = pgTable(
  "S_DocumentObject_2024s",
  {
    id: serial().primaryKey().notNull(),
    fileName: varchar({ length: 255 }),
    doc: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2024S.id],
      name: "S_DocumentObject_2024s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const rhUserObjects = pgTable("RH_UserObjects", {
  id: serial().primaryKey().notNull(),
  username: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  role: enumRhUserObjectsRole(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  isActive: integer(),
  canCreate: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const sDocumentObject2023S = pgTable(
  "S_DocumentObject_2023s",
  {
    id: serial().primaryKey().notNull(),
    fileName: varchar({ length: 255 }),
    doc: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2023S.id],
      name: "S_DocumentObject_2023s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sUserObject2023S = pgTable("S_UserObject_2023s", {
  id: serial().primaryKey().notNull(),
  username: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  role: enumSUserObject2023SRole(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  isActive: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const walDocumentObjects = pgTable(
  "WAL_DocumentObjects",
  {
    id: serial().primaryKey().notNull(),
    fileName: varchar({ length: 255 }),
    doc: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    requestId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [walRequestObjects.id],
      name: "WAL_DocumentObjects_requestId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sSupportObject2024S = pgTable(
  "S_SupportObject_2024s",
  {
    id: serial().primaryKey().notNull(),
    sum: integer(),
    recommendDate: timestamp({ withTimezone: true, mode: "string" }),
    recommenderType: enumSSupportObject2024SRecommenderType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    recommenderId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.recommenderId],
      foreignColumns: [sUserObject2024S.id],
      name: "S_SupportObject_2024s_recommenderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2024S.id],
      name: "S_SupportObject_2024s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sUserObjects = pgTable("S_UserObjects", {
  id: serial().primaryKey().notNull(),
  username: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  role: enumSUserObjectsRole(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  isActive: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const sSupportObjects = pgTable(
  "S_SupportObjects",
  {
    id: serial().primaryKey().notNull(),
    sum: integer(),
    recommendDate: timestamp({ withTimezone: true, mode: "string" }),
    recommenderType: enumSSupportObjectsRecommenderType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    recommenderId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.recommenderId],
      foreignColumns: [sUserObjects.id],
      name: "S_SupportObjects_recommenderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObjects.id],
      name: "S_SupportObjects_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const studentChildObjects = pgTable(
  "StudentChildObjects",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }),
    ssn: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "StudentChildObjects_projectId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [studentObjects.id],
      name: "StudentChildObjects_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sUserObject2024S = pgTable("S_UserObject_2024s", {
  id: serial().primaryKey().notNull(),
  username: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  role: enumSUserObject2024SRole(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  isActive: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const sSupportObject2023S = pgTable(
  "S_SupportObject_2023s",
  {
    id: serial().primaryKey().notNull(),
    sum: integer(),
    recommendDate: timestamp({ withTimezone: true, mode: "string" }),
    recommenderType: enumSSupportObject2023SRecommenderType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    studentId: integer(),
    recommenderId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.recommenderId],
      foreignColumns: [sUserObject2023S.id],
      name: "S_SupportObject_2023s_recommenderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.studentId],
      foreignColumns: [sStudentObject2023S.id],
      name: "S_SupportObject_2023s_studentId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const supportRecommendationObjects = pgTable(
  "SupportRecommendationObjects",
  {
    id: serial().primaryKey().notNull(),
    sum: integer(),
    recommendDate: timestamp({ withTimezone: true, mode: "string" }),
    recommenderType: enumSupportRecommendationObjectsRecommenderType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
    recommenderId: integer(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_SupportRecommendationObjects_ProjectObjects",
    }),
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [needyObjects.id],
      name: "SupportRecommendationObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.recommenderId],
      foreignColumns: [userObjects.id],
      name: "SupportRecommendationObjects_recommenderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const sStudentObjects = pgTable("S_StudentObjects", {
  id: serial().primaryKey().notNull(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  gender: varchar({ length: 255 }),
  ssn: varchar({ length: 255 }),
  maritalStatus: enumSStudentObjectsMaritalStatus(),
  birthDate: timestamp({ withTimezone: true, mode: "string" }),
  countryOfBirth: varchar({ length: 255 }),
  aliahDate: timestamp({ withTimezone: true, mode: "string" }),
  address: varchar({ length: 255 }),
  city: varchar({ length: 255 }),
  zipCode: integer(),
  poBox: varchar("POBox", { length: 255 }),
  email: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  additionalPhone: varchar({ length: 255 }),
  academicInstitution: varchar({ length: 255 }),
  degree: varchar({ length: 255 }),
  schoolYear: integer(),
  faculty: varchar({ length: 255 }),
  tuition: integer(),
  college: varchar({ length: 255 }),
  collegeType: varchar({ length: 255 }),
  isMilitaryService: boolean(),
  isCombat: boolean(),
  militaryJob: varchar({ length: 255 }),
  rank: varchar({ length: 255 }),
  monthOfMilitaryService: integer(),
  isWork: boolean(),
  workPlace: varchar({ length: 255 }),
  workPhone: varchar({ length: 255 }),
  workJob: varchar({ length: 255 }),
  salary: integer(),
  isPartnerWork: boolean(),
  partnerWorkPlace: varchar({ length: 255 }),
  partnerWorkPhone: varchar({ length: 255 }),
  partnerWorkJob: varchar({ length: 255 }),
  partnerSalary: integer(),
  fatherFirstName: varchar({ length: 255 }),
  fatherLastName: varchar({ length: 255 }),
  fatherSsn: varchar({ length: 255 }),
  motherFirstName: varchar({ length: 255 }),
  motherLastName: varchar({ length: 255 }),
  motherSsn: varchar({ length: 255 }),
  numberOfPersons: integer(),
  volunteeringPreferredArea: varchar({ length: 255 }),
  description: varchar({ length: 1023 }).default(sql`NULL`),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  supportAmount: integer(),
});

export const studentObjects = pgTable(
  "StudentObjects",
  {
    id: serial().primaryKey().notNull(),
    kollelName: varchar({ length: 255 }),
    headOfTheKollelName: varchar({ length: 255 }),
    headOfTheKollelPhone: varchar({ length: 255 }),
    kollelType: enumStudentObjectsKollelType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    needyId: integer(),
    projectId: integer(),
    ssnWife: varchar(),
    firstNameWife: varchar(),
    lastNameWife: varchar(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_StudentObjects_ProjectObjects",
    }),
    foreignKey({
      columns: [table.needyId],
      foreignColumns: [needyObjects.id],
      name: "StudentObjects_needyId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const walOfficeNoteObjects = pgTable(
  "WAL_OfficeNoteObjects",
  {
    id: serial().primaryKey().notNull(),
    content: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    requestId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [walRequestObjects.id],
      name: "WAL_OfficeNoteObjects_requestId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [walUserObjects.id],
      name: "WAL_OfficeNoteObjects_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const userObjects = pgTable(
  "UserObjects",
  {
    id: serial().primaryKey().notNull(),
    username: varchar({ length: 255 }),
    password: varchar({ length: 255 }),
    role: enumUserObjectsRole(),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    phone: varchar({ length: 255 }),
    isActive: integer(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    canCreate: integer(),
    projectId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projectObjects.id],
      name: "FK_UserObjects_ProjectObjects",
    }),
  ],
);

export const walPersonObjects = pgTable(
  "WAL_PersonObjects",
  {
    id: serial().primaryKey().notNull(),
    ssn: varchar({ length: 255 }),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    birthDate: timestamp({ withTimezone: true, mode: "string" }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    requestId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [walRequestObjects.id],
      name: "WAL_PersonObjects_requestId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const walPaymentObjects = pgTable(
  "WAL_PaymentObjects",
  {
    id: serial().primaryKey().notNull(),
    date: timestamp({ withTimezone: true, mode: "string" }),
    amount: integer(),
    type: enumWalPaymentObjectsType(),
    receiver: varchar({ length: 255 }),
    serialNumber: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    receiverSignatureDocId: integer(),
    requestId: integer(),
    userEnterId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.receiverSignatureDocId],
      foreignColumns: [walDocumentObjects.id],
      name: "WAL_PaymentObjects_receiverSignatureDocId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [walRequestObjects.id],
      name: "WAL_PaymentObjects_requestId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.userEnterId],
      foreignColumns: [walUserObjects.id],
      name: "WAL_PaymentObjects_userEnterId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const walSupportObjects = pgTable(
  "WAL_SupportObjects",
  {
    id: serial().primaryKey().notNull(),
    sum: integer(),
    description: varchar({ length: 255 }),
    recommendDate: timestamp({ withTimezone: true, mode: "string" }),
    recommenderType: enumWalSupportObjectsRecommenderType(),
    createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    requestId: integer(),
    recommenderId: integer(),
  },
  (table) => [
    foreignKey({
      columns: [table.recommenderId],
      foreignColumns: [walUserObjects.id],
      name: "WAL_SupportObjects_recommenderId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
    foreignKey({
      columns: [table.requestId],
      foreignColumns: [walRequestObjects.id],
      name: "WAL_SupportObjects_requestId_fkey",
    })
      .onUpdate("cascade")
      .onDelete("set null"),
  ],
);

export const walUserObjects = pgTable("WAL_UserObjects", {
  id: serial().primaryKey().notNull(),
  username: varchar({ length: 255 }),
  password: varchar({ length: 255 }),
  role: enumWalUserObjectsRole(),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  isActive: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
});

export const walRequestObjects = pgTable("WAL_RequestObjects", {
  id: serial().primaryKey().notNull(),
  caseOpenDate: timestamp({ withTimezone: true, mode: "string" }),
  firstName: varchar({ length: 255 }),
  lastName: varchar({ length: 255 }),
  gender: varchar({ length: 255 }),
  ssn: varchar({ length: 255 }),
  email: varchar({ length: 255 }),
  birthDate: timestamp({ withTimezone: true, mode: "string" }),
  maritalStatus: enumWalRequestObjectsMaritalStatus(),
  numberOfPersons: integer(),
  numberOfChildrenUnder18: integer(),
  numberOfChildrenUp18: integer(),
  city: varchar({ length: 255 }),
  address: varchar({ length: 255 }),
  phone: varchar({ length: 255 }),
  additionalPhone: varchar({ length: 255 }),
  isElderly: boolean(),
  isSingleParent: boolean(),
  isMarried: boolean(),
  isSingle: boolean(),
  isDivorcee: boolean(),
  isWidower: boolean(),
  medicalCertificates: boolean(),
  economicHardship: boolean(),
  constantDistress: boolean(),
  temporalDistress: boolean(),
  socialSecurity: varchar({ length: 255 }),
  socialSecurityType: varchar({ length: 255 }),
  additionalAllowance: varchar({ length: 255 }),
  manSalary: integer(),
  womanSalary: integer(),
  municipalWelfareAssistance: integer(),
  totalIncome: integer(),
  residenceType: enumWalRequestObjectsResidenceType(),
  hmo: enumWalRequestObjectsHmo("HMO"),
  homeVisit: varchar({ length: 255 }),
  welfareKnown: boolean(),
  socialSecurityKnown: boolean(),
  congressKnown: boolean(),
  congressHelpDescription: varchar({ length: 255 }),
  description: varchar({ length: 255 }),
  messages: varchar({ length: 255 }),
  newDocs: integer(),
  createdAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp({ withTimezone: true, mode: "string" }).notNull(),
  bankNumber: integer(),
  bankBranch: integer(),
  bankAccount: integer(),
});
