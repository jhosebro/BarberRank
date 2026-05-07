import { DEFAULT_SCHEDULE } from "@/constants/schedule";
import { barberService } from "@/services/barber.service";
import {
  Country,
  locationService,
  StateWithCities,
} from "@/services/location.service";
import { uploadService } from "@/services/upload.service";
import { WeekSchedule } from "@/types/onboarding.types";
import { mapScheduleToSlots } from "@/utils/schedule.mapper";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

type City = {
  id: number;
  name: string;
};

export function useOnboarding() {
  const { user, updateProfile } = useAuth();

  // =========================
  // STATE
  // =========================
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [selectedCountry, setSelectedCountryState] = useState<number | null>(
    null,
  );

  const [selectedState, setSelectedStateState] = useState<number | null>(null);

  const [selectedCity, setSelectedCity] = useState<number | null>(null);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateWithCities[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);

  // =========================
  // LOADERS
  // =========================
  const loadCountries = useCallback(async () => {
    const list = await locationService.getCountries();

    setCountries(list);

    return list;
  }, []);

  const loadStates = useCallback(async (countryId: number) => {
    const statesList = await locationService.getStates(countryId);

    const mapped: StateWithCities[] = statesList.map((s) => ({
      id: s.id,
      name: s.name,
      citiesList: [],
    }));

    setStates(mapped);

    return mapped;
  }, []);

  const loadCities = useCallback(async (stateId: number) => {
    const citiesList = await locationService.getCities(stateId);

    setCities(citiesList);

    return citiesList;
  }, []);

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    const init = async () => {
      try {
        const countriesList = await loadCountries();

        const colombia = countriesList.find((c) => c.name === "Colombia");

        if (colombia) {
          setSelectedCountryState(colombia.id);
        }

        if (!user?.id) return;

        const barberData: any = await barberService.getOrCreateBarberProfile(
          user.id,
        );

        if (!barberData) return;

        setAddress(barberData.address ?? "");
        setBio(barberData.bio ?? "");

        // =========================
        // COUNTRY
        // =========================
        if (barberData.country) {
          setSelectedCountryState(barberData.country);

          await loadStates(barberData.country);
        }

        // =========================
        // STATE
        // =========================
        if (barberData.state) {
          setSelectedStateState(barberData.state);

          await loadCities(barberData.state);
        }

        // =========================
        // CITY
        // =========================
        if (barberData.city) {
          setSelectedCity(barberData.city);
        }
      } catch (error) {
        console.error("Init onboarding error:", error);
      }
    };

    init();
  }, [user?.id, loadCountries, loadStates, loadCities]);

  // =========================
  // MANUAL HANDLERS
  // =========================
  const setSelectedCountry = async (countryId: number | null) => {
    setSelectedCountryState(countryId);

    setSelectedStateState(null);
    setSelectedCity(null);

    setStates([]);
    setCities([]);

    if (countryId !== null) {
      await loadStates(countryId);
    }
  };

  const setSelectedState = async (stateId: number | null) => {
    setSelectedStateState(stateId);

    setSelectedCity(null);

    setCities([]);

    if (stateId !== null) {
      await loadCities(stateId);
    }
  };

  // =========================
  // SCHEDULE
  // =========================
  const toggleDay = useCallback((day: number, enabled: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
      },
    }));
  }, []);

  const changeTime = useCallback(
    (day: number, field: "start" | "end", value: string) => {
      setSchedule((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [field]: value,
        },
      }));
    },
    [],
  );

  // =========================
  // STEPS
  // =========================
  const nextStep = () => {
    setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const prevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  // =========================
  // IMAGE
  // =========================
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      throw new Error("Permiso denegado");
    }

    if (!user?.id) {
      throw new Error("Usuario no autenticado");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploading(true);

    try {
      const publicUrl = await uploadService.uploadAvatar(
        user.id,
        result.assets[0].uri,
      );

      await updateProfile({
        avatar_url: publicUrl,
      });

      setAvatarUri(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // VALIDATION
  // =========================
  const validateForm = () => {
    if (!user?.id) {
      throw new Error("Usuario no autenticado");
    }

    if (selectedCountry === null) {
      throw new Error("Selecciona un país");
    }

    if (selectedState === null) {
      throw new Error("Selecciona un departamento");
    }

    if (selectedCity === null) {
      throw new Error("Selecciona una ciudad");
    }

    const invalidSchedule = Object.values(schedule).some(
      (slot) =>
        slot.enabled && (!slot.start || !slot.end || slot.start >= slot.end),
    );

    if (invalidSchedule) {
      throw new Error("Horarios inválidos");
    }
  };

  // =========================
  // FINISH
  // =========================
  const finish = async (): Promise<boolean> => {
    validateForm();

    if (!user?.id) {
      throw new Error("Usuario no autenticado");
    }

    setSaving(true);

    try {
      await barberService.updateBarber(user.id, {
        city: selectedCity!,
        country: selectedCountry!,
        state: selectedState!,
        address: address || null,
        bio: bio || null,
      });

      const barberId = await barberService.getBarberId(user.id);

      const slots = mapScheduleToSlots(schedule, barberId);

      await barberService.saveAvailability(barberId, slots);

      return true;
    } finally {
      setSaving(false);
    }
  };

  return {
    step,
    saving,
    uploading,

    selectedCountry,
    selectedState,
    selectedCity,

    countries,
    states,
    cities,

    address,
    bio,
    avatarUri,
    schedule,

    setSelectedCountry,
    setSelectedState,
    setSelectedCity,

    setAddress,
    setBio,

    nextStep,
    prevStep,

    toggleDay,
    changeTime,

    pickPhoto,
    finish,
  };
}
