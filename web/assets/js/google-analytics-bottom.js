/* eslint-disable */

function hitCallbackWithTimeout(callback, opt_timeout) {
    var called = false;
    function fn() {
        if (!called) {
            called = true;
            callback();
        }
    }
    setTimeout(fn, opt_timeout || 250);
    return fn;
}

// Link tracking router
$(document).on('click', 'a', function(ev){
    var $this = $(this);

    if(this.hasAttribute("data-ga-label") || this.hasAttribute("data-ga-value")) {
        return trackInternalLink($this);
    }

    var url = $this.attr('href');
    var patAbsolute = /^https?:\/\//i;
    if(url && patAbsolute.test(url) && url.indexOf('://'+window.location.hostname) === -1) {
        return trackExternalLink(ev, $this, url)
    }
});

/**
 * External link tracking
 * @param event JS event
 * @param JQuery element $link
 * @param string element $url
 */
function trackExternalLink(ev, $link, url) {
    var _blank = $link.attr('target') || '';

    if(_blank === '') {
        // If same window will wait up do 250ms that the beacon is sent
        ev.preventDefault();
    }

    ga('send', 'event', 'outbound', 'click'+_blank, url, {
        'transport': 'beacon',
        'hitCallback': hitCallbackWithTimeout(function(){
            if(_blank === '') {
                document.location = url;
                return false;
            }
        })
    });
}

/**
 * Internal link tracking
 * @param JQuery element $link
 */
function trackInternalLink($link) {
    var $parent = $link.parents("[data-ga-action]");
    var action = $parent.data('ga-action');
    var label = $link.data('ga-label')||$link.text();

    if($link.data('ga-value')) {
        var value = $link.data('ga-value');
        if(value == "auto") {
            // Find the position in parent container
            value = $parent.find('a[data-ga-value]:visible').index($link) + 1;
        }
    } else {
        var value = $link.parents("[data-ga-value]").data('ga-value');
    }

    ga('send', 'event', {
        transport: 'beacon', // beacon transport allows data to be sent asynchronously to a server, even after a page was closed.
        eventCategory: 'merchandising website',
        eventAction: action,
        eventLabel: label,
        eventValue: value
    });
}
