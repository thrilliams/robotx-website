// Use user-specified theme if it exists, otherwise dark mode (see below)
var forceTheme = new URLSearchParams(window.location.search).get('theme');
if (forceTheme !== null) {
    var variant = forceTheme;
} else {
    // var variant = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
    var variant = 'night'; // Dark mode is always right
    // TODO: change my mind
}

// Load correct CSS file and unhide body when done
var style = $('<link rel="stylesheet" href="/css/' + variant + '.css">');
style.on('load', _ => {
    $('body').removeAttr('style');
});

// Apply CSS and style logos accordingly
$('head').append(style);
$('head').append('<link rel="icon" href="/img/logos/icon-' + variant + '.png">');
$('#brand').attr('src', '/img/logos/brand-' + variant + '.png');