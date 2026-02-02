import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * A custom hook to fetch data from Supabase and listen for real-time changes.
 * 
 * @param {Object} options Options for fetching and listening
 * @param {string} options.table The table name
 * @param {string} options.select Columns to select (default: '*')
 * @param {string} options.filter Filter in format "column=eq.value"
 * @param {Object} options.orderBy Order by configuration { column, ascending }
 * @param {boolean} options.enabled Whether the hook should be active (default: true)
 * @returns {Object} { data, loading, error, refetch }
 */
export const useSupabaseRealtime = ({ table, select = '*', filter = null, orderBy = null, enabled = true }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!enabled) return;
        try {
            let query = supabase.from(table).select(select);

            if (filter) {
                const [column, rest] = filter.split('=');
                const [operator, value] = rest.split('.');

                if (operator === 'eq') {
                    query = query.eq(column, value);
                } else if (operator === 'neq') {
                    query = query.neq(column, value);
                }
                // Add more operators if needed
            }

            if (orderBy) {
                query = query.order(orderBy.column, { ascending: orderBy.ascending });
            }

            const { data: result, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setData(result || []);
        } catch (err) {
            console.error(`Error fetching ${table}:`, err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!enabled) return;

        fetchData();

        const channelName = `${table}-realtime-${Math.random().toString(36).substring(7)}`;
        const filterConfig = {
            event: '*',
            schema: 'public',
            table: table,
        };

        if (filter) {
            filterConfig.filter = filter;
        }

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', filterConfig, (payload) => {
                console.log(`[Realtime] ${table} event:`, payload);
                const { eventType, new: newItem, old: oldItem } = payload;

                if (eventType === 'INSERT') {
                    setData(prev => [newItem, ...prev]);
                } else if (eventType === 'UPDATE') {
                    setData(prev => prev.map(item => item.id === newItem.id ? newItem : item));
                } else if (eventType === 'DELETE') {
                    setData(prev => prev.filter(item => item.id !== oldItem.id));
                }
            })
            .subscribe((status) => {
                console.log(`[Realtime] ${table} subscription status:`, status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, filter, select, orderBy?.column, orderBy?.ascending]);

    return { data, loading, error, refetch: fetchData };
};
