// services/upload.service.ts

import { supabase } from "../lib/supabase";

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

export const uploadService = {
  async uploadAvatar(userId: string, uri: string): Promise<string> {
    try {
      if (!userId) {
        throw new Error("Usuario no autenticado");
      }

      if (!uri) {
        throw new Error("No se proporcionó una imagen");
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      if (!ALLOWED_TYPES.includes(blob.type)) {
        throw new Error("Formato no permitido. Usa JPG o PNG");
      }

      const sizeInMB = blob.size / (1024 * 1024);
      if (sizeInMB > MAX_FILE_SIZE_MB) {
        throw new Error("La imagen supera el tamaño máximo de 5MB");
      }

      const fileExt = blob.type.split("/")[1] || "jpg";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) {
        throw new Error("Error al subir la imagen: " + error.message);
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error("No se pudo obtener la URL pública");
      }

      return data.publicUrl;
    } catch (error: unknown) {
      console.error("UploadService Error:", error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Error desconocido al subir la imagen");
    }
  },
};
