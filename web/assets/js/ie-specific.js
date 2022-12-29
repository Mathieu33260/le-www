  /* Fix header on IE */
$(document).ready(function () {
  if($('#menu').length){
      var menu   = $('#menu'),
          top    = menu.offset().top;

      $(window).on('scroll', function () {
          if($('#menu').length && getWidth() >= 768 && $(window).height() < $('body').height()-$('#header').height()){
              var st = $(this).scrollTop();
              if (st >= top) {
                  menu.addClass('fixed');
              } else {
                  menu.removeClass('fixed');
              }
          }
      });
  }
});
