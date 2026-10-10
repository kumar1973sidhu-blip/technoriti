/**
 * TECHNORITI '26 / '27 - Complete CMS & Festival Management System
 * Full Dynamic Admin Console with PostgreSQL RLS & Supabase Auth
 */

(function () {
  'use strict';

  // Global Admin State
  const state = {
    currentUser: null,
    isAdmin: false,
    userRole: 'super_admin',
    currentTab: 'dashboard',
    settings: {},
    contentSections: [],
    navItems: [],
    events: [],
    sponsors: [],
    accommodationOptions: [],
    accommodations: [],
    registrations: [],
    payments: [],
    media: [],
    adminUsers: [],
    auditLogs: [],
    activeMediaPickerTarget: null,
    selectedEventIdForPrizes: null
  };

  // Toast Notification Utility
  window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `<span>${type === 'error' ? '⚠️' : type === 'success' ? '✅' : '⚡'}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  };

  // Modal Open/Close Utilities
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  };

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
    }
  });

  // Tab Switching
  window.switchTab = function (tabName) {
    state.currentTab = tabName;

    // Update sidebar buttons
    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab panes
    document.querySelectorAll('.admin-tab-pane').forEach((pane) => {
      if (pane.id === `pane-${tabName}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Update Header title
    const heading = document.getElementById('pageHeading');
    const subheading = document.getElementById('pageSubheading');
    if (heading && subheading) {
      const titles = {
        'dashboard': ['Command Center & Analytics', 'Real-time festival registration analytics and live telemetry'],
        'cms-homepage': ['Homepage CMS (Hero & Broadcast)', 'Edit fest titles, edition, taglines, countdown, and urgent announcements'],
        'cms-about': ['About BCE & Leadership CMS', 'Manage Principal address, convenor messages, and college legacy copy'],
        'cms-navigation': ['Navigation Menu Manager', 'Add, edit, reorder, and configure internal & external portal links'],
        'cms-sections': ['Page Section Visibility & Ordering', 'Publish, hide, rename, and sort homepage sections'],
        'cms-general': ['General Settings & Footer', 'Contact coordinates, social media links, and copyright text'],
        'cms-seo': ['SEO & Social Metadata', 'Optimize Google search ranking, meta tags, and OpenGraph social cards'],
        'competitions': ['Competitions Management', 'Add, edit, duplicate, delete, and toggle all 29 festival events'],
        'prizes-rules': ['Prizes & Rule Clauses Desk', 'Configure normalized position prizes and competition rule clauses'],
        'sponsors': ['Sponsors & Partners Desk', 'Manage title sponsors, tech partners, emblems, and click-through links'],
        'accommodation-tariffs': ['Accommodation Tariffs & Logistics', 'Configure lodging and food fees, bed inventory, and coordinators'],
        'accommodations': ['Hostel Bookings Desk', 'Review outstation student stay applications and allot campus rooms'],
        'registrations': ['Participant Registrations Desk', 'Search, filter, inspect, and verify all festival participant submissions'],
        'payments': ['Financial Ledger & Receipts', 'Verify UPI transactions, inspect receipts, and manage refunds'],
        'media': ['Media Library & Asset Manager', 'Upload and manage logos, banners, event graphics, and documents'],
        'users': ['Access Control & Role Permissions', 'Manage Super Admins, Event Leads, Coordinators, and Volunteers'],
        'audit': ['Security & Audit Trails', 'Immutable PostgreSQL log of administrative actions and RLS policy status']
      };
      if (titles[tabName]) {
        heading.textContent = titles[tabName][0];
        subheading.textContent = titles[tabName][1];
      }
    }

    // Close mobile drawer if open
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) sidebar.classList.remove('open');
  };

  // =========================================================================
  // 1. AUTHENTICATION & SECURITY GUARD
  // =========================================================================
  async function initSecurityGuard() {
    try {
      const client = TechnoritiDB.getClient();
      if (!client) {
        window.location.replace('login.html');
        return false;
      }

      const { data: { session } } = await client.auth.getSession();
      if (!session || !session.user) {
        window.location.replace('login.html');
        return false;
      }

      // Check admin role in user_roles
      const isAdmin = await TechnoritiDB.checkIsAdmin(session.user.id);
      if (!isAdmin) {
        await TechnoritiDB.signOut();
        window.location.replace('login.html');
        return false;
      }

      const role = await TechnoritiDB.getAdminRole(session.user.id);

      state.currentUser = session.user;
      state.isAdmin = true;
      state.userRole = role || 'super_admin';

      // Update UI with admin details
      const emailDisplay = document.getElementById('adminEmailDisplay');
      const roleDisplay = document.getElementById('adminRoleDisplay');
      const avatarDisplay = document.getElementById('adminAvatar');

      if (emailDisplay && session.user.email) {
        emailDisplay.textContent = session.user.email;
      }
      if (roleDisplay && role) {
        roleDisplay.textContent = role.toUpperCase().replace('_', ' ');
      }
      if (avatarDisplay && session.user.email) {
        avatarDisplay.textContent = session.user.email.charAt(0).toUpperCase();
      }

      return true;
    } catch (err) {
      console.error('Security guard error:', err);
      window.location.replace('login.html');
      return false;
    }
  }

  // =========================================================================
  // 2. DATA SYNCHRONIZATION
  // =========================================================================
  async function fetchAllData() {
    const client = TechnoritiDB.getClient();
    if (!client) return;

    try {
      // 1. Site Settings
      const settings = await TechnoritiDB.getSiteSettings();
      if (settings) state.settings = settings;

      // 2. Content Sections
      state.contentSections = await TechnoritiDB.getContentSections();

      // 3. Navigation Items
      state.navItems = await TechnoritiDB.getNavigationItems(false);

      // 4. Events
      state.events = await TechnoritiDB.getAllEventsAdmin();

      // 5. Sponsors
      state.sponsors = await TechnoritiDB.getAllSponsorsAdmin();

      // 6. Accommodation Options & Bookings
      state.accommodationOptions = await TechnoritiDB.getAccommodationOptions();
      const { data: accData } = await client
        .from('accommodation_bookings')
        .select('*')
        .order('created_at', { ascending: false });
      if (accData) state.accommodations = accData;

      // 7. Registrations
      const { data: regData } = await client
        .from('registrations')
        .select(`
          *,
          events:event_id (id, title, registration_fee, prize_pool),
          teams:team_id (id, team_name, members:team_members(*))
        `)
        .order('created_at', { ascending: false });
      if (regData) state.registrations = regData;

      // 8. Payments
      const { data: payData } = await client
        .from('payments')
        .select('*, registrations:registration_id(full_name, email, event_title)')
        .order('created_at', { ascending: false });
      if (payData) state.payments = payData;

      // 9. Media Assets
      state.media = await TechnoritiDB.getMediaAssets();

      // 10. Admin Users
      state.adminUsers = await TechnoritiDB.getAdminUsers();

      // 11. Audit Logs
      const { data: logsData } = await client
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);
      if (logsData) state.auditLogs = logsData;

      // Render all views with live data
      renderAllViews();
      showToast('Live database synchronization complete', 'success');
    } catch (err) {
      console.warn('Sync note:', err.message);
      renderAllViews();
    }
  }

  function renderAllViews() {
    renderDashboard();
    populateCmsHomepage();
    populateCmsAbout();
    renderNavigationTable();
    renderSectionVisibilityCards();
    populateCmsGeneral();
    populateCmsSeo();
    renderCompetitionsTable();
    populatePrizesEventSelector();
    renderSponsorsTable();
    populateAccommodationTariffs();
    renderAccommodationsTable();
    renderRegistrationsTable();
    renderPaymentsTable();
    renderMediaGrid();
    renderAdminUsersTable();
    renderAuditLogsTable();
    populateEventFilterDropdown();
  }

  // =========================================================================
  // 3. DASHBOARD & LIVE TELEMETRY
  // =========================================================================
  function renderDashboard() {
    const totalRegs = state.registrations.length;
    const verifiedRegs = state.registrations.filter(r => r.payment_status === 'completed' || r.payment_status === 'verified').length;
    const pendingRegs = totalRegs - verifiedRegs;

    let revenue = 0;
    state.registrations.forEach(r => {
      if (r.payment_status === 'completed' || r.payment_status === 'verified') {
        const fee = r.events?.registration_fee || r.event_fee || 0;
        revenue += Number(fee) || 0;
      }
    });

    let totalParticipants = 0;
    let totalTeams = 0;
    state.registrations.forEach(r => {
      const size = Number(r.team_size) || 1;
      totalParticipants += size;
      if (size > 1) totalTeams++;
    });

    document.getElementById('kpiTotalRegs').textContent = totalRegs.toString();
    document.getElementById('kpiRegsBreakdown').textContent = `Verified: ${verifiedRegs} | Pending: ${pendingRegs}`;
    document.getElementById('kpiRevenue').textContent = `₹${revenue.toLocaleString('en-IN')}`;
    document.getElementById('kpiAccommodations').textContent = state.accommodations.length.toString();
    document.getElementById('kpiActiveEvents').textContent = (state.events.length || 29).toString();
    document.getElementById('kpiVerifiedCount').textContent = verifiedRegs.toString();
    document.getElementById('kpiPendingCount').textContent = pendingRegs.toString();
    document.getElementById('kpiParticipantsCount').textContent = totalParticipants.toString();
    document.getElementById('kpiTeamsCount').textContent = totalTeams.toString();

    // Chart 1: Top Competitions
    const chartEventEl = document.getElementById('chartEventRegs');
    if (chartEventEl) {
      const counts = {};
      state.registrations.forEach(r => {
        const title = r.events?.title || r.event_title || 'General';
        counts[title] = (counts[title] || 0) + 1;
      });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (sorted.length === 0) {
        chartEventEl.innerHTML = '<div style="color:var(--text-muted); font-size:0.85rem; padding:12px; text-align:center;">No registration entries recorded yet.</div>';
      } else {
        const max = Math.max(...sorted.map(s => s[1]), 1);
        chartEventEl.innerHTML = sorted.map(([title, cnt]) => `
          <div class="chart-bar-row">
            <div class="chart-bar-label">
              <span>${escapeHtml(title)}</span>
              <strong>${cnt} entries</strong>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width: ${(cnt / max) * 100}%"></div>
            </div>
          </div>
        `).join('');
      }
    }

    // Chart 2: Payment Status
    const chartPayEl = document.getElementById('chartPaymentStats');
    if (chartPayEl) {
      const payCounts = { verified: verifiedRegs, pending: pendingRegs };
      chartPayEl.innerHTML = `
        <div class="chart-bar-row">
          <div class="chart-bar-label">
            <span>Verified Payments</span>
            <strong style="color:var(--accent-green);">${verifiedRegs}</strong>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${totalRegs > 0 ? (verifiedRegs/totalRegs)*100 : 0}%; background:var(--accent-green);"></div>
          </div>
        </div>
        <div class="chart-bar-row">
          <div class="chart-bar-label">
            <span>Pending Verification</span>
            <strong style="color:var(--accent-yellow);">${pendingRegs}</strong>
          </div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${totalRegs > 0 ? (pendingRegs/totalRegs)*100 : 0}%; background:var(--accent-yellow);"></div>
          </div>
        </div>
      `;
    }

    // Recent 5 Registrations Table
    const tbody = document.getElementById('overviewRecentTableBody');
    if (tbody) {
      if (state.registrations.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="table-empty-state">
              <div class="table-empty-icon">📝</div>
              <div>No registrations received yet. Waiting for participant entries.</div>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = state.registrations.slice(0, 5).map(reg => {
          const pName = reg.full_name || reg.participant_name || 'Participant';
          const eventTitle = reg.events?.title || reg.event_title || 'Event';
          const college = reg.college || 'BCE Bhagalpur';
          const phone = reg.phone || '—';
          const isVerified = reg.payment_status === 'completed' || reg.payment_status === 'verified';
          const dateStr = reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent';

          return `
            <tr>
              <td style="font-weight:700; color:#fff;">${escapeHtml(pName)}</td>
              <td><span style="color:var(--accent-cyan);">${escapeHtml(eventTitle)}</span></td>
              <td>${escapeHtml(college)}</td>
              <td>${escapeHtml(phone)}</td>
              <td><span class="badge-status ${isVerified ? 'badge-verified' : 'badge-pending'}">${isVerified ? 'VERIFIED' : 'PENDING'}</span></td>
              <td style="color:var(--text-muted); font-size:0.8rem;">${dateStr}</td>
            </tr>
          `;
        }).join('');
      }
    }
  }

  // =========================================================================
  // 4. CMS HOMEPAGE (HERO, ANNOUNCEMENTS, COUNTERS)
  // =========================================================================
  function populateCmsHomepage() {
    const festInfo = state.settings.general_fest_info || {};
    const heroInfo = state.settings.hero_section || {};
    const announceInfo = state.settings.announcement_banner || {};
    const statsInfo = state.settings.live_stats || {};

    // Hero Section
    const festNameInput = document.getElementById('cfgFestName');
    if (festNameInput) festNameInput.value = festInfo.fest_name || "TECHNORITI '26";

    const editionInput = document.getElementById('cfgEdition');
    if (editionInput) editionInput.value = festInfo.edition || '2026';

    const collegeTagInput = document.getElementById('cfgCollegeTag');
    if (collegeTagInput) collegeTagInput.value = festInfo.college_tag || 'BCE BHAGALPUR';

    const subtitleInput = document.getElementById('cfgFestSubtitle');
    if (subtitleInput) subtitleInput.value = festInfo.subtitle || 'Where Innovation Meets Reality';

    const heroDescInput = document.getElementById('cfgHeroDesc');
    if (heroDescInput) heroDescInput.value = heroInfo.description || 'Join Bihar\'s premier national technical festival featuring 29 high-octane engineering competitions, mega robotics arena, and hackathons.';

    const ctaPrimTextInput = document.getElementById('cfgCtaPrimaryText');
    if (ctaPrimTextInput) ctaPrimTextInput.value = festInfo.cta_primary_text || 'REGISTER';

    const ctaPrimLinkInput = document.getElementById('cfgCtaPrimaryLink');
    if (ctaPrimLinkInput) ctaPrimLinkInput.value = festInfo.cta_primary_link || 'register';

    const ctaSecTextInput = document.getElementById('cfgCtaSecondaryText');
    if (ctaSecTextInput) ctaSecTextInput.value = festInfo.cta_secondary_text || 'EXPLORE EVENTS';

    const ctaSecLinkInput = document.getElementById('cfgCtaSecondaryLink');
    if (ctaSecLinkInput) ctaSecLinkInput.value = festInfo.cta_secondary_link || 'competitions';

    const countdownInput = document.getElementById('cfgCountdownTarget');
    if (countdownInput && festInfo.countdown_target) {
      try {
        countdownInput.value = new Date(festInfo.countdown_target).toISOString().slice(0, 16);
      } catch (e) {}
    }

    const regBadgeInput = document.getElementById('cfgRegStatusBadge');
    if (regBadgeInput) regBadgeInput.value = festInfo.registration_status || 'open';

    const regBtnVisInput = document.getElementById('cfgRegBtnVisible');
    if (regBtnVisInput) regBtnVisInput.checked = festInfo.registration_btn_visible !== false;

    // Announcement Banner
    const announceEnabled = document.getElementById('cfgAnnounceEnabled');
    if (announceEnabled) announceEnabled.checked = !!announceInfo.enabled;

    const announceText = document.getElementById('cfgAnnounceText');
    if (announceText) announceText.value = announceInfo.text || '';

    const announceUrl = document.getElementById('cfgAnnounceUrl');
    if (announceUrl) announceUrl.value = announceInfo.link_url || '';

    const announcePriority = document.getElementById('cfgAnnouncePriority');
    if (announcePriority) announcePriority.value = announceInfo.priority || 'normal';

    // Stats Counters
    const statComps = document.getElementById('cfgStatCompetitions');
    if (statComps) statComps.value = statsInfo.competitions_stat || '29+';

    const statPrize = document.getElementById('cfgStatPrizePool');
    if (statPrize) statPrize.value = statsInfo.prize_pool_stat || '₹1,00,000+';

    const statParts = document.getElementById('cfgStatParticipants');
    if (statParts) statParts.value = statsInfo.participants_stat || '1,500+';

    const statColls = document.getElementById('cfgStatColleges');
    if (statColls) statColls.value = statsInfo.colleges_stat || '50+';
  }

  window.saveHeroSectionSettings = async function () {
    try {
      const current = state.settings.general_fest_info || {};
      const updated = {
        ...current,
        fest_name: document.getElementById('cfgFestName').value.trim(),
        edition: document.getElementById('cfgEdition').value.trim(),
        college_tag: document.getElementById('cfgCollegeTag').value.trim(),
        subtitle: document.getElementById('cfgFestSubtitle').value.trim(),
        cta_primary_text: document.getElementById('cfgCtaPrimaryText').value.trim(),
        cta_primary_link: document.getElementById('cfgCtaPrimaryLink').value.trim(),
        cta_secondary_text: document.getElementById('cfgCtaSecondaryText').value.trim(),
        cta_secondary_link: document.getElementById('cfgCtaSecondaryLink').value.trim(),
        countdown_target: document.getElementById('cfgCountdownTarget').value,
        registration_status: document.getElementById('cfgRegStatusBadge').value,
        registration_btn_visible: document.getElementById('cfgRegBtnVisible').checked
      };

      await TechnoritiDB.updateSiteSetting('general_fest_info', updated, 'Core festival metadata');

      const heroUpdates = {
        description: document.getElementById('cfgHeroDesc').value.trim()
      };
      await TechnoritiDB.updateSiteSetting('hero_section', heroUpdates, 'Hero section body copy');

      state.settings.general_fest_info = updated;
      state.settings.hero_section = heroUpdates;

      // Update sidebar title dynamically
      const sBrand = document.getElementById('sidebarBrandName');
      if (sBrand) sBrand.textContent = updated.fest_name;

      await TechnoritiDB.logAdminAction('UPDATE_HERO_SETTINGS', 'site_settings', 'general_fest_info', current, updated);
      showToast('Hero settings saved and published to public site!', 'success');
    } catch (err) {
      showToast('Failed to save hero settings: ' + err.message, 'error');
    }
  };

  window.saveAnnouncementSettings = async function () {
    try {
      const updated = {
        enabled: document.getElementById('cfgAnnounceEnabled').checked,
        text: document.getElementById('cfgAnnounceText').value.trim(),
        link_url: document.getElementById('cfgAnnounceUrl').value.trim(),
        priority: document.getElementById('cfgAnnouncePriority').value
      };
      await TechnoritiDB.updateSiteSetting('announcement_banner', updated, 'Portal urgent broadcast banner');
      state.settings.announcement_banner = updated;
      showToast('Announcement ticker updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save announcement: ' + err.message, 'error');
    }
  };

  window.saveStatsCountersSettings = async function () {
    try {
      const updated = {
        competitions_stat: document.getElementById('cfgStatCompetitions').value.trim(),
        prize_pool_stat: document.getElementById('cfgStatPrizePool').value.trim(),
        participants_stat: document.getElementById('cfgStatParticipants').value.trim(),
        colleges_stat: document.getElementById('cfgStatColleges').value.trim()
      };
      await TechnoritiDB.updateSiteSetting('live_stats', updated, 'Festival impact counters');
      state.settings.live_stats = updated;
      showToast('Impact counters saved successfully!', 'success');
    } catch (err) {
      showToast('Failed to save counters: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 5. CMS ABOUT & LEADERSHIP
  // =========================================================================
  function populateCmsAbout() {
    const secPrincipal = state.contentSections.find(s => s.id === 'about_principal') || {};
    const secConvenors = state.contentSections.find(s => s.id === 'about_convenors') || {};
    const secLegacy = state.contentSections.find(s => s.id === 'about_legacy') || {};

    const pName = document.getElementById('cfgPrincipalName');
    if (pName) pName.value = secPrincipal.title || 'Dr. Bimlesh Kumar';

    const pSub = document.getElementById('cfgPrincipalSubtitle');
    if (pSub) pSub.value = secPrincipal.subtitle || 'Principal, Bhagalpur College of Engineering';

    const pQuote = document.getElementById('cfgPrincipalQuote');
    if (pQuote) pQuote.value = secPrincipal.content || 'Education prepares a person to meet new challenges...';

    const pPort = document.getElementById('cfgPrincipalPortrait');
    if (pPort) pPort.value = secPrincipal.metadata?.portrait_src || 'principal-portrait.png';

    const convText = document.getElementById('cfgConvenorsText');
    if (convText) convText.value = secConvenors.content || 'Prof. Ranjan Kumar Mishra (HOD, Chemistry) & Prof. Shashank Shekhar (HOD, Humanities)';

    const legText = document.getElementById('cfgLegacyText');
    if (legText) legText.value = secLegacy.content || 'Bhagalpur College of Engineering is one of the premier technical colleges in Bihar...';
  }

  window.savePrincipalSection = async function () {
    try {
      const updates = {
        title: document.getElementById('cfgPrincipalName').value.trim(),
        subtitle: document.getElementById('cfgPrincipalSubtitle').value.trim(),
        content: document.getElementById('cfgPrincipalQuote').value.trim(),
        metadata: {
          designation: 'HEAD OF INSTITUTION',
          portrait_src: document.getElementById('cfgPrincipalPortrait').value.trim()
        }
      };
      await TechnoritiDB.updateContentSection('about_principal', updates);
      showToast("Principal's section updated and published!", 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  window.saveConvenorsAndLegacy = async function () {
    try {
      const convUpdates = {
        content: document.getElementById('cfgConvenorsText').value.trim()
      };
      await TechnoritiDB.updateContentSection('about_convenors', convUpdates);

      const legUpdates = {
        content: document.getElementById('cfgLegacyText').value.trim()
      };
      await TechnoritiDB.updateContentSection('about_legacy', legUpdates);

      showToast('Leadership and Legacy copy saved successfully!', 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 6. CMS NAVIGATION MENU MANAGER
  // =========================================================================
  function renderNavigationTable() {
    const tbody = document.getElementById('navItemsTableBody');
    if (!tbody) return;

    if (state.navItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-state">
            <div class="table-empty-icon">🧭</div>
            <div>No navigation menu items found. Add items to control the header menu.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = state.navItems.map((item, index) => {
      return `
        <tr>
          <td style="font-weight:700; color:var(--accent-cyan); font-family:var(--font-orbitron);">${item.sort_order}</td>
          <td style="font-weight:700; color:#fff;">${escapeHtml(item.label)}</td>
          <td><code>${escapeHtml(item.destination_url)}</code></td>
          <td><span style="font-size:0.75rem; color:var(--text-dim);">${item.is_external ? 'External URL' : 'Portal Panel'}</span></td>
          <td>${item.open_in_new_tab ? 'Yes (New Tab)' : 'Same Window'}</td>
          <td>
            <span class="badge-status ${item.is_visible ? 'badge-verified' : 'badge-rejected'}">
              ${item.is_visible ? 'VISIBLE' : 'HIDDEN'}
            </span>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              <button class="btn-action-icon" onclick="moveNavItem('${item.id}', -1)" title="Move Up">↑</button>
              <button class="btn-action-icon" onclick="moveNavItem('${item.id}', 1)" title="Move Down">↓</button>
              <button class="btn-action-icon" onclick="editNavItem('${item.id}')" title="Edit Item">✎</button>
              <button class="btn-action-icon reject" onclick="deleteNavItem('${item.id}')" title="Delete Item">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.openNewNavItemModal = function () {
    document.getElementById('navFormId').value = '';
    document.getElementById('navFormLabel').value = '';
    document.getElementById('navFormUrl').value = '';
    document.getElementById('navFormExternal').value = 'false';
    document.getElementById('navFormNewTab').value = 'false';
    document.getElementById('navFormOrder').value = (state.navItems.length + 1).toString();
    document.getElementById('navFormVisible').value = 'true';
    document.getElementById('navItemModalTitle').textContent = 'Add Navigation Link';
    openModal('navItemModal');
  };

  window.editNavItem = function (id) {
    const item = state.navItems.find(n => n.id === id);
    if (!item) return;
    document.getElementById('navFormId').value = item.id;
    document.getElementById('navFormLabel').value = item.label;
    document.getElementById('navFormUrl').value = item.destination_url;
    document.getElementById('navFormExternal').value = item.is_external ? 'true' : 'false';
    document.getElementById('navFormNewTab').value = item.open_in_new_tab ? 'true' : 'false';
    document.getElementById('navFormOrder').value = item.sort_order;
    document.getElementById('navFormVisible').value = item.is_visible ? 'true' : 'false';
    document.getElementById('navItemModalTitle').textContent = 'Edit Navigation Link';
    openModal('navItemModal');
  };

  window.handleSaveNavItem = async function (e) {
    e.preventDefault();
    try {
      const id = document.getElementById('navFormId').value;
      const payload = {
        label: document.getElementById('navFormLabel').value.trim(),
        destination_url: document.getElementById('navFormUrl').value.trim(),
        is_external: document.getElementById('navFormExternal').value === 'true',
        open_in_new_tab: document.getElementById('navFormNewTab').value === 'true',
        sort_order: parseInt(document.getElementById('navFormOrder').value, 10) || 1,
        is_visible: document.getElementById('navFormVisible').value === 'true'
      };
      if (id) payload.id = id;

      await TechnoritiDB.saveNavigationItem(payload);
      state.navItems = await TechnoritiDB.getNavigationItems(false);
      renderNavigationTable();
      closeModal('navItemModal');
      showToast('Navigation menu item saved!', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  window.deleteNavItem = async function (id) {
    if (!confirm('Are you sure you want to remove this navigation link?')) return;
    try {
      await TechnoritiDB.deleteNavigationItem(id);
      state.navItems = state.navItems.filter(n => n.id !== id);
      renderNavigationTable();
      showToast('Navigation link removed', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  window.moveNavItem = async function (id, direction) {
    const idx = state.navItems.findIndex(n => n.id === id);
    if (idx < 0) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= state.navItems.length) return;

    const currentItem = state.navItems[idx];
    const targetItem = state.navItems[targetIdx];

    const tempOrder = currentItem.sort_order;
    currentItem.sort_order = targetItem.sort_order;
    targetItem.sort_order = tempOrder;

    try {
      await TechnoritiDB.saveNavigationItem(currentItem);
      await TechnoritiDB.saveNavigationItem(targetItem);
      state.navItems = await TechnoritiDB.getNavigationItems(false);
      renderNavigationTable();
      showToast('Menu reordered', 'success');
    } catch (err) {
      showToast('Reorder error: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 7. CMS SECTION VISIBILITY & ORDER
  // =========================================================================
  function renderSectionVisibilityCards() {
    const container = document.getElementById('sectionVisibilityContainer');
    if (!container) return;

    const saved = state.settings.section_visibility || {
      about: { visible: true, title: 'ABOUT TECHNORITI', subtitle: 'Innovating the Future of Engineering', order: 1 },
      competitions: { visible: true, title: 'COMPETITIONS', subtitle: '29 Flagship Technical Events', order: 2 },
      accommodation: { visible: true, title: 'CAMPUS ACCOMMODATION', subtitle: 'Comfortable Lodging & Dining at BCE Campus', order: 3 },
      sponsors: { visible: true, title: 'OFFICIAL PARTNERS', subtitle: 'Supported by Visionary Organizations', order: 4 },
      register: { visible: true, title: 'FESTIVAL REGISTRATION', subtitle: 'Reserve Your Entry Today', order: 5 }
    };

    const sections = [
      { key: 'about', label: 'About BCE & Leadership Section' },
      { key: 'competitions', label: 'Competitions & Events Arena' },
      { key: 'accommodation', label: 'Hostel Accommodation Section' },
      { key: 'sponsors', label: 'Sponsors & Official Partners' },
      { key: 'register', label: 'Registration Desk & Form' }
    ];

    container.innerHTML = sections.map(s => {
      const val = saved[s.key] || { visible: true, title: s.label, subtitle: '', order: 1 };
      return `
        <div style="padding:16px; background:rgba(255,255,255,0.03); border:1px solid var(--admin-border); border-radius:10px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <strong style="color:#fff; font-size:0.95rem;">${escapeHtml(s.label)}</strong>
            <label class="switch">
              <input type="checkbox" id="secVis_${s.key}" ${val.visible ? 'checked' : ''}>
              <span class="slider"></span>
            </label>
          </div>
          <div class="cms-grid-3">
            <div class="cms-form-group" style="margin-bottom:0;">
              <label class="cms-label">Section Display Title</label>
              <input type="text" id="secTitle_${s.key}" class="cms-input" value="${escapeHtml(val.title || '')}">
            </div>
            <div class="cms-form-group" style="margin-bottom:0;">
              <label class="cms-label">Section Subtitle</label>
              <input type="text" id="secSub_${s.key}" class="cms-input" value="${escapeHtml(val.subtitle || '')}">
            </div>
            <div class="cms-form-group" style="margin-bottom:0;">
              <label class="cms-label">Display Order</label>
              <input type="number" id="secOrder_${s.key}" class="cms-input" value="${val.order || 1}">
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  window.saveSectionVisibilitySettings = async function () {
    try {
      const keys = ['about', 'competitions', 'accommodation', 'sponsors', 'register'];
      const updated = {};
      keys.forEach(k => {
        updated[k] = {
          visible: document.getElementById(`secVis_${k}`).checked,
          title: document.getElementById(`secTitle_${k}`).value.trim(),
          subtitle: document.getElementById(`secSub_${k}`).value.trim(),
          order: parseInt(document.getElementById(`secOrder_${k}`).value, 10) || 1
        };
      });
      await TechnoritiDB.updateSiteSetting('section_visibility', updated, 'Homepage section ordering and visibility');
      state.settings.section_visibility = updated;
      showToast('Section visibility preferences saved!', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 8. CMS GENERAL & FOOTER SETTINGS
  // =========================================================================
  function populateCmsGeneral() {
    const info = state.settings.footer_info || {};
    const colName = document.getElementById('cfgCollegeName');
    if (colName) colName.value = info.college_name || 'Bhagalpur College of Engineering';

    const cEmail = document.getElementById('cfgContactEmail');
    if (cEmail) cEmail.value = info.contact_email || 'technoriti@bcebhagalpur.ac.in';

    const cAddr = document.getElementById('cfgCampusAddress');
    if (cAddr) cAddr.value = info.address || 'BCE Campus, Post - Sabour, Bhagalpur, Bihar - 813210';

    const sInsta = document.getElementById('cfgSocialInstagram');
    if (sInsta) sInsta.value = info.instagram_url || 'https://instagram.com/bcebhagalpur';

    const sYt = document.getElementById('cfgSocialYouTube');
    if (sYt) sYt.value = info.youtube_url || 'https://youtube.com/@bcebhagalpur';

    const sLi = document.getElementById('cfgSocialLinkedIn');
    if (sLi) sLi.value = info.linkedin_url || 'https://linkedin.com/school/bcebhagalpur';

    const sTw = document.getElementById('cfgSocialTwitter');
    if (sTw) sTw.value = info.twitter_url || 'https://twitter.com/bcebhagalpur';

    const cCopy = document.getElementById('cfgCopyrightText');
    if (cCopy) cCopy.value = info.copyright_text || '© 2026 TECHNORITI, BCE Bhagalpur. All Rights Reserved.';
  }

  window.saveGeneralFooterSettings = async function () {
    try {
      const updated = {
        college_name: document.getElementById('cfgCollegeName').value.trim(),
        contact_email: document.getElementById('cfgContactEmail').value.trim(),
        address: document.getElementById('cfgCampusAddress').value.trim(),
        instagram_url: document.getElementById('cfgSocialInstagram').value.trim(),
        youtube_url: document.getElementById('cfgSocialYouTube').value.trim(),
        linkedin_url: document.getElementById('cfgSocialLinkedIn').value.trim(),
        twitter_url: document.getElementById('cfgSocialTwitter').value.trim(),
        copyright_text: document.getElementById('cfgCopyrightText').value.trim()
      };
      await TechnoritiDB.updateSiteSetting('footer_info', updated, 'Portal contact coordinates and footer legal copy');
      state.settings.footer_info = updated;
      showToast('General & Footer settings saved!', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 9. CMS SEO & METADATA
  // =========================================================================
  function populateCmsSeo() {
    const seo = state.settings.seo_metadata || {};
    const title = document.getElementById('cfgSeoTitle');
    if (title) title.value = seo.site_title || "TECHNORITI '26 | Bhagalpur College of Engineering Annual Techfest";

    const desc = document.getElementById('cfgSeoDesc');
    if (desc) desc.value = seo.meta_description || "Official portal for TECHNORITI '26, annual technical festival of BCE Bhagalpur. 29 competitions, hackathons, robotics, and cash prizes.";

    const kw = document.getElementById('cfgSeoKeywords');
    if (kw) kw.value = seo.keywords || "Technoriti 2026, BCE Bhagalpur, Techfest Bihar, Robowar, Hackathon";

    const ogImg = document.getElementById('cfgSeoOgImage');
    if (ogImg) ogImg.value = seo.og_image || "principal.png";

    const fav = document.getElementById('cfgSeoFavicon');
    if (fav) fav.value = seo.favicon || "";

    updateSerpPreview();
  }

  function updateSerpPreview() {
    const t = document.getElementById('cfgSeoTitle')?.value || "TECHNORITI '26 | Bhagalpur College of Engineering";
    const d = document.getElementById('cfgSeoDesc')?.value || "Official festival portal...";
    const titleEl = document.getElementById('serpTitlePreview');
    const descEl = document.getElementById('serpDescPreview');
    if (titleEl) titleEl.textContent = t;
    if (descEl) descEl.textContent = d;
  }

  document.getElementById('cfgSeoTitle')?.addEventListener('input', updateSerpPreview);
  document.getElementById('cfgSeoDesc')?.addEventListener('input', updateSerpPreview);

  window.saveSeoSettings = async function () {
    try {
      const updated = {
        site_title: document.getElementById('cfgSeoTitle').value.trim(),
        meta_description: document.getElementById('cfgSeoDesc').value.trim(),
        keywords: document.getElementById('cfgSeoKeywords').value.trim(),
        og_image: document.getElementById('cfgSeoOgImage').value.trim(),
        favicon: document.getElementById('cfgSeoFavicon').value.trim()
      };
      await TechnoritiDB.updateSiteSetting('seo_metadata', updated, 'Portal SEO and OpenGraph metadata');
      state.settings.seo_metadata = updated;
      showToast('SEO & Metadata saved!', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 10. COMPETITIONS MANAGEMENT (FULL CRUD)
  // =========================================================================
  function renderCompetitionsTable() {
    const tbody = document.getElementById('competitionsTableBody');
    if (!tbody) return;

    const searchVal = (document.getElementById('compSearchInput')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('compCategoryFilter')?.value || '';

    const filtered = state.events.filter(e => {
      const title = (e.title || '').toLowerCase();
      const cat = (e.event_categories?.name || e.category || '').toLowerCase();
      if (searchVal && !title.includes(searchVal) && !cat.includes(searchVal)) return false;
      if (categoryFilter && (e.event_categories?.name || e.category) !== categoryFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty-state">
            <div class="table-empty-icon">🏆</div>
            <div>No competitions found matching filters.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(e => {
      const catName = e.event_categories?.name || e.category || 'General';
      const teamSizeStr = e.team_size_min === e.team_size_max ? `${e.team_size_min} Person` : `${e.team_size_min || 1}-${e.team_size_max || 4} Members`;
      const feeStr = e.registration_fee > 0 ? `₹${e.registration_fee}` : 'Free';
      const isOpen = (e.registration_status || 'open') === 'open';
      const isPub = e.is_published !== false;

      return `
        <tr>
          <td style="font-weight:700; color:#fff;">${escapeHtml(e.title)}</td>
          <td><span style="font-size:0.8rem; color:var(--accent-cyan);">${escapeHtml(catName)}</span></td>
          <td>${teamSizeStr}</td>
          <td style="font-weight:700; color:var(--accent-green);">${feeStr}</td>
          <td style="font-weight:700; color:var(--accent-yellow);">${escapeHtml(e.prize_pool || '₹5,000')}</td>
          <td>
            <button class="btn-action-icon ${isOpen ? 'verify' : 'reject'}" onclick="toggleEventRegistration('${e.id}', '${isOpen ? 'closed' : 'open'}')">
              ${isOpen ? 'OPEN' : 'CLOSED'}
            </button>
          </td>
          <td>
            <button class="btn-action-icon ${isPub ? 'verify' : ''}" onclick="toggleEventPublished('${e.id}', ${!isPub})">
              ${isPub ? 'PUBLISHED' : 'DRAFT'}
            </button>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              <button class="btn-action-icon" onclick="editCompetition('${e.id}')" title="Edit Event">✎ Edit</button>
              <button class="btn-action-icon" onclick="duplicateCompetition('${e.id}')" title="Duplicate Event">📋 Clone</button>
              <button class="btn-action-icon reject" onclick="deleteCompetition('${e.id}')" title="Delete Event">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.openNewCompetitionModal = function () {
    document.getElementById('compFormId').value = '';
    document.getElementById('compFormTitle').value = '';
    document.getElementById('compFormSlug').value = '';
    document.getElementById('compFormCategory').value = 'coding';
    document.getElementById('compFormFeeType').value = 'member';
    document.getElementById('compFormFee').value = '100';
    document.getElementById('compFormMinTeam').value = '1';
    document.getElementById('compFormMaxTeam').value = '4';
    document.getElementById('compFormPrizePool').value = '₹10,000';
    document.getElementById('compFormFirstPrize').value = '₹6,000';
    document.getElementById('compFormShortDesc').value = '';
    document.getElementById('compFormFullDesc').value = '';
    document.getElementById('compFormDate').value = 'December 18, 2026';
    document.getElementById('compFormVenue').value = 'BCE Campus';
    document.getElementById('compFormCoordName').value = '';
    document.getElementById('compFormCoordPhone').value = '';
    document.getElementById('compFormRegStatus').value = 'open';
    document.getElementById('compFormPublished').value = 'true';
    document.getElementById('competitionModalTitle').textContent = 'Add New Competition';
    openModal('competitionModal');
  };

  window.editCompetition = function (id) {
    const e = state.events.find(ev => ev.id === id);
    if (!e) return;

    document.getElementById('compFormId').value = e.id;
    document.getElementById('compFormTitle').value = e.title;
    document.getElementById('compFormSlug').value = e.slug || e.id;
    document.getElementById('compFormCategory').value = e.category_id || 'coding';
    document.getElementById('compFormFeeType').value = e.fee_type || 'member';
    document.getElementById('compFormFee').value = e.registration_fee || 0;
    document.getElementById('compFormMinTeam').value = e.team_size_min || 1;
    document.getElementById('compFormMaxTeam').value = e.team_size_max || 4;
    document.getElementById('compFormPrizePool').value = e.prize_pool || '';
    document.getElementById('compFormFirstPrize').value = e.first_prize || '';
    document.getElementById('compFormShortDesc').value = e.short_desc || '';
    document.getElementById('compFormFullDesc').value = e.full_desc || '';
    document.getElementById('compFormDate').value = e.event_date || '';
    document.getElementById('compFormVenue').value = e.venue || '';
    document.getElementById('compFormCoordName').value = e.coordinator_name || '';
    document.getElementById('compFormCoordPhone').value = e.coordinator_phone || '';
    document.getElementById('compFormRegStatus').value = e.registration_status || 'open';
    document.getElementById('compFormPublished').value = e.is_published ? 'true' : 'false';
    document.getElementById('competitionModalTitle').textContent = `Edit Competition: ${e.title}`;
    openModal('competitionModal');
  };

  window.handleSaveCompetition = async function (e) {
    e.preventDefault();
    try {
      const id = document.getElementById('compFormId').value;
      const slugVal = document.getElementById('compFormSlug').value.trim() || document.getElementById('compFormTitle').value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const payload = {
        id: id || slugVal,
        title: document.getElementById('compFormTitle').value.trim(),
        slug: slugVal,
        category_id: document.getElementById('compFormCategory').value,
        fee_type: document.getElementById('compFormFeeType').value,
        registration_fee: parseInt(document.getElementById('compFormFee').value, 10) || 0,
        team_size_min: parseInt(document.getElementById('compFormMinTeam').value, 10) || 1,
        team_size_max: parseInt(document.getElementById('compFormMaxTeam').value, 10) || 1,
        prize_pool: document.getElementById('compFormPrizePool').value.trim(),
        first_prize: document.getElementById('compFormFirstPrize').value.trim(),
        short_desc: document.getElementById('compFormShortDesc').value.trim(),
        full_desc: document.getElementById('compFormFullDesc').value.trim(),
        event_date: document.getElementById('compFormDate').value.trim(),
        venue: document.getElementById('compFormVenue').value.trim(),
        coordinator_name: document.getElementById('compFormCoordName').value.trim(),
        coordinator_phone: document.getElementById('compFormCoordPhone').value.trim(),
        registration_status: document.getElementById('compFormRegStatus').value,
        is_published: document.getElementById('compFormPublished').value === 'true'
      };

      await TechnoritiDB.saveEvent(payload);
      state.events = await TechnoritiDB.getAllEventsAdmin();
      renderCompetitionsTable();
      populatePrizesEventSelector();
      closeModal('competitionModal');
      showToast(`Competition "${payload.title}" saved successfully!`, 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  window.deleteCompetition = async function (id) {
    if (!confirm('Are you sure you want to permanently delete this competition? All associated registrations will also be affected.')) return;
    try {
      await TechnoritiDB.deleteEvent(id);
      state.events = state.events.filter(e => e.id !== id);
      renderCompetitionsTable();
      populatePrizesEventSelector();
      showToast('Competition deleted', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  window.duplicateCompetition = async function (id) {
    const e = state.events.find(ev => ev.id === id);
    if (!e) return;
    try {
      const newSlug = `${e.slug || e.id}-copy-${Date.now().toString().slice(-4)}`;
      const payload = {
        ...e,
        id: newSlug,
        slug: newSlug,
        title: `${e.title} (Copy)`,
        sort_order: (e.sort_order || 0) + 1
      };
      delete payload.created_at;
      delete payload.updated_at;
      delete payload.event_categories;

      await TechnoritiDB.saveEvent(payload);
      state.events = await TechnoritiDB.getAllEventsAdmin();
      renderCompetitionsTable();
      showToast(`Duplicated into "${payload.title}"`, 'success');
    } catch (err) {
      showToast('Duplicate failed: ' + err.message, 'error');
    }
  };

  window.toggleEventRegistration = async function (id, newStatus) {
    try {
      await TechnoritiDB.saveEvent({ id, registration_status: newStatus });
      const target = state.events.find(e => e.id === id);
      if (target) target.registration_status = newStatus;
      renderCompetitionsTable();
      showToast(`Registration marked as ${newStatus.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  window.toggleEventPublished = async function (id, newPublished) {
    try {
      await TechnoritiDB.saveEvent({ id, is_published: newPublished });
      const target = state.events.find(e => e.id === id);
      if (target) target.is_published = newPublished;
      renderCompetitionsTable();
      showToast(`Event is now ${newPublished ? 'PUBLISHED' : 'DRAFT'}`, 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 11. PRIZES & RULES SUB-DESK
  // =========================================================================
  function populatePrizesEventSelector() {
    const sel = document.getElementById('prizesEventSelector');
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Select a competition to view/edit...</option>' +
      state.events.map(e => `<option value="${escapeHtml(e.id)}">${escapeHtml(e.title)}</option>`).join('');
    if (currentVal && state.events.some(e => e.id === currentVal)) {
      sel.value = currentVal;
    }
  }

  window.loadPrizesAndRulesForSelectedEvent = async function () {
    const sel = document.getElementById('prizesEventSelector');
    const eventId = sel?.value;
    state.selectedEventIdForPrizes = eventId;

    const prizesTbody = document.getElementById('eventPrizesTableBody');
    const rulesTbody = document.getElementById('eventRulesTableBody');

    if (!eventId) {
      if (prizesTbody) prizesTbody.innerHTML = '<tr><td colspan="4" class="table-empty-state">Select an event to load prizes</td></tr>';
      if (rulesTbody) rulesTbody.innerHTML = '<tr><td colspan="3" class="table-empty-state">Select an event to load rules</td></tr>';
      return;
    }

    const prizes = await TechnoritiDB.getEventPrizes(eventId);
    const rules = await TechnoritiDB.getEventRules(eventId);

    if (prizesTbody) {
      if (prizes.length === 0) {
        prizesTbody.innerHTML = '<tr><td colspan="4" class="table-empty-state">No position prizes configured. Click "Add Prize" to add.</td></tr>';
      } else {
        prizesTbody.innerHTML = prizes.map(p => `
          <tr>
            <td style="font-weight:700; color:var(--accent-yellow); font-family:var(--font-orbitron);">${p.position}</td>
            <td style="font-weight:700; color:#fff;">${escapeHtml(p.prize_title)}</td>
            <td style="font-weight:700; color:var(--accent-green);">${escapeHtml(p.prize_amount)}</td>
            <td style="text-align:right;">
              <button class="btn-action-icon reject" onclick="deletePrizeEntry('${p.id}')">✕</button>
            </td>
          </tr>
        `).join('');
      }
    }

    if (rulesTbody) {
      if (rules.length === 0) {
        rulesTbody.innerHTML = '<tr><td colspan="3" class="table-empty-state">No rules defined. Click "Add Rule" to add clauses.</td></tr>';
      } else {
        rulesTbody.innerHTML = rules.map(r => `
          <tr>
            <td style="font-weight:700; color:var(--accent-cyan); font-family:var(--font-orbitron);">${r.rule_number}</td>
            <td style="font-size:0.85rem; color:#fff;">${escapeHtml(r.rule_text)}</td>
            <td style="text-align:right;">
              <button class="btn-action-icon reject" onclick="deleteRuleEntry('${r.id}')">✕</button>
            </td>
          </tr>
        `).join('');
      }
    }
  };

  window.openAddPrizeModal = async function () {
    const eventId = state.selectedEventIdForPrizes;
    if (!eventId) {
      showToast('Please select a competition first', 'error');
      return;
    }
    const title = prompt('Enter Prize Position / Title (e.g. 1st Place / Winner):', '1st Place');
    if (!title) return;
    const amount = prompt('Enter Prize Amount (e.g. ₹10,000 + Certificate):', '₹10,000');
    if (!amount) return;

    try {
      await TechnoritiDB.saveEventPrize({
        event_id: eventId,
        position: 1,
        prize_title: title,
        prize_amount: amount
      });
      loadPrizesAndRulesForSelectedEvent();
      showToast('Prize entry added', 'success');
    } catch (err) {
      showToast('Failed to add prize: ' + err.message, 'error');
    }
  };

  window.deletePrizeEntry = async function (id) {
    try {
      await TechnoritiDB.deleteEventPrize(id);
      loadPrizesAndRulesForSelectedEvent();
      showToast('Prize deleted', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  window.openAddRuleModal = async function () {
    const eventId = state.selectedEventIdForPrizes;
    if (!eventId) {
      showToast('Please select a competition first', 'error');
      return;
    }
    const text = prompt('Enter rule clause description:');
    if (!text) return;

    try {
      await TechnoritiDB.saveEventRule({
        event_id: eventId,
        rule_number: Date.now() % 1000,
        rule_text: text
      });
      loadPrizesAndRulesForSelectedEvent();
      showToast('Rule clause recorded', 'success');
    } catch (err) {
      showToast('Failed to add rule: ' + err.message, 'error');
    }
  };

  window.deleteRuleEntry = async function (id) {
    try {
      await TechnoritiDB.deleteEventRule(id);
      loadPrizesAndRulesForSelectedEvent();
      showToast('Rule removed', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 12. SPONSORS MANAGEMENT (FULL CRUD)
  // =========================================================================
  function renderSponsorsTable() {
    const tbody = document.getElementById('sponsorsTableBody');
    if (!tbody) return;

    const tierFilter = document.getElementById('sponsorTierFilter')?.value || '';
    const filtered = state.sponsors.filter(s => !tierFilter || s.tier === tierFilter);

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-state">
            <div class="table-empty-icon">🤝</div>
            <div>No sponsors found. Click "Add Sponsor" to create partner entries.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(s => `
      <tr>
        <td style="font-size:1.4rem;">${escapeHtml(s.emblem || '⚡')}</td>
        <td style="font-weight:700; color:#fff;">${escapeHtml(s.name)}</td>
        <td><span style="font-size:0.75rem; text-transform:uppercase; color:var(--accent-yellow);">${escapeHtml(s.tier)}</span></td>
        <td><a href="${escapeHtml(s.website_url || '#')}" target="_blank" style="color:var(--accent-cyan); text-decoration:none;">${escapeHtml(s.website_url || '—')} ↗</a></td>
        <td><span class="badge-status ${s.is_active ? 'badge-verified' : 'badge-rejected'}">${s.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
        <td>${s.sort_order || 1}</td>
        <td style="text-align:right;">
          <div style="display:inline-flex; gap:6px;">
            <button class="btn-action-icon" onclick="editSponsor('${s.id}')">✎</button>
            <button class="btn-action-icon reject" onclick="deleteSponsor('${s.id}')">✕</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.openNewSponsorModal = function () {
    document.getElementById('sponsorFormId').value = '';
    document.getElementById('sponsorFormName').value = '';
    document.getElementById('sponsorFormTier').value = 'technical';
    document.getElementById('sponsorFormEmblem').value = '⚡';
    document.getElementById('sponsorFormSubtitle').value = '';
    document.getElementById('sponsorFormUrl').value = '';
    document.getElementById('sponsorFormLogo').value = '';
    document.getElementById('sponsorFormOrder').value = (state.sponsors.length + 1).toString();
    document.getElementById('sponsorFormActive').value = 'true';
    document.getElementById('sponsorModalTitle').textContent = 'Add Sponsor / Partner';
    openModal('sponsorModal');
  };

  window.editSponsor = function (id) {
    const s = state.sponsors.find(sp => sp.id === id);
    if (!s) return;
    document.getElementById('sponsorFormId').value = s.id;
    document.getElementById('sponsorFormName').value = s.name;
    document.getElementById('sponsorFormTier').value = s.tier;
    document.getElementById('sponsorFormEmblem').value = s.emblem || '';
    document.getElementById('sponsorFormSubtitle').value = s.subtitle || '';
    document.getElementById('sponsorFormUrl').value = s.website_url || '';
    document.getElementById('sponsorFormLogo').value = s.logo_url || '';
    document.getElementById('sponsorFormOrder').value = s.sort_order || 1;
    document.getElementById('sponsorFormActive').value = s.is_active ? 'true' : 'false';
    document.getElementById('sponsorModalTitle').textContent = `Edit Sponsor: ${s.name}`;
    openModal('sponsorModal');
  };

  window.handleSaveSponsor = async function (e) {
    e.preventDefault();
    try {
      const id = document.getElementById('sponsorFormId').value;
      const payload = {
        name: document.getElementById('sponsorFormName').value.trim(),
        tier: document.getElementById('sponsorFormTier').value,
        emblem: document.getElementById('sponsorFormEmblem').value.trim(),
        subtitle: document.getElementById('sponsorFormSubtitle').value.trim(),
        website_url: document.getElementById('sponsorFormUrl').value.trim(),
        logo_url: document.getElementById('sponsorFormLogo').value.trim(),
        sort_order: parseInt(document.getElementById('sponsorFormOrder').value, 10) || 1,
        is_active: document.getElementById('sponsorFormActive').value === 'true'
      };
      if (id) payload.id = id;

      await TechnoritiDB.saveSponsor(payload);
      state.sponsors = await TechnoritiDB.getAllSponsorsAdmin();
      renderSponsorsTable();
      closeModal('sponsorModal');
      showToast(`Partner "${payload.name}" saved!`, 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  window.deleteSponsor = async function (id) {
    if (!confirm('Are you sure you want to remove this sponsor partner?')) return;
    try {
      await TechnoritiDB.deleteSponsor(id);
      state.sponsors = state.sponsors.filter(s => s.id !== id);
      renderSponsorsTable();
      showToast('Sponsor removed', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 13. ACCOMMODATION TARIFFS & BOOKINGS DESK
  // =========================================================================
  function populateAccommodationTariffs() {
    const policy = state.settings.accommodation_policy || {};
    const lodgingEl = document.getElementById('cfgAccomLodgingFee');
    if (lodgingEl) lodgingEl.value = policy.lodging_fee_daily || 50;

    const foodEl = document.getElementById('cfgAccomFoodFee');
    if (foodEl) foodEl.value = policy.food_fee_daily || 125;

    const boysCoord = document.getElementById('cfgAccomBoysCoord');
    if (boysCoord) boysCoord.value = policy.boys_coordinator || 'Prof. Kumar Jyotiraditya (7004618331)';

    const girlsCoord = document.getElementById('cfgAccomGirlsCoord');
    if (girlsCoord) girlsCoord.value = policy.girls_coordinator || 'Prof. Sarika Kushwaha (7321018753)';

    const checkIn = document.getElementById('cfgAccomCheckIn');
    if (checkIn) checkIn.value = policy.check_in || 'December 2026, 6:00 AM';

    const checkOut = document.getElementById('cfgAccomCheckOut');
    if (checkOut) checkOut.value = policy.check_out || 'December 2026, 10:00 PM';

    updateTotalDailyFeeDisplay();
  }

  window.updateTotalDailyFeeDisplay = function () {
    const l = parseInt(document.getElementById('cfgAccomLodgingFee')?.value, 10) || 0;
    const f = parseInt(document.getElementById('cfgAccomFoodFee')?.value, 10) || 0;
    const totalEl = document.getElementById('cfgAccomTotalFee');
    if (totalEl) totalEl.value = `₹${l + f} / day`;
  };

  window.saveAccommodationTariffs = async function () {
    try {
      const lodging = parseInt(document.getElementById('cfgAccomLodgingFee').value, 10) || 50;
      const food = parseInt(document.getElementById('cfgAccomFoodFee').value, 10) || 125;
      const updated = {
        lodging_fee_daily: lodging,
        food_fee_daily: food,
        boys_coordinator: document.getElementById('cfgAccomBoysCoord').value.trim(),
        girls_coordinator: document.getElementById('cfgAccomGirlsCoord').value.trim(),
        check_in: document.getElementById('cfgAccomCheckIn').value.trim(),
        check_out: document.getElementById('cfgAccomCheckOut').value.trim()
      };
      await TechnoritiDB.updateSiteSetting('accommodation_policy', updated, 'Campus accommodation fees and coordinators');
      state.settings.accommodation_policy = updated;

      // Update accommodation_options default plan if exists
      if (state.accommodationOptions.length > 0) {
        await TechnoritiDB.updateAccommodationOption(state.accommodationOptions[0].id, {
          daily_lodging_fee: lodging,
          daily_food_fee: food,
          available_beds: parseInt(document.getElementById('cfgAccomAvailableBeds').value, 10) || 200
        });
      }

      showToast('Accommodation tariffs and policy saved!', 'success');
    } catch (err) {
      showToast('Save failed: ' + err.message, 'error');
    }
  };

  function renderAccommodationsTable() {
    const tbody = document.getElementById('accommodationsTableBody');
    if (!tbody) return;

    if (state.accommodations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="table-empty-state">
            <div class="table-empty-icon">🏨</div>
            <div>No accommodation requests filed yet. Outstation bookings will appear here.</div>
          </td>
        </tr>
      `;
      return;
    }

    const searchVal = (document.getElementById('accSearchInput')?.value || '').toLowerCase().trim();
    const blockFilter = document.getElementById('accBlockFilter')?.value || '';
    const statusFilter = document.getElementById('accStatusFilter')?.value || '';

    const filtered = state.accommodations.filter(acc => {
      const name = (acc.full_name || acc.guest_name || '').toLowerCase();
      const college = (acc.college || '').toLowerCase();
      if (searchVal && !name.includes(searchVal) && !college.includes(searchVal)) return false;
      if (blockFilter && acc.hostel_block !== blockFilter) return false;
      if (statusFilter && acc.status !== statusFilter) return false;
      return true;
    });

    tbody.innerHTML = filtered.map((acc, index) => {
      const bookId = `ACC-${100 + index}`;
      const name = acc.full_name || acc.guest_name || 'Guest Participant';
      const college = acc.college || 'Outstation College';
      const gender = acc.gender || 'male';
      const block = acc.hostel_block || (gender === 'female' ? 'Girls Hostel' : 'Boys Hostel');
      const dates = `${acc.days_count || 2} Days (${acc.members_count || 1} Person)`;
      const room = acc.room_number || 'Unallotted';
      const statusClass = acc.status === 'checked_in' || acc.status === 'allotted' ? 'badge-verified' : acc.status === 'cancelled' ? 'badge-rejected' : 'badge-pending';

      return `
        <tr>
          <td style="font-family:var(--font-orbitron); font-size:0.78rem; color:var(--accent-cyan);">${bookId}</td>
          <td style="font-weight:700; color:#fff;">${escapeHtml(name)}</td>
          <td>${escapeHtml(college)}</td>
          <td><span style="font-size:0.78rem; color:var(--text-dim);">${escapeHtml(block)}</span></td>
          <td style="font-size:0.8rem; color:var(--text-muted);">${dates}</td>
          <td>${escapeHtml(acc.phone || '—')}</td>
          <td><strong style="color:var(--accent-yellow);">${escapeHtml(room)}</strong></td>
          <td><span class="badge-status ${statusClass}">${escapeHtml(acc.status || 'requested')}</span></td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              <button class="btn-action-icon verify" onclick="openAllotRoomModal('${acc.id}', '${escapeHtml(name)}')">Allot</button>
              <button class="btn-action-icon" onclick="updateBookingStatus('${acc.id}', 'checked_in')">Check In</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.openAllotRoomModal = function (id, name) {
    document.getElementById('allotBookingId').value = id;
    document.getElementById('allotGuestName').value = name;
    document.getElementById('allotRoomNumber').value = '';
    openModal('allotRoomModal');
  };

  window.handleSaveRoomAllotment = async function (e) {
    e.preventDefault();
    const id = document.getElementById('allotBookingId').value;
    const block = document.getElementById('allotHostelBlock').value;
    const room = document.getElementById('allotRoomNumber').value.trim();
    const status = document.getElementById('allotStatus').value;

    try {
      const client = TechnoritiDB.getClient();
      await client.from('accommodation_bookings').update({
        hostel_block: block,
        room_number: room,
        status: status,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      const target = state.accommodations.find(a => a.id === id);
      if (target) {
        target.hostel_block = block;
        target.room_number = room;
        target.status = status;
      }
      renderAccommodationsTable();
      closeModal('allotRoomModal');
      showToast(`Room ${room} allotted to ${block}`, 'success');
    } catch (err) {
      showToast('Allotment failed: ' + err.message, 'error');
    }
  };

  window.updateBookingStatus = async function (id, status) {
    try {
      const client = TechnoritiDB.getClient();
      await client.from('accommodation_bookings').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
      const target = state.accommodations.find(a => a.id === id);
      if (target) target.status = status;
      renderAccommodationsTable();
      showToast(`Booking marked as ${status.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 14. REGISTRATIONS & PAYMENTS
  // =========================================================================
  function populateEventFilterDropdown() {
    const select = document.getElementById('regEventFilter');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">All Events (' + state.events.length + ')</option>' +
      state.events.map(e => `<option value="${escapeHtml(e.title)}">${escapeHtml(e.title)}</option>`).join('');
    select.value = current;
  }

  function renderRegistrationsTable() {
    const tbody = document.getElementById('registrationsTableBody');
    if (!tbody) return;

    const searchVal = (document.getElementById('regSearchInput')?.value || '').toLowerCase().trim();
    const eventFilter = document.getElementById('regEventFilter')?.value || '';
    const statusFilter = document.getElementById('regStatusFilter')?.value || '';
    const paymentFilter = document.getElementById('regPaymentFilter')?.value || '';

    const filtered = state.registrations.filter(reg => {
      const pName = (reg.full_name || reg.participant_name || '').toLowerCase();
      const pEmail = (reg.email || '').toLowerCase();
      const pPhone = (reg.phone || '').toLowerCase();
      const pCollege = (reg.college || '').toLowerCase();
      const eTitle = (reg.events?.title || reg.event_title || '').toLowerCase();

      if (searchVal) {
        const matches = pName.includes(searchVal) || pEmail.includes(searchVal) || pPhone.includes(searchVal) || pCollege.includes(searchVal) || eTitle.includes(searchVal);
        if (!matches) return false;
      }
      if (eventFilter && (reg.events?.title || reg.event_title) !== eventFilter) return false;
      if (statusFilter && reg.payment_status !== statusFilter) return false;
      if (paymentFilter && reg.payment_status !== paymentFilter) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="table-empty-state">
            <div class="table-empty-icon">🔍</div>
            <div>No matching registrations found for current filters.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map((reg, index) => {
      const regId = `REG-${1000 + index}`;
      const pName = reg.full_name || reg.participant_name || 'Participant';
      const email = reg.email || '—';
      const phone = reg.phone || '—';
      const eventTitle = reg.events?.title || reg.event_title || 'General Event';
      const college = reg.college || 'BCE Bhagalpur';
      const teamName = reg.teams?.team_name || (reg.team_size > 1 ? `Team of ${reg.team_size}` : 'Individual');
      const isPaid = reg.payment_status === 'completed' || reg.payment_status === 'verified';

      return `
        <tr>
          <td style="font-family:var(--font-orbitron); font-size:0.78rem; color:var(--accent-cyan);">${regId}</td>
          <td>
            <div style="font-weight:700; color:#fff;">${escapeHtml(pName)}</div>
            <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(email)}</div>
          </td>
          <td><span style="color:var(--accent-cyan); font-weight:600;">${escapeHtml(eventTitle)}</span></td>
          <td>${escapeHtml(college)}</td>
          <td>${escapeHtml(phone)}</td>
          <td><span style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(teamName)}</span></td>
          <td><span class="badge-status ${isPaid ? 'badge-verified' : 'badge-pending'}">${isPaid ? 'PAID' : 'PENDING'}</span></td>
          <td><span class="badge-status ${isPaid ? 'badge-verified' : 'badge-pending'}">${escapeHtml(reg.payment_status || 'pending')}</span></td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              <button class="btn-action-icon" onclick="viewRegistrationDetail('${reg.id}')" title="Inspect">👁️ View</button>
              ${!isPaid ? `
                <button class="btn-action-icon verify" onclick="updateRegistrationStatus('${reg.id}', 'verified')" title="Verify">✓</button>
              ` : `
                <button class="btn-action-icon reject" onclick="updateRegistrationStatus('${reg.id}', 'rejected')" title="Reject">✕</button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.viewRegistrationDetail = function (id) {
    const reg = state.registrations.find(r => r.id === id);
    if (!reg) return;

    const modalBody = document.getElementById('modalRegBody');
    const modalTitle = document.getElementById('modalRegTitle');
    modalTitle.textContent = `Registration Details`;

    const membersHtml = (reg.teams?.members && reg.teams.members.length > 0)
      ? reg.teams.members.map((m, idx) => `
          <div style="font-size:0.82rem; margin-bottom:4px; color:var(--text-main);">
            <strong>#${idx + 1}:</strong> ${escapeHtml(m.full_name || m.name)} (${escapeHtml(m.email || '')} - ${escapeHtml(m.phone || '')})
          </div>
        `).join('')
      : '<div style="font-size:0.82rem; color:var(--text-dim);">Solo entry / No team members listed</div>';

    modalBody.innerHTML = `
      <div id="printableSlipArea">
        <div style="border-bottom:2px solid var(--admin-border); padding-bottom:12px; margin-bottom:16px;">
          <h2 style="font-family:var(--font-orbitron); color:var(--accent-cyan); font-size:1.3rem;">TECHNORITI '26 OFFICIAL PASS</h2>
          <div style="font-size:0.75rem; color:var(--text-dim);">Bhagalpur College of Engineering Annual Techfest</div>
        </div>

        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Participant / Leader</span>
            <span class="detail-val">${escapeHtml(reg.full_name || reg.participant_name || 'N/A')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Event Applied</span>
            <span class="detail-val" style="color:var(--accent-cyan);">${escapeHtml(reg.events?.title || reg.event_title || 'N/A')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email Address</span>
            <span class="detail-val">${escapeHtml(reg.email || 'N/A')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Phone Number</span>
            <span class="detail-val">${escapeHtml(reg.phone || 'N/A')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Institution / College</span>
            <span class="detail-val">${escapeHtml(reg.college || 'N/A')}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Payment Status</span>
            <span class="detail-val" style="text-transform:uppercase; color:var(--accent-green);">${escapeHtml(reg.payment_status || 'pending')}</span>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Team Members</span>
            <div class="team-list-box">${membersHtml}</div>
          </div>
          <div class="detail-item full-width">
            <span class="detail-label">Admin Notes</span>
            <textarea id="adminNoteText_${reg.id}" class="cms-textarea" style="min-height:50px;" placeholder="Add verification notes...">${escapeHtml(reg.admin_notes || '')}</textarea>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top:1px solid var(--admin-border); padding-top:16px;">
        <button class="btn-secondary" onclick="window.print()">🖨️ Print Slip</button>
        <div style="display:flex; gap:10px;">
          <button class="btn-secondary" onclick="saveAdminNote('${reg.id}')">Save Notes</button>
          <button class="btn-primary" onclick="updateRegistrationStatus('${reg.id}', 'verified'); closeModal('regDetailModal');">✓ Verify</button>
        </div>
      </div>
    `;

    openModal('regDetailModal');
  };

  window.saveAdminNote = async function (id) {
    const text = document.getElementById(`adminNoteText_${id}`)?.value || '';
    try {
      const client = TechnoritiDB.getClient();
      await client.from('registrations').update({ admin_notes: text, updated_at: new Date().toISOString() }).eq('id', id);
      const target = state.registrations.find(r => r.id === id);
      if (target) target.admin_notes = text;
      showToast('Admin note saved', 'success');
    } catch (err) {
      showToast('Failed to save note: ' + err.message, 'error');
    }
  };

  window.updateRegistrationStatus = async function (id, status) {
    try {
      const client = TechnoritiDB.getClient();
      await client.from('registrations').update({ payment_status: status, updated_at: new Date().toISOString() }).eq('id', id);
      const target = state.registrations.find(r => r.id === id);
      if (target) target.payment_status = status;
      renderRegistrationsTable();
      renderDashboard();
      showToast(`Registration marked as ${status.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  // Payments Ledger
  function renderPaymentsTable() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    if (state.payments.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty-state">
            <div class="table-empty-icon">💳</div>
            <div>No financial transactions logged yet.</div>
          </td>
        </tr>
      `;
      return;
    }

    const filter = document.getElementById('paymentStatusFilter')?.value || '';
    const filtered = state.payments.filter(p => !filter || p.status === filter);

    tbody.innerHTML = filtered.map((p, idx) => {
      const isVer = p.status === 'verified';
      return `
        <tr>
          <td style="font-family:var(--font-orbitron); font-size:0.78rem; color:var(--accent-cyan);">TXN-${1000 + idx}</td>
          <td style="font-weight:700; color:#fff;">${escapeHtml(p.registrations?.full_name || 'Participant')}</td>
          <td>${escapeHtml(p.registrations?.event_title || 'Event')}</td>
          <td style="font-weight:700; color:var(--accent-green);">₹${p.amount}</td>
          <td><span style="font-size:0.75rem; text-transform:uppercase;">${p.payment_method || 'UPI'}</span></td>
          <td><code>${escapeHtml(p.transaction_reference || 'REF-PENDING')}</code></td>
          <td><span class="badge-status ${isVer ? 'badge-verified' : 'badge-pending'}">${escapeHtml(p.status)}</span></td>
          <td style="text-align:right;">
            <div style="display:inline-flex; gap:6px;">
              ${!isVer ? `<button class="btn-action-icon verify" onclick="updatePaymentStatus('${p.id}', 'verified')">Verify</button>` : ''}
              <button class="btn-action-icon reject" onclick="updatePaymentStatus('${p.id}', 'refunded')">Refund</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.updatePaymentStatus = async function (id, status) {
    try {
      const client = TechnoritiDB.getClient();
      await client.from('payments').update({ status, verified_at: new Date().toISOString() }).eq('id', id);
      const target = state.payments.find(p => p.id === id);
      if (target) target.status = status;
      renderPaymentsTable();
      showToast(`Payment marked as ${status.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  // CSV Export Utility
  window.exportRegistrationsCSV = function () {
    if (state.registrations.length === 0) {
      showToast('No registrations to export yet', 'error');
      return;
    }

    const headers = ['Registration_ID', 'Participant_Name', 'Email', 'Phone', 'College', 'Event_Title', 'Team_Size', 'Payment_Status', 'Created_Date'];
    const rows = state.registrations.map((r, i) => [
      `REG-${1000 + i}`,
      csvEscape(r.full_name || r.participant_name || ''),
      csvEscape(r.email || ''),
      csvEscape(r.phone || ''),
      csvEscape(r.college || ''),
      csvEscape(r.events?.title || r.event_title || ''),
      r.team_size || 1,
      r.payment_status || 'pending',
      r.created_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `technoriti_registrations_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Exported registrations to CSV', 'success');
  };

  function csvEscape(text) {
    if (!text) return '""';
    return `"${String(text).replace(/"/g, '""')}"`;
  }

  // =========================================================================
  // 15. MEDIA LIBRARY & SUPABASE STORAGE
  // =========================================================================
  function renderMediaGrid() {
    const grid = document.getElementById('mediaGridContainer');
    const pickerGrid = document.getElementById('mediaPickerGrid');
    const countEl = document.getElementById('mediaCountDisplay');
    if (!grid) return;

    const typeFilter = document.getElementById('mediaTypeFilter')?.value || '';
    const filtered = state.media.filter(m => !typeFilter || m.asset_type === typeFilter);

    if (countEl) countEl.textContent = state.media.length.toString();

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-dim);">No media assets found in library. Upload files above.</div>';
      if (pickerGrid) pickerGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:24px; color:var(--text-dim);">No images available. Upload one first.</div>';
      return;
    }

    const cardsHtml = filtered.map(m => `
      <div class="media-card">
        <div class="media-thumb-box">
          <img src="${escapeHtml(m.file_url)}" alt="${escapeHtml(m.title)}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 100 100\\'><text y=\\'.9em\\' font-size=\\'90\\'>📄</text></svg>'">
        </div>
        <div class="media-meta-box">
          <span class="media-name" title="${escapeHtml(m.title)}">${escapeHtml(m.title)}</span>
          <span class="media-subinfo">${m.asset_type}</span>
          <div style="display:flex; justify-content:space-between; margin-top:6px;">
            <button class="btn-action-icon" onclick="copyMediaUrl('${escapeHtml(m.file_url)}')">📋 Copy</button>
            <button class="btn-action-icon reject" onclick="deleteMedia('${m.id}')">✕</button>
          </div>
        </div>
      </div>
    `).join('');

    grid.innerHTML = cardsHtml;

    if (pickerGrid) {
      pickerGrid.innerHTML = filtered.map(m => `
        <div class="media-card" onclick="selectMediaForTarget('${escapeHtml(m.file_url)}')" style="cursor:pointer;">
          <div class="media-thumb-box">
            <img src="${escapeHtml(m.file_url)}" alt="${escapeHtml(m.title)}">
          </div>
          <div class="media-meta-box">
            <span class="media-name">${escapeHtml(m.title)}</span>
            <span style="font-size:0.75rem; color:var(--accent-cyan);">Click to Select</span>
          </div>
        </div>
      `).join('');
    }
  }

  window.handleMediaFileUpload = async function (files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    showToast(`Uploading ${file.name}...`, 'info');

    try {
      const client = TechnoritiDB.getClient();
      let publicUrl = '';

      // Try uploading to Supabase Storage bucket 'festival-media'
      const filePath = `uploads/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data: storageData, error: storageErr } = await client.storage
        .from('festival-media')
        .upload(filePath, file, { cacheControl: '31536000', upsert: true });

      if (!storageErr && storageData) {
        const { data: { publicUrl: pUrl } } = client.storage.from('festival-media').getPublicUrl(filePath);
        publicUrl = pUrl;
      } else {
        // Fallback: convert to Base64 Data URL so local development works even before storage bucket creation
        publicUrl = await fileToBase64(file);
      }

      await TechnoritiDB.saveMediaAssetRecord({
        title: file.name,
        asset_type: file.type.startsWith('image/') ? 'image' : 'document',
        file_url: publicUrl,
        storage_path: filePath,
        file_size: file.size,
        mime_type: file.type
      });

      state.media = await TechnoritiDB.getMediaAssets();
      renderMediaGrid();
      showToast(`Asset "${file.name}" added to media library!`, 'success');
    } catch (err) {
      showToast('Upload error: ' + err.message, 'error');
    }
  };

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  window.copyMediaUrl = function (url) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Media URL copied to clipboard!', 'success');
    });
  };

  window.openMediaPickerFor = function (inputId) {
    state.activeMediaPickerTarget = inputId;
    renderMediaGrid();
    openModal('mediaPickerModal');
  };

  window.selectMediaForTarget = function (url) {
    if (state.activeMediaPickerTarget) {
      const el = document.getElementById(state.activeMediaPickerTarget);
      if (el) el.value = url;
    }
    closeModal('mediaPickerModal');
    showToast('Media selected', 'success');
  };

  window.deleteMedia = async function (id) {
    if (!confirm('Are you sure you want to delete this media file?')) return;
    try {
      await TechnoritiDB.deleteMediaAsset(id);
      state.media = state.media.filter(m => m.id !== id);
      renderMediaGrid();
      showToast('Media deleted', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 16. USERS & ADMIN ROLES
  // =========================================================================
  function renderAdminUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    if (state.adminUsers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="table-empty-state">No admin users found</td></tr>`;
      return;
    }

    tbody.innerHTML = state.adminUsers.map(u => {
      const email = u.profiles?.email || u.user_id;
      return `
        <tr>
          <td style="font-weight:700; color:#fff;">${escapeHtml(email)}</td>
          <td><span class="user-role-badge">${escapeHtml(u.role.toUpperCase())}</span></td>
          <td style="color:var(--text-muted); font-size:0.8rem;">${new Date(u.created_at).toLocaleDateString()}</td>
          <td style="text-align:right;">
            <select class="filter-select" style="padding:4px 8px; font-size:0.75rem;" onchange="changeUserRole('${u.user_id}', this.value)">
              <option value="super_admin" ${u.role === 'super_admin' ? 'selected' : ''}>Super Admin</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
              <option value="coordinator" ${u.role === 'coordinator' ? 'selected' : ''}>Coordinator</option>
              <option value="student" ${u.role === 'student' ? 'selected' : ''}>Student</option>
            </select>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.changeUserRole = async function (userId, newRole) {
    try {
      await TechnoritiDB.updateUserRole(userId, newRole);
      state.adminUsers = await TechnoritiDB.getAdminUsers();
      renderAdminUsersTable();
      showToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
    } catch (err) {
      showToast('Failed to change role: ' + err.message, 'error');
    }
  };

  window.openAddAdminUserModal = async function () {
    const userId = prompt('Enter user UUID to grant administrator access:');
    if (!userId) return;
    const role = prompt('Enter role (super_admin, admin, coordinator):', 'admin');
    if (!role) return;

    try {
      await TechnoritiDB.updateUserRole(userId.trim(), role.trim().toLowerCase());
      state.adminUsers = await TechnoritiDB.getAdminUsers();
      renderAdminUsersTable();
      showToast('Administrator privileges granted!', 'success');
    } catch (err) {
      showToast('Assignment error: ' + err.message, 'error');
    }
  };

  // =========================================================================
  // 17. SECURITY AUDIT LOGS
  // =========================================================================
  function renderAuditLogsTable() {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;

    if (state.auditLogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty-state">No audit activity logged yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = state.auditLogs.map(log => {
      const ts = log.created_at ? new Date(log.created_at).toLocaleString('en-IN') : 'Recent';
      return `
        <tr>
          <td style="font-size:0.8rem; color:var(--text-dim);">${ts}</td>
          <td><strong style="color:var(--accent-cyan);">${escapeHtml(log.action)}</strong></td>
          <td><code>${escapeHtml(log.target_table || 'system')}</code></td>
          <td>${escapeHtml(log.user_id ? log.user_id.slice(0, 8) + '...' : 'Admin')}</td>
          <td style="font-size:0.75rem; color:var(--text-muted); max-width:300px; overflow:hidden; text-overflow:ellipsis;">
            ${escapeHtml(JSON.stringify(log.new_data || log.old_data || {}))}
          </td>
        </tr>
      `;
    }).join('');
  }

  // =========================================================================
  // 18. GLOBAL SEARCH MODAL (Ctrl + K)
  // =========================================================================
  window.handleGlobalSearch = function (query) {
    const resBox = document.getElementById('globalSearchResults');
    if (!resBox) return;

    const q = (query || '').toLowerCase().trim();
    if (!q) {
      resBox.innerHTML = '<div style="padding:20px; text-align:center; color:var(--text-dim); font-size:0.85rem;">Type anything to search across competitions, registrations, and sponsors...</div>';
      return;
    }

    const matchedEvents = state.events.filter(e => (e.title || '').toLowerCase().includes(q));
    const matchedRegs = state.registrations.filter(r => (r.full_name || r.email || '').toLowerCase().includes(q));
    const matchedSponsors = state.sponsors.filter(s => (s.name || '').toLowerCase().includes(q));

    let html = '';

    if (matchedEvents.length > 0) {
      html += `<div style="font-size:0.7rem; font-family:var(--font-orbitron); color:var(--accent-cyan); padding:6px 10px;">COMPETITIONS (${matchedEvents.length})</div>`;
      html += matchedEvents.map(e => `
        <div class="search-result-item" onclick="closeModal('globalSearchModal'); switchTab('competitions'); editCompetition('${e.id}')">
          <span style="font-weight:700; color:#fff;">🏆 ${escapeHtml(e.title)}</span>
          <span style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(e.event_categories?.name || 'Event')}</span>
        </div>
      `).join('');
    }

    if (matchedRegs.length > 0) {
      html += `<div style="font-size:0.7rem; font-family:var(--font-orbitron); color:var(--accent-green); padding:6px 10px; margin-top:8px;">REGISTRATIONS (${matchedRegs.length})</div>`;
      html += matchedRegs.map(r => `
        <div class="search-result-item" onclick="closeModal('globalSearchModal'); switchTab('registrations'); viewRegistrationDetail('${r.id}')">
          <span style="font-weight:700; color:#fff;">📝 ${escapeHtml(r.full_name || 'Participant')}</span>
          <span style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(r.event_title || '')}</span>
        </div>
      `).join('');
    }

    if (matchedSponsors.length > 0) {
      html += `<div style="font-size:0.7rem; font-family:var(--font-orbitron); color:var(--accent-yellow); padding:6px 10px; margin-top:8px;">SPONSORS (${matchedSponsors.length})</div>`;
      html += matchedSponsors.map(s => `
        <div class="search-result-item" onclick="closeModal('globalSearchModal'); switchTab('sponsors'); editSponsor('${s.id}')">
          <span style="font-weight:700; color:#fff;">🤝 ${escapeHtml(s.name)}</span>
          <span style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(s.tier)}</span>
        </div>
      `).join('');
    }

    if (!html) {
      html = `<div style="padding:20px; text-align:center; color:var(--text-dim); font-size:0.85rem;">No results found for "${escapeHtml(q)}"</div>`;
    }

    resBox.innerHTML = html;
  };

  // Keyboard shortcut Ctrl + K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openModal('globalSearchModal');
      document.getElementById('globalSearchInput')?.focus();
    }
  });

  // =========================================================================
  // 19. EVENT LISTENERS INITIALIZATION
  // =========================================================================
  function initListeners() {
    // Tab buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        if (tab) switchTab(tab);
      });
    });

    // Refresh Data button
    document.getElementById('btnRefreshData')?.addEventListener('click', async () => {
      showToast('Synchronizing with Supabase...', 'info');
      await fetchAllData();
    });

    // Export CSV button
    document.getElementById('btnExportCSV')?.addEventListener('click', exportRegistrationsCSV);

    // Global Search trigger
    document.getElementById('btnGlobalSearch')?.addEventListener('click', () => {
      openModal('globalSearchModal');
      document.getElementById('globalSearchInput')?.focus();
    });

    // Live Preview trigger
    document.getElementById('btnLivePreview')?.addEventListener('click', () => {
      const iframe = document.getElementById('previewIframe');
      if (iframe) iframe.src = '../index.html?t=' + Date.now();
      openModal('previewModal');
    });

    // Mobile Hamburger Toggle
    document.getElementById('mobileNavToggle')?.addEventListener('click', () => {
      const sidebar = document.getElementById('adminSidebar');
      if (sidebar) sidebar.classList.toggle('open');
    });

    // Logout button
    document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
      await TechnoritiDB.signOut();
      window.location.replace('login.html');
    });

    // Filter Listeners
    document.getElementById('compSearchInput')?.addEventListener('input', renderCompetitionsTable);
    document.getElementById('compCategoryFilter')?.addEventListener('change', renderCompetitionsTable);

    document.getElementById('regSearchInput')?.addEventListener('input', renderRegistrationsTable);
    document.getElementById('regEventFilter')?.addEventListener('change', renderRegistrationsTable);
    document.getElementById('regStatusFilter')?.addEventListener('change', renderRegistrationsTable);
    document.getElementById('regPaymentFilter')?.addEventListener('change', renderRegistrationsTable);

    document.getElementById('accSearchInput')?.addEventListener('input', renderAccommodationsTable);
    document.getElementById('accBlockFilter')?.addEventListener('change', renderAccommodationsTable);
    document.getElementById('accStatusFilter')?.addEventListener('change', renderAccommodationsTable);
  }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Bootstrap
  window.addEventListener('DOMContentLoaded', async () => {
    initListeners();
    const authorized = await initSecurityGuard();
    if (authorized) {
      await fetchAllData();
    }
  });
})();
