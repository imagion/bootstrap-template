$( document ).ready(function() {

    $('.works-carousel').slick({
        arrows: false,
        dots: true,
    });

    var scTop = $('#top'); // Get the button
    var winH = $(window).height(); // Get the window height.
    
    $(window).on("scroll", function () {
        if ($(this).scrollTop() > winH) {
            scTop.addClass("show");
        } else {
            scTop.removeClass("show");
        }
    }).on("resize", function () { // If the user resizes the window
        winH = $(this).height(); // you'll need the new height value
    });

    scTop.click(function () {
        $(window).scrollTop(0);
    });

});
