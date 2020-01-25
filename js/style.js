var t = new URLSearchParams(window.location.search).get('theme');
if (t !== null) {
    var variant = t;
} else {
    // var variant = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
    var variant = 'night'; // TODO: change my mind
}

var style = $('<link rel="stylesheet" href="/css/' + variant + '.css">')
style.on('load', _ => {
    $('body').removeAttr('style')
})

$('head').append(style)
$('head').append('<link rel="icon" href="/img/logos/icon-' + variant + '.png">')
$('#brand').attr('src', '/img/logos/brand-' + variant + '.png')