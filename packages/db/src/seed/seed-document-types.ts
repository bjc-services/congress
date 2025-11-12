import { SYSTEM_DOCUMENT_TYPES } from "@congress/validators/constants";

import { db } from "../client";
import { DocumentType } from "../schema/document.sql";

async function seedDocumentTypes() {
  await db.insert(DocumentType).values(SYSTEM_DOCUMENT_TYPES);
}

seedDocumentTypes()
  .catch(console.error)
  .finally(() => {
    process.exit(0);
  });
