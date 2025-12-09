import { useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDebounceValue } from "usehooks-ts";

import { orpc } from "../../lib/orpc";
import { AutoComplete } from "../autocomplete";
import { Field, FieldError, FieldGroup } from "../field";
import { Input } from "../input";
import { FloatingField } from "./floating-field";
import { withFieldGroup } from "./form-context";

interface AddressFields {
  cityId: number | undefined;
  streetId: number | undefined;
  houseNumber: string;
  addressLine2?: string;
  postalCode: string;
}

const defaultValues: AddressFields = {
  cityId: undefined,
  streetId: undefined,
  houseNumber: "",
  addressLine2: "",
  postalCode: "",
};

export const AddressFieldsGroup = withFieldGroup({
  defaultValues: defaultValues,
  // props: {
  //   title: "Address Information",
  // },
  render: function Render({ group }) {
    const { t } = useTranslation();

    const [citySearch, setCitySearch] = useDebounceValue("", 300);
    const [streetSearch, setStreetSearch] = useDebounceValue("", 300);

    const cityId = useStore(group.store, (state) => state.values.cityId);
    const streetId = useStore(group.store, (state) => state.values.streetId);

    const isSubmitting = useStore(
      group.form.store,
      (state) => state.isSubmitting,
    );

    const citiesQuery = useQuery(
      orpc.location.cities.queryOptions({
        input: { search: citySearch || undefined },
        enabled: true,
        select: (data) =>
          data.map((city) => ({
            value: String(city.id),
            label: city.nameHe,
            code: city.code,
          })),
        staleTime: 1000 * 60 * 60,
      }),
    );

    const selectedCity = useMemo(() => {
      return citiesQuery.data?.find(
        (city) => Number(city.value) === Number(cityId),
      );
    }, [citiesQuery.data, cityId]);

    const streetsQuery = useQuery(
      orpc.location.streets.queryOptions({
        input: {
          cityCode: selectedCity?.code || 0,
          search: streetSearch || undefined,
        },
        enabled: Boolean(selectedCity?.code),
        select: (data) =>
          data.map((street) => ({
            value: String(street.id),
            label: street.nameHe,
          })),
        staleTime: 1000 * 60 * 60,
      }),
    );

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium">{t("address_information")}</h2>
        <FieldGroup>
          <group.AppField name="cityId">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FloatingField label={t("city")} filled={Boolean(cityId)}>
                    <AutoComplete
                      selectedValue={cityId ? String(cityId) : ""}
                      onSearchValueChange={setCitySearch}
                      onSelectedValueChange={(value: string) => {
                        const newCityId = value
                          ? Number.parseInt(value, 10)
                          : undefined;

                        group.setFieldValue("cityId", newCityId);
                        group.setFieldValue("streetId", undefined);
                        setStreetSearch("");
                      }}
                      items={citiesQuery.data ?? []}
                      isLoading={citiesQuery.isLoading}
                      emptyMessage={t("no_cities_found")}
                      placeholder={" "}
                      disabled={isSubmitting}
                    />
                  </FloatingField>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </group.AppField>
          <group.AppField name="streetId">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FloatingField label={t("street")} filled={Boolean(streetId)}>
                    {selectedCity?.code ? (
                      <AutoComplete
                        selectedValue={streetId ? String(streetId) : ""}
                        onSearchValueChange={setStreetSearch}
                        onSelectedValueChange={(value: string) => {
                          group.setFieldValue(
                            "streetId",
                            value ? Number.parseInt(value, 10) : undefined,
                          );
                        }}
                        items={streetsQuery.data ?? []}
                        isLoading={streetsQuery.isLoading}
                        emptyMessage={t("no_streets_found")}
                        placeholder={" "}
                        disabled={isSubmitting}
                      />
                    ) : (
                      <Input
                        onBlur={field.handleBlur}
                        autoComplete="rutjfkde"
                        disabled={true}
                        placeholder={" "}
                      />
                    )}
                  </FloatingField>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </group.AppField>
        </FieldGroup>
        <FieldGroup>
          <group.AppField name="houseNumber">
            {(field) => <field.TextField label={t("house_number")} />}
          </group.AppField>
          <group.AppField name="addressLine2">
            {(field) => (
              <field.TextField
                label={t("address_line_two")}
                placeholder={t("address_line_two_placeholder")}
              />
            )}
          </group.AppField>
          <group.AppField name="postalCode">
            {(field) => <field.TextField label={t("postal_code")} />}
          </group.AppField>
        </FieldGroup>
      </div>
    );
  },
});
