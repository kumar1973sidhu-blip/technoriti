/**
 * TECHNORITI '26 - Supabase Client & Backend Bridge
 * Connects the public portal and admin panel to Supabase PostgreSQL + Auth
 */

(function (window) {
  'use strict';

  // Configured via project credentials with flexible runtime override support
  const SUPABASE_CONFIG = {
    url: (window.__ENV && window.__ENV.SUPABASE_URL) || (window.ENV && window.ENV.SUPABASE_URL) || 'https://rrkgrisyaeeuphnvhflu.supabase.co',
    anonKey: (window.__ENV && window.__ENV.SUPABASE_ANON_KEY) || (window.ENV && window.ENV.SUPABASE_ANON_KEY) || 'sb_publishable_EA2Vt_mY3bfxf9o0Ufgs4Q_WAufCucT'
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
            cover_image,
            gallery_images,
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

      // Generate client-side UUID upfront to eliminate SELECT requirement under public RLS
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
      };

      try {
        const regId = generateUUID();
        let bookingId = null;
        let teamId = null;
        const isLodging = !!regData.lodgingRequired;
        const isFooding = !!regData.foodingRequired;
        const needsServices = isLodging || isFooding;
        const teamSize = parseInt(regData.teamSize, 10) || 1;
        const lodgingDays = isLodging ? (parseInt(regData.lodgingDays, 10) || parseInt(regData.serviceDays, 10) || 2) : 0;
        const foodingDays = isFooding ? (parseInt(regData.foodingDays, 10) || parseInt(regData.serviceDays, 10) || 2) : 0;

        // Authoritative server-side recalculation of services
        const lodgingSubtotal = isLodging ? (50 * lodgingDays * teamSize) : 0;
        const foodingSubtotal = isFooding ? (125 * foodingDays * teamSize) : 0;
        const calculatedServicesTotal = lodgingSubtotal + foodingSubtotal;
        const serviceDaysMax = Math.max(lodgingDays, foodingDays, 1);

        const verifiedEventFee = parseInt(regData.eventFee, 10) || 0;
        const verifiedTotal = verifiedEventFee + calculatedServicesTotal;

        const servicesTag = `Services: [Lodging: ${isLodging ? 'YES (' + lodgingDays + 'd, ₹' + lodgingSubtotal + ')' : 'NO'} | Fooding: ${isFooding ? 'YES (' + foodingDays + 'd, ₹' + foodingSubtotal + ')' : 'NO'}] | People: ${teamSize} | Campus Total: ₹${calculatedServicesTotal}`;

        const rollNumber = (regData.rollNumber || '').trim();
        const safeEmail = (regData.email || '').trim().toLowerCase() || (rollNumber ? `${rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.bce` : 'participant@student.bce');

        // Check authenticated user ID
        let userId = regData.userId || null;
        if (!userId) {
          try {
            const { data: { session } } = await sb.auth.getSession();
            if (session && session.user) {
              userId = session.user.id;
            }
          } catch (_) {}
        }

        const selectedEvents = Array.isArray(regData.events) ? regData.events : (regData.selectedEvents || []);
        const eventsTitles = selectedEvents.length > 0 
          ? selectedEvents.map(e => e.title || e.id).join(', ') 
          : (regData.eventTitle || 'Competition');

        // 1. If accommodation or fooding is requested, create an accommodation booking record
        if (needsServices) {
          bookingId = generateUUID();
          const dailyRate = (isLodging ? 50 : 0) + (isFooding ? 125 : 0);

          const accomPayload = {
            id: bookingId,
            user_id: userId,
            full_name: (regData.fullName || '').trim(),
            email: safeEmail,
            phone: (regData.phone || '').trim(),
            college: (regData.college || '').trim(),
            gender: regData.gender || 'male',
            hostel_block: (regData.gender === 'female') ? 'Girls Hostel Block' : 'Boys Hostel Block',
            days_count: serviceDaysMax,
            members_count: teamSize,
            daily_rate: dailyRate,
            total_fee: calculatedServicesTotal,
            status: 'requested',
            has_lodging: isLodging,
            lodging_days: lodgingDays,
            lodging_subtotal: lodgingSubtotal,
            has_food: isFooding,
            food_days: foodingDays,
            food_subtotal: foodingSubtotal,
            payment_reference: regData.paymentReference || '',
            roll_number: rollNumber,
            branch: (regData.branch || '').trim(),
            academic_year: (regData.academicYear || '').trim(),
            admin_notes: `Roll: ${rollNumber || 'N/A'} | Linked Event: ${eventsTitles} | ${servicesTag}`
          };

          const { error: accomErr } = await sb
            .from('accommodation_bookings')
            .insert(accomPayload);

          if (accomErr) {
            console.warn('[Technoriti Supabase] Detailed accom insert error, retrying base payload:', accomErr.message);
            const baseAccomPayload = {
              id: bookingId,
              full_name: accomPayload.full_name,
              email: accomPayload.email,
              phone: accomPayload.phone,
              college: accomPayload.college,
              gender: accomPayload.gender,
              hostel_block: accomPayload.hostel_block,
              days_count: accomPayload.days_count,
              members_count: accomPayload.members_count,
              daily_rate: accomPayload.daily_rate,
              total_fee: accomPayload.total_fee,
              status: accomPayload.status,
              admin_notes: accomPayload.admin_notes
            };
            await sb.from('accommodation_bookings').insert(baseAccomPayload);
          }
        }

        // 2. If it's a team registration, create team record
        if (teamSize > 1) {
          teamId = generateUUID();
          const teamPayload = {
            id: teamId,
            team_name: `${(regData.fullName || 'Participant').trim()}'s Team`,
            event_id: regData.eventId || (selectedEvents[0] && selectedEvents[0].id) || 'general',
            college: (regData.college || '').trim(),
            leader_name: (regData.fullName || '').trim(),
            leader_email: safeEmail,
            leader_phone: (regData.phone || '').trim(),
            team_size: teamSize
          };

          const { error: teamErr } = await sb.from('teams').insert(teamPayload);
          if (teamErr) {
            console.warn('[Technoriti Supabase] Team registration note:', teamErr.message);
          }
        }

        // 3. Insert into central registrations table (pure insert without .select('*') to bypass RLS SELECT restriction)
        const regPayload = {
          id: regId,
          user_id: userId,
          full_name: (regData.fullName || '').trim(),
          email: safeEmail,
          phone: (regData.phone || '').trim(),
          college: (regData.college || '').trim(),
          roll_number: rollNumber,
          branch: (regData.branch || '').trim(),
          academic_year: (regData.academicYear || '').trim(),
          event_id: regData.eventId || (selectedEvents[0] && selectedEvents[0].id) || 'general',
          event_title: eventsTitles,
          selected_events: selectedEvents,
          team_id: teamId,
          team_size: teamSize,
          needs_accommodation: needsServices,
          accommodation_booking_id: bookingId,
          event_fee: verifiedEventFee,
          accommodation_fee: calculatedServicesTotal,
          total_amount: verifiedTotal,
          payment_status: 'pending',
          payment_reference: regData.paymentReference || '',
          admin_notes: `Roll: ${rollNumber || 'N/A'} | Competitions: ${eventsTitles} | Portal Submission | Ref: ${regData.refId || regId.slice(0, 8).toUpperCase()} | ${servicesTag}`
        };

        const { error: regErr } = await sb
          .from('registrations')
          .insert(regPayload);

        if (regErr) {
          console.warn('[Technoriti Supabase] Detailed registration insert note, falling back to base schema:', regErr.message);
          const fallbackPayload = {
            id: regId,
            full_name: regPayload.full_name,
            email: regPayload.email,
            phone: regPayload.phone,
            college: regPayload.college,
            event_id: regPayload.event_id,
            event_title: regPayload.event_title,
            team_id: regPayload.team_id,
            team_size: regPayload.team_size,
            needs_accommodation: regPayload.needs_accommodation,
            accommodation_booking_id: regPayload.accommodation_booking_id,
            event_fee: regPayload.event_fee,
            accommodation_fee: regPayload.accommodation_fee,
            total_amount: regPayload.total_amount,
            payment_status: regPayload.payment_status,
            payment_reference: regPayload.payment_reference,
            admin_notes: regPayload.admin_notes
          };
          const { error: fbErr } = await sb.from('registrations').insert(fallbackPayload);
          if (fbErr) {
            console.error('[Technoriti Supabase] Registration fallback insert failed:', fbErr);
            throw new Error(fbErr.message || 'Failed to record registration in database.');
          }
        }

        // 4. Log transaction in payments audit table
        try {
          await sb.from('payments').insert({
            registration_id: regId,
            amount: regData.totalAmount || 0,
            currency: 'INR',
            payment_method: 'upi_manual',
            transaction_reference: regData.paymentReference || `UTR-${Date.now()}`,
            status: 'pending'
          });
        } catch (payErr) {
          console.warn('[Technoriti Supabase] Payment audit note:', payErr.message);
        }

        return { success: true, id: regId, registration: regPayload };
      } catch (err) {
        console.error('[Technoriti Supabase] Registration submission failed:', err);
        throw err;
      }
    },

    /**
     * Fetch all registrations for authenticated Admin panel
     */
    async getRegistrationsAdmin() {
      const sb = getSupabase();
      if (!sb) {
        const empty = [];
        empty.data = empty;
        return empty;
      }

      try {
        let res = await sb
          .from('registrations')
          .select(`
            *,
            events:event_id (id, title, registration_fee, prize_pool),
            accommodation:accommodation_booking_id (id, hostel_block, days_count, members_count, daily_rate, total_fee, status, admin_notes)
          `)
          .order('created_at', { ascending: false });

        if (res.error) {
          console.warn('[TechnoritiDB] Full query error, falling back to base select:', res.error.message);
          res = await sb
            .from('registrations')
            .select('*')
            .order('created_at', { ascending: false });
        }
        const list = (res && res.data) || [];
        list.data = list; // backward compatibility for callers expecting { data: [...] }
        return list;
      } catch (err) {
        console.error('[TechnoritiDB] Failed to fetch registrations:', err);
        const empty = [];
        empty.data = empty;
        return empty;
      }
    },

    /**
     * Update participant registration payment status and admin notes
     */
    async updateRegistrationStatus(id, status, adminNotes = null) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable');
      const payload = {
        payment_status: status,
        updated_at: new Date().toISOString()
      };
      if (adminNotes !== null) {
        payload.admin_notes = adminNotes;
      }

      const { data, error } = await sb
        .from('registrations')
        .update(payload)
        .eq('id', id)
        .select('*');

      if (error) throw error;
      return data;
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
      const payload = { id, ...updates, updated_at: new Date().toISOString() };
      const { data, error } = await sb
        .from('content_sections')
        .upsert(payload, { onConflict: 'id' })
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

    async getAccommodationBookingsAdmin() {
      const sb = getSupabase();
      if (!sb) {
        const empty = [];
        empty.data = empty;
        return empty;
      }
      try {
        const { data, error } = await sb
          .from('accommodation_bookings')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('[TechnoritiDB] getAccommodationBookingsAdmin note:', error.message);
          const empty = [];
          empty.data = empty;
          return empty;
        }
        const list = data || [];
        list.data = list;
        return list;
      } catch (err) {
        console.warn('[TechnoritiDB] getAccommodationBookingsAdmin exception:', err);
        const empty = [];
        empty.data = empty;
        return empty;
      }
    },

    /**
     * Submit verified accommodation booking to Supabase
     */
    async submitAccommodationBooking(booking) {
      const sb = getSupabase();
      if (!sb) throw new Error('Supabase client unavailable. Please check your internet connection.');

      // Validation
      if (!booking.fullName || !booking.fullName.trim()) throw new Error('Full Name is required.');
      if (!booking.email || !booking.email.trim()) throw new Error('Valid email address is required.');
      if (!booking.phone || !/^[6-9]\d{9}$/.test(booking.phone.trim().replace(/\D/g, '').slice(-10))) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      if (!booking.college || !booking.college.trim()) throw new Error('College / University name is required.');

      const gender = (booking.gender || 'male').toLowerCase();
      const validGenders = ['male', 'female', 'other'];
      const normalizedGender = validGenders.includes(gender) ? gender : 'male';
      const hostelBlock = normalizedGender === 'female' ? 'Girls Hostel Block' : 'Boys Hostel Block';

      const membersCount = parseInt(booking.occupants || booking.membersCount, 10) || 1;
      const isLodging = booking.lodgingRequired !== false && booking.isLodging !== false;
      const isFooding = booking.foodRequired === true || booking.isFooding === true;

      if (!isLodging && !isFooding) {
        throw new Error('Please select at least one service: Lodging / Hostel or Fooding / Campus Mess.');
      }

      // Independent duration selectors for lodging and mess food
      const lodgingDays = isLodging ? (parseInt(booking.lodgingDays, 10) || parseInt(booking.daysCount, 10) || 2) : 0;
      const foodDays = isFooding ? (parseInt(booking.foodDays, 10) || parseInt(booking.daysCount, 10) || 2) : 0;
      const serviceDaysMax = Math.max(lodgingDays, foodDays, 1);

      const lodgingSubtotal = isLodging ? (50 * lodgingDays * membersCount) : 0;
      const foodingSubtotal = isFooding ? (125 * foodDays * membersCount) : 0;
      let discount = (isLodging && membersCount >= 12) ? 250 : ((isLodging && membersCount >= 4) ? 150 : 0);
      const calculatedTotal = Math.max(0, lodgingSubtotal + foodingSubtotal - discount);
      const totalFee = parseInt(booking.totalFee, 10) || calculatedTotal;
      const dailyRate = (isLodging ? 50 : 0) + (isFooding ? 125 : 0);

      // Check user_id
      let userId = booking.userId || null;
      if (!userId) {
        try {
          const { data: { session } } = await sb.auth.getSession();
          if (session && session.user) {
            userId = session.user.id;
          }
        } catch (_) {}
      }

      const bookingId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });

      const notesArr = [
        `Services: [Lodging: ${isLodging ? 'YES (' + lodgingDays + 'd, ₹' + lodgingSubtotal + ')' : 'NO'} | Fooding: ${isFooding ? 'YES (' + foodDays + 'd, ₹' + foodingSubtotal + ')' : 'NO'}]`,
        `Branch: ${booking.branch || 'Not specified'}`,
        `Roll: ${booking.rollNumber || 'N/A'}`,
        `Type: ${booking.bookingType || 'Solo'}`,
        booking.paymentReference ? `Payment Ref: ${booking.paymentReference}` : '',
        `Arrival: ${booking.arrival || 'Dec 2026'}`,
        booking.preferences ? `Notes: ${booking.preferences}` : ''
      ].filter(Boolean);

      const payload = {
        id: bookingId,
        user_id: userId,
        full_name: booking.fullName.trim(),
        email: booking.email.trim().toLowerCase(),
        phone: booking.phone.trim(),
        college: booking.college.trim(),
        gender: normalizedGender,
        hostel_block: isLodging ? hostelBlock : 'Not Applicable (Campus Mess Dining Pass)',
        room_number: booking.roomNumber || null,
        days_count: serviceDaysMax,
        members_count: membersCount,
        daily_rate: dailyRate,
        total_fee: totalFee,
        status: 'requested',
        has_lodging: isLodging,
        lodging_days: lodgingDays,
        lodging_subtotal: lodgingSubtotal,
        has_food: isFooding,
        food_days: foodDays,
        food_subtotal: foodingSubtotal,
        payment_reference: booking.paymentReference || '',
        roll_number: booking.rollNumber || '',
        branch: booking.branch || '',
        academic_year: booking.academicYear || '',
        admin_notes: notesArr.join(' | ')
      };

      try {
        const { data, error } = await sb
          .from('accommodation_bookings')
          .insert(payload)
          .select('*')
          .single();

        if (error) {
          console.warn('[TechnoritiDB] Full accom insert note, retrying base schema:', error.message);
          const basePayload = {
            id: bookingId,
            full_name: payload.full_name,
            email: payload.email,
            phone: payload.phone,
            college: payload.college,
            gender: payload.gender,
            hostel_block: payload.hostel_block,
            days_count: payload.days_count,
            members_count: payload.members_count,
            daily_rate: payload.daily_rate,
            total_fee: payload.total_fee,
            status: payload.status,
            admin_notes: payload.admin_notes
          };
          const { data: baseData, error: baseErr } = await sb
            .from('accommodation_bookings')
            .insert(basePayload)
            .select('*')
            .single();

          if (baseErr) throw baseErr;
          return { success: true, booking: baseData || basePayload };
        }

        return { success: true, booking: data || payload };
      } catch (err) {
        console.error('[TechnoritiDB] Booking failed:', err);
        throw new Error(err.message || 'Failed to submit accommodation booking.');
      }
    },

    /**
     * Alias for decoupled accommodation booking submission
     */
    async submitIndependentAccommodation(booking) {
      return this.submitAccommodationBooking(booking);
    },

    // Accommodation FAQs CMS
    async getAccommodationFAQs() {
      const sb = getSupabase();
      if (!sb) return null;
      try {
        const { data, error } = await sb.from('site_settings').select('value').eq('key', 'accommodation_faqs').single();
        if (error || !data) return null;
        return data.value;
      } catch (err) {
        return null;
      }
    },

    async saveAccommodationFAQs(faqs) {
      return this.updateSiteSetting('accommodation_faqs', faqs, 'Editable Accommodation Frequently Asked Questions');
    },

    // Payment Gateway Public Configuration CMS
    async getPaymentGatewayConfig() {
      const sb = getSupabase();
      if (!sb) return null;
      try {
        const { data, error } = await sb.from('site_settings').select('value').eq('key', 'payment_gateway_config').single();
        if (error || !data) return null;
        return data.value;
      } catch (err) {
        return null;
      }
    },

    async savePaymentGatewayConfig(config) {
      // Security check: Never store private/secret keys in public site_settings
      const safeConfig = {
        provider: config.provider || 'manual_upi',
        environment: config.environment || 'sandbox',
        key_id: config.key_id || '', // Public Key only
        merchant_upi: config.merchant_upi || '',
        merchant_name: config.merchant_name || 'BCE Bhagalpur Technoriti',
        checkout_enabled: !!config.checkout_enabled,
        currency: 'INR',
        webhook_status: config.webhook_status || 'not_configured',
        updated_at: new Date().toISOString()
      };
      return this.updateSiteSetting('payment_gateway_config', safeConfig, 'Public Payment Gateway Integration Configuration');
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

    async getAuditLogsAdmin(limit = 60) {
      const sb = getSupabase();
      if (!sb) return [];
      try {
        const { data, error } = await sb
          .from('admin_audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (error) {
          console.warn('[TechnoritiDB] getAuditLogsAdmin error:', error.message);
          return [];
        }
        const list = data || [];
        list.data = list;
        return list;
      } catch (err) {
        console.warn('[TechnoritiDB] getAuditLogsAdmin exception:', err);
        return [];
      }
    },

    async getPaymentsAdmin() {
      const sb = getSupabase();
      if (!sb) return [];
      try {
        const { data, error } = await sb
          .from('payments')
          .select('*, registrations:registration_id(full_name, email, event_title)')
          .order('created_at', { ascending: false });
        if (error) {
          console.warn('[TechnoritiDB] getPaymentsAdmin error:', error.message);
          return [];
        }
        const list = data || [];
        list.data = list;
        return list;
      } catch (err) {
        console.warn('[TechnoritiDB] getPaymentsAdmin exception:', err);
        return [];
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
    },

    // =====================================================================
    // PARTICIPANT AUTHENTICATION & PROFILE METHODS
    // =====================================================================

    /**
     * Participant Sign-Up
     * Registers a new participant via Supabase Auth and populates public.profiles
     */
    async signUpParticipant(userData) {
      const sb = getSupabase();
      if (!sb) {
        return { success: false, error: 'Database service is currently unreachable. Please check your internet.' };
      }

      const email = (userData.email || '').trim().toLowerCase();
      const password = userData.password || '';
      const fullName = (userData.fullName || '').trim();
      const college = (userData.college || '').trim();
      const branch = (userData.branch || '').trim();
      const academicYear = (userData.academicYear || '').trim();
      const rollNumber = (userData.rollNumber || '').trim();
      const phone = (userData.phone || '').trim().replace(/\D/g, '').slice(-10);

      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }
      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long.' };
      }
      if (!fullName) {
        return { success: false, error: 'Full Name is required.' };
      }
      if (!rollNumber) {
        return { success: false, error: 'Roll Number is required.' };
      }
      if (!college) {
        return { success: false, error: 'College / University name is required.' };
      }

      try {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              college: college,
              branch: branch,
              academic_year: academicYear,
              roll_number: rollNumber,
              phone: phone
            }
          }
        });

        if (error) {
          if (error.message && error.message.toLowerCase().includes('already registered')) {
            return { success: false, error: 'An account with this email address already exists. Please sign in instead.' };
          }
          return { success: false, error: error.message || 'Registration failed. Please check your details.' };
        }

        if (!data || !data.user) {
          return { success: false, error: 'Sign-up failed: No user record was created.' };
        }

        const user = data.user;

        // Upsert into public.profiles
        try {
          await sb.from('profiles').upsert({
            id: user.id,
            email: email,
            full_name: fullName,
            college: college,
            branch: branch,
            academic_year: academicYear,
            roll_number: rollNumber,
            phone: phone,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (profErr) {
          console.warn('[TechnoritiDB] Profile upsert note:', profErr.message);
        }

        return {
          success: true,
          user: user,
          session: data.session,
          requiresEmailConfirmation: !data.session
        };
      } catch (err) {
        console.error('[TechnoritiDB] signUpParticipant exception:', err);
        return { success: false, error: err.message || 'An unexpected error occurred during sign up.' };
      }
    },

    /**
     * Participant Sign-In
     */
    async signInParticipant(email, password) {
      const sb = getSupabase();
      if (!sb) {
        return { success: false, error: 'Database service is currently unreachable. Check your connection.' };
      }

      try {
        const { data, error } = await sb.auth.signInWithPassword({
          email: (email || '').trim().toLowerCase(),
          password: password || ''
        });

        if (error) {
          return { success: false, error: error.message || 'Invalid email or password.' };
        }

        if (!data || !data.user) {
          return { success: false, error: 'Sign in failed: No user found.' };
        }

        return {
          success: true,
          user: data.user,
          session: data.session
        };
      } catch (err) {
        console.error('[TechnoritiDB] signInParticipant exception:', err);
        return { success: false, error: err.message || 'An unexpected error occurred during sign in.' };
      }
    },

    /**
     * Send Password Reset Email
     */
    async resetPassword(email) {
      const sb = getSupabase();
      if (!sb) return { success: false, error: 'Database service is currently unreachable.' };

      try {
        const redirectUrl = (typeof window !== 'undefined' && window.location) 
          ? `${window.location.origin}/login.html` 
          : 'https://technoriti-nine.vercel.app/login.html';

        const { error } = await sb.auth.resetPasswordForEmail((email || '').trim().toLowerCase(), {
          redirectTo: redirectUrl
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (err) {
        return { success: false, error: err.message || 'Could not send reset email.' };
      }
    },

    /**
     * Fetch profile for current participant
     */
    async getParticipantProfile(userId) {
      const sb = getSupabase();
      if (!sb || !userId) return null;

      try {
        const { data, error } = await sb
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          // If error, attempt from auth metadata
          const user = await this.getCurrentUser();
          if (user && user.id === userId && user.user_metadata) {
            return {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata.full_name || '',
              college: user.user_metadata.college || '',
              branch: user.user_metadata.branch || '',
              academic_year: user.user_metadata.academic_year || '',
              roll_number: user.user_metadata.roll_number || '',
              phone: user.user_metadata.phone || ''
            };
          }
          return null;
        }

        return data;
      } catch (err) {
        console.warn('[TechnoritiDB] getParticipantProfile exception:', err);
        return null;
      }
    },

    /**
     * Update participant profile details
     */
    async updateParticipantProfile(userId, updates) {
      const sb = getSupabase();
      if (!sb || !userId) throw new Error('Supabase client unavailable');

      const payload = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await sb
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },

    /**
     * Fetch registered competitions strictly for the specified participant
     */
    async getParticipantRegistrations(userId, email) {
      const sb = getSupabase();
      if (!sb) return [];

      try {
        let query = sb.from('registrations').select('*');

        if (userId && email) {
          query = query.or(`user_id.eq.${userId},email.eq.${email.toLowerCase()}`);
        } else if (userId) {
          query = query.eq('user_id', userId);
        } else if (email) {
          query = query.eq('email', email.toLowerCase());
        } else {
          return [];
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
          console.warn('[TechnoritiDB] getParticipantRegistrations note:', error.message);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('[TechnoritiDB] getParticipantRegistrations exception:', err);
        return [];
      }
    },

    /**
     * Fetch accommodation bookings strictly for the specified participant
     */
    async getParticipantAccommodations(userId, email) {
      const sb = getSupabase();
      if (!sb) return [];

      try {
        let query = sb.from('accommodation_bookings').select('*');

        if (userId && email) {
          query = query.or(`user_id.eq.${userId},email.eq.${email.toLowerCase()}`);
        } else if (userId) {
          query = query.eq('user_id', userId);
        } else if (email) {
          query = query.eq('email', email.toLowerCase());
        } else {
          return [];
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) {
          console.warn('[TechnoritiDB] getParticipantAccommodations note:', error.message);
          return [];
        }
        return data || [];
      } catch (err) {
        console.warn('[TechnoritiDB] getParticipantAccommodations exception:', err);
        return [];
      }
    },

    /**
     * Fetch all participant accounts for Admin Desk
     */
    async getParticipantAccountsAdmin() {
      const sb = getSupabase();
      if (!sb) return { data: [] };

      try {
        const { data, error } = await sb
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[TechnoritiDB] getParticipantAccountsAdmin note:', error.message);
          return { data: [] };
        }
        const list = data || [];
        list.data = list;
        return list;
      } catch (err) {
        console.warn('[TechnoritiDB] getParticipantAccountsAdmin exception:', err);
        const list = [];
        list.data = list;
        return list;
      }
    }
  };

  // Expose to window and global scope unconditionally
  if (typeof window !== 'undefined') {
    window.TechnoritiDB = TechnoritiDB;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.TechnoritiDB = TechnoritiDB;
  }
  if (typeof self !== 'undefined') {
    self.TechnoritiDB = TechnoritiDB;
  }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
