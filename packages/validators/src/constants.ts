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
