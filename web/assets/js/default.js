/* eslint-disable */

departement = null;
aAuctionsWait = {};
limit = null;
auctionsnew = null;
auctionTemplate = null;

window.Cookies.defaults.path = '/';
if(typeof _errs !== 'undefined'){
    _errs.meta.cookie_ga = Cookies.get('_ga');
}

/** FUNCTIONS **/
function hideGeneralLoader() {
    const loader = document.getElementById("general-loader");
    if (loader) {
        loader.classList.add("hide");
    }
}
function showGeneralLoader() {
    const loader = document.getElementById("general-loader");
    if (loader) {
        loader.classList.remove("hide");
    }
}

/**
 * Equilibre de plusieurs colonnes en hauteur
 * @param String or jQuery object selecteur
 */
function hauteurs_deux_colonnes(selecteur, lineheight){
    var max_height = 0;
    var height = 0;
    if(typeof selecteur === 'string'){
        selecteur = jQuery(selecteur);
    }

    $(selecteur).each(function(i, val){
        height = (jQuery(val).height());
        if(height > max_height){
            max_height = jQuery(val).height();
        }

    });

    $(selecteur).height(max_height);
    if(lineheight){
        $(selecteur).css('line-height',max_height+'px');
    }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function auctionEnded(auctionChannel){
    auctionChannel.isAuctionEndedCalled = true;
    var auction = auctionChannel.container;
    if($(auction).parent().data('list') !== 'useractualauctions' && $(auction).parent().attr('id') !== 'userActiveAuctions'){
        var auctionIndex = auctionChannel.auctionListRef.getAuctionData(auctionChannel.json.auctionUuid);
        if(auctionChannel.auctionListRef.auctions[auctionIndex]) {
            auctionChannel.auctionListRef.auctions[auctionIndex].inactive = true;
        }

        // Limitation
        if(typeof $(auction).parents('.auctions').attr('data-limit') !== 'undefined'){
            limit = $(auction).parents('.auctions').attr('data-limit');
        }

        if (typeof isListing === 'undefined' && ((typeof aAuctionsWait.tabIndex == 'undefined' || aAuctionsWait.tabIndex.length === 0) || typeof auctionEndedNoRefresh === 'undefined')) {
            // Delay refresh
            setTimeout(function(){
                auctionChannel.auctionListRef.requestAuctions();
            }, getRandomInt(0, 3000));
        }
        else if(typeof isListing !== 'undefined' && typeof $('.refreshAuctions').attr('style') === 'undefined'){
            ga('send', {
              hitType: 'event',
              eventCategory: 'auctions list',
              eventAction: 'click',
              eventLabel: 'Refresh'
            });
        }
    }
}

function mergeArray(array1, array2) {
    var result_array = [];
    var arr = array1.concat(array2);
    var len = arr.length;
    var assoc = {};

    while(len--) {
        var item = arr[len];

        if(!assoc[item]) {
            result_array.unshift(item);
            assoc[item] = true;
        }
    }

    return result_array;
}

function bindTypeAhead(data, cities) {
    var list = mergeArray(data, cities);
    dataTypeAhead = list;
    $(".tagsSearch").autoComplete({
        minChars: 2,
        source: function(term, suggest){
            term = term.toLowerCase();
            var choices = list;
            var matches = [];
            for (i=0; i<choices.length; i++)
                if (~choices[i].toLowerCase().indexOf(term)) matches.push(choices[i]);
            suggest(matches);
        }
    });
}

/** VALIDATION FORM **/
$(document).on('submit','#validationPhone',function(event){
    event.preventDefault();
    var phoneNumber = $('#phone').val();
    if(validatePhoneMobile(phoneNumber)){
        // valide
        showGeneralLoader();
        if($('#validationPhone').find('.form-group').hasClass('has-error')){
            $('#validationPhone').find('.form-group').removeClass('has-error');
        }
        if($('#validationPhone').find('.text-danger').hasClass('hide') === false){
            $('#validationPhone').find('.text-danger').addClass('hide');
        }
        $.ajax({
            method: "POST",
            url: '/user/profile?source=defaultJs512',
            dataType: 'json',
            data: {phone: phoneNumber},
            error: function(response){
                if(response.responseJSON.error){
                    if("Un sms a déjà été envoyé pour ce numéro de téléphone." === response.responseJSON.message || "Erreur lors de l'envoie du sms, vous avez le droit a un maximum de trois validations différentes toute les 30 minutes." === response.responseJSON.message){
                        show_validationPhoneCode(response.responseJSON);
                        $('#validationPhoneCode').find('.form-group').addClass('has-warning');
                        $('#validationPhoneCode').find('.text-warning').text(response.responseJSON.message).removeClass('hide');
                    }else{
                        if($('#validationPhoneCode').length){
                            $('#validationPhoneCode').find('.form-group').switchClass('has-warning','has-error');
                            $('#validationPhoneCode').find('.text-danger').text(response.responseJSON.message).removeClass('hide');
                        }else{
                            $('#validationPhone').find('.form-group').addClass('has-error');
                            $('#validationPhone').find('.text-danger').text(response.responseJSON.message).removeClass('hide');
                        }
                    }
                }
                hideGeneralLoader();
            },
            success: function(response){
                show_validationPhoneCode(response);
                $('#validationPhone').find('fieldset').attr('disabled','');
                hideGeneralLoader();
            }
        });
    }else{
        // invalide
        $('#validationPhone').find('.form-group').addClass('has-error');
        $('#validationPhone').find('.text-danger').removeClass('hide');
    }
});
function show_validationPhoneCode(response){
    if($('#validationPhoneCode').length === 0){
        $('#confirmBidAuto').find('.form').css({
            height: '46px',
            overflow: 'hidden'
        });
        if(response){
            $('#confirmBidAuto').find('.form').append(response.formValidationPhoneCode);
        }
        $('#validationPhone').hide('fade',500);
        $('#validationPhoneCode').show('fade',500,function(){
            $('#confirmBidAuto').find('.form').removeAttr('style');
        });
    }
}
/** END FUNCTIONS **/

$(document).ready(function () {
    $('.closeApps').click(function (e) {
        $('#blockApps').slideUp();
        e.preventDefault();
    });

    $('.popupLogin').on('click',function(event) {
        event.preventDefault();
        if($('.login-popup').css("display") === 'none'){
            $('.login-popup').show();
        } else {
            $('.login-popup').hide();
        }
    });

    if (!Cookies.get('no-cookie-bar')) {
        $('#cookie-consent').show();
    }

    $(document).on('click', ".close-cookie-content", function (e) {
        Cookies.set('no-cookie-bar', '1', {expires: 600});
        $('#cookie-consent').hide();
        e.preventDefault();
    });

    $('#form_newsletter_subscribe').on('submit', function (event) {
        event.preventDefault();
        $.ajax({
            type: "POST",
            url: $('#form_newsletter_subscribe').attr('action'),
            data: {email: $(this).find('[name="email"]').val()}
        }).success(function (data) {
            if(data.confirmed) {
                $('#footer').find('.newsletter .newsletter-submit-success-confirmed').removeClass('hide');
            } else {
                $('#footer').find('.newsletter .newsletter-submit-success').removeClass('hide');
            }

            $('#newsletter-bar').find('.form_newsletter_subscribe').removeClass('hide');
            $("#form_newsletter_subscribe").addClass('hide');
            ga('send', 'event', 'newsletter', 'subscribed_bar', '', 0);
        }).error(function (data) {
            var text = typeof data.error === 'string' ? data.error : "Une erreur est survenue, merci de vérifier votre email et d\'essayer de nouveau. Si le problème persiste vous pouvez nous contacter";
            $('#form_newsletter_subscribe').find('legend').after('<div class="alert alert-danger">'+text+'</div>');
            ga('send', 'event', 'Form', 'submit_invalid', 'newsletter_bar', 0);
        });
    });

    // On ready, declare object.keys for IE8 & start FWC JS
    if (!Object.keys) {
        Object.keys = function (obj) {
            var keys = [];
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    keys.push(i);
                }
            }
            return keys;
        };
    }

    departement = getParameterByName('departement');

    // login form submit
    $('#login_submit').on('click',function() {
        $('#login_form').submit();
    });

    // make top auction clickable (homepage)
    $(document).on("click", ".row.special.push-auction", function() {
        document.location = $(this).find('a').attr('href');
    });

    // show modal whenever it needs to be shown :)
    if (typeof $('.modal').attr('aria-hidden') !== 'undefined' && $('.modal').attr('aria-hidden') === 'false') {
        $('.modal').modal('show');
    }

    if($('.auctions').length > 0){
        $('.auctions').each(function(index){
            $(this).attr('data-tabindex',index);
        });
    }
}(jQuery));

jQuery.browser = {};
(function () {
    jQuery.browser.msie = false;
    jQuery.browser.version = 0;
    if (navigator.userAgent.match(/MSIE ([0-9]+)\./)) {
        jQuery.browser.msie = true;
        jQuery.browser.version = RegExp.$1;
    }
})();

$(document).ready(function(){
    var options = {
    width: '250px',
    height: '80px',
        themePath: '/assets/gfx/jquerybubblepopup-themes/',
        innerHtml: 'Enchérisseur novice : cette enchérisseur a gagné'
    };
    window.bindPopUpStatus = function(userIcone){
        $(userIcone).hover(
            function() {
                options['innerHtml'] = $(userIcone).attr('data-value');
                $(userIcone).CreateBubblePopup( options );
                $(userIcone).SetBubblePopupOptions( options );
                $(userIcone).ShowBubblePopup( options );
            }, function() {
                $(userIcone).HideBubblePopup( options );
                $(userIcone).RemoveBubblePopup(options);
            }
        );
    };
    $('.popup-info-bidder-status').each(function(){
        bindPopUpStatus(this);
    });

    // Helper for header FAQ button
    $('#topDIV').find('.service:first-child > a').css('line-height',(parseInt($('#topDIV').find('.service:first-child > a img').height())+parseInt($('#topDIV').find('.service:first-child > a').css('margin-top')))+'px');

    $('#headerParrainage, #form_parrainage').on('submit', function (event) {
        event.preventDefault();
        var data = {ajax:1};
        var name;
        var form = this;
        if($(form).attr('id') === 'headerParrainage'){
            $('.parrainage .loader').removeClass('hide');
        }
        else if($(form).attr('id') === 'form_parrainage'){
            $('#form_parrainage').find('.icon-mes-messages').addClass('hide');
            $('#form_parrainage').find('.loader').removeClass('hide');
        }
        $(form).find('input').each(function(){
            name = $(this).attr('name');
            data[name] = $(this).val();
        });
        $.ajax({
            type: "POST",
            url: $(this).attr('action'),
            data: data
        }).success(function (data) {
            if(data !== 'done'){
                $('#parrainageError').find('.modal-body').html(data);
                $('#parrainageError').modal('show');
            }
            else {
                ga('send', 'event', 'Form', 'parrainage', 'header_bar', 0);
                $('#parrainageSuccess').modal('show');
            }
            if($(form).attr('id') === 'headerParrainage'){
                $('.parrainage .loader').addClass('hide');
            }
            else if($(form).attr('id') === 'form_parrainage'){
                $('#form_parrainage').find('.icon-mes-messages').removeClass('hide');
                $('#form_parrainage').find('.loader').addClass('hide');
            }
            return false;
        }).error(function (data) {
            ga('send', 'event', 'Form', 'parrainage', 'header_bar', 0);
            if($(form).attr('id') === 'headerParrainage'){
                $('.parrainage .loader').addClass('hide');
            }
            else if($(form).attr('id') === 'form_parrainage'){
                $('#form_parrainage').find('.icon-mes-messages').removeClass('hide');
                $('#form_parrainage').find('.loader').addClass('hide');
            }
        });
    });

    $('[data-link-url]').on('click', function(){
        document.location = $(this).attr('data-link-url');
    });
});

// Open link in popup
$(document).on('click','a[target="popup"]', function(){
    if($(this).hasClass('twitter')){
        return false;
    }
    window.open($(this).attr('href'),$(this).attr('data-popupname'),'width=600,height=400');
    return false;
});

// Back to last page
$(document).on('click','.back', function(){
    history.back();
});

// Old browsers
Array.prototype.indexOf||(Array.prototype.indexOf=function(a,b){var c;if(null==this)throw new TypeError('"this" is null or not defined');var d=Object(this),e=d.length>>>0;if(0===e)return-1;var f=+b||0;if(Math.abs(f)===1/0&&(f=0),f>=e)return-1;for(c=Math.max(f>=0?f:e-Math.abs(f),0);c<e;){if(c in d&&d[c]===a)return c;c++}return-1});

/**
 * Typehead & searchbar
 */
var dataTypeAhead = null;
var suggestionTags = null;
var suggestionCities = null;

$(document).on('focus', '.tagsSearch', function(){
    if(dataTypeAhead === null){
        loadJs(assetCdn+'/assets/js/jquery.auto-complete.min.js',function(){
            $.ajax({
                method: 'GET',
                url: '/search/suggestions',
                success: function(response) {
                    suggestionTags = response['tags'];
                    suggestionCities = response['bigcities'];
                    var typeAheadParams = response['tags'].concat(response['shortLocs']);
                    bindTypeAhead(typeAheadParams, suggestionCities);
                }
            });
        });
    }
});

$(document).on('submit','#validationPhoneCode',function(event){
    event.preventDefault();
    var code = $('#code').val();
    var phoneNumber = $('#phone').val();
    $.ajax({
        method: "POST",
        url: '/user/profile?source=defaultJs845',
        dataType: 'json',
        data: {phone: phoneNumber, code: code},
        error: function(response){
            if(response.error){
                $('#validationPhoneCode').find('.form-group').addClass('has-error');
                $('#validationPhoneCode').find('.text-danger').text(response.responseJSON.message).removeClass('hide');
            }
            hideGeneralLoader();
        },
        success: function(response){
            if(response.error === false){
                $('#confirmBidAuto').find('form').html('<div class="alert alert-success" role="alert">Votre numéro est validé.</div>');
                setTimeout(function(){
                    $('#confirmBidAuto').modal('hide');
                    $('#formAutoBid').click();
                },1000);
            }
            hideGeneralLoader();
        }
    });
});
$('#confirmBidAuto').on('hidden.bs.modal', function (e) {
    $('#validationPhoneCode').remove();
    // Re-init form validationPhone
    $('#validationPhone').removeAttr('style');
    $('#validationPhone').find('fieldset').removeAttr('disabled');
});
/** ENDED VALIDATION FORM **/

$(document).on('click','#enteteMobile button.search', function(){
    if($('#enteteMobile').find('.rechercheMobile').hasClass('hide')){
        $('#enteteMobile').find('.rechercheMobile').removeClass('hide');
    } else {
        $('#enteteMobile').find('.rechercheMobile').addClass('hide');
    }
});

// GO TO TOP
$('#gototop').on('click', function(){
    $('body, html').animate({ scrollTop: 0 }, 'fast');
});

$(document).ready(function () {
    // GoToTop button
    if (getWidth() >= 768) {
        $(window).on('scroll', function () {
            if($(this).scrollTop() > 40){
                $('#gototop').fadeIn();
            } else {
                $('#gototop').fadeOut();
            }
        });
    }

    /** TRACKING MODAL **/
    $('.modal[data-ga-title]').on('shown.bs.modal', function (e) {
        var title=$(this).data('ga-title');
        var page=$(this).data('ga-page');
        ga('send', 'pageview', {
            title: title,
            page: page
        });
    });
});

if(typeof _errs !== 'undefined'){
    _errs.meta.cookie_ga = Cookies.get('_ga');
}


$('.modal').on('hidden.bs.modal', function(e){
    $(e.target).find('.loader').addClass('hide');
});

$(function() {
    $('input, textarea').placeholder({customClass:'my-placeholder'});
});

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

if (browserCompatible === false) {
    var $buoop = {
        required: browserRequire,
        insecure:true,
        api:2019.10,
        l: "fr",
        container: document.body,
        style: "bottom",
    };
    function $buo_f(){
     var e = document.createElement("script");
     e.src = "//browser-update.org/update.min.js";
     document.body.appendChild(e);
    };
    try {document.addEventListener("DOMContentLoaded", $buo_f,false)}
    catch(e){window.attachEvent("onload", $buo_f)}
}
