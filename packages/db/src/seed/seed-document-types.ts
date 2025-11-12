import { db } from "../client";
import { createID } from "../id";
import { DocumentType } from "../schema/document.sql";

const systemDocumentTypes: (typeof DocumentType.$inferInsert)[] = [
  {
    name: "תעודת זהות",
    description: "תצלום תעודת זהות בתוקף",
    isSystemDefined: true,
    maxAllowedFiles: 1,
    createdByUserId: createID.SYSTEM_USER_ID,
    id: createID.SYSTEM_DOCUMENT_IDS.idCard,
    allowedFileTypes: ["image/*", "application/pdf"],
  },
  {
    name: "ספח תעודת זהות",
    description: "ספח לתעודת זהות, הכולל את כל הנספחים בתעודת הזהות",
    isSystemDefined: true,
    maxAllowedFiles: 1,
    createdByUserId: createID.SYSTEM_USER_ID,
    id: createID.SYSTEM_DOCUMENT_IDS.idAppendix,
    allowedFileTypes: ["image/*", "application/pdf"],
  },
];

async function seedDocumentTypes() {
  await db.insert(DocumentType).values(systemDocumentTypes);
}

seedDocumentTypes()
  .catch(console.error)
  .finally(() => {
    process.exit(0);
  });
