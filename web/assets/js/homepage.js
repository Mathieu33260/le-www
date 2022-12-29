/* eslint-disable */

homepage = {
    animationInProgress: false,
    clusterName: 'Paris',

    /**
     * Init Homepage Class
     */
    init: function() {
        homepage.headerScroll();


        if (window.IntersectionObserver) {
            var options = {
                rootMargin: "0px 0px -100%"
            };

            var observer = new IntersectionObserver(homepage.headerScroll, options);
            var homeSlider = window.document.querySelector('#homeslider');

            observer.observe(homeSlider)
        } else {
            document.addEventListener("scroll", homepage.headerScroll);
        }
    },

    /**
     * Function for define multiple attributes
     * @param elem
     * @param attrs
     */
    setAttributes: function(elem, attrs) {
        for(var key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                elem.setAttribute(key, attrs[key]);
            }
        }
    },

    dataLayer: function(segment, uid) {
        dataLayer.push({
            'setHashedEmail': uid,
            'event': 'viewHome',
            'user_segment': segment
        });
    },

    headerScroll: function(){
        if(getWidth() < 768){
            var st = $(window).scrollTop();
            var header = $('#header');
            var scrollMinHeight = $('#homeslider').height();

            var slideMenuDown = function() {
                window.animationInProgress = true;
                header.find('.logo img').attr('src', assetCdn+'/assets/gfx/logo.svg?v=20191230');
                header.addClass('fixed');
                header.slideDown( "slow", function() {
                    window.animationInProgress = false;
                });
            };

            var slideMenuUp = function() {
                window.animationInProgress = true;
                header.slideUp( "slow" , function() {
                    header.removeClass('fixed').removeAttr('style');
                    header.find('.logo img').attr('src', assetCdn+'/assets/gfx/logo-blanc.svg?v=20191230');
                    window.animationInProgress = false;
                });
            };

            if(st >= scrollMinHeight && !header.hasClass('fixed') && !window.animationInProgress){
                requestAnimationFrame(slideMenuDown);
            }else if(st < scrollMinHeight+header.height() && header.hasClass('fixed') && !window.animationInProgress){
                requestAnimationFrame(slideMenuUp);
            }
        }
    }
};
