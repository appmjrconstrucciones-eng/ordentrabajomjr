"use client";

import { useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '@/lib/microsoft/authConfig';

export const useOneDrive = () => {
    const { instance, accounts } = useMsal();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const getAccessToken = async () => {
        const account = accounts[0];
        if (!account) {
            throw new Error("No hay sesión activa.");
        }

        try {
            const response = await instance.acquireTokenSilent({
                ...loginRequest,
                account: account,
            });
            return response.accessToken;
        } catch (error) {
            console.warn("Token silencioso falló. Se requiere re-autenticación.", error);
            throw new Error("La sesión ha expirado. Por favor reconecta tu cuenta.");
        }
    };

    /**
     * Sube un archivo a OneDrive en una carpeta específica para la OT.
     * @param file Archivo obtenido del input
     * @param workOrderId ID de la Orden de Trabajo (para crear carpeta)
     */
    const uploadBlueprint = async (file: File, workOrderId: string) => {
        setIsUploading(true);
        setUploadError(null);

        try {
            if (accounts.length === 0) {
                throw new Error("Debes conectar tu cuenta Microsoft antes de subir archivos.");
            }

            const token = await getAccessToken();
            const fileName = encodeURIComponent(file.name);
            const baseFolder = "MJR_OT_Blueprints"; // Carpeta raíz para este sistema
            const folderPath = `${baseFolder}/${workOrderId}`;

            // Endpoint para subir (PUT)
            const endpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/${folderPath}/${fileName}:/content`;

            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': file.type,
                },
                body: file,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || "Error al subir a OneDrive");
            }

            const data = await response.json();
            return data.webUrl as string;

        } catch (error: any) {
            console.error("OneDrive Upload Error:", error);
            setUploadError(error.message);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return {
        uploadBlueprint,
        isUploading,
        uploadError,
        user: accounts[0] || null,
        login: () => instance.loginPopup(loginRequest)
    };
};
