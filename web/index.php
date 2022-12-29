<?php
//header('Location: https://failover.loisirsencheres.com/');

if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/getMicrotime/') !== false) {
    include 'util/microtime.php';
    exit;
} elseif (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/avis-verifies-info/') !== false) {
    include 'util/avis-verifies-info.php';
    exit;
} elseif (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/_profiler/') !== false) {
    // Profiler web interface is elsewhere, will crash in production, composer dev only
    include 'util/profiler.php';
    exit;
} elseif (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/le-meilleur-job-de-france') === 0) {
    // Meilleur job de france migrated on dedicated domain. https://local-www.loisirsentest.com/le-meilleur-job-de-france/?yo=ya /candidat/fourniola1.html
    $path = substr($_SERVER['REQUEST_URI'], strlen('/le-meilleur-job-de-france'));
    header('Location: https://meilleurjobdefrance.fr' . $path, true, 301);
    exit;
}

require_once __DIR__ . '/../vendor/autoload.php';
$app = new Silex\Application();
$app->register(new Silex\Provider\SwiftmailerServiceProvider()); // This overwrite $app['swiftmailer.options']
$app->register(new Silex\Provider\MonologServiceProvider()); // Needs to be before config load otherwise provider overrides values

if (function_exists('newrelic_add_custom_parameter')) {
    // @todo Does not work ?
    newrelic_add_custom_parameter('request_uri', $_SERVER['REQUEST_URI']);
    newrelic_add_custom_parameter('request_referer', isset($_SERVER['HTTP_REFERER'])?$_SERVER['HTTP_REFERER']:null);
    if (isset($_SERVER['HTTP_CLIENT_URI'])) {
        newrelic_add_custom_parameter('request_clienturi', $_SERVER['HTTP_CLIENT_URI']);
    }
    if (isset($_SERVER['HTTP_CLIENT_IP'])) {
        newrelic_add_custom_parameter('request_clientip', $_SERVER['HTTP_CLIENT_IP']);
    }
    if (isset($_SERVER['HTTP_CLIENT_GACLIENTID'])) {
        newrelic_add_custom_parameter('request_gaclientid', $_SERVER['HTTP_CLIENT_GACLIENTID']);
    }
}

$app['monolog'] = $app->share($app->extend('monolog', function ($monolog) {
    /** @var \Monolog\Logger $monolog */
    if (function_exists('newrelic_set_appname')) {
        $newRelicHandler = new \Monolog\Handler\NewRelicHandler(\Monolog\Logger::ERROR);
        $monolog->pushHandler($newRelicHandler);
    }

    return $monolog;
}));

// Register Base ServiceProviders
$app->register(new Silex\Provider\SecurityServiceProvider());

use ASS\Api\Provider\AssSessionServiceProvider;
$app->register(new AssSessionServiceProvider([
    // 'readOnly' => isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] == 'XMLHttpRequest' && $_SERVER['REQUEST_METHOD'] === 'GET',
    'readOnlyMode' => AssSessionServiceProvider::MODE_LOG
]));

// Load configuration files.. Overwriting default config values of Base Service Providers
$app->register(new Igorw\Silex\ConfigServiceProvider(__DIR__ . "/../app/config/config.cache.php"));
if ($app['assets']['enable_manifest_cache']) {
    $app->register(new Igorw\Silex\ConfigServiceProvider(__DIR__ . "/../app/config/webpack.manifestjson.cache.php"));
}

use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;

$app['api.BuildNo'] = @file_get_contents($app['api.BuildNoPath']);

// Newrelic monitoring app name
if (function_exists('newrelic_set_appname')) {
    newrelic_set_appname($app['name'].'-'.$app['env'].';'.ini_get('newrelic.appname'));
}

// Don't detroy the session on authentication to allow passing flash messages (overwrite SecurityServiceProvider)
$app['security.session_strategy.user'] = $app->share(function ($app) {
    return new Symfony\Component\Security\Http\Session\SessionAuthenticationStrategy('none');
});

// Replaces $app->register(new Silex\Provider\UrlGeneratorServiceProvider());
$app['url_generator'] = $app->share(function ($app) {
    $app->flush();
    $urlGenerator = new ASS\Library\ASSUrlGenerator($app['routes'], $app['request_context']);
    $urlGenerator->setSession($app['session']);

    return $urlGenerator;
});

$redisConf = [
    'host' => $app['redis.host'],
    'timeout' => 1.0
];

if ($app['redis.password'] != '') {
    $redisConf['password'] = $app['redis.password'];
}

if (!empty($app['redissession.host'])) {
    $predisClients['session'] = [
        'parameters' => [
            'host' => $app['redissession.host'],
            'timeout' => 1.0,
            'database' => 0,
            'persistent' => 'redissession'
        ],
        'options' => [
            'prefix' => 'sessions:'
        ]
    ];
} else {
    $predisClients['session'] = [
        'parameters' => $redisConf + ['database' => 0, 'persistent' => 'websession'],
        'options' => [
            'prefix' => 'sessions:'
        ]
    ];
}



if (!empty($app['redis2.host'])) {
    $predisClients['session2'] = [
        'parameters' => [
            'host' => $app['redis2.host'],
            'timeout' => $app['redis2.timeout'],
            'database' => $app['redis2.dbsession'],
            'persistent' => 'websession2'
        ],
        'options' => [
            'prefix' => 'sessions:'
        ]
    ];
    if (!empty($app['redis2.password'])) {
        $predisClients['session2']['parameters']['password'] = $app['redis.password'];
    }
}

// Switch on/off API cache
if (!isset($_GET['gimenow']) && isset($_SERVER['REQUEST_URI']) && substr($_SERVER['REQUEST_URI'], 0, 7) !== '/admin/') {
    if (!empty($app['redisapicache.host'])) {
        $predisClients['api-cache'] = [
            'parameters' => [
                'host' => $app['redisapicache.host'],
                'timeout' => 1.0,
                'database' => 0,
                'persistent' => 'redisapicache'
            ],
            'options' => [
                'prefix' => 'api'.$app['api.BuildNo'].':'
            ]
        ];
    } else {
        $predisClients['api-cache'] = [
            'parameters' => $redisConf + ['database' => 4, 'persistent' => 'apicache'],
            'options' => [
                'prefix' => 'api'.$app['api.BuildNo'].':'
            ]
        ];
    }
}

$app->register(new Predis\Silex\ClientsServiceProvider(), ['predis.clients' => $predisClients]);


$app->register(new Silex\Provider\TranslationServiceProvider(), array(
    'locale_fallbacks' => array('fr'),
    'translation.class_path' => __DIR__.'/../app/Resources/translations/',
));
use Silex\Provider\FormServiceProvider;

$app->register(new FormServiceProvider());
use Symfony\Component\Security\Core\Authentication\Token\UsernamePasswordToken;
use Symfony\Component\Translation\Loader\YamlFileLoader;

$app['translator'] = $app->share($app->extend('translator', function ($translator, $app) {
    $translator->addLoader('yaml', new YamlFileLoader());
    $translator->addResource('yaml', __DIR__.'/../app/Resources/translations/messages.fr.yml', 'fr');
    $translator->addResource('yaml', __DIR__.'/../app/Resources/translations/messages.en.yml', 'en');

    return $translator;
}));

// Show maintenance message
if ($app['maintenance']) {
    include("maintenance.html");
    die();
}

$app->register(new Silex\Provider\TwigServiceProvider(), $app['twig.config']);

//$app->register(new Guzzle\GuzzleServiceProvider());

$app->register(new Silex\Provider\ServiceControllerServiceProvider()); // Usefull in prod too for using controoller as services

// Profiler, needs TWIG
if ($app['env'] === 'dev') {
    if (isset($_GET['noProfiler']) && $_GET['noProfiler']==1) {
        $_COOKIE['noProfiler'] = 1;
    }
    if (!isset($_COOKIE['noProfiler'])) {
        $app->register(new Silex\Provider\WebProfilerServiceProvider(), array(
            'profiler.cache_dir' => $app['cache.dir'].'/profiler',
            'profiler.mount_prefix' => '/_profiler', // this is the default
        ));
    }
}

$app->register(new \ASS\Api\Provider\ApiClientServiceProvider());
$app->register(new \ASS\Api\Provider\ApiSecurityProvider());
$app->register(new \ASS\Provider\ASSServiceProvider());
$app->register(new \ASS\Provider\TrackerServiceProvider());

// Start routing
$app['controller.content'] = $app->share(function () use ($app) {
    return new \ASS\Controller\ContentController($app);
});
$app['controller.paiement'] = $app->share(function () use ($app) {
    return new \ASS\Controller\PaiementController($app);
});
$app['controller.reservation'] = $app->share(function () use ($app) {
    return new \ASS\Controller\ReservationController($app);
});
$app['controller.feed'] = $app->share(function () use ($app) {
    return new \ASS\Controller\FeedController($app);
});
$app['controller.feedback'] = $app->share(function () use ($app) {
    return new \ASS\Controller\FeedbackController($app);
});
$app['controller.landing'] = $app->share(function () use ($app) {
    return new \ASS\Controller\LandingPageController($app);
});
$app['controller.survey'] = $app->share(function () use ($app) {
    return new \ASS\Controller\SurveyController($app);
});
$app['controller.faq'] = $app->share(function () use ($app) {
    return new \ASS\Controller\FaqController($app);
});
$app['controller.auction'] = $app->share(function () use ($app) {
    return new \ASS\Controller\AuctionController($app);
});
$app['controller.all'] = $app->share(function () use ($app) {
    return new \ASS\Controller\AllController($app);
});
$app['controller.user'] = $app->share(function () use ($app) {
    return new \ASS\Controller\UserController($app);
});
$app['controller.category'] = $app->share(function () use ($app) {
    return new \ASS\Controller\CategoryController($app);
});
$app['controller.christmas'] = $app->share(function () use ($app) {
    $categoryController = new \ASS\Controller\CategoryController();
    return new \ASS\Controller\ChristmasController($categoryController, $app);
});
$app['controller.search'] = $app->share(function () use ($app) {
    return new \ASS\Controller\SearchBarController($app);
});
$app['controller.payment'] = $app->share(function () use ($app) {
    return new \ASS\Controller\PaymentController($app);
});
$app['controller.newsletter'] = $app->share(function () use ($app) {
    return new \ASS\Controller\NewsletterController($app);
});
$app['controller.product'] = $app->share(function () use ($app) {
    return new \ASS\Controller\ProductController($app);
});
$app['controller.admin.product'] = $app->share(function () use ($app) {
    return new \ASS\Controller\Admin\ProductController($app);
});
$app['controller.admin.content'] = $app->share(function () use ($app) {
    return new \ASS\Controller\Admin\ContentController($app);
});
$app['controller.geoloc'] = $app->share(function () use ($app) {
    return new \ASS\Controller\GeolocController($app);
});
$app['controller.captcha'] = $app->share(function () use ($app) {
    return new \ASS\Controller\CaptchaController($app);
});
$app['controller.eulerian'] = $app->share(function () use ($app) {
    return new \ASS\Controller\EulerianController($app);
});
$app['controller.user.auction'] = $app->share(function () use ($app) {
    return new \ASS\Controller\UserAuctionController($app);
});

// Admin
$app->get('/admin/product/{id}', 'controller.admin.product:auction')->bind('product.auction.admin');
$app->get('/product/{id}/print', 'controller.admin.product:auctionPrint')->bind('product.auction.admin.print');
$app->match('/admin/content/{name}', 'controller.admin.content:content')->bind('product.admin.content');

// All
$app->get('/all/', 'controller.all:auctions')->bind('all.page');

// Auctions
$app->get('/', 'controller.auction:home')->bind('homepage');
$app->match('/carte-cadeau', 'controller.auction:christmasGiftCard')->bind('christmaspage.giftcard');
$app->match('/carte-cadeau-recevoir', 'controller.auction:christmasGiftCardLanding')->bind('christmas.giftcard.landing');
$app->match('/carte-cadeau-offrir-recevoir', 'controller.auction:christmasChoice')->bind('christmaspage.giftcard.choice');
$app->get('auction/activeauctions', 'controller.auction:activeAuctions')->bind('auction.activeAuctions');
$app->get('auction/auctionsnew', 'controller.auction:getAuctionsNew')->bind('auction.auctionsnew');
$app->get('auction/auctionhomerefresh', 'controller.auction:activeHomeAuctions')->bind('auction.homeAuction');
$app->get('auction/auctionsgeoloc', 'controller.auction:getAuctionsGeoloc')->bind('auction.auctionsgeoloc');
$app->get('auction/{id}-{title}', 'controller.auction:detailAuction')->bind('auction.detail.title');
$app->match('auction/{id}/vipconfirmationmobile', 'controller.auction:mobileVipConfirmation')->bind('auction.vip.confirmation.mobile');
$app->get('auction/{id}', 'controller.auction:detailAuction')->bind('auction.detail');
$app->get('auction/{id}/availability', 'controller.auction:availability')->bind('auction.availability');
$app->post('auction/{id}/bid', 'controller.auction:bid')->bind('auction.bid');
$app->post('auction/{id}/vipconfirmation', 'controller.auction:vipConfirmation')->bind('auction.vip.confirmation');
$app->match('/auction/{id}/doDeposit', 'controller.auction:doDeposit')->bind('auction.doDeposit');
$app->match('/mobile-search', 'controller.auction:mobileSearch')->bind('mobile.search');
$app->match('/deposit/{id}/transaction/{state}', 'controller.auction:depositTransaction')->bind('deposit.transaction');
$app->get('/gagnant/{title}/{auctionId16}', 'controller.auction:winnerShare')->bind('auction.winnershare');

// Category
$app->get('/category/{name}', 'controller.category:auctions')->bind('category.name');
$app->get('/carte-aux-encheres', 'controller.category:maps')->bind('auctions.map');

// City
$app->get('/ville/', 'controller.geoloc:cities')->bind('geoloc.cities');
$app->get('/ville/{city}', 'controller.geoloc:city')->bind('geoloc.city');

// Content
$app->match('/app/{page}', 'controller.content:showAppContent')->method('GET|POST')->bind('content.app');
$app->match('/experiment', 'controller.content:experiment')->method('GET')->bind('content.experiment');
$app->get('/classement-encherisseurs', 'controller.content:topweekpayers')->bind('content.topweekpayers');
$app->get('/a-propos', 'controller.content:apropos')->bind('content.apropos');
$app->get('/c/a-propos', 'controller.content:apropos')->bind('app.apropos');
$app->get('/enveloppe-cadeau', 'controller.content:enveloppecadeau')->bind('content.enveloppecadeau');
$app->match('/recrutement', 'controller.content:recrutement')->bind('content.recrutement');
$app->match('/assurances-liste-TO/', 'controller.content:listeassurances')->bind('content.listeassurances');
$app->match('/content/{page}', 'controller.content:showContent')->bind('content.page');
$app->get('/c/deepRedirect/{url}', 'controller.content:deepRedirect')->bind('app.deepRedirect');
$app->match('/c/tech', 'controller.content:techAction')->bind('app.techaction');
$app->get('/c/deeplinking', 'controller.content:deeplinking')->bind('app.deeplink');
$app->get('/c/vous-avez-aime', 'controller.content:offer')->bind('app.offer');
$app->get('/c/application-mobile-bon-plan-voyage-{sejour}-vacances-weekend', 'controller.content:appMobile')
    ->assert('sejour', 'sejour|séjour')->value('sejour', 'sejour')
    ->bind('app.mobile');
$app->get('/apple-app-site-association', 'controller.content:iosAssociation')->bind('app.iosAssociation');
$app->get('/.well-known/assetlinks.json', 'controller.content:androidAssociation')->bind('app.androidAssociation');
$app->match('/c/{page}', 'controller.content:showContent')->bind('c.page');
$app->match('/wishlist', 'controller.content:wishlist')->bind('wishlist');
$app->post('captcha/', 'controller.captcha:validate')->bind('captcha.validate');

// FAQ & helper center
$app->get('/faq', 'controller.faq:faq')->bind('faq');
$app->get('/faq/{section}', 'controller.faq:section')->bind('faq.section');
$app->get('/centre-aide', 'controller.faq:centreAide')->bind('centre-aide');
$app->get('/centre-aide/categorie/{categorieId}', 'controller.faq:centreAideCategorie')->bind('centre-aide.categorie');
$app->get('/centre-aide/section/{sectionId}', 'controller.faq:centreAideArticles')->bind('centre-aide.articles');

// Feedbacks
$app->get('/avis-loisirs-encheres', 'controller.feedback:homeFeedback')->bind('feedback.home');
$app->get('/avis-loisirs-encheres-page{numpage}', 'controller.feedback:pageFeedback')->bind('feedback.page');

// Feeds
$app->get('/feed/channable.xml', 'controller.feed:channable')->bind('feed.channable');
$app->get('/feed/sitemap.xml', 'controller.feed:sitemap')->bind('feed.sitemap');
$app->get('/feed/sitemap/{entity}.xml', 'controller.feed:sitemapEntity')->bind('feed.sitemap.entity');
$app->get('/feed/criteo.xml', 'controller.feed:criteo')->bind('feed.criteo');
$app->get('/feed/dartagnan.csv', 'controller.feed:dartagnan')->bind('feed.dartagnan');
$app->get('/feed/facebook.xml', 'controller.feed:facebook')->bind('feed.facebook');
$app->get('/feed/google.csv', 'controller.feed:google')->bind('feed.google');
$app->get('/feed/fidme.json', 'controller.feed:fidme')->bind('feed.fidme');

// Idées cadeau
$app->get('/idees-cadeau-noel/', 'controller.content:christmaspage')->bind('christmaspage');
$app->get('/idees-cadeau-noel/{name}', 'controller.category:auctions')->bind('christmas.category.name');

// Landingpage
$app->get('/evenement/{alias}', 'controller.landing:evenement')->bind('landing.event');
$app->get('/solidaire/{alias}', 'controller.landing:solidary')->bind('landing.solidary');
$app->match('/club-med', 'controller.landing:clubmed')->bind('clubmed');
$app->match('/enfoires', 'controller.landing:enfoires')->bind('enfoires');
$app->match('/enfoires/confirmation', 'controller.landing:enfoiresConfirm')->bind('enfoires.confirm');
$app->match('/{name}', 'controller.landing:landingPage')->bind('landing.page')->assert('name', 'enfoires|bienvenue$|hunkemoller$|bonjour$|sudouest$|obiz$|jeu-concours-crete-2017$|bienvenue-affilae$');

// Newsletter
$app->post('/newsletter/subscribe/', 'controller.newsletter:subscribe')->bind('newsletter.subscribe');
$app->get('/newsletter/subscribe-from-email', 'controller.newsletter:subscribeFromEmail')->bind('newsletter.subscribeFromEmail');
$app->match('/newsletter/unsubscribe/', 'controller.newsletter:unsubscribe')->bind('newsletter.unsubscribe');
$app->match('/newsletter/pre-unsubscribe/', 'controller.newsletter:preUnsubscribe')->bind('newsletter.preUnsubscribe');
$app->match('/newsletter/confirm-unsubscribe/', 'controller.newsletter:confirmUnsubscribe')->bind('newsletter.confirmUnsubscribe');
$app->match('/newsletter/indesirable/', 'controller.newsletter:indesirable')->bind('newsletter.indesirable');

// Paiement
$app->match('/paiement/{id}/gateway/{productType}', 'controller.paiement:gateway')->bind('paiement.gateway')->value('productType', 'auction');
$app->match('/paiement/{id}/redirect/{productType}', 'controller.paiement:paiementRedirect')->bind('paiement.redirect')->value('productType', 'auction');
$app->match('/paiement/{id}/other', 'controller.paiement:paiementOther')->bind('paiement.other');
$app->match('/paiement/{id}/free', 'controller.paiement:freeTransaction')->bind('paiement.free');
$app->match('/paiement/{id}/transaction/{type}/{productType}', 'controller.paiement:transaction')->bind('paiement.transaction')->value('productType', 'auction');
$app->match('/paiement/{paymentId}/location', 'controller.paiement:location')->bind('paiement.location');
$app->get('/paiement/{paymentId}/casinoschedule', 'controller.paiement:casinoSchedule')->bind('paiement.casinoSchedule');
$app->post('/paiement/{paymentId}/paymenttracking', 'controller.paiement:addPaymentTracking')->bind('paiement.tracking');
$app->match('/paiement/createCheckout', 'controller.paiement:createCheckout')->bind('paiement.createCheckout');
$app->match('/paiement/{id}/{productType}', 'controller.paiement:paiement')->bind('paiement.page')->method('GET|POST')->value('productType', 'auction');

// Payment
$app->match('/payment/{id}/info', 'controller.payment:payment')->bind('payment.page')->method('GET|POST');
$app->match('/payment/transaction', 'controller.payment:transaction')->bind('payment.transaction');
$app->match('/payment/transactiondirect', 'controller.payment:transactiondirect')->bind('payment.direct.transaction');
$app->match('/payment/{id}/direct', 'controller.payment:direct')->bind('payment.direct')->method('GET|POST');
$app->match('/payment/{paymentId}/deleteDebit', 'controller.payment:deleteDebit')->bind('payment.debit.delete');
$app->match('/payment/{paymentId}/extra/{extraId}/add', 'controller.payment:addExtraToPayment')->bind('payment.extra.add');
$app->match('/payment/{paymentId}/extra/{extraId}/delete', 'controller.payment:deleteExtraFromPayment')->bind('payment.extra.delete');
$app->match('/payment/state', 'controller.payment:state')->bind('payment.state');
$app->match('/payment/form', 'controller.payment:form')->bind('payment.form');
$app->match('/payment/giftcardpayment/{id}/payment', 'controller.payment:giftcardpayment')->bind('payment.giftcardpayment');
$app->match('/payment/giftcardpayment/{id}/overview', 'controller.payment:giftcardoverview')->bind('payment.giftcardoverview');
$app->match('/payment/transaction/paypal', 'controller.payment:paypalTransaction')->bind('payment.paypal.transaction');
$app->match('/payment/transaction/etrans', 'controller.payment:etransTransaction')->bind('payment.etrans.transaction');
$app->match('/payment/giftcardtransaction', 'controller.payment:giftcardtransaction')->bind('payment.giftcard.transaction');

// product
$app->get('/product/{id}', 'controller.product:auction')->bind('product.auction');
$app->post('/product/{id}/addComment', 'controller.product:addComment')->bind('auction.add.comment');
$app->get('/product/{id}/addComment', 'controller.product:fixGoogleAddComment')->bind('auction.fixgoogleaddcomment');
$app->get('/product/{id}/refreshCrossSelling', 'controller.product:refreshCrossSellingAuction')->bind('product.refresh.crossSelling');
$app->get('/product/', 'controller.product:listProduct')->bind('product.list');
if ($app['debug']) {
    $app->post('/product/testMetaDesc', 'controller.product:testMetaDesc')->bind('product.testMetaDesc');
}

// Search
$app->get('/search/products', 'controller.search:getProducts')->bind('searchBar.getProducts');
$app->get('/search/suggestions', 'controller.search:getSuggestions')->bind('searchBar.getSuggestions');

// Sitemap
$app->get('/sitemap', 'controller.feed:siteMapHtml')->bind('content.sitemaphtml');

// Survey
$app->get('/sondage/profils-encherisseurs/', 'controller.survey:personaHome')->bind('survey.personaHome');
$app->post('/sondage/profils-encherisseurs/', 'controller.survey:personaPost')->bind('survey.personaPost');

// Eulerian
$app->get('/eulerian/edata', 'controller.eulerian:getEdata')->bind('eulerian.edata');

// User
$app->match('/wishlist/{cryptdata}', 'controller.user:wishlist')->bind('user.wishlist')->value('cryptdata', null);
$app->match('/user/login', 'controller.user:login')->bind('user.login');
$app->match('/user/abtestvariation/{abTestName}', 'controller.user:getAbTestVariation')->bind('user.abtestvariation');
$app->match('/user/auctiontracking', 'controller.user:auctionTracking')->bind('user.auctionTracking');
$app->match('/user/login/facebook', 'controller.user:loginFacebook')->bind('user.login.facebook');
$app->match('/user/login/google', 'controller.user:loginGoogle')->bind('user.login.google');
$app->match('/user/register', 'controller.user:register')->bind('user.register')->method('GET|POST');
$app->match('/user/register/lightbox', 'controller.user:register')->bind('user.register.lightbox');
$app->match('/user/register/success', 'controller.user:registerSuccess')->bind('user.register.success');
$app->match('/user/register/{themes}', 'controller.user:register')->bind('user.register.themes')->method('GET|POST');
$app->get('/user/{userId}/confirm', 'controller.user:confirm')->bind('user.confirm');
$app->get('/user/{userId}/confirm/mobile', 'controller.user:confirmMobile')->bind('user.confirm.mobile');
$app->match('/user/profile', 'controller.user:profile')->bind('user.profile');
$app->match('/user/mot-de-passe', 'controller.user:changePassword')->bind('user.changePassword');
$app->match('/user/parrainage', 'controller.user:parrainage')->bind('user.parrainage');
$app->match('/user/mes-avantages', 'controller.user:avantages')->bind('user.avantages');
$app->match('/user/mes-favoris', 'controller.user:favorites')->bind('user.favorites');
$app->match('/user/mes-cartes-cadeaux', 'controller.user:giftcard')->bind('user.giftcard');
$app->match('/user/mes-cartes-cadeaux/{giftcardId}', 'controller.user:showGiftcard')->bind('user.giftcard.show');
$app->match('/user/mes-cartes-cadeaux/{giftcardId}/renvoyer', 'controller.user:resendGiftcard')->bind('user.giftcard.resend');
$app->match('/user/mes-cartes-cadeaux/{giftcardId}/facture', 'controller.user:invoiceGiftcard')->bind('user.giftcard.invoice');
$app->match('/user/parrainage/parrainagelink', 'controller.user:parrainagelink')->bind('user.profile.parrainagelink');
$app->match('/user/email', 'controller.user:changeEmail')->bind('user.email');
$app->match('/user/email/reuse', 'controller.user:reuseEmail')->bind('user.email.reuse');
$app->match('/user/email/{emailId}/send', 'controller.user:sendEmailConfirmation')->bind('user.email.send');
$app->match('/user/purchase', 'controller.user:purchases')->bind('user.purchase');
$app->match('/user/auctions', 'controller.user:auctions')->bind('user.auctions');
$app->put('/user/{userId}/auction/{auctionId}', 'controller.user.auction:edit')
    ->bind('user.auction.edit')
    ->assert('userId', '\d+')
    ->assert('auctionId', '\d+');
$app->match('/user/lostpassword', 'controller.user:lostPasswordApp')->bind('user.lostpasswordApp');
$app->match('/user/mot-de-passe-perdu', 'controller.user:lostPassword')->bind('user.lostpassword');
$app->match('/user/{userId}/reset', 'controller.user:resetPassword')->bind('user.resetpassword');
$app->match('/user/{userId}/resetEmail', 'controller.user:resetEmail')->bind('user.resetEmail');
$app->match('/user/{userId}/invoice/{invoiceId}', 'controller.user:invoice')->bind('user.invoice');
$app->match('/user/{userId}/voucher/{voucherId}', 'controller.user:voucher')->bind('user.voucher');
$app->match('/user/{userId}/voucher/{voucherId}/update', 'controller.user:updateVoucherGift')->bind('user.voucher.update');
$app->match('/user/{userId}/voucher/{voucherId}/reserver', 'controller.user:bookVoucher')->bind('user.voucher.book');
$app->post('/reservation/option', 'controller.reservation:bookingOption')->bind('reservation.option');
$app->match('/reservation/{resId}', 'controller.reservation:reserve')->bind('reservation.complete');
$app->match('/user/{userId}/creditcard/add/{onlyEtransForm}', 'controller.user:addCreditCard')->bind('user.creditcard.add')->value('onlyEtransForm', false);
$app->match('/user/{userId}/creditcard/transaction/{state}', 'controller.user:addCreditCardTransaction')->bind('user.creditcard.transaction');
$app->match('/user/{userId}/optin', 'controller.user:optinUser')->bind('user.optin');
$app->match('/user/setting', 'controller.user:updateSettingMail')->bind('user.setting');
$app->match('/user/mail', 'controller.user:sendConfirmMail')->bind('user.mail');
$app->match('/user/creditcard/{id}/delete', 'controller.user:deleteCreditCard')->bind('user.creditcard.delete');
$app->match('/user/appdata', 'controller.user:appData')->bind('user.appdata');
// End routing

// Put refer tracking in session
if (!empty($_GET['utm_source']) || !empty($_GET['utm_medium']) || !empty($_GET['utm_campaign'])) {
    $utm_source = (!empty($_GET['utm_source'])) ? $_GET['utm_source'] : "";
    $app['session']->set('utm_source', $utm_source);
    $utm_medium = (!empty($_GET['utm_medium'])) ? $_GET['utm_medium'] : "";
    $app['session']->set('utm_medium', $utm_medium);
    $utm_campaign = (!empty($_GET['utm_campaign'])) ? $_GET['utm_campaign'] : "";
    $app['session']->set('utm_campaign', $utm_campaign);
    $utm_content = (!empty($_GET['utm_content'])) ? $_GET['utm_content'] : "";
    $app['session']->set('utm_content', $utm_content);
}

if (!empty($_GET['le_source']) || !empty($_GET['le_medium']) || !empty($_GET['le_campaign'])) {
    $utm_source = (!empty($_GET['le_source'])) ? $_GET['le_source'] : "";
    $app['session']->set('utm_source', $utm_source);
    $utm_medium = (!empty($_GET['le_medium'])) ? $_GET['le_medium'] : "";
    $app['session']->set('utm_medium', $utm_medium);
    $utm_campaign = (!empty($_GET['le_campaign'])) ? $_GET['le_campaign'] : "";
    $app['session']->set('utm_campaign', $utm_campaign);
    $utm_content = (!empty($_GET['le_content'])) ? $_GET['le_content'] : "";
    $app['session']->set('utm_content', $utm_content);
}

// When a person come from a godfatherLink
if (!empty($_GET['gfid'])) {
    $app['session']->set('godfatherId', $_GET['gfid']);
}

if (!empty($_GET['gclid'])) {
    $app['session']->set('gclid', $_GET['gclid']);
    if (empty($_GET['le_source']) && empty($_GET['le_medium']) && empty($_GET['le_campaign'])) {
    }
}
// First visited page
if (!$app['session']->has('landingPage') && isset($_SERVER['REQUEST_URI'])) {
    $app['session']->set('landingPage', $_SERVER['REQUEST_URI']);
}

// First referer
if (!$app['session']->has('landingReferer')) {
    $app['session']->set('landingReferer', isset($_SERVER['HTTP_REFERER'])?$_SERVER['HTTP_REFERER']:'');
}

$app['service.images'] = $app->share(function ($app) {
    return new \ASS\Library\ASSImageService(isset($_SERVER['HTTP_ACCEPT']) ? (strpos($_SERVER['HTTP_ACCEPT'], 'image/webp') !== false) : false);
});
$app['googleanalytics'] = $app->share(function ($app) {
    return new \ASS\Library\ASSGA($app);
});
$app['browser'] = $app->share(function ($app) {
    return new \ASS\Library\Browser($app);
});

$app['service.eulerian_encryptor'] = $app->share(function ($app) {
    return new \ASS\Service\EulerianEncryptor($app['eulerian']['secretIv']);
});

//@Todo: @Nick hoe zou je dit officieel netjes moeten doen? :)
require_once __DIR__ . '/../src/ASS/Library/sanitizer.php';
$app['twig'] = $app->share($app->extend('twig', function ($twig, $app) {
    $twig->getExtension('core')->setEscaper('sanitize', 'sanitize_string_with_dashes');
    $twig->addExtension(new ASS\Library\ASSTwigExtension(
        $app['service.images'],
        $app['cdn-www.host'],
        $app['session'],
        $app['service.mobileApp'],
        $app['assets']['manifest_content'],
        $app['eulerian']
    ));
    return $twig;
}));

$app->before(function (Request $request) use ($app) {
    /** @var \Monolog\Logger $logger */
    $logger = $app['logger'];

    // Add Context to logger
    $logger->pushProcessor(function ($record) use ($app, $request) {
        // Only on web request
        if (php_sapi_name() == "fpm-fcgi" && isset($record['context']) && isset($_SERVER['REQUEST_METHOD']) && isset($_SERVER['REQUEST_URI'])) {
            // Don't do twice
            if (!isset($record['context']['url'])) {
                $request = $app['request'];
                $record['context']['url'] = $request->getMethod().' '.$request->getRequestUri();
                $record['context']['referer'] = $request->headers->get('referer');
                $record['context']['user-agent'] = $request->headers->get('user-agent');
                $record['context']['_ga'] = $request->cookies->get('_ga');
                $record['context']['isAjax'] = $request->isXmlHttpRequest();
                $record['context']['sess'] = substr(session_id(), 0, 6);
                $record['context']['clientIp'] = $request->getClientIp();
                $record['context']['requestTime'] = $request->server->get('REQUEST_TIME_FLOAT');
            }
        }
        return $record;
    });
}, \Silex\Application::EARLY_EVENT);


/**
 * Before executing an action
 */
$app->before(function (Request $request) use ($app) {
    if ($request->getClientIp() === '54.36.96.54') {
        return new Response('Big browser is watching you', 200);
    }

    /** @var \ASS\Service\MobileAppService $mobileAppService */
    $mobileAppService = $app['service.mobileApp'];

    $userId = null;
    // Genere https url if the user is logged in
    if ($app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $app['security']->getToken()->getUser()) {
        $userId = $app['security']->getToken()->getUser();
    }

    // User id can't be available ealier
    $app['logger']->pushProcessor(function ($record) use ($userId) {
        if (isset($record['context'])) {
            $record['context']['userId'] = $userId;
        }
        return $record;
    });

    if (function_exists('newrelic_add_custom_parameter')) {
        newrelic_add_custom_parameter('userId', $userId);
        newrelic_add_custom_parameter('isXmlHttpRequest', $request->isXmlHttpRequest());
        newrelic_add_custom_parameter('request_uri', $request->getUri());
        newrelic_add_custom_parameter('request_clientip', $request->getClientIp());
    }

    if ($request->query->has('clientId')) {
        $app['session']->set('payclid', $request->get('clientId'));
    }

    $app['translator']->setLocale('fr'); // Default, we could use the local set in the request

    if ($request->cookies->has('oauth_mobile')) {
        $mobileToken = $request->cookies->get('oauth_mobile');
        $mobileTokenClientId = $app['service.user']->getMobileTokenClientId($mobileToken);
        if (strpos($mobileTokenClientId, 'sharewire') !== false || strpos($mobileTokenClientId, 'app2') !== false) {
            $app['session']->set('mobiletoken', $mobileToken);
            $app['session']->set('mobiletokenClientId', $mobileTokenClientId);
        }

        // User not already logged in via session : log him in
        if (!($app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $app['security']->getToken()->getUser())) {
            // Get webview token from app token
            $result = $mobileAppService->getOauthTokenFromSwitch($mobileToken);

            if (!empty($result['user'])) {
                $app['logger']->info("Oauth Grant Switch to logged in user.");
                $token = new UsernamePasswordToken(
                    "" . $result['user']['id'],
                    null,
                    'user',
                    $result['user']['roles']
                );
                $token->setAttributes(array());
                $token->setAttribute('access_token', $result['access_token']);
                $token->setAttribute('refresh_token', $result['refresh_token']);
                $token->setAttribute('expires', time() + $result['expires_in']);
                $token->setAttribute('user', $result['user']);
                $app['security']->setToken($token);
                $app['session']->set('_security_'.'user', serialize($token));
                $app['session']->set('client_id', $result['client_id']);
            } else {
                $app['logger']->info("Oauth Grant Switch to anonymous user.");
                $app['session']->set('client_id', $app['api.client.oauth']['webviewClientId']);
            }
        } else {
            $app['logger']->info("User went from mobile app to webview ");
        }
    }

    // Check if for app
    $isApp = $mobileAppService->isApp($request, $app['session']);
    if ($isApp) {
        if ($app['url_generator']->isAvailableForApp($request->get('_route')) === false) {
            // this url is not accessible by app
            $deeplink = $app['url_generator']->getDeeplink($request->get('_route'));
            if ($deeplink !== false) {
                $mobileTokenClientIdMsg = isset($mobileTokenClientId)?$mobileTokenClientId:'';
                $session = $app['session'];
                $app['logger']->warning("Redirect [{$request->get('_route')}] to $deeplink , mobileClientId=$mobileTokenClientIdMsg, client_id:".$session->get('client_id'), [
                    'sessApptheme' => $session->get('apptheme'),
                    'onlyview' => $session->get('onlyview'),
                ]);
                return $app->redirect($deeplink);
            }
        }
    }

    // Put the utm_source of landing when the user signed up in session for later tracking
    if (is_numeric($userId) && !$app['session']->get('settingsFetched')) {
        $app['session']->set('settingsFetched', true); // Flag
        $app['service.user']->refreshUserSettings();
    }

    if ($app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $request->cookies->get('want_newsletter_clubmed')) {
        $user = $app['security']->getToken()->getAttribute('user');
        $app['service.user']->setSettingValue($user, 'want_newsletter_clubmed', $request->cookies->get('want_newsletter_clubmed'));
    }

    // Display popup auction to pay
    if (!$isApp && ($app['security']->isGranted('IS_AUTHENTICATED_FULLY')) && ($app['session']->getFlashBag()->has('trackLoginViaForm') || $app['session']->getFlashBag()->has('trackLoginViaFacebook'))) {
        if (!$app['session']->getFlashBag()->get('bypassAfterloggin')) {
            $app['session']->getFlashBag()->add('bypassAfterloggin', 'yes');
            $user = $app['security']->getToken()->getAttribute('user');
            if ($user['nbPaymentPending'] > 0 && !$request->cookies->has('showAuctionAvailability') && strpos($request->getPathInfo(), "eulerian") === false) {
                $app['session']->getFlashBag()->add('popupAuctionToPay', 'yes');
                return $app->redirect($app['url_generator']->generate('user.auctions'));
            }
        }
    }
    if ($app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
        $firebaseToken = $app['session']->get('firebaseToken');
        $firebaseExpTime = $app['session']->get('firebaseTokenExpiration');
        if (!$firebaseToken || $firebaseExpTime < time()) {
            $user = $app['security']->getToken()->getAttribute('user');
            $aToken = $app['service.user']->getFirebaseToken($user['id']);
            $app['session']->set('firebaseToken', $aToken['token']);
            $app['session']->set('firebaseTokenExpiration', $aToken['expire']);
        }
    }

    /* We build allTags, and push headers if required */
    if (empty($mobileTokenClientId)) {
        $mobileTokenClientId = null;
    }
    $app['service.tracker']->buildAllTags([
        \ASS\Trackers\EulerianTagBuilder::getContainerKey() => function () use ($app, $request, $mobileTokenClientId) {
            $user = false;
            if ($app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
                $user = $app['security']->getToken()->getAttribute('user');
            }

            $return = [
                'uid' => $user ? $user['num'] : '',
                // Eulerian advise to identify user without exposing email in the source.
                'email' => $user ? hash('sha256', $user['email']) : '',
                'profile' => $app['service.user']->getUserTrackingProfile(),
                'path' => $request->getPathInfo(),
            ];

            if ($mobileTokenClientId && $mobileTokenClientId === 'app2-ios') {
                $return['edev'] = 'AppNativeIOSphone';
            } elseif ($mobileTokenClientId && $mobileTokenClientId === 'app2-android') {
                $return['edev'] = 'AppNativeAndroidphone';
            }

            return $return;
        }
    ]);
}, \Silex\Application::LATE_EVENT);

// API error handled early so we don't log them if we return a response or redirect
$app->error(function (\CAC\Component\ApiClient\ApiException $e, $code) use ($app) {
    if (strpos($e->getMessage(), 'User not active') !== false) { // Webview users should not get here
        $app['session']->getFlashBag()->add('notconfirmed', $app['translator']->trans($e->getMessage()));
        if (!$app['request']->isXmlHttpRequest()) {
            return $app->redirect($app['url_generator']->generate('homepage'));
        }
        return new Response('0', 400);
    }

    if (strpos($e->getMessage(), 'user.blocked') !== false) {
        $app['session']->getFlashBag()->add('userblocked', $app['translator']->trans($e->getMessage()));
        return $app->redirect($app['url_generator']->generate('homepage'));
    }

    if (strpos($e->getMessage(), 'Le site fonctionne actuellement de façon limité') !== false) {
        return $app['twig']->render('readonly.twig');
    }

    if (strpos($e->getMessage(), '404') !== false) {
        return $app['service.redirect']->redirectOr404();
    }

    // Let non handled exception pass thrugh other handler like logger, ...
}, \Silex\Application::EARLY_EVENT);

// Catch early the robot scan and don't report to NewRelic
$app->error(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $code) use ($app) {
    // Error pages for prod & stag
    if (!$app['debug']) {
        return $app['service.redirect']->redirectOr404();
    }
}, \Silex\Application::EARLY_EVENT);

// Catch early the robot scan and don't report to NewRelic
$app->error(function (Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, $code) use ($app) {
    if ($app['request']->isXmlHttpRequest()) {
        return new JsonResponse(['error'=>'Method not allowed'], $code);
    } else {
        return new Response($app['twig']->render('404.twig'), $code);
    }
}, \Silex\Application::EARLY_EVENT);

$app->error(function (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, $code) use ($app) {
    $request =  $app['request'];
    if ($request && $request->isXmlHttpRequest()) {
        return new JsonResponse('Error', $code);
    }
    if ($request && $request->get('_route') == 'homepage') {
        // No redirect loop
        return $app['twig']->render('error.twig');
    }
    $app['session']->getFlashBag()->add('error', $e->getMessage()); // Do we want to show the message ?
    return $app->redirect($app['url_generator']->generate('homepage'));
});

// Other error handling appens after monolog and newRelic, show friendly error page for users
$app->error(function (\Exception $e, $code) use ($app) {
    // Same error handling in prod and dev, please refer to the profiler
    switch ($code) {
        case 404:
            return $app['service.redirect']->redirectOr404();
        default:
            $request =  $app['request'];
            if ($request && $request->isXmlHttpRequest()) {
                return new JsonResponse('Error', $code);
            }
            return $app['twig']->render('error.twig');
    }
});

if ($app['env'] === 'dev') {
    $whoops = new \Whoops\Run;
    $whoops->pushHandler(new \Whoops\Handler\PrettyPageHandler);
    $whoops->register();
}

// Debug endpoint (no console available)
if ($app['debug']) {
    $app->get("/routes", function () use ($app) {
        echo '<table>';

        foreach ($app['routes'] as $name => $route) {
            $methods = $route->getMethods();
            $methodsTxt = isset($methods[0])? $methods[0]:'';
            $methodsTxt .= isset($methods[1])? $methods[1]:'';
            echo '<tr><td>'.$methodsTxt.'<td>'. $route->getPath().'<td>'.$name.'<td>'.implode(',', $route->getSchemes());
        }
        echo '<table>';
        die();
    });

    /**
     * Test that the session lock is released
     * Usage : /sleep?sleep=1&loop=3&fatal=1
     */
    $app->get("/sleep", function (Request $request) use ($app) {

        $nbsec = $request->get('sleep')?:1;
        $nbloop = $request->get('loop')?:5;
        $doFatal = $request->get('fatal')?:false;

        for ($i=1; $i<=$nbloop; $i++) {
            sleep($nbsec);
        }

        if ($doFatal) {
            $null = null;
            $null->crash(); // Fatal error
        }

        return 'ok';
    });
}

$app->match('/healthcheck', function () use ($app) {
    try {
        $apiroot = $app['apiclient.default']->get('/')->getContent();
        if (!array_key_exists('api', $apiroot)) {
            throw new \Exception('API err');
        }
        return 'Ok';
    } catch (\Exception $ex) {
        throw $ex;
    }
});

$app->get('/raiseerror/', function (Request $request) {
    if ($request->get('type') == 'fatal') {
        trigger_error("Fatal error", E_USER_ERROR);
    } elseif ($request->get('type') == 'notice') {
        trigger_error("Notice error", E_USER_NOTICE);
    } elseif ($request->get('type') == 'error') {
        trigger_error("Error", E_USER_ERROR);
    } elseif ($request->get('type') == 'warning') {
        trigger_error("Warning", E_USER_WARNING);
    } elseif ($request->get('code') && 400<= $request->get('code') && $request->get('code') <=599) {
        return new Response('Wanted error '.$request->get('code'), $request->get('code'));
    } elseif ($request->get('sleep') && 0<= $request->get('sleep') && $request->get('code') <=200) {
        sleep($request->get('sleep'));
        return 'slept for '.$request->get('sleep').' seconds';
    } elseif ($request->get('type') == 'LogicException') {
        throw new \LogicException('Test LogicException');
    }
    return 'noop';
});

$app->run();
