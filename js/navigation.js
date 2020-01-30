// Load a URL into the main container
function load(src, clear = true) {
    fetch(src + '.html', {
        // Only use cache if developing locally
        cache: window.location.hostname === 'localhost' ? 'no-store' : 'default'
    }).then(res => res.text()).then(body => {
        // Usually clean out the main container, sometimes we might need to load multiple pages consecutively
        if (clear) $('#container').empty();
        $('#container').append($(body));

        // Save path and theme (sometimes)
        var s = { path: src };
        if (forceTheme) s.theme = forceTheme;

        // Put them in window.location
        var url = URI(window.location.href);
        url.search(s);
        window.history.pushState(s, 'Robot X', url.toString());
    });
}

// Round out the bottom of the second to last item in the navbar so the donate button looks byootiful
var list = $('#list').find('button');
$(list.slice(-2)[0]).addClass('last');

// Set click event for each button in the navbar
list.click(e => {
    // The donate button doesn't have a target page, so we ignore it
    if (e.target.dataset.href) {
        // First load the target page
        load(e.target.dataset.href);

        // Set list as inactive
        list.removeClass('active');

        // Set button as active and show dropdown if necessary
        $(e.target).addClass('active');
        if ($(e.target).parent()[0] !== $('#robot-menu')[0]) $('#robot-menu').collapse('hide');
        else $('#robot-menu').collapse('show');
    }

    // Begone, accursed blue outline!
    e.target.blur();
})

// Get path from URL params or home
var path = URI(window.location.href).search(true).path ? unescape(URI(window.location.href).search(true).path) : 'home';

// Set button as active and show dropdown if necessary
$('[data-href="' + path + '"]').addClass('active');
if ($('[data-href="' + path + '"]').parent()[0] === $('#robot-menu')[0]) $('#robot-menu').collapse('show');

// Load the first page
load(path);