/**
 * @param link Element
 * redirect browser on data-link attribute
 */
const fakeLink = (link) => {
    const href = link.getAttribute('data-link');
    const target = link.getAttribute('data-target');

    if (target) {
        return window.open(href, target);
    }

    return window.location.replace(href)
};

/**
 * Listen click event on footer
 */
const listenClickEventOnFooter = () => {
    const target = document.querySelector('#footer.footer-group-links');
    if (!target) return;
    target.addEventListener('click', (e) => {
        const el = e.target;

        if (el.classList.contains('fake-link')) {
            return fakeLink(el);
        }
    });
};
listenClickEventOnFooter();
