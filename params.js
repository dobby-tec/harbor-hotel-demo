// Stores values from the address in localStorage so a guide can target on them ("Local Storage value is", Key = hh_param_<name>).
// Loaded in the head, before the Fullstory snippet, so the values exist before targeting is evaluated.
//   ?set=group:a                 -> localStorage["hh_param_group"] = "a"
//   ?set=group:a,tour:fees       -> two keys at once
//   ?clear=group                 -> removes hh_param_group
//   ?clear=all                   -> removes every hh_param_* key
// Only keys that start with hh_param_ are touched. Names: letters, digits, dash and underscore. Values: up to 60 characters, no comma.
(function () {
  var PREFIX = 'hh_param_';
  try {
    var q = new URLSearchParams(location.search);
    var set = q.get('set'), clear = q.get('clear');
    var okName = function (s) { return /^[A-Za-z0-9_-]{1,40}$/.test(s); };
    if (clear) {
      if (clear === 'all') {
        for (var i = localStorage.length - 1; i >= 0; i--) { var k = localStorage.key(i); if (k && k.indexOf(PREFIX) === 0) localStorage.removeItem(k); }
      } else {
        clear.split(',').forEach(function (n) { if (okName(n)) localStorage.removeItem(PREFIX + n); });
      }
    }
    if (set) {
      set.split(',').forEach(function (pair) {
        var at = pair.indexOf(':'); if (at < 1) return;
        var name = pair.slice(0, at), value = pair.slice(at + 1);
        if (okName(name) && value.length <= 60) localStorage.setItem(PREFIX + name, value);
      });
    }
  } catch (e) { /* storage blocked: the site still works, it just cannot be targeted on these values */ }
})();
