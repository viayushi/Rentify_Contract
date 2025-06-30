
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchContracts = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [user]);

  const createContract = async (contractData) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('contracts')
        .insert([{
          ...contractData,
          buyer_id: user.id,
          status: 'draft'
        }])
        .select()
        .single();

      if (error) throw error;
      
      setContracts(prev => [...prev, data]);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating contract:', error);
      return { error };
    }
  };

  const updateContract = async (contractId, updates) => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', contractId)
        .select()
        .single();

      if (error) throw error;
      
      setContracts(prev => 
        prev.map(contract => 
          contract.id === contractId ? data : contract
        )
      );
      return { data, error: null };
    } catch (error) {
      console.error('Error updating contract:', error);
      return { error };
    }
  };

  return {
    contracts,
    loading,
    createContract,
    updateContract,
    fetchContracts
  };
};
