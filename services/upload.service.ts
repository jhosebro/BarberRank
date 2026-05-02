// services/upload.service.ts

import { supabase } from "../lib/supabase";

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
      const arrayBuffer = await response.arrayBuffer();

      const fileExt = uri.split(".").pop() || "jpg";
      const contentType = fileExt === "png" ? "image/png" : "image/jpeg";

      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, {
          contentType,
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
    } catch (error) {
      console.error("UploadService Error:", error);

      throw error instanceof Error
        ? error
        : new Error("Error desconocido al subir la imagen");
    }
  },
};
