(function () {
  "use strict";

  const SUPABASE_URL = GIOCHISAT_CONFIG.supabaseUrl;
  const SUPABASE_KEY = GIOCHISAT_CONFIG.supabaseKey;
  const STORAGE_PREFIX = "giochisat_stats_v1";

  function localDateParts() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(now).reduce((out, part) => {
      out[part.type] = part.value;
      return out;
    }, {});
    return {
      day: `${parts.year}-${parts.month}-${parts.day}`,
      month: `${parts.year}-${parts.month}`
    };
  }

  async function recordPlay(gameId) {
    if (!gameId || !/^[a-z0-9-]+$/.test(gameId)) return false;

    const period = localDateParts();
    const keys = {
      gameDay: `${STORAGE_PREFIX}:game:${gameId}:day:${period.day}`,
      gameMonth: `${STORAGE_PREFIX}:game:${gameId}:month:${period.month}`,
      gameAll: `${STORAGE_PREFIX}:game:${gameId}:all`,
      siteDay: `${STORAGE_PREFIX}:site:day:${period.day}`,
      siteMonth: `${STORAGE_PREFIX}:site:month:${period.month}`,
      siteAll: `${STORAGE_PREFIX}:site:all`
    };

    const payload = {
      p_game_id: gameId,
      p_count_game_day: !localStorage.getItem(keys.gameDay),
      p_count_game_month: !localStorage.getItem(keys.gameMonth),
      p_count_game_all: !localStorage.getItem(keys.gameAll),
      p_count_site_day: !localStorage.getItem(keys.siteDay),
      p_count_site_month: !localStorage.getItem(keys.siteMonth),
      p_count_site_all: !localStorage.getItem(keys.siteAll)
    };

    if (!Object.values(payload).some(value => value === true)) return true;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/game_record_play`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        keepalive: true
      });
      if (!response.ok) return false;
      Object.entries(keys).forEach(([name, key]) => {
        const flag = {
          gameDay: "p_count_game_day",
          gameMonth: "p_count_game_month",
          gameAll: "p_count_game_all",
          siteDay: "p_count_site_day",
          siteMonth: "p_count_site_month",
          siteAll: "p_count_site_all"
        }[name];
        if (payload[flag]) localStorage.setItem(key, "1");
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  window.GiochiSATStats = { recordPlay };
})();
