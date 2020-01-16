$.ajaxSetup({
  cache: false
})

function load(src) {
  $('#container').load(src + '.html', _ => {
    var url = URI(window.location.href)
    window.location.href = '#'
    var s = {
      path: src
    }

    if (queryV) s.theme = variant

    url.search(s)
    window.history.replaceState(null, null, url.toString())
    $('#brand').attr('src', '/img/logos/brand-' + variant + '.png')
  })
}

var list = $('#list').find('button')
console.log($(list.slice(-2)[0]).addClass('last'))

list.click(e => {
  if (e.target.dataset.href) {
    load(e.target.dataset.href)
    list.removeClass('active')
    $(e.target).addClass('active')
    if ($(e.target).parent()[0] !== $('#robot-menu')[0]) $('#robot-menu').collapse('hide')
    else $('#robot-menu').collapse('show')
  }
  e.target.blur()
})

var path = URI(window.location.href).search(true).path ? unescape(URI(window.location.href).search(true).path) : 'home'
$('[data-href="' + path + '"]').addClass('active')
if ($('[data-href="' + path + '"]').parent()[0] === $('#robot-menu')[0]) $('#robot-menu').collapse('show')

load(path)