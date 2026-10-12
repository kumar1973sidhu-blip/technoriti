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

        // 1. If accommodation or fooding is requested, create an accommodation booking record
        if (needsServices) {
          bookingId = generateUUID();
          const dailyRate = (isLodging ? 50 : 0) + (isFooding ? 125 : 0);

          const accomPayload = {
            id: bookingId,
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
            admin_notes: `Roll: ${rollNumber || 'N/A'} | Linked Event: ${regData.eventTitle} | ${servicesTag}`
          };

          const { error: accomErr } = await sb
            .from('accommodation_bookings')
            .insert(accomPayload);

          if (accomErr) {
            console.warn('[Technoriti Supabase] Accommodation booking note:', accomErr.message);
          }
        }

        // 2. If it's a team registration, create team record
        if (teamSize > 1) {
          teamId = generateUUID();
          const teamPayload = {
            id: teamId,
            team_name: `${(regData.fullName || 'Participant').trim()}'s Team`,
            event_id: regData.eventId,
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
          full_name: (regData.fullName || '').trim(),
          email: safeEmail,
          phone: (regData.phone || '').trim(),
          college: (regData.college || '').trim(),
          event_id: regData.eventId,
          event_title: regData.eventTitle,
          team_id: teamId,
          team_size: teamSize,
          needs_accommodation: needsServices,
          accommodation_booking_id: bookingId,
          event_fee: verifiedEventFee,
          accommodation_fee: calculatedServicesTotal,
          total_amount: verifiedTotal,
          payment_status: 'pending',
          payment_reference: regData.paymentReference || '',
          admin_notes: `Roll: ${rollNumber || 'N/A'} | Competitions: ${regData.eventTitle} | Portal Submission | Ref: ${regData.refId || regId.slice(0, 8).toUpperCase()} | ${servicesTag}`
        };

        const { error: regErr } = await sb
          .from('registrations')
          .insert(regPayload);

        if (regErr) {
          console.error('[Technoriti Supabase] Registration insert failed:', regErr);
          throw new Error(regErr.message || 'Failed to record registration in database.');
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

      const membersCount = parseInt(booking.occupants, 10) || 1;
      const daysCount = parseInt(booking.daysCount, 10) || 2;
      const isLodging = booking.lodgingRequired !== false;
      const isFooding = booking.foodRequired === true;

      if (!isLodging && !isFooding) {
        throw new Error('Please select at least one service: Lodging / Hostel or Fooding / Campus Mess.');
      }

      const lodgingSubtotal = isLodging ? (50 * daysCount * membersCount) : 0;
      const foodingSubtotal = isFooding ? (125 * daysCount * membersCount) : 0;
      let discount = (isLodging && membersCount >= 12) ? 250 : ((isLodging && membersCount >= 4) ? 150 : 0);
      const calculatedTotal = Math.max(0, lodgingSubtotal + foodingSubtotal - discount);
      const totalFee = parseInt(booking.totalFee, 10) || calculatedTotal;
      const dailyRate = (isLodging ? 50 : 0) + (isFooding ? 125 : 0);

      const notesArr = [
        `Services: [Lodging: ${isLodging ? 'YES' : 'NO'} (₹${lodgingSubtotal}) | Fooding: ${isFooding ? 'YES' : 'NO'} (₹${foodingSubtotal})]`,
        `Branch: ${booking.branch || 'Not specified'}`,
        `Roll: ${booking.rollNumber || 'N/A'}`,
        `Type: ${booking.bookingType || 'Solo'}`,
        `Arrival: ${booking.arrival || 'Dec 2026'}`,
        booking.preferences ? `Notes: ${booking.preferences}` : ''
      ].filter(Boolean);

      const payload = {
        full_name: booking.fullName.trim(),
        email: booking.email.trim().toLowerCase(),
        phone: booking.phone.trim(),
        college: booking.college.trim(),
        gender: normalizedGender,
        hostel_block: hostelBlock,
        days_count: daysCount,
        members_count: membersCount,
        daily_rate: dailyRate,
        total_fee: totalFee,
        status: 'requested',
        admin_notes: notesArr.join(' | ')
      };

      const { data, error } = await sb
        .from('accommodation_bookings')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        console.error('[TechnoritiDB] Booking failed:', error);
        throw new Error(error.message || 'Failed to submit accommodation booking.');
      }

      return { success: true, booking: data };
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
