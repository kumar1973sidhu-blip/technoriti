/**
 * TECHNORITI '26 - Supabase Client & Backend Bridge
 * Connects the public portal and admin panel to Supabase PostgreSQL + Auth
 */

(function (window) {
  'use strict';

  // Configured via project credentials
  const SUPABASE_CONFIG = {
    url: 'https://rrkgrisyaeeuphnvhflu.supabase.co',
    anonKey: 'sb_publishable_EA2Vt_mY3bfxf9o0Ufgs4Q_WAufCucT'
  };

  let supabaseClient = null;

  // Initialize Supabase Client
  function getSupabase() {
    if (supabaseClient) return supabaseClient;

    if (window.supabase && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
        }
      });
      return supabaseClient;
    }

    console.warn('[Technoriti Supabase] Supabase SDK not loaded yet. Waiting for script to resolve.');
    return null;
  }

  // =====================================================================
  // PUBLIC CLIENT API (Non-destructive with graceful offline fallbacks)
  // =====================================================================
  const TechnoritiDB = {
    client: getSupabase,
    getClient: getSupabase,

    /**
     * Fetch published competitions, filtered optionally by category
     */
    async getCompetitions(category = 'all') {
      const sb = getSupabase();
      if (!sb) return null;

      try {
        let query = sb
          .from('events')
          .select(`
            id,
            title,
            slug,
            category_id,
            short_desc,
            registration_fee,
            fee_type,
            prize_pool,
            first_prize,
            second_prize,
            third_prize,
            team_size_min,
            team_size_max,
            event_date,
            event_time,
            venue,
            registration_status,
            sort_order,
            coordinator_name,
            coordinator_phone,
            category:event_categories (name, slug)
          `)
          .eq('is_published', true)
          .order('sort_order', { ascending: true });

        if (category && category !== 'all') {
          query = query.eq('category_id', category);
        }

        const { data, error } = await query;
        if (error) {
          console.warn('[Technoriti Supabase] Could not fetch events from DB:', error.message);
          return null;
        }

        return data;
      } catch (err) {
        console.warn('[Technoriti Supabase] Network error fetching events:', err);
        return null;
      }
    },

    /**
     * Fetch full rules & prizes for a single competition modal
     */
    async getEventDetails(eventId) {
      const sb = getSupabase();
      if (!sb) return null;

      try {
        const [eventRes, prizesRes, rulesRes] = await Promise.all([
          sb.from('events').select('*').eq('id', eventId).single(),
          sb.from('event_prizes').select('*').eq('event_id', eventId).order('position', { ascending: true }),
          sb.from('event_rules').select('*').eq('event_id', eventId).order('rule_number', { ascending: true })
        ]);

        if (eventRes.error) return null;

        return {
          event: eventRes.data,
          prizes: prizesRes.data || [],
          rules: rulesRes.data || []
        };
      } catch (err) {
        console.warn('[Technoriti Supabase] Error fetching event details:', err);
        return null;
      }
    },

    /**
     * Submit a real participant event registration to Supabase
     */
    async submitRegistration(regData) {
      const sb = getSupabase();
      if (!sb) {
        throw new Error('Supabase client is not available. Please check internet connection.');
      }

      try {
        let bookingId = null;

        // 1. If accommodation is requested, create an accommodation booking record
        if (regData.needsAccommodation) {
          const { data: accomData, error: accomErr } = await sb
            .from('accommodation_bookings')
            .insert({
              full_name: regData.fullName,
              email: regData.email,
              phone: regData.phone,
              college: regData.college,
              gender: regData.gender || 'male',
              members_count: regData.teamSize || 1,
              status: 'requested',
              daily_rate: 175,
              total_fee: regData.accommodationFee || 175
            })
            .select('id')
            .single();

          if (!accomErr && accomData) {
            bookingId = accomData.id;
          }
        }

        // 2. Insert into central registrations table
        const { data: registration, error: regErr } = await sb
          .from('registrations')
          .insert({
            full_name: regData.fullName,
            email: regData.email,
            phone: regData.phone,
            college: regData.college,
            event_id: regData.eventId,
            event_title: regData.eventTitle,
            team_size: regData.teamSize || 1,
            needs_accommodation: !!regData.needsAccommodation,
            accommodation_booking_id: bookingId,
            event_fee: regData.eventFee || 0,
            accommodation_fee: regData.accommodationFee || 0,
            total_amount: regData.totalAmount || 0,
            payment_status: 'pending',
            payment_reference: regData.paymentReference || ''
          })
          .select('*')
          .single();

        if (regErr) {
          throw new Error(regErr.message || 'Failed to record registration in database.');
        }

        // 3. If it's a team registration, create team record
        if (regData.teamSize > 1) {
          await sb.from('teams').insert({
            team_name: `${regData.fullName}'s Team`,
            event_id: regData.eventId,
            college: regData.college,
            leader_name: regData.fullName,
            leader_email: regData.email,
            leader_phone: regData.phone,
            team_size: regData.teamSize
          });
        }

        return { success: true, registration };
      } catch (err) {
        console.error('[Technoriti Supabase] Registration submission failed:', err);
        throw err;
      }
    },

    /**
     * Fetch active sponsors
     */
    async getSponsors() {
      const sb = getSupabase();
      if (!sb) return null;

      try {
        const { data, error } = await sb
          .from('sponsors')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) return null;
        return data;
      } catch (err) {
        return null;
      }
    },

    /**
     * Fetch site settings (dates, prize totals, edition status)
     */
    async getSiteSettings() {
      const sb = getSupabase();
      if (!sb) return null;

      try {
        const { data, error } = await sb.from('site_settings').select('*');
        if (error) return null;

        const settings = {};
        data.forEach(item => {
          settings[item.key] = item.value;
        });
        return settings;
      } catch (err) {
        return null;
      }
    },

    // =====================================================================
    // CMS DATA ACCESS & MUTATION METHODS
    // =====================================================================
    // 1. Site Settings
    async updateSiteSetting(key, value, description = '') {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const payload = {
        key,
        value,
        updated_at: new Date().toISOString()
      };
      if (description) payload.description = description;
      const { data, error } = await sb
        .from('site_settings')
        .upsert(payload, { onConflict: 'key' })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },

    // 2. Content Sections
    async getContentSections() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('content_sections')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) return [];
      return data || [];
    },

    async updateContentSection(id, updates) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const payload = { ...updates, updated_at: new Date().toISOString() };
      const { data, error } = await sb
        .from('content_sections')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },

    // 3. Navigation Items
    async getNavigationItems(onlyVisible = false) {
      const sb = getSupabase();
      if (!sb) return [];
      let query = sb.from('navigation_items').select('*').order('sort_order', { ascending: true });
      if (onlyVisible) query = query.eq('is_visible', true);
      const { data, error } = await query;
      if (error) return [];
      return data || [];
    },

    async saveNavigationItem(item) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const payload = { ...item, updated_at: new Date().toISOString() };
      const { data, error } = item.id
        ? await sb.from('navigation_items').update(payload).eq('id', item.id).select('*').single()
        : await sb.from('navigation_items').insert(payload).select('*').single();
      if (error) throw error;
      return data;
    },

    async deleteNavigationItem(id) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { error } = await sb.from('navigation_items').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // 4. Competitions / Events (Full CRUD)
    async getAllEventsAdmin() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('events')
        .select('*, event_categories(name)')
        .order('sort_order', { ascending: true });
      if (error) return [];
      return data || [];
    },

    async saveEvent(eventData) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const payload = { ...eventData, updated_at: new Date().toISOString() };
      const isExisting = !!eventData.id;
      const { data, error } = isExisting
        ? await sb.from('events').upsert(payload).select('*').single()
        : await sb.from('events').insert(payload).select('*').single();
      if (error) throw error;
      return data;
    },

    async deleteEvent(id) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { error } = await sb.from('events').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // 5. Prizes & Rules
    async getEventPrizes(eventId) {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('event_prizes')
        .select('*')
        .eq('event_id', eventId)
        .order('position', { ascending: true });
      if (error) return [];
      return data || [];
    },

    async saveEventPrize(prizeData) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { data, error } = prizeData.id
        ? await sb.from('event_prizes').update(prizeData).eq('id', prizeData.id).select('*').single()
        : await sb.from('event_prizes').insert(prizeData).select('*').single();
      if (error) throw error;
      return data;
    },

    async deleteEventPrize(id) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { error } = await sb.from('event_prizes').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    async getEventRules(eventId) {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('event_rules')
        .select('*')
        .eq('event_id', eventId)
        .order('rule_number', { ascending: true });
      if (error) return [];
      return data || [];
    },

    async saveEventRule(ruleData) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { data, error } = ruleData.id
        ? await sb.from('event_rules').update(ruleData).eq('id', ruleData.id).select('*').single()
        : await sb.from('event_rules').insert(ruleData).select('*').single();
      if (error) throw error;
      return data;
    },

    async deleteEventRule(id) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { error } = await sb.from('event_rules').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // 6. Sponsors (Full CRUD)
    async getAllSponsorsAdmin() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('sponsors')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) return [];
      return data || [];
    },

    async saveSponsor(sponsorData) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { data, error } = sponsorData.id
        ? await sb.from('sponsors').update(sponsorData).eq('id', sponsorData.id).select('*').single()
        : await sb.from('sponsors').insert(sponsorData).select('*').single();
      if (error) throw error;
      return data;
    },

    async deleteSponsor(id) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { error } = await sb.from('sponsors').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // 7. Accommodation Options & Bookings
    async getAccommodationOptions() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb.from('accommodation_options').select('*');
      if (error) return [];
      return data || [];
    },

    async updateAccommodationOption(id, updates) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { data, error } = await sb.from('accommodation_options').update(updates).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },

    // 8. Media Assets Library
    async getMediaAssets() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('media_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },

    async saveMediaAssetRecord(asset) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { data, error } = await sb.from('media_assets').insert(asset).select('*').single();
      if (error) throw error;
      return data;
    },

    async deleteMediaAsset(id) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { error } = await sb.from('media_assets').delete().eq('id', id);
      if (error) throw error;
      return true;
    },

    // 9. Admin Audit Logs
    async logAdminAction(action, targetTable, targetId, oldData, newData) {
      const sb = getSupabase();
      if (!sb) return;
      try {
        const user = await this.getCurrentUser();
        await sb.from('admin_audit_logs').insert({
          user_id: user?.id || null,
          action,
          target_table: targetTable,
          target_id: String(targetId || ''),
          old_data: oldData ? oldData : null,
          new_data: newData ? newData : null,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[TechnoritiDB] Failed to write audit log:', err);
      }
    },

    // 10. User Roles Management
    async getAdminUsers() {
      const sb = getSupabase();
      if (!sb) return [];
      const { data, error } = await sb
        .from('user_roles')
        .select('*, profiles:user_id(id, email, full_name, phone, college)')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },

    async updateUserRole(userId, newRole) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { data, error } = await sb
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id,role' })
        .select('*');
      if (error) throw error;
      return data;
    },

    async removeUserRole(userRoleId) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const { error } = await sb.from('user_roles').delete().eq('id', userRoleId);
      if (error) throw error;
      return true;
    },

    // =====================================================================
    // AUTHENTICATION & ADMIN ROLE GUARDS
    // =====================================================================
    async signInAdmin(email, password) {
      const sb = getSupabase();
      if (!sb) {
        return { success: false, error: 'Supabase client unavailable. Check internet connectivity.' };
      }

      try {
        // Step 1: Supabase Auth signInWithPassword()
        const { data, error } = await sb.auth.signInWithPassword({
          email: (email || '').trim(),
          password: password || ''
        });

        if (error) {
          return { success: false, error: error.message || 'Invalid login credentials.' };
        }

        if (!data || !data.user) {
          return { success: false, error: 'Authentication failed. No user record returned.' };
        }

        // Step 2: Check authenticated user's ID
        const userId = data.user.id;

        // Step 3: Check public.user_roles for this user's ID
        const { data: roleRows, error: roleError } = await sb
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (roleError) {
          console.error('[TechnoritiDB] Error checking user_roles:', roleError);
          await sb.auth.signOut();
          return { success: false, error: 'Failed to verify account permissions from database.' };
        }

        // Step 4: Verify role is super_admin, admin, or coordinator
        const allowedRoles = ['super_admin', 'admin', 'coordinator'];
        const matched = (roleRows || []).find(r => r.role && allowedRoles.includes(r.role.toLowerCase().trim()));

        if (!matched) {
          // NO -> Sign out and Access Denied
          await sb.auth.signOut();
          return {
            success: false,
            error: 'Access Denied: Your account does not have administrator privileges (super_admin, admin, or coordinator).'
          };
        }

        // YES -> Return successful admin auth
        return {
          success: true,
          user: data.user,
          session: data.session,
          role: matched.role
        };
      } catch (err) {
        console.error('[TechnoritiDB] signInAdmin error:', err);
        return {
          success: false,
          error: err.message || 'An unexpected error occurred during login.'
        };
      }
    },

    async signOut() {
      const sb = getSupabase();
      if (!sb) return;
      try {
        await sb.auth.signOut();
      } catch (err) {
        console.warn('[TechnoritiDB] signOut error:', err);
      }
    },

    async getCurrentUser() {
      const sb = getSupabase();
      if (!sb) return null;
      try {
        const { data: { session } } = await sb.auth.getSession();
        return session?.user || null;
      } catch (err) {
        return null;
      }
    },

    async checkIsAdmin(userId) {
      const sb = getSupabase();
      if (!sb) return false;

      try {
        let uid = userId;

        // If userId not provided, retrieve from active session
        if (!uid) {
          const { data: { session } } = await sb.auth.getSession();
          if (!session || !session.user) {
            return false;
          }
          uid = session.user.id;
        }

        if (!uid) return false;

        const { data, error } = await sb
          .from('user_roles')
          .select('role')
          .eq('user_id', uid);

        if (error || !data || data.length === 0) {
          return false;
        }

        const allowedRoles = ['super_admin', 'admin', 'coordinator'];
        return data.some(r => r.role && allowedRoles.includes(r.role.toLowerCase().trim()));
      } catch (err) {
        console.warn('[TechnoritiDB] checkIsAdmin error:', err);
        return false;
      }
    },

    async getAdminRole(userId) {
      const sb = getSupabase();
      if (!sb) return null;

      try {
        let uid = userId;
        if (!uid) {
          const { data: { session } } = await sb.auth.getSession();
          if (!session || !session.user) return null;
          uid = session.user.id;
        }

        const { data, error } = await sb
          .from('user_roles')
          .select('role')
          .eq('user_id', uid);

        if (error || !data) return null;

        const allowedRoles = ['super_admin', 'admin', 'coordinator'];
        const matched = data.find(r => r.role && allowedRoles.includes(r.role.toLowerCase().trim()));
        return matched ? matched.role : null;
      } catch (err) {
        return null;
      }
    }
  };

  // Expose to window
  window.TechnoritiDB = TechnoritiDB;

})(window);
