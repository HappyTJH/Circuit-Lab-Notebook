export interface ExperimentRecord {
  id: string
  user_id: string
  sequence_number: number
  timestamp: number
  experimenter: string
  transistors: Record<string, { W: string; L: string }>
  capacitors: Record<string, string>
  voltages: Record<string, string>
  waveform_image: string
  observations: string
  created_at: string
  updated_at: string
}

export interface ExperimentRecordInput {
  sequence_number: number
  timestamp: number
  experimenter: string
  transistors: Record<string, { W: string; L: string }>
  capacitors: Record<string, string>
  voltages: Record<string, string>
  waveform_image: string
  observations: string
}
