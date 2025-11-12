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

export const SYSTEM_DOCUMENT_IDS = {
  idCard: _createFixedId("documentType", "id_card"),
  idAppendix: _createFixedId("documentType", "id_appendix"),
} as const;
export const SYSTEM_USER_ID = _createFixedId("user", "system");

export const SYSTEM_DOCUMENT_TYPES: {
  name: string;
  description: string;
  isSystemDefined: boolean;
  maxAllowedFiles: number;
  createdByUserId: string;
  id: string;
  allowedFileTypes: string[];
}[] = [
  {
    name: "תעודת זהות",
    description: "תצלום תעודת זהות בתוקף",
    isSystemDefined: true,
    maxAllowedFiles: 1,
    createdByUserId: SYSTEM_USER_ID,
    id: SYSTEM_DOCUMENT_IDS.idCard,
    allowedFileTypes: ["image/*", "application/pdf"],
  },
  {
    name: "ספח תעודת זהות",
    description: "ספח לתעודת זהות, הכולל את כל הנספחים בתעודת הזהות",
    isSystemDefined: true,
    maxAllowedFiles: 1,
    createdByUserId: SYSTEM_USER_ID,
    id: SYSTEM_DOCUMENT_IDS.idAppendix,
    allowedFileTypes: ["image/*", "application/pdf"],
  },
] as const;
