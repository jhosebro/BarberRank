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

export function useOnboarding() {
  const { user, updateProfile } = useAuth();

  // =========================
  // STATE
  // =========================
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);

  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<StateWithCities[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedState, setSelectedState] = useState<number | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  // =========================
  // LOADERS
  // =========================
  const loadCountries = useCallback(async () => {
    const list = await locationService.getCountries();
    setCountries(list);

    const colombia = list.find((c) => c.name === "Colombia");
    if (colombia) {
      setSelectedCountry(colombia.id);
    }
  }, []);

  const loadStates = useCallback(async (countryId: number) => {
    const statesList = await locationService.getStates(countryId);

    const mapped: StateWithCities[] = statesList.map((s) => ({
      id: s.id,
      name: s.name,
      citiesList: [],
    }));

    setStates(mapped);
  }, []);

  const loadCities = useCallback(async (stateId: number) => {
    const citiesList = await locationService.getCities(stateId);
    setCities(citiesList.sort());
  }, []);

  // =========================
  // INITIAL LOAD (FIX RACE CONDITION)
  // =========================
  useEffect(() => {
    const init = async () => {
      try {
        await loadCountries();

        if (user?.id) {
          const barberData: any = await barberService.getOrCreateBarberProfile(
            user.id,
          );

          if (barberData) {
            setCity(barberData.city ?? "");
            setAddress(barberData.address ?? "");
            setBio(barberData.bio ?? "");

            if (barberData.country) {
              setSelectedCountry(barberData.country);
              await loadStates(barberData.country);
            }

            if (barberData.state) {
              setSelectedState(barberData.state);
              await loadCities(barberData.state);
            }
          }
        }
      } catch (error) {
        console.error("Init error:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [user?.id, loadCountries, loadStates, loadCities]);

  // =========================
  // COUNTRY CHANGE
  // =========================
  useEffect(() => {
    if (selectedCountry === null) return;

    loadStates(selectedCountry);

    if (!isInitializing) {
      setSelectedState(null);
      setCities([]);
      setCity("");
    }
  }, [selectedCountry, loadStates, isInitializing]);

  // =========================
  // STATE CHANGE
  // =========================
  useEffect(() => {
    if (selectedState === null) return;

    loadCities(selectedState);

    if (!isInitializing) {
      setCity("");
    }
  }, [selectedState, loadCities, isInitializing]);

  // =========================
  // SCHEDULE
  // =========================
  const toggleDay = useCallback((day: number, enabled: boolean) => {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled } }));
  }, []);

  const changeTime = useCallback(
    (day: number, field: "start" | "end", value: string) => {
      setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }));
    },
    [],
  );

  // =========================
  // STEPS
  // =========================
  const nextStep = () => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  const prevStep = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));

  // =========================
  // IMAGE
  // =========================
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") throw new Error("Permiso denegado");
    if (!user?.id) throw new Error("Usuario no autenticado");

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

      await updateProfile({ avatar_url: publicUrl });
      setAvatarUri(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // VALIDATION
  // =========================
  const validateForm = () => {
    if (!user?.id) throw new Error("Usuario no autenticado");

    if (selectedCountry === null || selectedState === null) {
      throw new Error("Selecciona país y departamento");
    }

    if (!city.trim()) {
      throw new Error("Selecciona una ciudad");
    }

    const invalid = Object.values(schedule).some(
      (s) => s.enabled && !(s.start && s.end && s.start < s.end),
    );

    if (invalid) throw new Error("Horarios inválidos");
  };

  // =========================
  // FINISH
  // =========================
  const finish = async (): Promise<boolean> => {
    validateForm();

    setSaving(true);

    try {
      const countryName = countries.find((c) => c.id === selectedCountry)?.name;

      if (!countryName || selectedState === null) {
        throw new Error("Datos inválidos");
      }

      await barberService.updateBarber(user!.id, {
        city,
        country: countryName,
        state: selectedState,
        address: address || null,
        bio: bio || null,
      });

      const barberId = await barberService.getBarberId(user!.id);
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
    city,
    address,
    bio,
    avatarUri,
    schedule,
    cities,
    countries,
    states,
    selectedCountry,
    selectedState,

    setSelectedCountry,
    setSelectedState,
    setCity,
    setAddress,
    setBio,

    toggleDay,
    changeTime,
    nextStep,
    prevStep,
    pickPhoto,
    finish,
  };
}
