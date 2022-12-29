/* eslint-disable */

// Placeholder slider
$('.pageDetailProduit .slids .placeholder-block').css({
    width: $('.pageDetailProduit .slids').width(),
    left: '15px'
});

var getNewAuctionsInProgress = false;

/** Auction class  **/
var auction = function () {
    this.useMiniBid = false;
    this.onlyview = false;
    this.onlytabs = false;
    this.now;
    this.auctionId;
    this.productId;
    this.userProducts;
    this.departureCities;
    this.auctionData;
    this.productData;
    this.isPrivate = false;
    this.hadUserMobilePhone = false;
    this.alertUserPhone = false;
    this.winnerShare = false;
    this.isRunning;
    this.feedbackInfo;
    this.hasYoutube;
    this.tags;
    this.checkoutFlow;
};

auction.prototype.init = function() {
    var self = this;

    if(this.checkoutFlow.calendarType && !self.onlyPrint){
        $.ajax({
            method: "GET",
            url: urls['product.auction'].replace('productId',self.productId),
            data: {'data': 'availabilities', 'auction':this.auctionId, 'relativeToNbDay': true},
            dataType : 'json',
            success: function (result) {
                self.departureCities = result.departureCities;
                createCalendars(result.departureCities);
                $('#calendars').find('[data-toggle="popover"]').popover();
            }
        });
    }

    if(currentUser && !isApp){
        var iconFavorite = $('.pageDetailProduit .icon-favorite');
        if($(iconFavorite).hasClass('not-favorite') && this.userProducts.indexOf(this.productId) != -1){
            $(iconFavorite).addClass('is-favorite');
            $(iconFavorite).removeClass('not-favorite');
        }
        else if($(iconFavorite).hasClass('is-favorite') && this.userProducts.indexOf(this.productId) == -1){
            $(iconFavorite).addClass('not-favorite');
            $(iconFavorite).removeClass('is-favorite');
        }
    }

    if(!this.onlytabs){
        if(this.isPrivate){
            $('#lightbox').modal('show');
        }
        if(currentUser){
            if(this.hadUserMobilePhone){
                var str = 'Être alerté par SMS';
                if(currentUser.telephone){
                    str+=' au '+currentUser.telephone;
                }
                str+= ", 5 minutes avant la fin de l'enchère <em>(facultatif)</em>";
                $('.sendsms label').find('p').replaceWith(str);
            }
            if(this.alertUserPhone){
                var str = 'Vous recevrez un sms de rappel';
                if(currentUser.telephone){
                    str+=' au '+currentUser.telephone;
                }
                str+= "*, 5 minutes avant la fin de cette enchère.<br /><em>*pour modifier votre numéro, rendez-vous sur votre profil</em>";
                $('.checkbox.sendsms').find('label').replaceWith(str);
            }
        }

        if(!this.onlyview){
            var aAddProduct = {
                'id': 'P'+this.productData.id,
                'name': this.productData['name'].replace("'",''),
                'category': 'auction',
                'price': this.publicPrice,
                'list': 'Product detail'
            };
            if(currentUser){
                aAddProduct['dimension'] = 1;
            }else{
                aAddProduct['dimension'] = 0;
            }
            ga('ec:addProduct', aAddProduct);
            if(this.isRunning){
                ga('ec:setAction', 'detail');
                ga('send', 'event', 'ecommerce', 'product_view', 'auction', {'nonInteraction': 1});
            }
        }

        if($('#detailAuctionBids').find('li.video').length){
            // test Youtube img
            var img = new Image();
            img.src = $('#detailAuctionBids').find('li.video > img').data('large-src');
            img.onload = function(){
                if(this.width <= 120 && this.height <= 90){
                    var id = $('#detailAuctionBids').find('li.video').data('id');
                    $('#detailAuctionBids').find('li.video > img').data('large-src', '//img.youtube.com/vi/'+id+'/hqdefault.jpg');
                    $('#detailAuctionBids').find('.pgwSlideshow li.video > img').attr('src', '//img.youtube.com/vi/'+id+'/hqdefault.jpg');
                }
            };
        }

        $(document).ready(function () {
            if($('.pgwSlideshow').length == 0) {
                return; // In printOnly mode
            }
            var options = {
                transitionEffect: 'fading',
                beforeSlide: function(id){
                    var overlay = $('.pageDetailProduit .slids .overlay');
                    if(id == 1){
                        overlay.fadeIn();
                    }else{
                        overlay.hide();
                    }
                }
            };
            if ( ($('.pgwSlideshow li').length < 2) ) {
                if (screen.availWidth > 767) {
                    $('.feedback').addClass('hasNoThumbnail');
                }
            }
            if ( (screen.availWidth < 767 ) || ($('.pgwSlideshow li').length < 2)) {
                options.displayList = false;
            }
            $('.pgwSlideshow').pgwSlideshow(options);
            $('.pgwSlideshow .elt_1 img').load(function(){
                $('.pageDetailProduit .slids .placeholder-block').remove();
            });

            if(self.winnerShare){
            // Modal winner share
                $('#winnerShare').find('.auction-img').css({
                    "background-image": "url("+$('.ps-current .elt_1 img').attr('src')+")",
                    "display" : "block"
                });

                $('#winnerShare').modal('show');
            }

            if(self.hasYoutube){
                var regex = /(elt_[0-9])/g;
                var m;
                var posClass = '';
                $.each($('.ps-list .video'), function(){
                    var videoId = youtubeParser($(this).data('url'));
                    var classcss = $(this).attr('class');
                    m;
                    while ((m = regex.exec(classcss)) !== null) {
                        if (m.index === regex.lastIndex) {
                            regex.lastIndex++;
                        }
                        posClass = m[0];
                    }
                    $('.ps-current .'+posClass).addClass('video').attr('data-id',videoId);
                    $('<div class="text-center"><img src="'+assetCdn+'/assets/img/icon-play.png" width="90" heigth="90" alt="Play" /></div').appendTo('.ps-current .'+posClass);
                });
            }
        });

        var url = document.location.toString();
        if (url.match('#feedback') || url.match('#commentSection')) {
            $('.panel-collapse').collapse('hide');
            $('.nav-tabs a[href="#feedback"]').tab('show');
            $.scrollTo('#feedback');
        }
        if (url.match('#description')) {
            $('.panel-collapse').collapse('hide');
            $('.nav-tabs a[href="#description"]').tab('show');
            $.scrollTo('#description');
        }
        if (url.match('#moreinfo')) {
            $('.panel-collapse').collapse('hide');
            $('.nav-tabs a[href="#moreinfo"]').tab('show');
            $.scrollTo('#moreinfo');
        }
        if (url.match('#gettingthere')) {
            $('.panel-collapse').collapse('hide');
            $('.nav-tabs a[href="#gettingthere"]').tab('show');
            $.scrollTo('#gettingthere');
        }

        var aDataLayer = {
            'event': 'viewItem',
            'setHashedEmail': (currentUser)?currentUser.trackingUId:'',
            'ProductID': this.productData.id,
            'productName': this.productData.name,
            'productShortName': this.productData.shortName,
            'productPublicPrice': this.productData.publicPrice,
            'user_segment': (currentUser)?2:1
        };
        if(self.tags){
            aDataLayer['category'] = self.tags[0];
        }
        if (typeof dataLayer !== 'undefined') {
            dataLayer.push(aDataLayer);
        }
    }

    $('.comment-form').on('submit', function(e){
        e.preventDefault();
        self.comment();
    });
};

function showOrHidePhoneNumber(input){
  if($(input).prop("checked") == true){
    if(!auctionDetail.onlyview){
      ga('send', 'event', 'smsbutton', 'click', document.referrer, 1);
    }
    if(currentUser && (currentUser.telephone === null || currentUser.telephone === '')){
      $('#labelPhone').removeClass('hide');
    }
  }
  else if((currentUser && (currentUser.telephone === null || currentUser.telephone === '')) && !$(input).prop("checked")){
    $('#labelPhone').addClass('hide');
  }
}

auction.prototype.comment = function() {
    var self = this;
    if(currentUser){
        $("#commentSubmit").prop('disabled',true);
        $.ajax({
            method: "POST",
            url: urls['auction.add.comment'].replace('productId',self.productId),
            data: { comment: $('.comment-form textarea').val(),
                score : $('.starsComment.selected').last().attr('data-index')},
            success: function () {
                $('#commentSuccess').modal('show');
                $('#commentSection').hide();
            },
            error: function (data) {
                var resp = JSON.parse(data.responseText);
                if(resp.msg === 'Number of characters exceeded'){
                    $('#commentError').find('.commentErrorLimit').removeClass('hide');
                }else{
                    if(!$('#commentError').find('.commentErrorLimit').hasClass('hide')){
                        $('#commentError').find('.commentErrorLimit').addClass('hide');
                    }
                    $('#commentError').find('.commentErrorContent').html(resp.msg);
                }
                $('#commentError').modal('show');
                $("#commentSubmit").prop('disabled',false);
            }
        });
    }
};
/** Ended auction class **/


/** Others functions **/
userid = 0;
bidToSubmit = 0;
// Create IE + others compatible event handler
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";
// Listen to message from child window
eventer(messageEvent,function(e) {
    if (e.data == 'BidOk') {
        abtestarr.usedDeposit = 1;
        $('#confirmBidSteps').find('#engagement').prop('checked','checked');
        $('#confirmBidSteps').submit();
    }
},false);

/* Show text zone for mobile. */
$(document).on('change', '#sendsms', function() {
    showOrHidePhoneNumber(this);
});

$(document).on('click', '#login-btn-bid', function(e){
    $('.modal').modal('hide');
    $('.login-popup').show();
});

// Comment functions
$('.starsComment').mouseover(function() {
    var id = $(this).attr('data-index');
    $.each($('.starsFeedback'), function(index) {
        $.each($('.starsComment', $(this)), function(index2) {
            if( index2 < id ) {
                $(this).attr('src', assetCdn+'/assets/gfx/stars_color.png');
            }
        });
    });
});

$('.starsComment').mouseout(function() {
    //if a stars is selected do nothing
    if(!$(this).hasClass('selected')) {
        var id = $(this).attr('data-index');
        $.each($('.starsFeedback'), function(index) {
            $.each($('.starsComment', $(this)), function(index2) {
                if( index2 < id && !$(this).hasClass('selected') ) {
                    $(this).attr('src', assetCdn+'/assets/gfx/stars_nocolor.png');
                }
            });
        });
    }
});

$(document).on('click', '.starsComment', function() {
    var id = $(this).attr('data-index');
    $.each($('.starsFeedback'), function(index) {
        $.each($('.starsComment', $(this)), function(index2) {
            if( index2 < id ) {
                $(this).attr('src', assetCdn+'/assets/gfx/stars_color.png');
                $(this).addClass('selected');
            }
            if( index2 >= id ) {
                $(this).attr('src', assetCdn+'/assets/gfx/stars_nocolor.png');
                $(this).removeClass('selected');
            }
        });
    });
});
var optionsFeedback = {
    width: '250px',
    height: '80px',
    themePath: assetCdn+'/assets/gfx/jquerybubblepopup-themes/',
    innerHtml: ''
};
$('.starsComment').each(function(){
    $(this).hover(function() {
        score = $(this).attr('data-index');
        if(score == 1 ) {
            innerHtml = 'Pas du tout satisfait';
        }
        else if(score == 2) {
            innerHtml = 'Peu satisfait';
        }
        else if(score == 3) {
            innerHtml = 'Moyennement satisfait';
        }
        else if(score == 4) {
            innerHtml = 'Satisfait';
        }
        else if(score == 5) {
            innerHtml = 'Très satisfait';
        }
        optionsFeedback['innerHtml'] = innerHtml;
        $(this).CreateBubblePopup( optionsFeedback );
        $(this).SetBubblePopupOptions( optionsFeedback );
        $(this).ShowBubblePopup( optionsFeedback );
    }, function() {
        $(this).HideBubblePopup( optionsFeedback );
        $(this).RemoveBubblePopup(optionsFeedback);
    });
});
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    if(!auctionDetail.onlyview && !auctionDetail.onlytabs){
        ga('send', {'hitType': 'pageview','page': document.location.pathname+$(e.target).attr('href'),'title': auctionDetail.productData.id+' - Tab: '+$(e.target).html()});
    }
});
$(document).on('click','#feedbackLink',function() {
    $('.nav-tabs a[href="#feedback"]').tab('show');
    $('.nav-tabs a[href="#feedback"]').on('shown.bs.tab', function (e) {
        $(document).scrollTo('#feedback');
    });
});
// Ended comment functions

$(document).on('submit', '#confirmBidSteps', function(e){
    e.preventDefault();
    var useConfirmBidModal = $('#confirmBid').hasClass('in');
    var modal = $('#confirmBid');
    if($('#engagement').prop("checked") == false){
        $('#confirmBidSteps').find('.checkbox.engagement').addClass('has-error');
        $('#confirmBidSteps').find('.checkbox.engagement .help-block').removeClass('hide');
        return false;
    }else if($('#engagement').prop("checked") == true && $('#confirmBidSteps').find('.checkbox.engagement').hasClass('has-error')){
        $('#confirmBidSteps').find('.checkbox.engagement').removeClass('has-error');
        $('#confirmBidSteps').find('.checkbox.engagement .help-block').addClass('hide');
    }
    if($('#cgv').length){
        if($('#cgv').prop("checked") == false){
            $('#confirmBidSteps').find('.checkbox.cgv').addClass('has-error');
            return false;
        }
    }

    if($('#sendsms').prop('checked') === true && $('#telephone').val() == ""){
        $('.declined_phone').show();
        $('#labelPhone').addClass('error').removeClass('hide');
        return null;
    }
    else {
        $('#labelPhone').removeClass('error');
    }

    if (useConfirmBidModal) {
        $(modal).find('.form').addClass('hide');
        $(modal).find('.loader').removeClass('hide');
    }

    var bidForm = $('.bid-form.active');
    var inputAmount = bidForm.find("input[name='bid']").val();
    var newBid = inputAmount !== '' && typeof inputAmount !== 'undefined' ? parseInt(inputAmount) : parseInt($(modal).find('.newbid').html());
    var sms = $('#sendsms').prop('checked');
    var phone = $('#telephone').val();
    var url = urls['auction.bid'].replace('auctionId',auctionDetail.auctionId);
    $('#labelPhone').addClass('hide');
    abtestarr.screenHeight = screen.height;
    abtestarr.screenWidth = window.innerWidth;
    $.ajax({
        type: "POST",
        url: url,
        data: { bid: newBid, sms: sms, phone: phone, abtests: abtestarr, isAutoBid: (bidForm.attr('id')==='formAutoBid')?1:0 }
    }).success(function(data){
        delete abtestarr.cookieBid;
        dataObj = (typeof data === 'object') ? data:JSON.parse(data);
        const errorName = dataObj.error;
        const errorMessage = dataObj.message;

        if(errorName == 'unauthenticated') {
            document.location = urls['user.login']+'?error=unauthenticated';
        } else if (errorName === 'bid.accountconfirm.needed') {
            confirmEmail();
        } else if (errorName === 'bid.declined.needcreditcard') {
            $('#confirmBid').modal('hide');
            window.dispatchEvent(new Event('needConfirmCard'));
        } else if (errorName === 'bid.declined.needphonevalidation') {
            $('#confirmBid').modal('hide');
            window.dispatchEvent(new Event('needConfirmPhone'));
        } else if(errorName === 'bid.declined.selfoverbid') {
            validateBid("Vous ne pouvez pas surenchérir sur vous-même.");
        } else if (errorName === 'bid.declined.maxpurchased') {
            validateBid(errorName, errorMessage, useConfirmBidModal ? modal : null);
        } else if (errorName === 'declined') {
            $('.error-bid > .modal-dialog > .modal-content > .modal-body > div').hide();
            $('.error-bid').modal('hide');
            $('.error-bid .modal-title').html("Une erreur s'est produite");
            $('.declined').show();
            $('.error-bid').modal('show');
            $('#confirmBid').modal('hide');
        } else if(errorName === 'bid.accountconfirm.needed') {
            confirmEmail();
        } else if(dataObj.bid) {
            // Bid valide
            if(bidForm.attr('id')==='formAutoBid'){
                var auctionUuid = auctionDetail.uuid;
                var channel = auctionManager.auctions['auction_'+auctionUuid];

                channel.confirmBidSteps(dataObj.bid);
            }

            // Change text when user active phone call
            var num = $('#telephone').val();
            if($('#sendsms').prop('checked') == true && num != null) {
                $('.checkbox.sendsms').find('label').replaceWith("Vous recevrez un sms de rappel au " + num + "*, 5 minutes avant la fin de cette enchère.<br /><em>*pour modifier votre numéro, rendez-vous sur votre profil client</em>");
            }

            // Tracking
            if(!auctionDetail.onlyview) {
                ga('send', 'event', 'bidbutton', 'click', 'default', 1);

                dataLayer.push({
                    'event': 'bidbutton1',
                    'auctionId' : dataObj.bid.id,
                    'bidAmount' : dataObj.bid.amount/100,
                    'userId' : userId,
                    'ProductID' : productId,
                });
                //TAG CRITEO FOR GTM Basket
                dataLayer.push({
                    'event': 'viewBasket',
                    'user_segment': '2',
                    'deduplication': '1',
                    'bidAmount': parseInt(newBid)
                  });

                if (typeof window.eulerianTrackAction === "function") {
                    // Eulerian bid button track
                    window.eulerianTrackAction([
                        'uid', dataObj.eulerian.uid,
                        'email', dataObj.eulerian.leadNumber,
                        'profile', dataObj.eulerian.profile,
                        'prdref', productId,
                        'estimate', 1,
                        'type', 'bid',
                        'montant_enchere', (dataObj.bid.amount / 100),
                        'path', 'bid',
                        'pagegroup', 'bid',
                        'optin-mail', (dataObj.eulerian.mail ? 'OUI' : 'NON'),
                        'optin-sms', (dataObj.eulerian.sms ? 'OUI' : 'NON'),
                        'ref', dataObj.eulerian.ref
                    ]);
                }
            }
            if (useConfirmBidModal) {
                $(modal).find('.loader').addClass('hide');
                if (auctionDetail.hasReservePrice && dataObj.bid.reservePricePassed === false) {
                    $(modal).find('.reservePrice').removeClass('hide');
                }
                $(modal).modal('hide');
            }

            $('.declined .bid-next').html(parseInt(dataObj.bid.amount_formatted) + 1);

            if(auctionDetail.hasReservePrice && dataObj.bid.reservePricePassed === true){
                setTimeout(function(){ $('#confirmBid').modal('hide'); }, 3000);
            }

            if(auctionDetail.onlyview){
                if(!dataObj.bid){
                    $.each(data, function(index, value){
                        leErrs.meta[index] = value;
                    });
                    leErrs.track(new Error('Debug dataObj.bid.amount'));
                }
            }
        } else {
            validateBid(errorName, errorMessage, useConfirmBidModal ? modal : null);
        }
    });
});

$(document).on('click','.ps-current .video div',function(){
    var li = $(this).parent();
    var videoId = li.data('id');
    if (getWidth() < 768) {
        li.html('<iframe width="100%" height="100%" src="https://www.youtube.com/embed/'+videoId+'?autoplay=1" frameborder="0" allowfullscreen></iframe>');
        $('.ps-current').height(li.find('iframe').height()+'px');
    }
    else {
        li.append('<iframe width="100%" height="100%" src="https://www.youtube.com/embed/'+videoId+'?autoplay=1" frameborder="0" allowfullscreen></iframe>');
    }
});

$('#loginModal').on('show.bs.modal', function () {
    $('#registermodal').modal('hide');
});


function youtubeParser(url){
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    return (match&&match[7].length==11)? match[7] : false;
}

function showBidConfirm(modal){
    ga('send', 'event', 'modal', 'show', 'confirmBid');
    showModal(modal);
}

function showWinModal (modal) {
    showModal(modal);
    dataLayer.push({
        'event': 'winAuctionModal'
    });
}

function showModal(modal) {
    $(modal).modal('show');
}

function definedProductIsFavorite(){
    $('.auction').each(function(){
        var iconFavorite = $(this).find('.icon-favorite');
        var idProduct = $(this).attr('data-pid');
        if($(iconFavorite).hasClass('not-favorite') && auctionDetail.userProducts.indexOf(idProduct) != -1){
            $(iconFavorite).addClass('is-favorite');
            $(iconFavorite).removeClass('not-favorite');
        }
        else if($(iconFavorite).hasClass('is-favorite') && auctionDetail.userProducts.indexOf(idProduct) == -1){
            $(iconFavorite).addClass('not-favorite');
            $(iconFavorite).removeClass('is-favorite');
        }
    });
}

function errorModal(minBid) {
    $('.error-bid .modal-body > div').hide();
    $('.error-bid').modal('hide');
    $('.error-bid .modal-title').html("Une erreur s'est produite");
    $('.declined .bid-next').text(parseInt(minBid));
    $('.declined').show();
    $('.error-bid').modal('show');
}

function validateBid(errorName, errorMessage, modal){
    var msg;
    var hasError = false;
    if(errorName === 'Le montant de votre mise est trop élevé pour cette enchère.'){
        msg = errorName;
        errorName='tooHigh';
        hasError = true;
    } else if (errorName === 'Le montant de votre mise est inférieur à celui de la mise la plus elevée.') {
        msg = "Quelqu’un a surenchérit avant que vous ne validiez votre mise... C’est votre dernier mot ?<br />Rétablissez cette injustice !";
        errorName = 'tooLow';
        hasError = true;
    }
    $('.error-bid .modal-body > div').hide();
    if(errorName == 'bid.payment.pending') {
        $('.error-bid .modal-title').html('Paiement en attente');
        $('.error-bid .unpaid').show();
        hasError = true;
    } else if(errorName == 'ipblocked') {
        $('.error-bid .modal-title').html('Oups !');
        $('.error-bid .ipblocked').show();
        hasError = true;
    } else if(errorName == 'bid.declined.maxpurchased') {
        $('.error-bid .modal-title').html('Nombre limité');
        $('.error-bid .tooHighBid').show();
        $('#tooHighBidMsg').html(errorMessage);
        hasError = true;
    } else if (errorName === 'tooLow') {
        $('.error-bid .modal-title').html('Vous vous êtes fait doubler ! 😯🏁');
        $('.error-bid .tooHighBid').show();
        $('#tooHighBidMsg').html(msg);
        hasError = true;
    } else if(errorName=='tooHigh') {
        $('.error-bid .modal-title').html('Montant trop élevé.');
        $('.error-bid .tooHighBid').show();
        $('#tooHighBidMsg').html(msg);
        hasError = true;
    } else if(errorName=='readonly') {
        $('.error-bid .modal-title').html('Mode limité');
        $('#readonly').show();
        hasError = true;
    } else if(errorName=='failed_after') {
        $('.error-bid .modal-title').html('Enchère terminé');
        $('.error-bid .error_unknown').text("L'enchère est terminé.");
        $('.error-bid .error_unknown').show();
        hasError = true;
    } else if(errorName=='maxLeader') {
        $('.error-bid .modal-title').html('Limite atteinte');
        $('#maxLeader').show();
        hasError = true;
    } else if (errorName == 'overMaxDelta') {
        $('.error-bid .modal-title').html('Mise maximum');
        $('.overMaxDelta').show();
        hasError = true;
    } else if (errorName == 'underMinDelta') {
        $('.error-bid .modal-title').html('Mise minimum');
        $('.underMinDelta').show();
        hasError = true;
    } else {
        $('.error-bid .modal-title').html('Une erreur s\'est produite');
        $('.error-bid .error_unknown').text(errorName);
        $('.error-bid .error_unknown').show();
        hasError = true;
    }
    $('#currentAmountArea').find('.bid-amount').each(function(){
        $('.bid-next').text(parseInt($(this).text()) + 1);
        $('.bid-next').show();
    });
    if(!auctionDetail.onlyview){
        ga('send', 'event', 'error', 'ajax', errorName?errorName:'error_bid', 0);
    }

    if(modal){
        $(modal).modal('hide');
        $(modal).on('hidden.bs.modal', function (e) {
            if(hasError){
                $('.error-bid').modal('show');
                hasError = false;
            }
        });
    }else{
        if(hasError){
            $('.error-bid').modal('show');
            hasError = false;
        }
    }
}
