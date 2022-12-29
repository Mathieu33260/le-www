<?php

namespace ASS\Controller;

use CAC\Component\ApiClient\ApiDataException;
use CAC\Component\ApiClient\ApiException;
use PayPal\Api\Payment;
use PayPal\Api\PaymentExecution;
use PayPal\Auth\OAuthTokenCredential;
use PayPal\Rest\ApiContext;
use Silex\Application;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Security\Acl\Exception\Exception;
use Detection\MobileDetect;
use ASS\Controller\BaseController;
use Symfony\Component\HttpFoundation\JsonResponse;

class PaymentController extends BaseController
{
    /**
     * @var Array months
     */
    private $months = array();
    private $casinoActive = false; // this method is enable
    private $useCasino = false; // to propose this method

    public function __construct($app)
    {
        parent::__construct($app);
        $this->months = array(
            '01' => 'Janvier',
            '02' => 'Février',
            '03' => 'Mars',
            '04' => 'Avril',
            '05' => 'Mai',
            '06' => 'Juin',
            '07' => 'Juillet',
            '08' => 'Août',
            '09' => 'Septembre',
            '10' => 'Octobre',
            '11' => 'Novembre',
            '12' => 'Décembre',
        );
        $this->casinoActive = $app['casino']['active'];
    }

    public function deleteDebit(Request $request, $paymentId)
    {
        $this->getLogger()->info("Function deleteDebit in PaymentController is always used by payment $paymentId");
        try {
            $r = $this->app['apiclient.finance']->deleteDebitFromPayment($paymentId, 'all')->getContent();
        } catch (ApiException $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
        }
        $this->app['session']->getFlashBag()->add('success', 'Suppresion du débit avec succès.');
        if ($request->query->has('type') && $request->get('type') == 'direct') {
            return $this->app->redirect($this->app['url_generator']->generate('payment.direct', array('id' => $paymentId,'token' => $request->get('token'))));
        } else {
            return $this->app->redirect($this->app['url_generator']->generate('payment.page', array('id' => $paymentId)));
        }
    }

    /**
     * Show the direct payment interface
     *
     * @param Request $request
     * @param $id
     * @return mixed
     */
    public function direct(Request $request, $id)
    {
        $this->getLogger()->info("Function direct in PaymentController is always used by payment $id");
        $data['token'] = $request->get('token');
        $payment = $this->app['apiclient.finance']->getDirectPayment($id, $data['token'], true)->getContent();
        $alreadyPaid = $payment['payment']['status'] == 'complete' || $payment['payment']['status'] == 'failed';
        $paypalAlreadyPaid = $payment['payment']['status'] == 'processing';
        if ($alreadyPaid || $paypalAlreadyPaid) {
            return $this->app['twig']->render(
                'payment/direct.twig',
                array(
                    "alreadyPaid" => $alreadyPaid,
                    "paypalAlreadyPaid" => $paypalAlreadyPaid
                )
            );
        }
        $transid = $payment['payment']["id"]."-".(time()-strtotime($payment['payment']["created"]));
        $promocode = $payment['promocode'];

        $cid = $request->get('clientId');

        if ($cid == '' || $cid == null) {
            $cid = 'unknown';
            $this->app['logger']->critical('Client id error or null:');
            $this->app['logger']->critical('----------------');
            $this->app['logger']->critical('Query : '.serialize($request->query->all()));
            $this->app['logger']->critical('Request URI : '.$_SERVER['REQUEST_URI']);
        }

        // update the client from where the user made the payment attempt
        $this->app['apiclient.finance']->updatePayment($id, [
            'clientId' => $cid,
        ]);
        if (!$promocode) {
            $promocode = $payment['coupon'];
        }
        // Mandatory params.
        $errorPromocode = '';
        if ($request->isMethod('POST') && $request->get('promocode')) {
            try {
                $payment = $this->app['apiclient.finance']->getDirectPayment(
                    $id,
                    $data['token'],
                    false,
                    $request->get('promocode')
                )->getContent();
                return $this->app->redirect($this->app['url_generator']->generate('payment.direct', array('id' => $id, 'token' =>$data['token'] )));
            } catch (ApiException $e) {
                if ((strpos($e->getMessage(), 'est invalide') !== false)) {
                    try {
                        $r2 = $this->app['apiclient.finance']->postCouponDirectly(
                            $payment['payment']['id'],
                            ['code' => $request->get('promocode')],
                            $data['token']
                        );
                        return $this->app->redirect($this->app['url_generator']->generate('payment.direct', array('id' => $id, 'token' =>$data['token'])));
                    } catch (ApiException $e) {
                        $errorPromocode = $e->getMessage();
                    }
                } else {
                    $errorPromocode = $e->getMessage();
                }
            }
        } elseif ($request->get('remove_promocode') !== null) {
            $payment = $this->app['apiclient.finance']->getDirectPayment(
                $id,
                $data['token'],
                false,
                null,
                $request->get('remove_promocode')
            )->getContent();
            $this->app['apiclient.finance']->deleteCouponDirectly($payment['id'], $data['token']);
            // Redirect whe the action is performed to get the fresh data
            return $this->app->redirect($this->app['url_generator']->generate(
                'payment.direct',
                array('id' => $id, 'token' => $data['token'])
            ));
        }

        $giftcards = $payment['giftcards'];
        $sumGiftcards = 0;
        if ($giftcards != null) {
            $sumGiftcards = array_sum(array_map(function ($giftcard) {
                return $giftcard['amount_left'];
            }, $giftcards));
        }
        if ($request->isMethod('POST') && $request->get('useGiftcardAmount')) {
            $useGiftcardAmount = $request->get('useGiftcardAmount');
            try {
                $r = $this->app['apiclient.finance']->addDebitToPayment($id, ['amount' => $useGiftcardAmount,'token' => $data['token']])->getContent();
                // Redirect whe the action is performed to get the fresh data
                return $this->app->redirect($this->app['url_generator']->generate('payment.direct', array('id' => $id, 'token' => $data['token'] )));
            } catch (ApiException $e) {
                $this->app['session']->getFlashBag()->add('error', $e->getMessage());
            }
        }
        $debits = $payment['debits'];
        $sumDebit = 0;
        $sumDebit = array_sum(array_map(function ($debit) {
            return $debit['amount'];
        }, $debits));

        $productExtras = $this->getApiContentUncached($payment['product']['_links']['extras']);
        $paymentExtras = $payment['extras'];

        $sumExtra = 0;
        $sumExtra = array_sum(array_map(function ($paymentExtra) {
            return $paymentExtra['price'];
        }, $paymentExtras));

        $params = [
            "payment" => $payment['payment'],
            "promocode" => $promocode,
            "transid" => $transid,
            "errorPromocode" => $errorPromocode,
            "userData" => $payment['user'],
            "auction" => $payment['auction'],
            "product" => $payment['product'],
            "alreadyPaid" => $alreadyPaid,
            "paypalAlreadyPaid" => $paypalAlreadyPaid,
            "verifToken" => $data['token'],
            "sumdebit" => $sumDebit,
            "sumGiftcards" => $sumGiftcards,
            "paymentExtras" => $paymentExtras,
            "productExtras" => $productExtras,
            "sumExtra" => $sumExtra,
            "userCards" => $payment['userCards'],
            "direct" => true,
        ];
        return $this->app['twig']->render('payment/direct.twig', $params);
    }

    /**
     * End of transaction
     * @param Request $request
     * @return mixed
     */
    public function transactiondirect(Request $request)
    {
        $this->getLogger()->info("Function transactiondirect in PaymentController is always used");
        $isPaypalPayment = false;
        if ($request->isMethod('POST')) {
            $transaction = array();
            if (is_numeric($request->get('freepaymentid'))) {
                $transaction = $this->freetransactiondirect($request);
                if (!is_array($transaction)) {
                    return $transaction;
                }
            }
            if ($request->get('state') == 'success') {
                $transaction['title'] = 'Transaction acceptée';
                $transaction['text'] = 'Votre paiement a bien été pris en compte.'.PHP_EOL.
                    'Vous allez recevoir très prochainement votre bon par mail';
            } elseif ($request->get('state') == 'cancel') {
                $transaction['title'] = 'Transaction annulée';
                $transaction['text'] = 'La transaction a été annulée.';
            } elseif ($request->get('state') == 'exception') {
                $transaction['title'] = 'Erreur de transaction';
                $transaction['text'] = 'Une erreur s\'est produite au cours de la transaction.';
            } elseif ($request->get('state') == 'decline') {
                $transaction['title'] = 'Erreur de transaction';
                $transaction['text'] = 'Une erreur s\'est produite au cours de la transaction.';
            } else {
                $transaction['title'] = 'Erreur de transaction';
                $transaction['text'] = 'Une erreur s\'est produite lors de la transaction.';
            }
        } else {
            $transaction = array();
            $state = $request->query->get('state');
            if ($state == "success") {
                $isPaypalPayment = true;
                $apiContext = new ApiContext(
                    new OAuthTokenCredential($this->app['paypal']['clientID'], $this->app['paypal']['clientSecret'])
                );
                $config = array(
                    'log.LogEnabled' => true,
                    'log.FileName' => $this->app['paypal']['logFile'],
                    'log.LogLevel' => 'FINE'
                );
                $this->app['env'] == 'dev' ? $config['mode'] = 'sandbox' : $config['mode'] = 'live';
                $apiContext->setConfig($config);
                $paymentId = $request->query->get('paymentId');
                $PayPalpayment = Payment::get($paymentId, $apiContext);
                $execution = new PaymentExecution();
                $execution->setPayerId($request->query->get('PayerID'));
                try {
                    $result = $PayPalpayment->execute($execution, $apiContext);
                    try {
                        $PayPalpayment = Payment::get($paymentId, $apiContext);
                    } catch (Exception $ex) {
                        $this->app['logger']->error('Paypal payment get error');
                        $this->app['logger']->error('PayPalPaymentId:'.$paymentId);
                    }
                } catch (Exception $ex) {
                    $this->app['logger']->error('Paypal payment execution error');
                    $this->app['logger']->error('PayPalPaymentId:'.$paymentId);
                }
                //All is good, we can generate the voucher and mark the payment as complete
                if ($PayPalpayment->getState() == "approved") {
                    $transaction['title'] = 'Transaction acceptée';
                    $transaction['text'] = 'Votre paiement a bien été pris en compte.'.PHP_EOL.
                        'Vous allez recevoir très prochainement votre bon par mail';
                    $transaction['id'] = $request->query->get('pid');
                    $transaction['amount'] = $PayPalpayment->getTransactions()[0]->getAmount();
                    $transaction['product_name'] = $PayPalpayment->getTransactions()[0]->getDescription();
                    $transaction['product_id'] = $request->query->get('pid');
                    $transaction['product_price'] = 0;
                }
            } elseif ($request->get('state') == 'cancel') {
                $transaction['title'] = 'Transaction annulée';
                $transaction['text'] = 'La transaction a été annulée.';
            }
            if ($isPaypalPayment) {
                $payment = array();
                $payment['id'] = explode('-', $request->query->get('orderId'))[0];
                $payment['payID'] = $request->query->get('orderId');
                $payment['payment_data'] = $request->query->get('orderId').'_'.$PayPalpayment->getState();
                $payment['status'] = 'processing';
                $payment['updated'] = date('Y-m-d H:i:s');
                $payment['platform'] = 'paypal';
                $this->app['apiclient.finance']->updatePayment($payment['id'], $payment);
            }
        }
        return $this->app['twig']->render(
            'payment/transactiondirect.twig',
            array(
                'transaction' => $transaction
            )
        );
    }

    private function freetransactiondirect(Request $request)
    {
        $this->getLogger()->info("Function freetransactiondirect in PaymentController is always used");
        $id = $request->get('freepaymentid');
        $payment = $this->app['apiclient.finance']->getDirectPayment(
            $id,
            $request->query->get('token'),
            true
        )->getContent();
        if ($payment['payment']['status'] == 'complete' || $payment['payment']['status'] == 'failed') {
            return $this->app->redirect($this->app['url_generator']->generate(
                'user.login',
                array('error' => 'alreadyPaid')
            ));
        }

        // Free means amount = 0
        if ($payment['payment']['amount'] > 0) {
            return $this->app->redirect($this->app['url_generator']->generate(
                'user.login',
                array('error' => 'alreadyPaid')
            ));
        }

        // Update the payment
        $payment = array();
        $payment['payment']['id'] = $id;
        $payment['payment']['status'] = "complete";
        $payment['payment']['updated'] = date('Y-m-d H:i:s');

        $this->app['apiclient.finance']->updatePayment($payment['payment']['id'], array(
            'id' => $payment['payment']['id'],
            'status' => $payment['payment']['status'],
            'updated' => $payment['payment']['updated']
        ));

        $payment = $this->app['apiclient.finance']->getDirectPayment(
            $id,
            $request->query->get('token'),
            true
        )->getContent();

        $transaction = array();
        $transaction['title'] = 'Transaction acceptée';
        $transaction['text'] = 'Votre paiement a bien été pris en compte.'.PHP_EOL.
            'Vous allez recevoir très prochainement votre bon par mail';
        $transaction['id'] = $payment['payment']['id'];
        $transaction['amount'] = $payment['payment']['amount'];
        $transaction['product_name'] = $payment['product']['name'];
        $transaction['product_id'] = $payment['product']['id'];
        $transaction['product_price'] = 0;
        return $transaction;
    }

    /**
     * Perform a User login
     *
     * @param Request $request
     */
    public function payment(Request $request, $id)
    {
        $this->getLogger()->info("Function payment in PaymentController is always used by payment $id");
        $error = '';
        if ($this->casinoActive || ($request->request->has('casino') || $request->query->has('casino'))) {
            $this->useCasino = true;
        }
        // Check if the user is authenticated
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $userId = $this->app['security']->getToken()->getUser();
            try {
                // Get user, userLocation, payment and auction information.
                $user = $this->app['apiclient.user']->getUser($userId)->getContent();
                $rApi = $this->getApiContentUncached("/payment/".$id.'?with_promocode');

                $payment = $rApi['payment'];

                if ($request->isXmlHttpRequest()) {
                    $a_response = [];
                    if ($request->query->has('nxcbEligibilite')) {
                        $a_response['status'] = $payment['status']; // Status of payment (pending, complete...) is used for show or not the winModal
                        if ($payment['status'] === 'pending') {
                            $a_response['success'] = $this->app['service.paiement']->casinoEligibilite($id, $payment['verification_token']);
                        }
                    }
                    if ($request->query->has('abtest')) {
                        $abtestName = $request->query->get('abtest');
                        $this->app['googleanalytics']->executeTest($abtestName);
                        $a_response[$abtestName] = $this->app['googleanalytics']->getVariation($abtestName);
                        $this->app['service.user']->setSettingValue($user, $abtestName, $a_response[$abtestName], 'abtest');
                    }
                    return new JsonResponse($a_response);
                }

                $promocode = $rApi['promocode'];
                if (!$promocode) {
                    $promocode = $rApi['coupon'];
                }

                // Redirect user if the payement is complete.
                if ($payment['status'] == 'complete' || $payment['status'] == 'failed') {
                    return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => 'alreadyPaid')));
                }

                // Redirect user if the payment is not for his auction.
                if (('/user/' . $userId) != $payment['_links']['user']) {
                    return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => 'unauthorised')));
                }
                $errorPromocode = '';
                if ($request->isMethod('POST') && $request->get('promocode')) {
                    try {
                        $r = $this->getApiContentUncached('/payment/'.$payment['id'].'?apply_promocode='.$request->get('promocode'));
                        // Redirect whe the action is performed to get the fresh data
                        return $this->app->redirect($this->app['url_generator']->generate('payment.page', array('id' => $id)));
                    } catch (ApiException $e) {
                        if ((strpos($e->getMessage(), 'est invalide') !== false)) {
                            // Might be a coupon
                            try {
                                $r2 = $this->app['apiclient.finance']->postCoupon($payment['id'], ['code'=>$request->get('promocode')]);
                                return $this->app->redirect($this->app['url_generator']->generate('payment.page', array('id' => $id)));
                            } catch (ApiException $e) {
                                $errorPromocode = $e->getMessage();
                            }
                        } else {
                            $errorPromocode = $e->getMessage();
                        }
                    }
                } elseif ($request->get('remove_promocode') !== null) {
                    $r = $this->getApiContentUncached('/payment/'.$payment['id'].'?remove_promocode');
                    $this->app['apiclient.finance']->deleteCoupon($payment['id']);
                    // Redirect whe the action is performed to get the fresh data
                    return $this->app->redirect($this->app['url_generator']->generate('payment.page', array('id' => $id)));
                }

                $auction = $this->app['apiclient.default']->get($payment['_links']['auction'])->getContent();
                $product = $this->app['apiclient.default']->get($auction['_links']['product'])->getContent();
                $userLocation = $this->app['apiclient.default']->get($user["_links"]["location"])->getContent();
                $transid = $payment["id"]."-".(time()-strtotime($payment["created"]));
                $basedir = realpath(__DIR__ . '/../../../');
                $countries = require_once($basedir . '/vendor/symfony/icu/Symfony/Component/Icu/Resources/data/region/en.php');

                // update the client from where the user made the payment attempt
                $this->app['apiclient.finance']->updatePayment($id, [
                    'clientId' => $this->app['api.client.oauth']['clientId'],
                ]);

                $giftcards = $this->getApiContentUncached($user['_links']['giftcards']);
                $sumGiftcards = 0;
                if ($giftcards != null) {
                    $sumGiftcards = array_sum(array_map(function ($giftcard) {
                        return $giftcard['amount_left'];
                    }, $giftcards));
                }
                if ($request->isMethod('POST') && $request->get('useGiftcardAmount')) {
                    $useGiftcardAmount = $request->get('useGiftcardAmount');
                    try {
                        $r = $this->app['apiclient.finance']->addDebitToPayment($id, ['amount' => $useGiftcardAmount])->getContent();

                        // Redirect whe the action is performed to get the fresh data
                        return $this->app->redirect($this->app['url_generator']->generate('payment.page', array('id' => $id)));
                    } catch (ApiException $e) {
                        $this->app['session']->getFlashBag()->add('error', $e->getMessage());
                    }
                }
                $debits = $this->getApiContentUncached($payment['_links']['debits']);
                $sumDebit = 0;
                $sumDebit = array_sum(array_map(function ($debit) {
                    return $debit['amount'];
                }, $debits));

                $productExtras = $this->getApiContentUncached($product['_links']['extras']);
                $paymentExtras = $this->getApiContentUncached($payment['_links']['extras']);

                $sumExtra = 0;
                $sumExtra = array_sum(array_map(function ($paymentExtra) {
                    return $paymentExtra['price'];
                }, $paymentExtras));

                $productPrice = $promocode?$payment['amount']+$promocode['amount']+$sumDebit-$sumExtra:$payment['amount']+$sumDebit-$sumExtra;
                $winingBidAmount = $productPrice-$auction['cost'];
                $userCards = $this->app['apiclient.default']->get($user['_links']['creditcards'], ['valid' => 1,'active' => 1])->getContent();
                return $this->app['twig']->render(
                    'payment/overview.twig',
                    array(
                        'userData' => $user,
                        'userLocation' => $userLocation,
                        'payment' => $payment,
                        'country' => $countries['Countries'],
                        'auction' => $auction,
                        'product' => $product,
                        'transid' => $transid,
                        'promocode' => $promocode,
                        'errorPromocode' => $errorPromocode,
                        'winingBidAmount' => $winingBidAmount,
                        'verifToken' => $payment['verification_token'],
                        'giftcards' => $giftcards,
                        'sumGiftcards' => $sumGiftcards,
                        'sumdebit' => $sumDebit,
                        'productExtras' => $productExtras,
                        'paymentExtras' => $paymentExtras,
                        'userCards' => $userCards,
                        "direct" => false,
                    )
                );
            } catch (ApiDataException $e) {
                $error = 'invalid';
            } catch (AccessDeniedHttpException $e) {
                $error = 'unauthenticated';
            }
        } else {
            $error = 'unauthenticated';
        }

        return $this->app->redirect($this->app['url_generator']->generate('user.login', array('error' => 'unauthenticated')));
    }

    public function addExtraToPayment(Request $request, $paymentId, $extraId)
    {
        $this->getLogger()->info("Function addExtraToPayment in PaymentController is always used by payment $paymentId");
        $data = [
            "extraId" => $extraId
        ];

        if ($request->query->has('verificationToken') && $request->get('verificationToken') != null) {
            $data["verificationToken"] = $request->get('verificationToken');
        }

        try {
            $result = $this->app['apiclient.finance']->addExtraToPayment($paymentId, $data)->getContent();
        } catch (ApiException $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
        }

        if (!isset($data['verificationToken'])) {
            return $this->app->redirect($this->app['url_generator']->generate('payment.page', ['id' => $paymentId]));
        } else {
            return $this->app->redirect($this->app['url_generator']->generate('payment.direct', ['id' => $paymentId, 'token' => $data['verificationToken']]));
        }
    }

    public function deleteExtraFromPayment(Request $request, $paymentId, $extraId)
    {
        $this->getLogger()->info("Function deleteExtraFromPayment in PaymentController is always used by payment $paymentId");
        $data = [];
        if ($request->query->has('verificationToken') && $request->get('verificationToken') != null) {
            $data["verificationToken"] = $request->get('verificationToken');
        }

        try {
            if (isset($data['verificationToken'])) {
                $this->app['apiclient.finance']->deleteExtraFromPayment($paymentId, $extraId, $data['verificationToken'])->getContent();
            } else {
                $this->app['apiclient.finance']->deleteExtraFromPayment($paymentId, $extraId)->getContent();
            }
        } catch (ApiException $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
        }

        if (!isset($data['verificationToken'])) {
            return $this->app->redirect($this->app['url_generator']->generate('payment.page', ['id' => $paymentId]));
        } else {
            return $this->app->redirect($this->app['url_generator']->generate('payment.direct', ['id' => $paymentId, 'token' => $data['verificationToken']]));
        }
    }

    public function paypalTransaction(Request $request)
    {
        $this->getLogger()->info("Function paypalTransaction in PaymentController is always used by payment $paymentId");
        $params = array('payment' => $request->query->get('payment'), 'verificationToken' => $request->query->get('verificationToken'));
        $params['direct'] = $request->query->get('direct');
        $link = $this->app['apiclient.finance']->createPaypalLink($params);
        return new RedirectResponse($link->getContent());
    }

    public function etransTransaction(Request $request)
    {
        $this->getLogger()->info("Function etransTransaction in PaymentController is always used");
        $payment = $this->app['apiclient.finance']->getPayment(explode('-', $request->get('paymentId'))[0])->getContent();
        $auction = $this->app['apiclient.default']->get($payment['_links']['auction'])->getContent();
        $product = $this->app['apiclient.default']->get($auction['_links']['product'])->getContent();
        $state = $request->get('state');
        $transaction = [];
        if ($state == 'success') {
            $transaction['title'] = 'Transaction acceptée';
            $transaction['text'] = 'Votre paiement a bien été pris en compte.'.PHP_EOL.
                'Vous allez recevoir très prochainement votre bon par mail';
            $transaction['id'] = $payment['id'];
            $transaction['amount'] = $payment['amount'];
            $transaction['product_name'] = $product['name'];
            $transaction['product_id'] = $product['id'];
            $transaction['product_price'] = 0;
            $payment = array();
            $payment['id'] = explode('-', $request->query->get('paymentId'))[0];
            $payment['payID'] = $request->query->get('paymentId');
            $payment['payment_data'] = $request->query->get('paymentId').'_'.$state;
            $payment['status'] = 'processing';
            $payment['updated'] = date('Y-m-d H:i:s');
            $payment['platform'] = $request->get('ctype');
            $this->app['apiclient.finance']->updatePayment($payment['id'], $payment);
        } elseif ($state == 'cancel') {
            $transaction['title'] = 'Transaction annulée';
            $transaction['text'] = 'Votre paiement a été annulé. Vous pouvez procéder à nouveau au règlement dans votre rubrique "Mes Enchères".';
        } elseif ($state == 'decline') {
            $transaction['title'] = 'Transaction refusée';
            $transaction['text'] = 'Votre paiement a été refusée par notre prestataire.';
        } else {
            $transaction['title'] = 'Erreur de transaction';
            $transaction['text'] = 'Une erreur s\'est produite lors de la transaction.';
        }
        $userId = $this->app['security']->getToken()->getUser();

        $template = $request->get('direct') ? 'payment/transactiondirect.twig' : 'paiement/confirmation_giftcard.twig';

        return $this->app['twig']->render(
            $template,
            array(
                'transaction' => $transaction,
                'paymentType' => 'online'
            )
        );
    }

    /**
     * LEGACY
     *
     * End of transaction
     * @param Request $request
     * @return mixed
     */
    public function transaction(Request $request)
    {
        $this->getLogger()->info("Function transaction in PaymentController is always used");
        $isPaypalPayment = false;
        if ($request->isMethod('POST')) {
            if (is_numeric($request->get('freepaymentid'))) {
                $transaction = $this->freetransaction($request);
                if (!is_array($transaction)) {
                    return $transaction;
                }
                $state = 'success';
            }
        } else {
            $transaction = array();
            $state = $request->query->get('state');
            if ($state == "success") {
                $isPaypalPayment = true;
                $apiContext = new ApiContext(
                    new OAuthTokenCredential($this->app['paypal']['clientID'], $this->app['paypal']['clientSecret'])
                );
                $config = array(
                    'log.LogEnabled' => true,
                    'log.FileName' => $this->app['paypal']['logFile'],
                    'log.LogLevel' => 'FINE'
                );
                $this->app['env'] == 'dev' ? $config['mode'] = 'sandbox' : $config['mode'] = 'live';
                $apiContext->setConfig($config);
                $paymentId = $request->query->get('paymentId');
                $PayPalpayment = Payment::get($paymentId, $apiContext);
                $execution = new PaymentExecution();
                $execution->setPayerId($request->query->get('PayerID'));
                try {
                    $result = $PayPalpayment->execute($execution, $apiContext);
                    try {
                        $PayPalpayment = Payment::get($paymentId, $apiContext);
                    } catch (Exception $ex) {
                        $this->app['logger']->error('Paypal payment get error');
                        $this->app['logger']->error('PayPalPaymentId:'.$paymentId);
                    }
                } catch (Exception $ex) {
                    $this->app['logger']->error('Paypal payment execution error');
                    $this->app['logger']->error('PayPalPaymentId:'.$paymentId);
                }
                //All is good, we can generate the voucher and mark the payment as complete
                if ($PayPalpayment->getState() == "approved") {
                    $transaction['title'] = 'Transaction acceptée';
                    $transaction['text'] = 'Votre paiement a bien été pris en compte.'.PHP_EOL.
                        'Vous allez recevoir très prochainement votre bon par mail';
                    $transaction['id'] = $request->query->get('pid');
                    $transaction['amount'] = $PayPalpayment->getTransactions()[0]->getAmount();
                    $transaction['product_name'] = $PayPalpayment->getTransactions()[0]->getDescription();
                    $transaction['product_id'] = $request->query->get('pid');
                    $transaction['product_price'] = 0;
                }
            } else {
                //Status failed, canceled or expired.
                $transaction['title'] = 'Transaction annulée';
                $transaction['text'] = 'Votre paiement a été annulé. Vous pouvez procéder à nouveau au règlement dans votre rubrique "Mes Enchères".';
            }
        }
        $transaction = $transaction ?: [];
        $transaction['title'] = $transaction['title'] ?: 'Erreur de transaction';
        $transaction['text'] = $transaction['text'] ?: 'Une erreur s\'est produite après la transaction.';
        if ($isPaypalPayment) {
            $payment = array();
            $payment['id'] = explode('-', $request->query->get('orderId'))[0];
            $payment['payID'] = $request->query->get('orderId');
            $payment['payment_data'] = $request->query->get('orderId').'_'.$PayPalpayment->getState();
            $payment['status'] = 'processing';
            $payment['updated'] = date('Y-m-d H:i:s');
            $payment['platform'] = 'paypal';
            $this->app['apiclient.finance']->updatePayment($payment['id'], $payment);
        }

        return $this->app['twig']->render(
            'paiement/confirmation_giftcard.twig',
            array(
                'transaction' => $transaction,
                'paymentType' => 'online'
            )
        );
    }

    /**
     * In case the promocode cover all the product price we bypass teh gateway
     */
    private function freetransaction(Request $request)
    {
        $this->getLogger()->info("Function freetransaction in PaymentController is always used");
        $id = $request->get('freepaymentid');

        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }

        $userId = $this->app['security']->getToken()->getUser();

        // Get user, userLocation, payment and auction information.
        $user = $this->app['apiclient.user']->getUser($userId)->getContent();
        $rApi = $this->getApiContentUncached("/payment/" . $id . '?with_promocode');

        $payment = $rApi['payment'];
        $promocode = $rApi['promocode'];

        // Redirect user if the payement is complete.
        if ($payment['status'] == 'complete' || $payment['status'] == 'failed') {
            return $this->app->redirect($this->app['url_generator']->generate(
                'user.login',
                array('error' => 'alreadyPaid')
            ));
        }

        // Free means amount = 0
        if ($payment['amount'] > 0) {
            return $this->app->redirect($this->app['url_generator']->generate(
                'user.login',
                array('error' => 'alreadyPaid')
            ));
        }

        // Redirect user if the payment is not for his auction.
        if (('/user/' . $userId) != $payment['_links']['user']) {
            return $this->app->redirect($this->app['url_generator']->generate(
                'user.login',
                array('error' => 'unauthorised')
            ));
        }

        // Update the payment
        $payment = array();
        $payment['id'] = $id;
        $payment['status'] = "complete";
        $payment['updated'] = date('Y-m-d H:i:s');

        $this->app['apiclient.finance']->updatePayment($payment['id'], array(
            'id' => $payment['id'],
            'status' => $payment['status'],
            'updated' => $payment['updated']
        ));

        $payment = $this->app['apiclient.default']->get("/payment/" . $payment['id'])->getContent();
        $auction = $this->app['apiclient.default']->get($payment['_links']['auction'])->getContent();
        $product = $this->app['apiclient.default']->get($auction['_links']['product'])->getContent();

        $transaction = array();
        $transaction['title'] = 'Transaction acceptée';
        $transaction['text'] = 'Votre paiement a bien été pris en compte.'.PHP_EOL.
            'Vous allez recevoir très prochainement votre bon par mail';
        $transaction['id'] = $payment['id'];
        $transaction['amount'] = $payment['amount'];
        $transaction['product_name'] = $product['name'];
        $transaction['product_id'] = $product['id'];
        $transaction['product_price'] = 0;

        return $transaction;
    }

    /**
     * Helper makes sure we don't get cached results
     * @param string $url relative URL without domain
     * @return array
     */
    private function getApiContentUncached($url)
    {
        $this->getLogger()->info("Function getApiContentUncached in PaymentController is always used url $url");
        $r = $this->app['apiclient.default']->get($url)->getContent();

        return $r;
    }

    /**
     * Generate sha-1 sign for Ogone.
     * @param $fields
     * @return string
     */
    public function generateShasign($fields)
    {
        $this->getLogger()->info("Function generateShasign in PaymentController is always used");
        //ksort($fields, SORT_NATURAL | SORT_FLAG_CASE);
        $phrase = '';
        foreach ($fields as $key => $field) {
            if (empty($field) && $field !== '0') {
                continue;
            }
            $phrase .= strtoupper($key) . '=' . $field . $this->app['ogone']['shasig'];
            ;
        }

        return ($phrase);
    }

    public function giftcardOverview(Request $request, $id)
    {
        $this->getLogger()->info("Function giftcardOverview in PaymentController is always used");
        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }
        $payment = $this->app['apiclient.finance']->getGiftcardPayment($id)->getContent();
        $userId = $this->app['security']->getToken()->getUser();

        $user = $this->app['apiclient.user']->getUser($userId)->getContent();
        $user['location'] = $this->app['apiclient.default']->get($user['_links']['location'])->getContent();
        return $this->app['twig']->render(
            'payment/giftcardoverview.twig',
            [
                'giftcardpayment' => $payment
            ]
        );
    }

    public function giftcardpayment(Request $request, $id)
    {
        $this->getLogger()->info("Function giftcardpayment in PaymentController is always used");
        // only show this page when not logged in
        if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            return $this->app->redirect($this->app['url_generator']->generate('user.login'));
        }
        //Check perm
        $payment = $this->app['apiclient.finance']->getGiftcardPayment($id)->getContent();

        $data = [
            'giftcardpaymentid' => $payment['id'],
            'method' => $request->get('method')
        ];
        // Create form

        $giftcardform = $this->app['apiclient.finance']->createGiftcardTransaction($data)->getContent();
        if ($request->query->get('method') == 'paypal') {
            return new RedirectResponse($giftcardform);
        } else {
            // is Mobile device ?
            $detect = new MobileDetect;
            $mobile = false;
            if ($detect->isMobile() || $detect->isTablet()) {
                $mobile = true;
            }
            if ($mobile) {
                $link = $this->app['etrans.mobile.url'];
            } else {
                $link =  $this->app['etrans.url'];
            }

            return $this->app['twig']->render('payment/giftcardEtransRedirect.twig', [
                    "etransLink" => $link,
                    "etransFormElements" => $giftcardform
                ]);
        }
    }

    public function giftcardtransaction(Request $request)
    {
        $this->getLogger()->info("Function giftcardtransaction in PaymentController is always used");
        if ($request->get('type') == 'paypal') {
            $transaction = array();
            $state = $request->query->get('state');
            if ($state == "success") {
                $apiContext = new ApiContext(
                    new OAuthTokenCredential($this->app['paypal']['clientID'], $this->app['paypal']['clientSecret'])
                );
                $config = array(
                    'log.LogEnabled' => true,
                    'log.FileName' => $this->app['paypal']['logFile'],
                    'log.LogLevel' => 'FINE'
                );
                $this->app['env'] == 'dev' ? $config['mode'] = 'sandbox' : $config['mode'] = 'live';
                $apiContext->setConfig($config);
                $paymentId = $request->query->get('paymentId');
                $PayPalpayment = Payment::get($paymentId, $apiContext);
                $execution = new PaymentExecution();
                $execution->setPayerId($request->query->get('PayerID'));
                try {
                    $result = $PayPalpayment->execute($execution, $apiContext);
                    try {
                        $PayPalpayment = Payment::get($paymentId, $apiContext);
                    } catch (Exception $ex) {
                        $this->app['logger']->error('Paypal payment get error');
                        $this->app['logger']->error('PayPalPaymentId:'.$paymentId);
                    }
                } catch (Exception $ex) {
                    $this->app['logger']->error('Paypal payment execution error');
                    $this->app['logger']->error('PayPalPaymentId:'.$paymentId);
                }
                if ($PayPalpayment->getState() == "approved") {
                    $transaction['title'] = 'Transaction acceptée';
                    $transaction['text'] = 'La transaction s\'est déroulée avec succès. Votre bon cadeau vous sera prochainement délivré.';
                    $transaction['id'] = $request->query->get('pid');
                    $transaction['amount'] = $PayPalpayment->getTransactions()[0]->getAmount();
                    $transaction['product_name'] = $PayPalpayment->getTransactions()[0]->getDescription();
                    $transaction['product_id'] = $request->query->get('pid');
                    $transaction['product_price'] = 0;
                    $payment = array();
                    $payment['id'] = explode('-', $request->query->get('orderId'))[0];
                    $payment['payID'] = $request->query->get('paymentId');
                    $payment['payment_data'] = http_build_query($request->query->all());
                    $payment['status'] = 'processing';
                    $payment['updated'] = date('Y-m-d H:i:s');
                    $payment['platform'] = $request->get('ctype');
                    $res = $this->app['apiclient.finance']->updateGiftcardPayment($payment['id'], $payment)->getContent();
                }
            } else {
                //Status failed, canceled or expired.
                $transaction['title'] = 'Transaction annulée';
                $transaction['text'] = 'Votre paiement a été annulé. Vous pouvez procéder à nouveau au règlement dans votre rubrique "Mes Enchères".';
            }
        } else {
            $giftcardpayment = $this->app['apiclient.finance']->getGiftcardPayment(explode('-', $request->get('paymentId'))[0])->getContent();
            $state = $request->get('state');
            $transaction = [];
            if ($state == 'success') {
                $transaction['title'] = 'Transaction acceptée';
                $transaction['text'] = 'La transaction s\'est déroulée avec succès. Votre bon cadeau vous sera prochainement délivré.';
                $transaction['id'] = $giftcardpayment['id'];
                $transaction['amount'] = $giftcardpayment['amount'];
                $payment = array();
                $payment['id'] = explode('-', $request->query->get('paymentId'))[0];
                $payment['payID'] = $request->query->get('paymentId');
                $payment['payment_data'] = http_build_query($request->query->all());
                $payment['status'] = 'processing';
                $payment['updated'] = date('Y-m-d H:i:s');
                $payment['platform'] = $request->get('ctype');
                $res = $this->app['apiclient.finance']->updateGiftcardPayment($payment['id'], $payment)->getContent();
            } elseif ($state == 'cancel') {
                $transaction['title'] = 'Transaction annulée';
                $transaction['text'] = 'Votre paiement a été annulé. Vous pouvez procéder à nouveau au règlement dans votre rubrique "Mes Enchères".';
            } elseif ($state == 'decline') {
                $transaction['title'] = 'Transaction refusée';
                $transaction['text'] = 'Votre paiement a été refusée par notre prestataire.';
            } else {
                $transaction['title'] = 'Erreur de transaction';
                $transaction['text'] = 'Une erreur s\'est produite lors de la transaction.';
            }

            if ($state !== 'success') {
                return $this->app['twig']->render(
                    'paiement/error.twig',
                    [
                        'isPayment'         => true,
                        'hideExtendedFooter'=> false,
                        'transaction'       => $transaction,
                        'productType'       => 'giftcard',
                        'id'                => explode('-', $request->query->get('paymentId'))[0]
                    ]
                );
            }
        }

        return $this->app['twig']->render(
            'paiement/confirmation_giftcard.twig',
            array(
                'transaction'           => $transaction,
                'hideExtendedFooter'    => false,
                'productType'           => 'giftcard',
                'paymentType' => 'online'
            )
        );
    }
}
