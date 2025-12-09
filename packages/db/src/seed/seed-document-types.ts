import {
  identityAppendixDocumentType,
  identityCardDocumentType,
  yeshivaCertificateDocumentType,
} from "@congress/validators/constants";

import { db } from "../client";
import { DocumentType } from "../schema/document.sql";

async function seedDocumentTypes() {
  await db
    .insert(DocumentType)
    .values([
      identityCardDocumentType,
      identityAppendixDocumentType,
      yeshivaCertificateDocumentType,
    ] as const);
}

seedDocumentTypes().catch(console.error);
