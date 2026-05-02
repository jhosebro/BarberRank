export interface Country {
  id: number;
  code: string;
  name: string;
  phone_code: string;
  currency: string;
  timezone: string;
}

export interface State {
  id: number;
  name: string;
  cities: Record<number, string>;
}

export interface StateWithCities {
  code: string;
  id: number;
  name: string;
  citiesList: string[];
}

export interface LocationData {
  country: Country;
  states: Record<string, [number, string, Record<number, string>]>;
}

const BASE_URL = "https://cdn.geo-locations.com";

export const locationService = {
  async getCountries(): Promise<Country[]> {
    try {
      const res = await fetch(`${BASE_URL}/countries.json`);
      if (!res.ok) throw new Error("Failed to fetch countries");
      return await res.json();
    } catch (error) {
      console.error("Error fetching countries:", error);
      return [];
    }
  },

  async getLocations(countryCode: string): Promise<LocationData | null> {
    try {
      const res = await fetch(`${BASE_URL}/locations/${countryCode}.json`);
      if (!res.ok) throw new Error(`Failed to fetch locations for ${countryCode}`);
      return await res.json();
    } catch (error) {
      console.error("Error fetching locations:", error);
      return null;
    }
  },

  getStatesList(data: LocationData): StateWithCities[] {
    return Object.entries(data.states).map(([code, values]) => ({
      code,
      id: values[0],
      name: values[1],
      citiesList: Object.values(values[2]).sort() as string[],
    }));
  },

  getCitiesList(state: StateWithCities): string[] {
    return state.citiesList;
  },
};