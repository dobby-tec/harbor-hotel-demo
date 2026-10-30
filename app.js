// Harbor Hotel demo site. Bookings are kept in this browser (localStorage "hh_bookings").
(function () {
  var ROOMS = [
    { id: 'garden', name: 'Garden Room', sleeps: 2, saver: 80, flex: 92, cleaning: 70, pic: 'p1', blurb: 'Ground floor, opens onto the herb garden. Queen bed, rain shower.' },
    { id: 'city', name: 'City Room', sleeps: 2, saver: 88, flex: 101, cleaning: 20, pic: 'p2', blurb: 'Third floor with a view over the old harbour. Queen bed, work desk.' },
    { id: 'loft', name: 'Loft', sleeps: 3, saver: 95, flex: 109, cleaning: 0, pic: 'p3', blurb: 'Under the roof, with a sofa bed and a small kitchenette.' },
    { id: 'suite', name: 'Suite', sleeps: 4, saver: 130, flex: 150, cleaning: 0, pic: 'p4', blurb: 'Two rooms, king bed and a living area with a harbour view.' }
  ];
  var EXTRA = { insurance: 24, breakfast: 36 };
  var q = new URLSearchParams(location.search), page = document.body.getAttribute('data-page');
  var CONTROL = q.get('mode') === 'control', NOTICE = q.get('notice') === '1' && !CONTROL;
  var $ = function (s) { return document.querySelector(s); };
  var eur = function (n) { return '€' + n; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var keep = (CONTROL ? '&mode=control' : '') + (NOTICE ? '&notice=1' : '');
  var day = function (s) { var m = /^\d{4}-\d{2}-\d{2}$/.test(s || '') && Date.parse(s + 'T00:00:00Z'); return m || null; };
  function stay() {
    var a = q.get('checkin'), b = q.get('checkout'), g = Number(q.get('guests'));
    var n = day(a) !== null && day(b) !== null ? Math.round((day(b) - day(a)) / 864e5) : null;
    if (n === null) return { err: 'Dates must be written as YYYY-MM-DD, for example 2026-11-14.' };
    if (n < 1) return { err: 'The check-out date must be after the check-in date.' };
    if (n > 14) return { err: 'A stay can be at most 14 nights.' };
    if (!(g >= 1 && g <= 4)) return { err: 'Guests must be from 1 to 4.' };
    return { checkin: a, checkout: b, nights: n, guests: g };
  }
  function cost(r, rate, n) { var per = rate === 'flex' ? r.flex : r.saver; return { per: per, stay: per * n, cleaning: r.cleaning, base: per * n + r.cleaning }; }
  function qs(o) { return Object.keys(o).map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&'); }
  function fail(m) { $('#content').innerHTML = '<div class="panel"><h1>Something is wrong</h1><p class="err">' + esc(m) + '</p><p><a href="index.html">Back to search</a></p></div>'; }

  if (page === 'home') {
    var f = $('#search');
    f.addEventListener('submit', function (e) { e.preventDefault(); location.href = 'rooms.html?' + qs({ checkin: f.checkin.value, checkout: f.checkout.value, guests: f.guests.value }) + keep; });
  }
  if (page === 'rooms') {
    var s = stay(); if (s.err) return fail(s.err);
    var html = '<h1>Available rooms</h1><p class="summary" id="summary">Stay: ' + s.checkin + ' to ' + s.checkout + ' (' + s.nights + ' night' + (s.nights > 1 ? 's' : '') + '), ' + s.guests + ' guest' + (s.guests > 1 ? 's' : '') + '</p>';
    if (NOTICE) html += '<p class="notice" id="fee-notice">The prices on this page are per night. They do not include the cleaning fee. The cleaning fee is added at checkout and is different for each room: ' + ROOMS.map(function (r) { return r.name + ' ' + r.cleaning + ' EUR'; }).join(', ') + '.</p>';
    ROOMS.forEach(function (r) {
      html += '<article class="panel room"><a href="room.html?id=' + r.id + '"><img class="pic" src="room-' + r.id + '.svg" alt="' + esc(r.name) + '"></a><div><h2>' + esc(r.name) + '</h2><p class="meta">Sleeps ' + r.sleeps + ' &middot; ' + esc(r.blurb) + '</p>';
      if (s.guests > r.sleeps) { html += '<p>Too small for ' + s.guests + ' guests.</p></div></article>'; return; }
      html += '<div class="rates">';
      [['flex', 'Flex rate', 'Free cancellation until 48 hours before arrival', 'tag', 'Free cancellation'], ['saver', 'Saver rate', 'Not refundable', 'tag no', 'Not refundable']].forEach(function (x) {
        var c = cost(r, x[0], s.nights), p = CONTROL ? eur(c.base) + ' total for ' + s.nights + ' night' + (s.nights > 1 ? 's' : '') + ', all fees included' : eur(c.per) + ' per night';
        html += '<div class="rate"><span class="' + x[3] + '">' + x[4] + '</span><h3>' + x[1] + '</h3><p>' + x[2] + '</p><p class="price">' + p + '</p><a class="btn" href="checkout.html?' + qs({ room: r.id, rate: x[0], checkin: s.checkin, checkout: s.checkout, guests: s.guests }) + keep + '" aria-label="Select ' + x[1] + ' for ' + esc(r.name) + '">Select</a></div>';
      });
      html += '</div></div></article>';
    });
    $('#content').innerHTML = html + '<p><a href="index.html">Back to search</a></p>';
  }
  if (page === 'checkout') {
    var s2 = stay(), room = ROOMS.filter(function (r) { return r.id === q.get('room'); })[0], rate = q.get('rate');
    if (s2.err) return fail(s2.err); if (!room || (rate !== 'flex' && rate !== 'saver')) return fail('Choose a room and a rate first.');
    var c = cost(room, rate, s2.nights);
    $('#content').innerHTML = '<h1>Your booking</h1><p>' + esc(room.name) + ', ' + (rate === 'flex' ? 'Flex rate (free cancellation until 48 hours before arrival)' : 'Saver rate (not refundable)') + '<br>' + s2.checkin + ' to ' + s2.checkout + ' (' + s2.nights + ' night' + (s2.nights > 1 ? 's' : '') + '), ' + s2.guests + ' guest' + (s2.guests > 1 ? 's' : '') + '. Payment at the property.</p>' +
      '<form id="book" class="panel"><label for="name">Full name</label><input type="text" id="name" required><label for="email" style="margin-top:10px">Email</label><input type="email" id="email" required>' +
      '<fieldset><legend>Extras</legend><label><input type="checkbox" id="insurance" checked> Travel insurance (' + eur(EXTRA.insurance) + ')</label><label><input type="checkbox" id="breakfast"> Breakfast (' + eur(EXTRA.breakfast) + ')</label></fieldset>' +
      '<p>Room, ' + s2.nights + ' night' + (s2.nights > 1 ? 's' : '') + ' at ' + eur(c.per) + ': ' + eur(c.stay) + '<br>Cleaning fee: ' + eur(c.cleaning) + '<br><span id="extras"></span></p><p class="total" id="total"></p><button type="submit">Confirm booking</button></form>';
    var upd = function () { var e = ($('#insurance').checked ? EXTRA.insurance : 0) + ($('#breakfast').checked ? EXTRA.breakfast : 0); $('#extras').textContent = 'Extras: ' + eur(e); $('#total').textContent = 'Total: ' + eur(c.base + e); return e; };
    $('#insurance').addEventListener('change', upd); $('#breakfast').addEventListener('change', upd); upd();
    $('#book').addEventListener('submit', function (e) {
      e.preventDefault(); var ex = upd(), list = []; try { list = JSON.parse(localStorage.getItem('hh_bookings') || '[]'); } catch (x) {}
      var b = { id: list.length + 1, time: new Date().toISOString(), room: room.id, rate: rate, checkin: s2.checkin, checkout: s2.checkout, nights: s2.nights, guests: s2.guests, name: $('#name').value.trim(), email: $('#email').value.trim(), insurance: $('#insurance').checked, breakfast: $('#breakfast').checked, total: c.base + ex, mode: CONTROL ? 'totals' : 'per-night' };
      list.push(b); localStorage.setItem('hh_bookings', JSON.stringify(list)); sessionStorage.setItem('hh_last', JSON.stringify(b)); location.href = 'confirmation.html' + (keep ? '?' + keep.slice(1) : '');
    });
  }
  if (page === 'confirmation') {
    var b2 = null; try { b2 = JSON.parse(sessionStorage.getItem('hh_last')); } catch (x) {}
    if (!b2) return fail('There is no booking to show.');
    var rm = ROOMS.filter(function (r) { return r.id === b2.room; })[0];
    $('#content').innerHTML = '<h1>Booking confirmed</h1><p id="ref">Reference HH-' + (1000 + b2.id) + '</p><p>' + esc(rm.name) + ', ' + (b2.rate === 'flex' ? 'Flex rate' : 'Saver rate') + '<br>' + b2.checkin + ' to ' + b2.checkout + ' (' + b2.nights + ' night' + (b2.nights > 1 ? 's' : '') + '), ' + b2.guests + ' guest' + (b2.guests > 1 ? 's' : '') + '<br>' + esc(b2.name) + ', ' + esc(b2.email) + '<br>Extras: ' + ([b2.insurance && 'Travel insurance', b2.breakfast && 'Breakfast'].filter(Boolean).join(', ') || 'none') + '<br><strong>Total: ' + eur(b2.total) + '</strong>, payable at the property.</p><p><a href="index.html">New search</a></p>';
  }
  if (page === 'bookings') {
    var l = []; try { l = JSON.parse(localStorage.getItem('hh_bookings') || '[]'); } catch (x) {}
    var rows = l.map(function (b) { return '<tr><td>' + b.id + '</td><td>' + b.time.slice(0, 19).replace('T', ' ') + '</td><td>' + b.room + '</td><td>' + b.rate + '</td><td>' + b.checkin + ' to ' + b.checkout + '</td><td>' + b.guests + '</td><td>' + (b.insurance ? 'insurance ' : '') + (b.breakfast ? 'breakfast' : '') + '</td><td>' + b.total + '</td><td>' + b.mode + '</td></tr>'; }).join('');
    $('#content').innerHTML = '<h1>Bookings saved in this browser</h1><p class="summary">Stored in this browser only.</p><div class="panel"><table cellpadding="6"><thead><tr><th>#</th><th>time</th><th>room</th><th>rate</th><th>dates</th><th>guests</th><th>extras</th><th>total</th><th>mode</th></tr></thead><tbody>' + (rows || '<tr><td colspan="9">none</td></tr>') + '</tbody></table><p><button type="button" id="clear" class="secondary">Clear</button></p></div>';
    $('#clear').addEventListener('click', function () { localStorage.removeItem('hh_bookings'); location.reload(); });
  }
})();
