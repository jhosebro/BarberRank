// ─── Interfaces ─────────────────────────────────────────────

interface CitiesJson {
  cities: City[];
}

export interface Country {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
  id_country: number;
}

export interface City {
  id: number;
  name: string;
  id_state: number;
}

export interface StateWithCities {
  id: number;
  name: string;
  citiesList: City[];
}

// ─── Config ─────────────────────────────────────────────

const citiesData: CitiesJson = require("@/data/cities.json");

const BASE_URL =
  "https://raw.githubusercontent.com/millan2993/countries/master/json";

// ✔ Nunca usar null → evita errores TS
let countriesCache: Country[] = [];
let statesCache: State[] = [];
let citiesCache: City[] = [];

// ─── Utils ─────────────────────────────────────────────

const parseJSON = (text: string) => {
  const cleanText = text.replace(/^\uFEFF/, "");
  return JSON.parse(cleanText);
};

// ─── Service ─────────────────────────────────────────────

export const locationService = {
  // ─── Countries ─────────────────────────────────
  async getCountries(): Promise<Country[]> {
    if (countriesCache.length > 0) return countriesCache;

    const res = await fetch(`${BASE_URL}/countries.json`);

    if (!res.ok) {
      console.error("Error countries:", res.status);
      return [];
    }

    const text = await res.text();
    const json = parseJSON(text);

    countriesCache = json.countries ?? [];

    return countriesCache;
  },

  // ─── States ─────────────────────────────────
  async getStates(countryId: number): Promise<State[]> {
    if (statesCache.length === 0) {
      const res = await fetch(`${BASE_URL}/states.json`);

      if (!res.ok) {
        console.error("Error states:", res.status);
        return [];
      }

      const text = await res.text();
      const json = parseJSON(text);

      statesCache = json.states ?? [];
    }

    return statesCache.filter((s) => s.id_country === countryId);
  },

  // ─── Cities ─────────────────────────────────
  async getCities(stateId: number): Promise<City[]> {
    if (citiesCache.length === 0) {
      citiesCache = citiesData.cities as City[];
    }

    return citiesCache
      .filter((c) => c.id_state === stateId)
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  // ─── Helper avanzado (opcional) ─────────────────────────
  async getStatesWithCities(countryId: number): Promise<StateWithCities[]> {
    const states = await this.getStates(countryId);

    return Promise.all(
      states.map(async (state) => ({
        id: state.id,
        name: state.name,
        citiesList: await this.getCities(state.id),
      })),
    );
  },
};
