/* eslint-disable */

function User(data){
    this.num = data.num;
    this.products = data.products;
    this.firebaseToken = data.firebaseToken;
    this.auctions = {};
}

function definedProductIsFavorite(){
    $('.auction').each(function(){
        var iconFavorite = $(this).find('.icon-favorite');
        var idProduct = $(this).attr('data-pid');
        if($(iconFavorite).hasClass('not-favorite') && User.products.indexOf(idProduct) != -1){
            $(iconFavorite).addClass('is-favorite');
            $(iconFavorite).removeClass('not-favorite');
        }
        else if($(iconFavorite).hasClass('is-favorite') && User.products.indexOf(idProduct) == -1){
            $(iconFavorite).addClass('not-favorite');
            $(iconFavorite).removeClass('is-favorite');
        }
    });
}

$(document).on('click','.auction .icon-favorite, .pageDetailProduit .icon-favorite', function(){
    $(this).after('<img class="loader heart" src="/assets/gfx/loader-heart.gif" alt="#" />');
    $(this).addClass('hide');
    var action = '';
    var ce = this;
    if($(this).hasClass('not-favorite')){
        action = 'like';
        $(this).removeClass('not-favorite');
    }
    else if($(this).hasClass('is-favorite')){
        action = 'unlike';
        $(this).removeClass('is-favorite');
    }

    if($(this).parents('.auction').length){
        var pid = $(this).parents('.auction').attr('data-pid');
    }
    else if($(this).parents('.slids').length){
        var pid = $(this).parents('.slids').attr('data-pid');
    }
    $.ajax({
        type: "POST",
        url: urls['user.favorites'],
        data: {pid:pid,action:action},
        datatype:'json'
    }).success(function (data) {
        User.products = JSON.parse(data.userProducts);
        ga('send', 'event', 'Auction', action, 'favorite', pid);
        if(action === 'like'){
            $(ce).addClass('is-favorite');

            /** Animate btn heart favorite in header **/
            // Ref : http://tympanus.net/Development/CreativeButtons/
            var activatedClass = 'btn-activated';
            if($('.btn-7e').hasClass(activatedClass) === false) {
                $('.btn-7e').addClass(activatedClass);
                setTimeout( function() { $('.btn-7e').removeClass(activatedClass); }, 1000 );
            }
            /** END animate **/
        }
        else if(action === 'unlike'){
            $(ce).addClass('not-favorite');
        }

        $(ce).next('.loader').remove();
        $(ce).removeClass('hide');

        // Eulerian register button track
        if (typeof window.eulerianTrackAction === "function") {
            window.eulerianTrackAction([
                'uid', data.uid,
                'email', data.leadNumber,
                'profile', data.profile,
                'prdref', pid,
                'estimate', 1,
                'type', action,
                'pagegroup', 'favoris',
                'optin-nl', (data.nl ? 'OUI' : 'NON'),
                'optin-mail', (data.nl ? 'OUI' : 'NON'),
                'path', 'Favori',
                'ref', data.ref
            ]);
        }
    }).error(function (data) {
        $(ce).remove();
        $(ce).next('.loader').remove();
    });
});

var purchases = {
    init: function() {
        this.limit_height(".auction_model_1 .name");
        this.giftcard_provider();
        this.user_nav('#usernav');
        this.custom_modal();
    },

    /**
     * Add ellipsis at paragraphe
     * @param name : class of element
     */
    limit_height : function (name) {
        $(name).truncate({
            ellipsis : '...',
            lines: 2,
            position: "end"
        });
    },

    /**
     * Provide service for gifcard
     */
    giftcard_provider : function () {
        purchases.limit_form('#giftText');
    },

    /**
     * Fix limit characters for form
     * @param elem
     */
    limit_form: function (elem) {
        $(elem).on('keyup', function () {
            formLimitsCharacters({
                input: $(this),
                limit: 80,
                substr: true
            });
        });
    },

    /**
     * Provide user nav
     * @param elem
     */
    user_nav : function (elem) {
        var nav = $(elem).find('li');
        var tablet = document.body.clientWidth >= 768 && document.body.clientWidth <= 991;

        tablet ? hauteurs_deux_colonnes(nav) : '';

        window.onresize = function() {
            if(tablet) {
                hauteurs_deux_colonnes(nav);
            } else {
                nav.css('height','auto');
            }
        };
    },

    /**
     * show custom modal for voucher
     */
    custom_modal : function () {
        var modal = '#vouchercustommodal';
        var custom = '.auction_model_1 .custom';

        $(custom).on('click', function (e) {
            e.preventDefault();
            var href = $(this).attr('href');

            showGeneralLoader();
            $.ajax({
                type: "POST",
                url: href
            }).success(function () {
                $(modal).find('form').attr('action', href);
                $(modal).modal('show');
                hideGeneralLoader();
                return false;
            }).error(function () {
                return false;
            });
        });
    },

    /**
     * Share auction on facebook
     * @param id
     * @param url
     */
    share: function(id, url) {
        var link = 'https://www.facebook.com/sharer/sharer.php?app_id=' + id + '&display=popup&u=' +  url +'&amp;src=sdkpreparse';
        var name = 'Partager';
        var specs = 'top=' + (screen.height / 2) - (350 / 2) + ',left=' + (screen.width / 2) - (520 / 2) + ',toolbar=0,status=0,width=520,height=350';

        window.open(link, name, specs);
    },
};

$('#firebaseSignOut').on('shown.bs.modal', function () {
    ga('send', 'event', 'modal', 'show', 'firebaseSignOut');
});

function confirmEmail(){
    var inThreeMinutes = new Date(new Date().getTime() + 3 * 60 * 1000); // 3 minutes
    Cookies.set('want-product', auctionDetail.productData.id, {expires: inThreeMinutes});
    $.ajax({
        type: "POST",
        url: urls['user.email']
    }).success(function (data) {
        $('#confirmEmail').find('.modal-body').html("<p>Pour aller plus loin, vous devez néanmoins confirmer votre e-mail</p>");
        $('#confirmEmail').find('.modal-body').append(data);
        $('#confirmBid').modal('hide');
        $('#confirmEmail').modal('show');
        ga('send', 'event', 'modal', 'show', 'easybid confirmEmail');
    });
}

$(document).on('submit', '#confirmEmail form', function(e){
    e.preventDefault();
    ga('send', 'event', 'modal', 'submit', 'easybid confirmEmail');
    var data = {};
    $(this).find("input").each(function() {
        data[$(this).attr('name')] = $(this).val();
    });
    $.ajax({
        type: "POST",
        url: urls['user.email'],
        data: data
    }).success(function (data) {
        $('#confirmEmail').find('.modal-body').html("<p>Pour aller plus loin, vous devez néanmoins confirmer votre e-mail</p>");
        $('#confirmEmail').find('.modal-body').append(data);
    });
});
