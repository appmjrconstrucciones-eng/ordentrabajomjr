/**
 * Tipo que representa un Contrato/Proyecto proveniente de la colección
 * "contracts" del proyecto SEGUIMIENTO PROYECTOS MJR.
 *
 * Solo mapeamos los campos que necesitamos en la plataforma de OTs.
 */
export interface Contract {
  id: string;
  title?: string;        // Nombre real en Firestore (usado para el dropdown)
  name?: string;         // Alias
  project?: string;      // Alias
  client?: string;       // Cliente
  status?: string;       // Activo | Cerrado | Pendiente
  amount?: number;       // Monto contratado
  steelWeight?: number;  // Kg de acero del contrato
  projectId?: string;    // Referencia al proyecto padre (si existe)
  currency?: string;     // USD | CRC
  location?: string;     // Ubicación de la obra
  startDate?: string;
  endDate?: string;
}
