import { useMemo } from "react";
import { useStore } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useDebounceValue } from "usehooks-ts";

import { useTRPC } from "../../lib/trpc";
import { AutoComplete } from "../autocomplete";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../field";
import { Input } from "../input";
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
  props: {
    title: "Address Information",
  },
  render: function Render({ group, title }) {
    const { t } = useTranslation();
    const trpc = useTRPC();

    const [citySearch, setCitySearch] = useDebounceValue("", 300);
    const [streetSearch, setStreetSearch] = useDebounceValue("", 300);

    const cityId = useStore(group.store, (state) => state.values.cityId);
    const streetId = useStore(group.store, (state) => state.values.streetId);

    const isSubmitting = useStore(
      group.form.store,
      (state) => state.isSubmitting,
    );

    const citiesQuery = useQuery(
      trpc.location.cities.queryOptions(
        { search: citySearch || undefined },
        {
          enabled: true,
          select: (data) =>
            data.map((city) => ({
              value: String(city.id),
              label: city.nameHe,
              code: city.code,
            })),
          staleTime: 1000 * 60 * 60,
        },
      ),
    );

    const selectedCity = useMemo(() => {
      return citiesQuery.data?.find(
        (city) => Number(city.value) === Number(cityId),
      );
    }, [citiesQuery.data, cityId]);

    const streetsQuery = useQuery(
      trpc.location.streets.queryOptions(
        {
          cityCode: selectedCity?.code || 0,
          search: streetSearch || undefined,
        },
        {
          enabled: Boolean(selectedCity?.code),
          select: (data) =>
            data.map((street) => ({
              value: String(street.id),
              label: street.nameHe,
            })),
          staleTime: 1000 * 60 * 60,
        },
      ),
    );

    return (
      <div className="space-y-4">
        {title && <h2 className="text-lg font-medium">{title}</h2>}
        <FieldGroup>
          <group.AppField name="cityId">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldContent>
                    <FieldLabel>{t("city")}</FieldLabel>
                  </FieldContent>
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
                    placeholder={t("select_city_placeholder")}
                    disabled={isSubmitting}
                  />
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
                  <FieldContent>
                    <FieldLabel>{t("street")}</FieldLabel>
                  </FieldContent>
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
                      placeholder={t("select_street_placeholder")}
                      disabled={isSubmitting}
                    />
                  ) : (
                    <Input
                      onBlur={field.handleBlur}
                      autoComplete="rutjfkde"
                      disabled={true}
                      placeholder={t("street_select_a_city_first")}
                    />
                  )}
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
