/*  work.js — role filtering for the work page.
    Deliberately small and dependency-free. The filtering itself is done by
    CSS over data-roles attributes; this file only keeps three things in sync:
    the data-filter attribute, the URL, and the project links.               */

(function () {
  'use strict';

  var ROLES  = ['all', 'directed', 'produced', 'written'];
  var results = document.getElementById('results');
  var grid    = document.getElementById('grid');
  var list    = document.getElementById('list');
  var count   = document.getElementById('count');
  if (!results) return;

  var shelf   = document.getElementById('shelf');
  var hint    = document.querySelector('.shelf-hint');
  var roleButtons = Array.prototype.slice.call(document.querySelectorAll('[data-role]'));
  var viewButtons = Array.prototype.slice.call(document.querySelectorAll('[data-view]'));
  var cards       = Array.prototype.slice.call(results.querySelectorAll('.card'));

  /* Filter state lives in the URL so it can be linked, and so a project page
     can read it and sort the matching evidence block first. */
  function roleFromHash() {
    var m = /(?:^|[#&])role=([a-z]+)/.exec(window.location.hash);
    var r = m ? m[1] : 'all';
    return ROLES.indexOf(r) > -1 ? r : 'all';
  }

  function apply(role) {
    results.setAttribute('data-filter', role);

    roleButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-role') === role));
    });

    /* Carry the filter through to the project page. */
    Array.prototype.slice.call(document.querySelectorAll('a[data-project]')).forEach(function (a) {
      var base = a.getAttribute('href').split('?')[0];
      a.setAttribute('href', role === 'all' ? base : base + '?role=' + role);
    });

    closeShelf();

    var n = cards.filter(function (c) {
      return role === 'all' ||
             (' ' + c.getAttribute('data-roles') + ' ').indexOf(' ' + role + ' ') > -1;
    }).length;
    if (count) count.textContent = n + (n === 1 ? ' project' : ' projects');
  }

  roleButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var role = b.getAttribute('data-role');
      /* Writing the hash rather than calling apply() directly keeps the URL
         authoritative, so back and forward work without extra bookkeeping. */
      window.location.hash = (role === 'all') ? '' : 'role=' + role;
      if (role === 'all') apply('all');
    });
  });

  viewButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var view = b.getAttribute('data-view');
      if (shelf) shelf.hidden = (view !== 'shelf');
      if (hint)  hint.hidden  = (view !== 'shelf');
      if (grid)  grid.hidden  = (view !== 'grid');
      if (list)  list.hidden  = (view !== 'list');
      if (view !== 'shelf') closeShelf();
      viewButtons.forEach(function (o) {
        o.setAttribute('aria-pressed', String(o.getAttribute('data-view') === view));
      });
    });
  });

  /* ---- the shelf ---------------------------------------------------------
     One click turns a title around: the spine flips to a back cover and the
     items to its right are pushed along the shelf by the width change.
     Double-click opens the project page.

     Double-click is not a web convention and a keyboard user cannot perform
     it, so it is a shortcut and never the only way in — the back cover
     carries a real link, and that link is what screen readers and keyboards
     use. touch-action:manipulation in the CSS stops a phone treating the
     second tap as zoom.                                                    */

  function closeShelf(except) {
    if (!shelf) return;
    Array.prototype.slice.call(shelf.querySelectorAll('.shelf-item[data-open]'))
      .forEach(function (li) {
        if (li === except) return;
        li.removeAttribute('data-open');
        var btn = li.querySelector('.shelf-card');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
  }

  if (shelf) {
    Array.prototype.slice.call(shelf.querySelectorAll('.shelf-card')).forEach(function (btn) {
      var li = btn.parentNode;

      btn.addEventListener('click', function (e) {
        /* the link on the back cover is a real link — let it navigate */
        if (e.target.closest && e.target.closest('a')) return;
        var open = li.hasAttribute('data-open');
        closeShelf(li);
        if (open) { li.removeAttribute('data-open'); btn.setAttribute('aria-expanded', 'false'); }
        else      { li.setAttribute('data-open', ''); btn.setAttribute('aria-expanded', 'true'); }
      });

      btn.addEventListener('dblclick', function (e) {
        if (e.target.closest && e.target.closest('a')) return;
        var href = btn.getAttribute('data-href');
        var r = document.querySelector('[data-role][aria-pressed="true"]');
        var sel = r ? r.getAttribute('data-role') : 'all';
        window.location.href = (sel && sel !== 'all') ? href + '?role=' + sel : href;
      });
    });

    /* Escape closes whatever is open. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeShelf();
    });
  }

  window.addEventListener('hashchange', function () { apply(roleFromHash()); });
  apply(roleFromHash());
})();
