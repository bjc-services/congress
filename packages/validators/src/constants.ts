export const dbIdPrefixes = {
  user: "user",
  session: "ses",
  account: "acc",
  verification: "ver",
  personContact: "p_ctct",
  personAddress: "p_addr",
  personRelationship: "p_rel",
  beneficiaryAccount: "ben_acc",
  beneficiarySession: "ben_ses",
  beneficiaryDocument: "ben_dcm",
  upload: "upl",
  documentType: "dcm_type",
} as const;

function _createFixedId<
  TPrefix extends keyof typeof dbIdPrefixes,
  TID extends string,
>(prefix: TPrefix, id: TID) {
  return [dbIdPrefixes[prefix], id].join(
    "_",
  ) as `${(typeof dbIdPrefixes)[TPrefix]}_${TID}`;
}

export const SYSTEM_USER_ID = _createFixedId("user", "system");

interface SystemDocumentType {
  name: string;
  description: string;
  isSystemDefined: boolean;
  maxAllowedFiles: number;
  createdByUserId: string;
  id: string;
  allowedFileTypes: string[];
  maxFileSize: number;
}

export const identityCardDocumentType: SystemDocumentType = {
  name: "תעודת זהות",
  description: "תצלום תעודת זהות בתוקף",
  isSystemDefined: true,
  maxAllowedFiles: 1,
  createdByUserId: SYSTEM_USER_ID,
  id: _createFixedId("documentType", "id_card"),
  allowedFileTypes: ["image/*", "application/pdf"],
  maxFileSize: 10485760, // 10MB
};

export const identityAppendixDocumentType: SystemDocumentType = {
  name: "ספח תעודת זהות",
  description: "ספח לתעודת זהות, הכולל את כל הנספחים בתעודת הזהות",
  isSystemDefined: true,
  maxAllowedFiles: 1,
  createdByUserId: SYSTEM_USER_ID,
  id: _createFixedId("documentType", "id_appendix"),
  allowedFileTypes: ["image/*", "application/pdf"],
  maxFileSize: 10485760, // 10MB
};

export const yeshivaCertificateDocumentType: SystemDocumentType = {
  name: "אישור תים ללימוד בכולל",
  description: "אישור תים ללימוד בכולל",
  isSystemDefined: true,
  maxAllowedFiles: 1,
  createdByUserId: SYSTEM_USER_ID,
  id: _createFixedId("documentType", "tim_confirmation"),
  allowedFileTypes: ["image/*", "application/pdf"],
  maxFileSize: 10485760, // 10MB
};
