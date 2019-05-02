var queryV = !!new URLSearchParams(window.location.search).get('theme')
var hours = new Date().getHours()
var variant = new URLSearchParams(window.location.search).get('theme') || (hours > 5 && hours < 17) ? 'day' : 'night'

var style = $('<link rel="stylesheet" href="/css/' + variant + '.css">')
style.on('load', _ => {
  $('body').removeAttr('style')
})
$('head').append(style)

$('head').append('<link rel="icon" href="/img/logos/icon-' + variant + '.png">')

$('#brand').attr('src', '/img/logos/brand-' + variant + '.png')