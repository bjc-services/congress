import {
  identityAppendixDocumentType,
  identityCardDocumentType,
} from "@congress/validators/constants";

import { db } from "../client";
import { DocumentType } from "../schema/document.sql";

async function seedDocumentTypes() {
  await db
    .insert(DocumentType)
    .values([identityCardDocumentType, identityAppendixDocumentType] as const);
}

seedDocumentTypes().catch(console.error);
