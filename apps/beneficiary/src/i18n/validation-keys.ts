/**
 * This file declares all Zod validation error keys for i18next extraction.
 * The keys here match the error messages used in @congress/validators schemas.
 *
 * DO NOT import this file - it exists only for i18next-cli to extract the keys.
 */

// This function is never called, it just helps i18next-cli extract keys
export function declareValidationKeys(t: (key: string) => void) {
  // Date validation
  t("date_of_birth_required");
  t("invalid_date");

  // Phone validation
  t("phone_number_required");
  t("invalid_phone_number");

  // Name validation
  t("name_required");
  t("name_too_short");
  t("name_too_long");

  // Address validation
  t("city_required");
  t("city_too_long");
  t("city_too_short");
  t("street_required");
  t("street_too_long");
  t("street_too_short");
  t("house_number_required");
  t("house_number_too_long");
  t("postal_code_required");
  t("postal_code_too_short");
  t("postal_code_too_long");
  t("address_line2_required");
  t("address_line2_too_long");

  // Document validation
  t("document_type_required");
  t("upload_id_required");

  // Password validation
  t("password_too_short");
  t("password_too_long");

  // OTP validation
  t("otp_invalid");

  // Israeli ID validation
  t("national_id_incorrect");

  // Reset password
  t("reset_token_required");

  // Signup validation
  t("children_count_invalid");
  t("identity_card_upload_id_required");
  t("identity_appendix_upload_id_required");
  t("spouse_required");
  t("children_mismatch");

  // Yeshiva details validation
  t("yeshiva_name_required");
  t("head_of_the_yeshiva_name_required");
}
