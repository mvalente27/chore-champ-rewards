import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useStreak(profileId: string | undefined) {
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profileId) {
      setStreak(0);
      setIsLoading(false);
      return;
    }

    calculateStreak(profileId);
  }, [profileId]);

  const calculateStreak = async (profileId: string) => {
    try {
      // Get all approved earnings for this profile, ordered by date
      const { data: earnings, error } = await supabase
        .from('earnings')
        .select('created_at')
        .eq('profile_id', profileId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!earnings || earnings.length === 0) {
        setStreak(0);
        setIsLoading(false);
        return;
      }

      // Group earnings by date (ignoring time)
      const uniqueDays = new Set<string>();
      earnings.forEach((e) => {
        const date = new Date(e.created_at).toISOString().split('T')[0];
        uniqueDays.add(date);
      });

      // Convert to sorted array (most recent first)
      const sortedDays = Array.from(uniqueDays).sort().reverse();

      // Calculate streak - count consecutive days starting from today or yesterday
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let currentStreak = 0;
      const checkDate = sortedDays[0] === today || sortedDays[0] === yesterday 
        ? new Date(sortedDays[0]) 
        : null;

      if (!checkDate) {
        // No activity today or yesterday, streak is 0
        setStreak(0);
        setIsLoading(false);
        return;
      }

      for (const day of sortedDays) {
        const dayDate = new Date(day);
        const expectedDate = new Date(checkDate);
        expectedDate.setDate(expectedDate.getDate() - currentStreak);

        if (dayDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
          currentStreak++;
        } else {
          break;
        }
      }

      setStreak(currentStreak);
    } catch (err) {
      console.error('Error calculating streak:', err);
      setStreak(0);
    } finally {
      setIsLoading(false);
    }
  };

  return { streak, isLoading };
}
