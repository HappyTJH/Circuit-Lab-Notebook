import { supabase } from '../lib/supabase'
import type { ExperimentRecord, ExperimentRecordInput } from '../types/experiment'

export const experimentService = {
  // 获取所有实验记录
  async getAllRecords(): Promise<ExperimentRecord[]> {
    const { data, error } = await supabase
      .from('experiment_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching records:', error)
      throw error
    }

    return data || []
  },

  // 创建新记录
  async createRecord(record: ExperimentRecordInput): Promise<ExperimentRecord> {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('experiment_records')
      .insert({
        ...record,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating record:', error)
      throw error
    }

    return data
  },

  // 更新记录
  async updateRecord(id: string, updates: Partial<ExperimentRecordInput>): Promise<ExperimentRecord> {
    const { data, error } = await supabase
      .from('experiment_records')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating record:', error)
      throw error
    }

    return data
  },

  // 删除记录
  async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('experiment_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting record:', error)
      throw error
    }
  },

  // 订阅实时变化
  onRecordsChange(callback: (records: ExperimentRecord[]) => void) {
    const channel = supabase
      .channel('experiment_records_changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'experiment_records'
        },
        async () => {
          const records = await this.getAllRecords()
          callback(records)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}
