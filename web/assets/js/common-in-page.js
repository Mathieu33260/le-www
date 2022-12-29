/* eslint-disable */

$( document ).ajaxStop(function() {
  var element = document.getElementById("general-loader");
  if (element) {
    element.classList.add("hide");
  }
});

$(document).ready(function () {
    $('.modal-success').modal('show');
    $('.modal-error').modal('show');
    $(document).on('click','.more-action',function(){
        var ce = $(this).parent().find('.more-hide');
        if($(ce).hasClass('more-show')){
            $(ce).removeClass('more-show');
            $(this).html('En voir plus...');
        }
        else {
            $(ce).addClass('more-show');
            $(this).html('En voir moins');
        }
    });
});

/**
 * Init popover and tooltip
 */
$(function () {
    $('[data-toggle="popover"]').popover();
    $('[data-toggle="tooltip"]').tooltip();
});

$('#description').find("a[href='#calendars']").on('click',function(){
    ga('send', 'event', 'auction detail', 'link to calendar', 'click');
});
if($('#description').find("a[href='#calendars']").length && window.innerWidth < 768){
    ga('send', 'event', 'auction detail', 'link to calendar', 'show');
};

$('#winmodal').find('.btn').on('click',function(event){
    event.preventDefault();
    var href = $(this).attr('href');
    setTimeout(gotopayment, 1000);
    var goto = false;
    function gotopayment() {
      if (!goto) {
        goto = true;
        window.location.href = href;
      }
    }

    ga('send', 'event', 'ecommerce', 'access_payment', 'winmodal', {
      hitCallback: gotopayment
    });
});

function toasterActionLink(ce, event){
    if(event){
        event.preventDefault();
    }
    var href = $(ce).is('a') ? $(ce).attr('href') : $('#toast-container').find('.toast-message a').attr('href');
    if(typeof href !== 'undefined'){
        setTimeout(gotopayment, 1000);
        var goto = false;
        function gotopayment() {
          if (!goto) {
            goto = true;
            window.location.href = href;
          }
        }

        ga('send', 'event', 'ecommerce', 'access_payment', 'notification', {
          hitCallback: gotopayment
        });
    }
}

$(document).on('click', '#toast-container', function(event){
    if(!$(this).hasClass('toast-close-button')){
        toasterActionLink(this, event);
    }
});

/**
* Decimal adjustment of a number.
* @param {String}  type  The type of adjustment.
* @param {Number}  value The number.
* @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
* @returns {Number} The adjusted value.
*/
function decimalAdjust(t,e,i){return"undefined"==typeof i||0===+i?Math[t](e):(e=+e,i=+i,null===e||isNaN(e)||"number"!=typeof i||i%1!==0?NaN:0>e?-decimalAdjust(t,-e,i):(e=e.toString().split("e"),e=Math[t](+(e[0]+"e"+(e[1]?+e[1]-i:-i))),e=e.toString().split("e"),+(e[0]+"e"+(e[1]?+e[1]+i:i))))}

// Decimal ceil
if (!Math.ceil10) {
    Math.ceil10 = function(value, exp) {
        return decimalAdjust('ceil', value, exp);
    };
}

function firebase_logEvent(name, params) {
  if (!name) {
    return;
  }

  if (window.AnalyticsWebInterface) {
    // Call Android interface
    window.AnalyticsWebInterface.logEvent(name, JSON.stringify(params));
  } else if (window.webkit
      && window.webkit.messageHandlers
      && window.webkit.messageHandlers.firebase) {
    // Call iOS interface
    var message = {
      command: 'logEvent',
      name: name,
      parameters: params
    };
    window.webkit.messageHandlers.firebase.postMessage(message);
  } else {
    // No Android or iOS interface found
    console.log("No native APIs found for Firebase "+name, params);
  }
}
