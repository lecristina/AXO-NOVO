/* theme.js - Theme Manager (Light only) */
var ThemeManager = {
    init: function() {
        document.documentElement.classList.remove('dark');
    },
    toggle: function() {},
    current: function() { return 'light'; }
};
ThemeManager.init();
