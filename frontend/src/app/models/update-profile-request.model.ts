export interface UpdateProfileRequest {
  customer_id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country_iso2?: string;
  address_subdivision_code?: string;
}
