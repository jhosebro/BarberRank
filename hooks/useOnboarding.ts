import { DEFAULT_SCHEDULE } from "@/constants/schedule";
import { barberService } from "@/services/barber.service";
import { locationService, Country, StateWithCities } from "@/services/location.service";
import { uploadService } from "@/services/upload.service";
import { WeekSchedule } from "@/types/onboarding.types";
import { mapScheduleToSlots } from "@/utils/schedule.mapper";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState, useEffect } from "react";
import { useAuth } from "./useAuth";

export function useOnboarding() {
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [city, setCity] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [bio, setBio] = useState<string>("");

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("CO");
  const [states, setStates] = useState<StateWithCities[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [cities, setCities] = useState<string[]>([]);

  const loadLocations = useCallback(async () => {
    try {
      const list = await locationService.getCountries();
      setCountries(list);
    } catch (error) {
      console.error("Error loading countries:", error);
    }
  }, []);

  const loadStates = useCallback(async (countryCode: string) => {
    try {
      const data = await locationService.getLocations(countryCode);
      if (data) {
        const statesList = locationService.getStatesList(data);
        setStates(statesList);
      }
    } catch (error) {
      console.error("Error loading states:", error);
    }
  }, []);

  const loadCities = useCallback(async (countryCode: string, stateCode: string) => {
    try {
      const data = await locationService.getLocations(countryCode);
      if (data) {
        const state = data.states[stateCode];
        if (state) {
          const citiesList = Object.values(state[2]).sort() as string[];
          setCities(citiesList);
        }
      }
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const loadExistingBarber = useCallback(async () => {
    if (!user?.id) return;
    try {
      const barberData: any = await barberService.getBarberProfile(user.id);
      if (barberData) {
        if (barberData.city) setCity(barberData.city);
        if (barberData.address) setAddress(barberData.address);
        if (barberData.bio) setBio(barberData.bio);
        
        if (barberData.country && barberData.state) {
          await loadStates(barberData.country);
          setSelectedCountry(barberData.country);
          setSelectedState(barberData.state);
        }
      }
    } catch (error) {
      console.error("Error loading existing barber:", error);
    }
  }, [user?.id, loadStates]);

  useEffect(() => {
    if (user?.id) {
      loadExistingBarber();
    }
  }, [user?.id, loadExistingBarber]);

  useEffect(() => {
    if (selectedCountry) {
      loadStates(selectedCountry);
      setSelectedState("");
      setCities([]);
    }
  }, [selectedCountry, loadStates]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      loadCities(selectedCountry, selectedState);
    }
  }, [selectedCountry, selectedState, loadCities]);

  const toggleDay = useCallback((day: number, enabled: boolean) => {
    setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled } }));
  }, []);

  const changeTime = useCallback(
    (day: number, field: "start" | "end", value: string) => {
      setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }));
    },
    [],
  );

  const nextStep = useCallback(() => {
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }, []);

  const prevStep = useCallback(() => {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  }, []);

  // ✔ Permisos
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permiso denegado para acceder a la galería");
    }
  };

  // ✔ Selección de imagen
  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets[0]) return null;

    return result.assets[0].uri;
  };

  // ✔ Orquestador (clean)
  const pickPhoto = async () => {
    await requestPermission();

    const uri = await selectImage();
    if (!uri) return;

    if (!user?.id) {
      throw new Error("Usuario no autenticado");
    }

    setUploading(true);

    try {
      const publicUrl = await uploadService.uploadAvatar(user.id, uri);

      await updateProfile({ avatar_url: publicUrl });

      setAvatarUri(publicUrl);
    } catch (error) {
      console.error("Error al subir imagen:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    if (!user?.id) {
      throw new Error("Usuario no autenticado");
    }

    if (!city.trim()) {
      throw new Error("La ciudad es obligatoria");
    }

    if (!selectedCountry || !selectedState || !city.trim()) {
      throw new Error("Selecciona país, departamento y ciudad");
    }

    const isValidTime = (start: string, end: string) => start < end;

    const hasInvalidSlot = Object.values(schedule).some(
      (slot) => slot.enabled && !isValidTime(slot.start, slot.end),
    );

    if (hasInvalidSlot) {
      throw new Error("Hay horarios inválidos");
    }
  };

  const finish = async (): Promise<boolean> => {
    validateForm();

    setSaving(true);

    try {
      const countryName = countries.find((c) => c.code === selectedCountry)?.name || "";
      const stateName = states.find((s) => s.code === selectedState)?.name || "";

      await barberService.updateBarber(user!.id, {
        city,
        country: countryName,
        state: stateName,
        address: address || null,
        bio: bio || null,
      });

      const barberId = await barberService.getBarberId(user!.id);

      const slots = mapScheduleToSlots(schedule, barberId);

      await barberService.saveAvailability(barberId, slots);

      return true;
    } catch (error) {
      console.error("Error en finish:", error);
      throw error;
    } finally {
      setSaving(false);
    }
  };
  return {
    // estado
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
    selectedCountry,
    setSelectedCountry,
    states,
    selectedState,
    setSelectedState,
    setCity,

    // setters
    setAddress,
    setBio,

    // lógica
    toggleDay,
    changeTime,
    nextStep,
    prevStep,
    pickPhoto,
    finish,
    loadCities,
  };
}
