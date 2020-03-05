$('#navbar > a').click(e => {
    if (window.innerWidth < 768) {
        e.preventDefault();
        $('#navbar > ul').toggleClass('display');
    }
});