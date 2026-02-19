export interface TransistorParams {
  W: string;
  L: string;
}

export interface ExperimentRecord {
  id: string;
  sequenceNumber: number;
  timestamp: number;
  experimenter: string;
  transistors: {
    [key: string]: TransistorParams;
  };
  capacitors: {
    [key: string]: string;
  };
  voltages: {
    [key: string]: string;
  };
  waveformImage: string | null; // Data URL or Object URL
  observations: string;
}

export const TRANSISTOR_NAMES = [
  "M_r", "M_dp", "M_dn", "M_ONp", "M_ONn", "M_OFFp", "M_OFFn",
  "M_R1a", "M_R2a", "M_R3a", 
  "M_invp", "M_invn", 
  "M_R1b", "M_R2b", "M_R3b", 
  "M_ref", "M_RA", "M_CA"
];

export const CAPACITOR_NAMES = ["C1", "C2", "C3"];

export const VOLTAGE_NAMES = ["V_diff", "V_don", "V_doff", "V_refr"];
