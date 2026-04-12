import { DEFAULT_SCHEDULE } from "@/constants/schedule";
import { barberService } from "@/services/barber.service";
import { uploadService } from "@/services/upload.service";
import { WeekSchedule } from "@/types/onboarding.types";
import { mapScheduleToSlots } from "@/utils/schedule.mapper";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { useAuth } from "./useAuth";

export function useOnboarding() {
  const { user, updateProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [schedule, setSchedule] = useState<WeekSchedule>(DEFAULT_SCHEDULE);

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
      await barberService.updateBarber(user!.id, {
        city,
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

    // setters
    setCity,
    setAddress,
    setBio,

    // lógica
    toggleDay,
    changeTime,
    nextStep,
    prevStep,
    pickPhoto,
    finish,
  };
}
