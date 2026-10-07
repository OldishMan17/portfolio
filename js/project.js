/*  project.js — one job only.
    If the visitor arrived from a role filter, sort that role's evidence block
    first. A producer who filtered for producing work should not have to scroll
    past thoughts on staging to reach the schedule. CSS does the reordering;
    this sets the attribute it keys off.                                      */

(function () {
  'use strict';
  var blocks = document.querySelector('.blocks');
  if (!blocks) return;

  var m = /[?&]role=([a-z]+)/.exec(window.location.search);
  var role = m ? m[1] : null;

  if (role && ['directed', 'produced', 'written'].indexOf(role) > -1) {
    blocks.setAttribute('data-lead', role);
  }

  /* Send the back link to the same filtered view the visitor came from. */
  var back = document.querySelector('[data-back]');
  if (back && role) {
    back.setAttribute('href', back.getAttribute('href').split('#')[0] + '#role=' + role);
  }
})();
