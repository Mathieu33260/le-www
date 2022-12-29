<?php

namespace ASS\Controller;

use ASS\Service\BreadCrumbService;
use ASS\Service\PaiementService;
use CAC\Component\ApiClient\ApiDataException;
use CAC\Component\ApiClient\ApiException;
use PayPal\Api\Payment;
use PayPal\Api\PaymentExecution;
use PayPal\Auth\OAuthTokenCredential;
use PayPal\Rest\ApiContext;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Security\Acl\Exception\Exception;
use Detection\MobileDetect;
use ASS\Trackers\EulerianTagBuilder;

class PaiementController extends AbstractReservationController
{
    use Traits\ServicesTrait;

    private $isPayment = true;
    private $token;
    private $id;
    private $rApi;
    private $error = [];
    private $isTO = false;
    private $productType = 'auction';
    private $flow;
    private $step;
    private $showStep;
    private $dataView = [];
    private $dataUpdate = [];
    private $operation;
    private $casinoActive = false; // this method is enable
    private $useCasino = false; // to propose this method
    private $changeMethod = false; // Change the payment method

    public function __construct($app = null)
    {
        parent::__construct($app);
        $this->casinoActive = $this->app['casino']['active'];
    }

    public function gateway(Request $request, $id, $productType = 'auction')
    {
        $this->request = $request;
        try {
            if (!$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
                if ($this->request->isXmlHttpRequest()) {
                    return new JsonResponse(null, 401);
                }
                return $this->app->redirect($this->app['url_generator']->generate('user.login'));
            }
            $this->productType = $productType;
            $data = [
                'id'            => $id,
                'productType'   => $this->productType
            ];

            // Get payment data
            $payment = $this->app['service.paiement']->getPayment($this->productType, $id);

            if ($this->productType === 'auction') {
                $data['token'] = $payment['verification_token'];
            } elseif ($this->productType === 'giftcard') {
                $payment['verification_token'] = '0000';
            } else {
                throw new Exception("Product type undefined");
            }

            // Check if the current user is the user of the payment
            $paymentUser = $this->app['apiclient.default']->get($payment['_links']['user'])->getContent();
            $currentUserId = $this->app['security']->getToken()->getUser();
            if ($paymentUser['id'] != $currentUserId) {
                if ($this->request->isXmlHttpRequest()) {
                    return new JsonResponse(null, 401);
                }
                if ($this->isApp($request)) {
                    return $this->app->redirect($this->app['url_generator']->generate('user.auctions')."&apptest=1", 301);
                }
                return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
            }

            if ($this->request->query->has('changemethod')) {
                $data['changemethod'] = 1;
            }

            return $this->app->redirect($this->app['url_generator']->generate('paiement.page', $data), 301);
        } catch (\Exception $ex) {
            $this->app['logger']->error('Paypal gateway error '.$ex->getMessage(), ['exception' => $ex]);
            if ($this->request->isXmlHttpRequest()) {
                return new JsonResponse(null, 400);
            }
            $this->app['session']->getFlashBag()->add('error', 'Une erreur est survenue, si elle persiste merci de nous contacter');

            switch ($this->productType) {
                case 'auction':
                    return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
                break;
                case 'giftcard':
                    return $this->app->redirect($this->app['url_generator']->generate('user.giftcard'), 301);
                break;
                default:
                    return $this->app->redirect($this->app['url_generator']->generate('user.profile'), 301);
            }
        }
    }

    /**
     * payment page by step
     * @param Request $request
     * @param int $id
     * @return RedirectResponse
     */
    public function paiement(Request $request, $id, $productType = 'auction')
    {
        $this->request = $request;
        if (strpos($id, "&") !== false) {
            //To fix this incorrect we need to replace the first "&" in the url to a "?"
            $urlEnd = preg_replace('/&/', "?", $id, 1);
            return $this->app->redirect("https://{$this->app['www.host']}/paiement/$urlEnd");
        }
        try {
            $this->productType = $this->dataView['productType'] = $productType;
            $this->token = $this->request->get('token');
            $this->id = $id;
            $this->dataView['isApp'] = $this->isApp($request);
            $this->changeMethod = $this->request->query->has('changemethod');
            if ($this->productType === 'auction' && ($this->casinoActive || ($this->request->request->has('casino') || $this->request->query->has('casino')))) {
                $this->useCasino = true;
            }
            $this->dataView['useCasino'] = $this->useCasino;

            // Form data in case of error
            $this->dataView['dataSave'] = $this->app['session']->get('paiement');
            $this->app['session']->remove('paiement');

            if ($this->request->isXmlHttpRequest()) {
                return $this->ajax();
            }

            if ($this->productType !== 'auction' && !$this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
                return $this->app->redirect($this->app['url_generator']->generate('user.login'));
            }

            if ($this->productType === 'auction' && $this->token === null) {
                return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
            }

            // Validate forms
            if ($this->request->getMethod() === 'POST') {
                // NXCB Forms
                if ($this->request->request->has('method') && $this->request->request->get('method') == 'nxcb') {
                    // payment location for NXCB
                    if ($this->useCasino) {
                        $this->getPaymentDatas();
                        $result = $this->getPaymentService()->casinoForm($this->request, $this->rApi);
                    } else {
                        $this->getPaymentDatas();
                        $result = $this->getPaymentService()->locationForm($this->request, $this->rApi['payment']);
                    }

                    if ($result === true) {
                        $this->app['session']->getFlashBag()->get('success');
                        $redirect = $this->paiementRedirect($this->request);
                        if ($redirect !== false) {
                            return $redirect;
                        }
                    } else {
                        // Error
                        if ($this->useCasino) {
                            $this->addPaymentLog('[Casino] Remplissage du formulaire de demande de paiement Casino non abouti | '.json_encode($this->request->request->all()));
                            $this->addPaymentLog('[Casino] Erreurs sur la saisie : '.json_encode($result['error']));
                            $this->dataView['casinoRefused'] = 1;
                        }
                        $locationFormTemplate = ($this->useCasino) ? $this->app['twig']->render('paiement/module/casinoForm.twig', ['casinoForm' => $result['casinoForm']]) : $this->app['twig']->render('user/modules/locationForm.twig', ['locationForm' => $result['locationForm']]);
                        $this->dataView['locationFormTemplate'] = addslashes(str_replace(array('<br>','<br />',"\n","\r",'  ' ), ['','','','',''], trim($locationFormTemplate)));
                        $this->error = $result['error'];
                    }
                }

                if ($this->request->request->has('method') && !$this->error) {
                    // Method payment is chosen
                    return $this->paiementRedirect($this->request);
                }

                if ($this->request->request->has('update')) {
                    // Define operation type, insert, update or delete
                    $this->operation = $this->request->request->get('update') == 0 ? 'insert':'update';
                }

                // Check data reservation
                if ($this->request->request->has('availabilitie')) {
                    // get current datas
                    $this->getPaymentDatas();
                    try {
                        $errors = $this->getReservationService()->processingReservation([
                            'reservation' => $this->rApi['reservation'],
                            'availability' => $this->request->request->get('availabilitie'),
                            'token' => $this->request->get('token'),
                            'customFieldsValues' => $this->getCustomFieldsFromRequest(),
                            'email' => $this->rApi['product']['travelType'] == 'minicruise' ? null : $this->request->request->get('email'),
                            'phone' => $this->rApi['product']['travelType'] == 'minicruise' ? null : $this->request->request->get('telephone'),
                            'transportType' => $this->rApi['transportType'],
                        ]);
                        if (!empty($errors)) {
                            $this->error = array_merge($this->error, $errors);
                        }
                    } catch (\Exception $ex) {
                        $this->error['reservation'] = 'Une erreur, sur la réservation, est survenue.';
                        $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                        $this->app['session']->set('paiement', $_POST);
                        $this->getLogger()->critical('Payment page error #1 :'.$ex->getMessage());
                        $this->newRelicNoticeError("Payment page error", $ex);
                        if ($ex->getMessage() === '') {
                            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
                        }
                    }
                }

                // Check data passager
                if ($this->request->request->has('passager')) {
                    // get current datas
                    $this->getPaymentDatas();
                    try {
                        $errors = $this->getReservationService()->processingPassenger(
                            $this->rApi['reservation']['id'],
                            $this->rApi['product']['nbPassenger'],
                            $this->rApi['passengers'],
                            $this->request->request->get('passager'),
                            $this->request->request->get('dateTrip'),
                            $this->request->get('token'),
                            $this->getPassengerCustomFieldsFromRequest()
                        );
                        if (!empty($errors)) {
                            $this->error = array_merge($this->error, $errors);
                        }
                    } catch (ApiDataException $ex) {
                        $this->error['passager'] = 'Une erreur, sur la réservation, est survenue.';
                        $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                        $this->app['session']->set('paiement', $_POST);
                        $this->getLogger()->critical('Payment page error #2 :'.$ex->getMessage());
                        $this->newRelicNoticeError("Payment page error (ApiDataException)", $ex);
                        if ($ex->getMessage() === '') {
                            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
                        }
                    } catch (\Exception $ex) {
                        $this->error['passager'] = 'Une erreur, sur la réservation, est survenue.';
                        $this->app['session']->set('paiement', $_POST);
                        $this->getLogger()->critical('Payment page error #3 :'.$ex->getMessage());
                        $this->newRelicNoticeError("Payment page error (Exception)", $ex);
                        if ($ex->getMessage() === '') {
                            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
                        }
                    }
                }

                // Reservation or passenger may have changed, check the whole reservation data
                if ($this->request->request->has('passager') || $this->request->request->has('availabilitie')) {
                    $this->error = $this->validateReservation($this->error, $this->rApi['reservation']['id'], $this->request->get('token'));
                }

                // Delivery flow
                if ($this->request->get('delivery')) {
                    $this->getPaymentDatas();
                    $this->getOrderService()->updateOrderAndLocation($this->request, $this->rApi['order']);
                }

                // Step 2, user confirm his address
                if ($this->request->get('confirmOrder')) {
                    $this->getPaymentDatas();
                    try {
                        $isAccepted = $this->getOrderService()->isOrderAcceptedByMerchant($this->rApi['order']['id']);
                    } catch (ApiException $e) {
                        $this->getLogger()->error($e->getMessage());
                        $isAccepted = false;
                    }
                    if ($isAccepted === false) {
                        return $this->app['twig']->render('customError.twig', ['message' => "Nous sommes navrés, nous rencontrons des problèmes d'approvisionnement. Il nous est impossible de valider votre commande pour le moment."]);
                    }

                    // If stock update status
                    $this->getOrderService()->updateStatus($this->rApi['order']['id'], 'address_confirmed');
                }

                if ($this->request->request->has('option')) {
                    $a_option = $this->request->request->get('option');
                    if (isset($a_option['send']) && $a_option['send'] !== '' && ($this->request->request->has('freeCard') || $this->request->request->has('sendSelf') || $this->request->request->has('sendDirectly'))) {
                        // Valid form option wing
                        $currentCard = null;
                        if ($this->operation === 'update') {
                            // get current card datas
                            $this->getPaymentDatas();
                            $currentCard = $this->rApi['card'];
                        }
                        $this->processingOptionWing($this->operation, $currentCard);
                    }
                }
            }

            // Get payment data
            $this->getPaymentDatas(true);

            if (isset($this->rApi['reservation']) && $this->rApi['reservation']['id']) {
                $passengers = $this->dataView['passengers'] = $this->app['apiclient.default']->get('/reservation/' . $this->rApi['reservation']['id'] . '/passenger/', ['token' => $this->token, 'fieldsStatus' => 1])->getContent();
            }

            // Redirect user if the payement is complete.
            if ($this->productType === 'auction' && $this->rApi['payment']['status'] != 'pending' && !$this->changeMethod) {
                return $this->paymentEnded();
            }

            if ($this->rApi['payment']['status'] == 'processing' || $this->rApi['payment']['status'] == 'awaiting-bank') {
                return $this->app['twig']->render("paiement/cant_access_paiement.twig", [ ]);
            }

            // Define flow paiement
            if ($this->productType === 'auction') {
                $this->flow = $this->rApi['product']['flow'];
                $this->dataView['productImgs'] = $this->rApi['images'];
                $this->dataView['product'] = $this->rApi['product'];
                $this->dataView['winningBid'] = $this->rApi['winningBid'];
                $this->dataView['discountValue'] = $this->rApi['payment']['discountedAmount'];
                $this->dataView['auction'] = $this->rApi['auction'];
                $this->dataView['coupon'] = $this->rApi['coupon'];
                $this->dataView['promocode'] = $this->rApi['promocode'];
                $this->dataView['giftcardsMax'] = $this->dataView['cartecadeau'] = 0;
                $this->dataView['confirmation'] = false;
                $this->dataView['voucher'] = $this->rApi['productVoucher'];
                $this->dataView['option']['send'] = $this->rApi['card'];
                $this->dataView['userData'] = $this->app['apiclient.default']->get($this->rApi['payment']['_links']['user'])->getContent();
                $this->dataView['userData']['location'] = $this->app['apiclient.default']->get($this->dataView['userData']['_links']['location'])->getContent();
                $this->dataView['hideOption'] = false;
                $this->dataView['token'] = $this->token;
                $this->dataView['useNxcb'] = $this->getPaymentService()->casinoEligibilite($this->id, $this->token);
                $this->dataView['scoringAgreement'] = $this->rApi['payment']['scoringAgreement'];
                $this->dataView['customFields'] = $this->rApi['reservation']['customFields'];
                $this->dataView['passengersCustomFields'] = $this->getPassengersCustomFields($this->rApi['reservation']['id']);
                $this->dataView['order'] =  $this->rApi['order'];

                // The amount of gift cards used and calcul the maximum amount of gift cards
                $this->calcAmountOfGiftCardsUsed()->calcMaxAmountOfGiftCards();
            } else {
                $this->dataView['hideOption'] = true;
                $this->dataView['coupon'] = null;
                $this->dataView['promocode'] = null;
                $this->dataView['giftcardsMax'] = $this->dataView['cartecadeau'] = null;
                $this->dataView['userData'] = $this->app['apiclient.default']->get($this->rApi['payment']['_links']['user'])->getContent();
                $this->dataView['useNxcb'] = [
                    'threeTimes' => false,
                    'fourTimes' => false,
                ];
            }

            // Common datas
            $this->dataView['isPayment'] = $this->isPayment;
            $this->dataView['productType'] = $this->productType;

            // Set the get parameter casino
            $casino = $this->request->get('casino');

            // Define DEFAULT flow step
            $this->step = $this->showStep = 1;
            if ($this->request->getMethod() === 'POST' || $casino) {
                if (empty($this->error)) {
                    if ($this->request->request->has('back')) {
                        // back to prev step
                        if ($this->request->request->get('back') == 0) {
                            return $this->app->redirect('user.auctions');
                        }
                        $this->step = $this->showStep = $this->request->request->get('back');
                    } else {
                        //if scoring casino fail, redirect to payment means page
                        if ($casino) {
                            //set by default to step 2 (payment classic)
                            $this->step = $this->showStep = 2;
                            //set casinorefused to display the error
                            $this->dataView['casinoRefused'] = 1;
                            //payment tracking
                            $trackingData = [
                                'token'     => $this->request->get('token'),
                                'action'    => 'casino_scoring_refused',
                                'labelType' => 'referer',
                                'label'     => $_SERVER['HTTP_REFERER'] ?? null
                            ];
                            $this->addPaymentTracking($trackingData, $this->id);
                            $this->addPaymentLog('[Casino] Le paiement a été refusé par Casino. Le client ne pourra plus utiliser Casino pour ce paiement.');
                        } else {
                            $this->step = $this->showStep = $this->request->request->get('step')+1;
                        }
                    }
                } else {
                    $this->step = $this->showStep = $this->request->request->get('step');
                    $this->dataView['dataSave'] = $_POST;
                }
            }
            if (isset($this->rApi['payment']['step']) && $this->step > $this->rApi['payment']['step']) {
                $this->dataUpdate['step'] = $this->step;
            }

            // View datas
            $this->dataView['checkoutFlow'] = $this->getCheckoutFlow();
            $this->dataView['payment'] = $this->rApi['payment'];
            $this->dataView['error'] = $this->error;
            $this->dataView['hideNavbar'] = true;

            if (!empty($this->dataView['checkoutFlow']) && $this->dataView['checkoutFlow']['hasReservation'] && $this->dataView['checkoutFlow']['reservationTime'] != 'postPayment') {
                $this->isTO = true;
                $this->dataView['departureCities'] = $this->app['apiclient.default']->get($this->dataView['product']['_links']['departureCities'])->getContent();
                $this->dataView['reservation'] = $this->rApi['reservation'];
                $this->dataView['transportType'] = $this->rApi['transportType'];
                if ($this->dataView['reservation'] !== null) {
                    if ($this->app['session']->get('paiement') === null || empty($this->app['session']->get('paiement'))) {
                        $this->dataView['dataSave']['passager'] = $passengers;
                        if ($this->dataView['reservation']['_links']['availability'] !== null) {
                            $query = $this->app['apiclient.default']->get($this->dataView['reservation']['_links']['availability'])->getContent();
                            $departureCity = $query['departureCity'];
                            $this->dataView['dataSave']['departureCity'] = $departureCity;
                        }
                    } else {
                        $this->dataView['dataSave'] = $this->app['session']->get('paiement');
                    }
                }

                if ($this->step == 2) {
                    $this->dataView['passengers'] = $this->app['apiclient.default']->get('/reservation/' . $this->rApi['reservation']['id'] . '/passenger/', ['token' => $this->token, 'fieldsStatus' => 1])->getContent();

                    $this->dataView['passengers'] = array_map(function ($passenger) {
                        $passenger['birthDay'] = date('d/m/Y', strtotime($passenger['birthDay']));
                        return $passenger;
                    }, $this->dataView['passengers']);

                    $this->dataView['reservation']['departureCity'] = $departureCity = $this->app['apiclient.default']->get($this->rApi['reservation']['_links']['availability'])->getContent();
                    $this->dataView['reservation']['departureCity']['location'] = $this->app['apiclient.default']->get($departureCity['_links']['departureCity'])->getContent();
                    $this->dataView['possibleInsurances'] = $this->app['service.paiement']->insurancesContent($this->rApi['possibleInsurances']);
                }

                if (isset($this->rApi['addedInsurance'][0]) && $this->rApi['addedInsurance'][0]['archived'] == 0) {
                    $this->dataView['addedInsurance'] = $this->rApi['addedInsurance'][0];
                } elseif (isset($this->rApi['addedInsurance'])) {
                    $this->dataView['addedInsurance'] = $this->rApi['addedInsurance'];
                }
            }

            if ($this->dataView['isApp']) {
                $this->dataView['hideHeader'] = true;
            }

            // Find appropriate TWIG template
            if ($this->isTO) {
                $folder = 'bookable_calendar';
            } else {
                $folder = $this->getFlowService()->getStepFolder($this->flow, $this->step);
            }
            //if the payment is TO or physical product, set the step to 3
            if ($casino && $folder !== 'classic' && !$this->request->request->has('back')) {
                $this->step = $this->showStep = 3;
            }
            $this->dataView['currentStep'] = $this->step;

            // payment tracking
            $trackingData = [
                'token'     => $this->request->get('token'),
                'labelType' => 'referer',
                'label'     => $_SERVER['HTTP_REFERER'] ?? null,
            ];

            if ($folder . '-' . $this->step == 'bookable_calendar-1') {
                $trackingData['action'] = 'booking_page';
            } elseif ($folder . '-' . $this->step == 'delivery-1') {
                $trackingData['action'] = 'shipping_page';
            } elseif ($folder . '-' . $this->step == 'bookable_calendar-2'
            || $folder . '-' . $this->step == 'classic-1'
            || $folder . '-' . $this->step == 'delivery-2') {
                $trackingData['action'] = 'summary_page';
            } else {
                $trackingData['action'] = 'payment_page';
            }
            $this->addPaymentTracking($trackingData, $this->id);

            $twigTemplate = "paiement/$folder/step{$this->step}.twig";

            $this->dataView['hideGototop'] = true;
            $this->breadcrumbData();
            $this->dataView['breadcrumb'] = isset($this->getAllBreadcrumbSteps()[$this->flow]) ? $this->getAllBreadcrumbSteps()[$this->flow] : $this->getAllBreadcrumbSteps()['classic'];
            $this->dataView['isBreadcrumbFirstStepFake'] = $this->getAllBreadcrumbSteps()['breadcrumbFakeFirstStep'];

            // Payment step
            if (($this->showStep == '2' && !$this->isTO) || ($this->showStep == '3' && $this->isTO) || ($this->showStep == '3' && $this->flow === 'delivery')) {
                // Payment methods config
                $this->dataView['userCards'] = ($this->productType === 'auction') ? $this->rApi['userCards']: $this->app['apiclient.default']->get($this->dataView['userData']['_links']['creditcards'], ['valid' => 1,'active' => 1])->getContent();
                if ($this->productType === 'auction') {
                    $this->dataView['hasWing'] = $this->rApi['card'] === null ? false:true;
                }
                $this->dataView = $this->getPaymentService()->getPaymentMethods($this->dataView, $this->productType === 'auction'?$this->rApi['product']:null, $this->rApi['payment']);
                $this->dataView['trackPageUrl'] = '/paiement/method-choice';
            }

            // Update data payment
            if ($this->productType === 'auction') {
                // Update client id if needed
                if ($this->step == 1) {
                    $currentClientId = $this->getEffectiveClientId();
                    if (!isset($this->rApi['payment']['last_client_id']) || $currentClientId != $this->rApi['payment']['last_client_id']) {
                        $this->dataUpdate['clientId'] = $currentClientId;
                    }
                    $this->dataView['trackPageUrl'] = '/paiement/step-1';
                }
                // Save the data if needed
                if ($this->dataUpdate) {
                    $this->app['apiclient.finance']->updatePay($this->id, $this->dataUpdate+['token' => $this->token]);
                }
            }
        } catch (ApiDataException $e) {
            $this->error = 'invalid';
            $this->getLogger()->critical('Payment page error :'.$e->getMessage());
            $this->app['logger']->critical('Payment page error :'.$e->getMessage());
            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
            return $this->app->redirect($this->app['url_generator']->generate('user.auctions'));
        } catch (\Exception $ex) {
            $this->getLogger()->critical('Payment page error :'.$ex->getMessage());
            $this->newRelicNoticeError("Payment page error", $ex);
            if ($this->request->isXmlHttpRequest()) {
                return new JsonResponse(null, 400);
            } else {
                $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                $this->app['session']->set('paiement', $_POST);
            }
            switch ($this->productType) {
                case 'auction':
                    return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
                break;
                case 'giftcard':
                    return $this->app->redirect($this->app['url_generator']->generate('user.giftcard'), 301);
                break;
                default:
                    return $this->app->redirect($this->app['url_generator']->generate('user.profile'), 301);
            }
        }

        // TWIG rendering outside try catch bloc
        return $this->app['twig']->render($twigTemplate, $this->dataView);
    }

    public function location(Request $request, $paymentId)
    {
        $this->request = $request;
        if ($this->casinoActive || ($this->request->request->has('casino') || $this->request->query->has('casino'))) {
            $this->useCasino = true;
        }
        $rApi = $this->app['apiclient.default']->get("pay/$paymentId?token={$this->request->get('token')}")->getContent();
        if ($this->useCasino) {
            $dataView = $this->app['service.paiement']->casinoForm($this->request, $rApi);
            return new JsonResponse(['form' => $this->app['twig']->render('paiement/module/casinoForm.twig', $dataView)]);
        } else {
            $dataView = $this->app['service.paiement']->locationForm($this->request, $rApi);
            if ($this->request->isXmlHttpRequest()) {
                return new JsonResponse(['form' => $this->app['twig']->render('user/modules/locationForm.twig', $dataView)]);
            }
            return $this->app['twig']->render('user/location.twig', $dataView);
        }
    }

    public function casinoSchedule(Request $request, $paymentId)
    {
        $this->request = $request;

        try {
            //get the Casino schedule
            $rApi = $this->app['apiclient.default']->get("ipn/casino/schedule?payment=$paymentId&method={$this->request->get('method')}&token={$this->request->get('token')}")->getContent();

            if ($rApi['success']) {
                return new JsonResponse(['casinoSchedule' => $this->app['twig']->render('paiement/module/casinoSchedule.twig', $rApi)]);
            }
        } catch (\Exception $e) {
            return json_encode(['error'=>$e->getMessage()]);
        }
    }

    /**
     * @return array
     */
    private function getCheckoutFlow()
    {
        // There might not be a product in case of a giftcard. Todo move giftcard checkout somewhere else
        $productFlow = (isset($this->rApi['product']) && isset($this->rApi['product']['flow']))? $this->rApi['product']['flow'] : '';
        $checkoutFlow = $this->getAuctionService()->getCheckoutFlow($productFlow);
        return $checkoutFlow;
    }

    private function processingOptionWing($operation, $currentCard = null)
    {
        $wingValue = $this->request->request->get('option')['send'];
        $data = [
            'payment' => $this->id,
            'token'   => $this->token,
        ];
        if ($operation === 'insert') {
            $result = $this->valideOptionWing($data);
            if (is_array($result)) {
                return $this->app['apiclient.default']->post("/card/", $result)->getContent();
            }
            return $result;
        } elseif ($operation === 'update') {
            $insert = $update = false;
            if ($wingValue == '0') {
                if ($currentCard !== null) {
                    if ($currentCard['cardType'] !== 'sendDirectly') {
                        $this->app['apiclient.default']->delete("/card/{$currentCard['id']}?token=$this->token");
                        $currentCard = null;
                        // Insert new option
                        $insert = true;
                    } else {
                        // Update data
                        $update = true;
                    }
                } else {
                    return $this->processingOptionWing('insert');
                }
            } elseif ($wingValue == '1') {
                if ($currentCard !== null) {
                    if ($currentCard['cardType'] !== 'sendSelf') {
                        $this->app['apiclient.default']->delete("/card/{$currentCard['id']}?token=$this->token");
                        $currentCard = null;
                        // Insert new option
                        $insert = true;
                    } else {
                        // Update data
                        $update = true;
                    }
                } else {
                    return $this->processingOptionWing('insert');
                }
            } elseif ($wingValue == '2') {
                if ($currentCard !== null) {
                    if ($currentCard['cardType'] !== 'freeCard') {
                        $this->app['apiclient.default']->delete("/card/{$currentCard['id']}?token=$this->token");
                        $currentCard = null;
                        // Insert new option
                        $insert = true;
                    } else {
                        // Update data
                        $update = true;
                    }
                } else {
                    return $this->processingOptionWing('insert');
                }
            } else {
                if ($currentCard !== null) {
                    $this->app['apiclient.default']->delete("/card/{$currentCard['id']}?token=$this->token");
                }
                return null;
            }

            if ($insert) {
                return $this->processingOptionWing('insert');
            } elseif ($update) {
                $result = $this->valideOptionWing($data);
                if (is_array($result)) {
                    return $this->app['apiclient.default']->put("/card/{$currentCard['id']}", $result)->getContent();
                }
                return $result;
            }
        } elseif ($operation === 'delete' || $wingValue == '') {
            if ($currentCard !== null) {
                $this->app['apiclient.default']->delete("/card/{$currentCard['id']}?token=$this->token");
                return [];
            }
            return null;
        }
        return $this;
    }

    /**
     * get options values
     * @param array $post_options
     * @param array $data
     * @return array
     */
    private function valideOptionWing(array $data = [])
    {
        $wingValue = $this->request->request->get('option')['send'];
        if ($wingValue == 0) {
            $post_data = $this->request->request->get('sendDirectly');
            if (!isset($post_data['destCivilite'])) {
                $this->error['destCivilite'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destCity'] === '') {
                $this->error['destCity'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destStreet'] === '') {
                $this->error['destStreet'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destHousenumber'] === '') {
                $this->error['destHousenumber'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destZipcode'] === '') {
                $this->error['destZipcode'] = 'Ce champs est obligatoire';
            }
            if ($post_data['expZipcode'] === '') {
                $this->error['expZipcode'] = 'Ce champs est obligatoire';
            }
            if ($post_data['expStreet'] === '') {
                $this->error['expStreet'] = 'Ce champs est obligatoire';
            }
            if ($post_data['expHousenumber'] === '') {
                $this->error['expHousenumber'] = 'Ce champs est obligatoire';
            }
            if ($post_data['expLastName'] === '') {
                $this->error['expLastName'] = 'Ce champs est obligatoire';
            }
            if ($post_data['expFirstName'] === '') {
                $this->error['expFirstName'] = 'Ce champs est obligatoire';
            }
            if (!isset($post_data['expCivilite'])) {
                $this->error['expCivilite'] = 'Ce champs est obligatoire';
            }
            if (!$this->error) {
                $data['cardType'] = 'sendDirectly';
                $data['destCivilite'] = ucfirst($post_data['destCivilite']);
                $data['city'] = strtoupper($post_data['destCity']);
                $data['country'] = 'fr';
                $data['housenumber'] = $post_data['destHousenumber'];
                $data['street'] = $post_data['destStreet'];
                $data['zipcode'] = $post_data['destZipcode'];
                $data['adressSupplement'] = $post_data['destAdressSupplement'];
                $data['forText'] = $post_data['forText'];
                $data['openDate'] = $post_data['openDate'];
                $data['expCivilite'] = ucfirst($post_data['expCivilite']);
                $data['expFirstName'] = $post_data['expFirstName'];
                $data['expLastName'] = $post_data['expLastName'];
                $data['expCity'] = strtoupper($post_data['expCity']);
                $data['expCountry'] = 'fr';
                $data['expHousenumber'] = $post_data['expHousenumber'];
                $data['expStreet'] = $post_data['expStreet'];
                $data['expZipcode'] = $post_data['expZipcode'];
                $data['expAdressSupplement'] = $post_data['expAdressSupplement'];
            }
        } elseif ($wingValue == 1) {
            $post_data = $this->request->request->get('sendSelf');
            if (!isset($post_data['destCivilite'])) {
                $this->error['destCivilite'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destCity'] === '') {
                $this->error['destCity'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destStreet'] === '') {
                $this->error['destStreet'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destHousenumber'] === '') {
                $this->error['destHousenumber'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destZipcode'] === '') {
                $this->error['destZipcode'] = 'Ce champs est obligatoire';
            }
            if ($post_data['forText'] === '') {
                $this->error['forText'] = 'Ce champs est obligatoire';
            }
            if (!$this->error) {
                $data['cardType'] = 'sendSelf';
                $data['destCivilite'] = ucfirst($post_data['destCivilite']);
                $data['city'] = strtoupper($post_data['destCity']);
                $data['country'] = 'fr';
                $data['housenumber'] = $post_data['destHousenumber'];
                $data['street'] = $post_data['destStreet'];
                $data['zipcode'] = $post_data['destZipcode'];
                $data['adressSupplement'] = $post_data['destAdressSupplement'];
                $data['forText'] = $post_data['forText'];
            }
        } elseif ($wingValue == 2) {
            $post_data = $this->request->request->get('freeCard');
            $data['cardType'] = 'freeCard';
        }

        // common data
        if (isset($post_data)) {
            if ($post_data['destFirstName'] === '') {
                $this->error['destFirstName'] = 'Ce champs est obligatoire';
            }
            if ($post_data['destLastName'] === '') {
                $this->error['destLastName'] = 'Ce champs est obligatoire';
            }
            if (is_array($this->error) && count($this->error)) {
                return false;
            }
            $data['destFirstName'] = $post_data['destFirstName'];
            $data['destLastName'] = $post_data['destLastName'];
            $data['fromText'] = $post_data['fromText'];
            $data['customMessage'] = $post_data['customMessage'];
        }

        return $data;
    }

    private function ajax()
    {
        $return = array();
        try {
            if ('add' == $this->request->get('operation') && $this->request->isMethod('POST') && ($this->request->get('type') === '' || 'code' === $this->request->get('type'))) {
                // Coupon or code promo
                $query = $this->app['apiclient.default']->post(
                    "pay/{$this->id}/promotion/",
                    ['token'=>$this->token, 'promoType'=>'code', 'code'=>$this->request->get('value')]
                )->getContent();
                $return['discountType'] = null;
                $return['discountLimit'] = null;
                $return['discountedAmount'] = null;
                if ($query['coupon'] !== null) {
                    $return['amount'] = $query['coupon']['amount']/100;
                    $return['type'] = 'coupon';
                    $return['reductionType'] = $query['coupon']['type'];
                    $return['discountLimit'] = $query['coupon']['discountLimit'];
                    $return['discountedAmount'] = $query['payment']['discountedAmount']/100;
                } elseif ($query['promocode'] !== null) {
                    $return['amount'] = $query['promocode']['amount']/100;
                    $return['type'] = 'promocode';
                }
                $return['total'] = $query['payment']['amount'];
            } elseif ('add' == $this->request->get('operation') && $this->request->get('type') === 'debit' && $this->request->isMethod('POST')) {
                // Carte cadeau
                $query = $this->app['apiclient.default']->post(
                    "pay/{$this->id}/promotion/",
                    ['token'=>$this->token, 'promoType'=>$this->request->get('type'), 'amount'=>$this->request->get('value')]
                )->getContent();
                $return['total'] = $query['payment']['amount'];
            } elseif ('delete' === $this->request->get('operation')) {
                // Suppression
                if ($this->request->query->get('type') === 'option') {
                    $this->getPaymentDatas();
                    $this->getPaymentDatas();
                    $this->processingOptionWing('delete', $this->rApi['card']);
                    $return['return'] = true;
                } else {
                    $query = $this->app['apiclient.default']->delete("pay/{$this->id}/promotion/{$this->request->get('type')}?token={$this->token}")->getContent();
                    $return['total'] = $query['payment']['amount'];
                }
            } elseif ('nxcbEligibilite' === $this->request->get('type')) {
                return json_encode($this->app['service.paiement']->casinoEligibilite($this->id, $this->token));
            } elseif ($this->request->getMethod() === 'POST' && $this->request->request->get('type') === 'insurance') {
                $result = $this->app['service.paiement']->processingInsurance($this->request->request->get('insurance'), $this->id, $this->token);
                $return['amount'] = $result['payment']['amount'];
                $return['sellPrice'] = $result['addedInsurance'][0]['sellPrice'];
                $return['discountedAmount'] = $result['payment']['discountedAmount'];
            } else {
                throw new Exception('Erreur : type inconnu');
            }
        } catch (\Exception $ex) {
            return json_encode(['error'=>$ex->getMessage()]);
        }

        return json_encode($return);
    }

    public function paiementRedirect(Request $request)
    {
        $this->request = $request;
        if ($this->casinoActive || ($this->request->request->has('casino') || $this->request->query->has('casino'))) {
            $this->useCasino = true;
        }
        $this->getPaymentDatas(true);

        if (!in_array($this->rApi['payment']['status'], ['pending', 'awaiting', 'created'])) {
            $this->app['session']->getFlashBag()->add('error', 'La transaction est en cours de traitement.');
            return $this->app->redirect($this->app['url_generator']->generate('user.auctions'));
        }

        //payment tracking data
        $trackingData = [
            'token'     => $this->request->get('token'),
            'action'    => 'psp_redirect',
            'labelType' => 'value'
        ];

        // Payment with Paypal
        if ($this->request->request->get('method') == 'paypal') {
            try {
                $link = $this->app['apiclient.default']->post('/ipn/paypal/linkv2', ['payment' => $this->id, 'token' => $this->token])->getContent();
                //payment tracking
                $trackingData['label'] = 'Paypal';
                $this->addPaymentTracking($trackingData, $this->id);
                return new RedirectResponse($link);
            } catch (\Exception $ex) {
                $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                if ($this->productType === 'auction') {
                    return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType, 'token' => $this->token]));
                } else {
                    return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType]));
                }
            }
        }

        // Payment with other methods
        if ($this->request->request->get('method') == 'cheque' || $this->request->request->get('method') == 'virement' || $this->request->request->get('method') == 'ancv') {
            //payment tracking
            $trackingData['label'] = $this->request->request->get('method');
            $this->addPaymentTracking($trackingData, $this->id);

            return $this->paiementOther($this->request, $this->id);
        }

        if ($this->productType === 'giftcard') {
            $params = [
                'giftcardpaymentid' => $this->id,
                'method' => $this->request->request->get('method')
            ];
        } else {
            $params = [
                'payment' => $this->id,
                'method' => $this->request->request->get('method'),
                'token' => $this->token
            ];
        }

        // Payment with a saved card
        if (strpos($this->request->get('method'), 'savedCard') !== false) {
            $params += [
                'cardToUse' => explode('-', $this->request->get('method'))[1]
            ];

            try {
                $this->app['apiclient.finance']->makeExpressPayment($params)->getContent();
                if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $this->app['security']->getToken()->getUser()) {
                    $this->app['service.user']->refreshUser($this->app['security']->getToken()->getUser());
                    $user = $this->app['security']->getToken()->getAttribute('user');
                    $user['preferences']['hasPaid'] = 1;
                    $this->app['security']->getToken()->setAttribute('user', $user);
                }
                if ($this->getCheckoutFlow()['hasConfirmationTO']) {
                    return $this->renderConfirmation("paiement/confirmation_to.twig", [
                        'paymentType' => 'online',
                        'for' => 'confirmation',
                        'paymentId' => $this->id,
                        'token' => $this->token,
                    ]);
                } else {
                    if (($this->rApi['product']['bookable'] === true) && ($this->rApi['product']['nbPassenger'] !== null && $this->rApi['product']['nbPassenger'] > 0)) {
                        return $this->renderConfirmation("paiement/confirmation_to.twig", [
                            'paymentType' => 'online',
                            'for' => 'confirmation',
                            'paymentId' => $this->id,
                            'token' => $this->token
                        ]);
                    } else {
                        if ($this->productType == 'giftcard') {
                            return $this->renderConfirmation("paiement/confirmation_giftcard.twig", [
                                'paymentType' => 'online',
                                'for' => 'confirmation',
                                'paymentId' => $this->id,
                                'token' => $this->token
                            ]);
                        } else {
                            return $this->renderConfirmation("paiement/confirmation_classic.twig", [
                                'paymentType' => 'online',
                                'for' => 'confirmation',
                                'isPostPaymentReservation' => ($this->getCheckoutFlow()['hasReservation'] && $this->getCheckoutFlow()['reservationTime'] === 'postPayment'),
                                'paymentId' => $this->id,
                                'token' => $this->token,
                            ]);
                        }
                    }
                }
            } catch (ApiException $ex) {
                $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                if (strpos($ex->getMessage(), "Erreur d'identification de l'utilisateur") !== false) {
                    return $this->app->redirect($this->app['url_generator']->generate('homepage')); //Bad, token !=
                } elseif ((strpos($ex->getMessage(), "Vous devez saisir un nom") !== false) || (strpos($ex->getMessage(), "nous vous conseillons d'essayer d'employer une autre méthode") !== false)) {
                    // Can safely redirect to payment page
                    if ($this->productType === 'giftcard') {
                        return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType]));
                    } else {
                        return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType, 'token' => $this->token]));
                    }
                } else {
                    // Failsafe, only both error above should happen
                    if ($this->productType === 'giftcard') {
                        return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType]));
                    } else {
                        return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType, 'token' => $this->token]));
                    }
                }
            }
        }

        if ($this->request->request->has('saveCard') && $this->request->request->get('saveCard') && $params['method'] != 'ecarte') {
            $params += [
                'saveCard' => 1,
            ];
        }

        try {
            if ($this->productType === 'giftcard') {
                $data = $this->app['apiclient.finance']->createGiftcardTransaction($params)->getContent();
            } elseif ($params['method'] !== 'nxcb') {
                if ($request->cookies->get('etransTestError') !== null) {
                    $params['testError'] = $request->cookies->get('etransTestError');
                }
                $data = $this->app['apiclient.default']->post('/ipn/etrans/linkv2', $params)->getContent();
            }
        } catch (ApiException $e) {
            $this->app['session']->getFlashBag()->add('error', $e->getMessage());
            if (strpos($e->getMessage(), "Le code de verification fournit est incorrect") !== false) {
                return $this->app->redirect($this->app['url_generator']->generate('homepage'));
            } elseif (strpos($e->getMessage(), "Vous devez saisir un nom") !== false) {
                // Can safely redirect to payment page
                if ($this->productType === 'auction') {
                    return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType, 'token' => $this->token]));
                } else {
                    return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType]));
                }
            } else {
                // Failsafe, only both error above should happen
                return $this->app->redirect($this->app['url_generator']->generate('homepage'));
            }
        }

        // Payment with Casino
        if ($params['method'] === 'nxcb') {
            // payment in N x
            try {
                $data = ['payment' => $this->id, 'token' => $this->token];
                $casino_data = $this->request->request->get('casino');
                if ($this->useCasino) {
                    $ipnUri = '/ipn/casino/generateForm';
                    $data['method'] = $casino_data['method'];
                    $data['inputDatas'] = [
                        'userGender' => $casino_data['userGender'],
                        'userMaidenName' => $casino_data['userMaidenName'],
                        'userBirthZipcode' => $casino_data['userBirthZipcode'],
                        'userPhone' => $casino_data['userPhone'],
                        'userDateOfBirth' => $casino_data['userDateOfBirth'],
                        'zipcode' => $casino_data['zipcode'],
                        'city' => $casino_data['city'],
                        'street' => $casino_data['street'],
                        'country' => $casino_data['country'],
                        'location' => $casino_data['location'],
                        'userLastName' => $casino_data['userLastName'],
                        'userFirstName' => $casino_data['userFirstName'],
                    ];
                }

                $this->addPaymentLog('[Casino] Remplissage du formulaire de demande de paiement Casino abouti | '.json_encode($data['inputDatas']));
                $form = $this->app['apiclient.default']->post($ipnUri, $data)->getContent();

                // payment tracking
                $trackingData['label'] = $casino_data['method'];
                $this->addPaymentTracking($trackingData, $this->id);
                $this->addPaymentLog('[Casino] Validation du scoring casino, redirection vers la page de la banque.');

                return $this->app['twig']->render(
                    'payment/nxcbRedirect.twig',
                    [
                        'nxcbFormElements'      => $form,
                        'hideExtendedFooter'    => false,
                        'useCasino' => $this->useCasino
                    ]
                );
            } catch (\Exception $ex) {
                $this->addPaymentLog('[Casino] Refus casino au scoring (page banque non atteint), motif : "'.$ex->getMessage().'"');
                if ($ex->getMessage() === "Vous n'etes pas éligible a un crédit.") {
                    $this->error['payment'] = $ex->getMessage();
                    return false;
                } else {
                    if ($this->productType === 'auction') {
                        $urlParams = ['id' => $this->id, 'productType' => $this->productType, 'token' => $this->token];
                        if ($this->useCasino) {
                            $urlParams['casino'] = '1';
                        }
                        return $this->app->redirect($this->app['url_generator']->generate('paiement.page', $urlParams));
                    } else {
                        return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType]));
                    }
                }
            }
        } else {
            // Payment with etrans
            // is Mobile device ?
            $detect = new MobileDetect;
            $mobile = false;

            if ($detect->isMobile() || $detect->isTablet()) {
                $mobile = true;
            }
            if ($mobile || $this->isApp($request)) {
                $link = $this->app['etrans.mobile.url'];
            } else {
                $link =  $this->app['etrans.url'];
            }
            //payment tracking
            $trackingData['label'] = "cb";
            $this->addPaymentTracking($trackingData, $this->id);
            return $this->app['twig']->render(
                'payment/etransRedirect.twig',
                [
                    "etransLink"            => $link,
                    "etransFormElements"    => $data,
                    'isPayment'             => $this->isPayment,
                    'hideExtendedFooter'    => false
                ]
            );
        }
    }

    public function paiementOther(Request $request, $id)
    {
        try {
            $this->id = $id;
            $this->request = $request;
            $data = $this->app['apiclient.default']->get("/pay/$this->id?token=".$this->request->get('token')."&trackingUserStats=1")->getContent();
            $data['payment']['platform'] = $this->request->get('method');
            $paymentType = null;
            $trackingData = [
                'token'     => $this->request->get('token'),
                'action'    => 'psp_redirect',
                'labelType' => 'value'
            ];
            switch ($this->request->get('method')) {
                case 'tel':
                    $data['payment']['status'] = 'pending';
                    $paymentType = 'other';
                    break;
                case 'cheque':
                    $data['payment']['status'] = 'awaiting';
                    $view = 'confirmation_cheque';
                    $paymentType = 'cheque';
                    $trackingData['label'] = 'cheque';
                    break;
                case 'virement':
                    $data['payment']['status'] = 'awaiting';
                    $view = 'confirmation_virement';
                    $paymentType = 'bankwire';
                    $trackingData['label'] = 'virement';
                    break;
                case 'ancv':
                    $data['payment']['status'] = 'awaiting';
                    $view = 'confirmation_ancv';
                    $paymentType = 'bankwire';
                    $trackingData['label'] = 'ancv';
                    break;
                default:
                    $this->app['logger']->error('Invalide paiement type');
                    $data['payment']['platform'] = 'invalide';
                    break;
            }
            $data['payment']['step'] = $this->request->get('etape');

            $this->app['apiclient.default']->put("/pay/$this->id", $data['payment']+['token' => $this->request->get('token')]);
            if ($this->request->get('method') !== 'tel') {
                if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $this->app['security']->getToken()->getUser()) {
                    $this->app['service.user']->refreshUser($this->app['security']->getToken()->getUser());
                }
                //payment tracking
                $this->addPaymentTracking($trackingData, $this->id);
                return $this->renderConfirmation("paiement/$view.twig", [
                    'paymentType' => $paymentType,
                    'for' => 'confirmation',
                    'paymentId' => $this->id,
                    'token' => $this->request->get('token'),
                    'method' => $data['payment']['platform'],
                ]);
            } else {
                return $this->paiement($this->request, $this->id, $this->productType);
            }
        } catch (\Exception $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
            return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'productType' => $this->productType, 'token' => $this->request->get('token')]));
        }
    }

    public function freeTransaction($id, Request $request)
    {
        $this->request = $request;
        $this->token = $this->request->get('token');
        $this->id = $id;
        $this->productType = 'auction';
        try {
            $this->rApi = $this->app['apiclient.default']->get("/pay/{$this->id}?token={$this->token}&trackingUserStats=1")->getContent();
            $payment = $this->rApi['payment'];
        } catch (\Exception $ex) {
            $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
            return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['id' => $this->id, 'token' => $this->token]));
        }

        // Redirect user if the payement is complete.
        if ($payment['status'] != 'pending' && !$this->changeMethod) {
            return $this->paymentEnded();
        }

        // Free means amount = 0
        if ($payment['amount'] > 0) {
            return $this->app->redirect($this->app['url_generator']->generate('paiement.page', ['token' => $this->token, 'id' => $this->id]), 301);
        }

        $payment['status'] = 'complete';
        $payment['platform'] = 'free';

        $this->app['apiclient.default']->put("/pay/{$this->id}", $payment+['token' => $this->token]);

        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $this->app['security']->getToken()->getUser()) {
            $this->app['service.user']->refreshUser($this->app['security']->getToken()->getUser());
            $user = $this->app['security']->getToken()->getAttribute('user');
            $user['preferences']['hasPaid'] = 1;
            $this->app['security']->getToken()->setAttribute('user', $user);
        }

        if ($this->getCheckoutFlow()['hasConfirmationTO']) {
            return $this->renderConfirmation("paiement/confirmation_to.twig", [
                'paymentType'           => 'other',
                'for' => 'confirmation',
                'paymentId' => $this->id
            ]);
        } else {
            return $this->renderConfirmation("paiement/confirmation_classic.twig", [
                'paymentType'           => 'other',
                'for' => 'confirmation',
                'isPostPaymentReservation' => ($this->getCheckoutFlow()['hasReservation'] && $this->getCheckoutFlow()['reservationTime'] === 'postPayment'),
                'paymentId' => $this->id
            ]);
        }
    }

    public function transaction($id, $type, Request $request, $productType = 'auction')
    {
        $this->request = $request;
        $params = $this->request->query->all();
        $this->id = $id;
        $this->productType = $productType;
        $this->token = $params['verifToken'];

        $this->getPaymentDatas(true);
        $payment = $this->rApi['payment'];
        $success = false;
        $method = null;

        $trackingData = [
            'token'     => $this->token,
            'action'    => 'psp_validate',
            'labelType' => 'value'
        ];

        if ($type == 'paypal') {
            if ($params['state'] == "success") {
                $apiContext = new ApiContext(
                    new OAuthTokenCredential($this->app['paypal']['clientID'], $this->app['paypal']['clientSecret'])
                );
                $config = array(
                    'log.LogEnabled' => $this->app['paypal']['logEnabled'],
                    'log.FileName' => $this->app['paypal']['logFile'],
                    'log.LogLevel' => $this->app['paypal']['logLevel'],
                    'mode' => $this->app['paypal']['mode']
                );
                $apiContext->setConfig($config);
                $paypalSuccess = false;
                try {
                    $PayPalpayment = Payment::get($params['paymentId'], $apiContext);
                    $execution = new PaymentExecution();
                    $execution->setPayerId($params['PayerID']);
                    $PayPalpayment->execute($execution, $apiContext);
                    $PayPalpayment = Payment::get($params['paymentId'], $apiContext);
                    $paypalSuccess = true;
                } catch (\PayPal\Exception\PayPalConnectionException $ex) {
                    $this->app['logger']->error('Paypal payment execution error '.json_encode($ex->getData()));
                }
                if ($paypalSuccess && $PayPalpayment->getState() == "approved") {
                    $success = true;
                    $payment['payID'] = $this->request->query->get('orderId');
                    $payment['status'] = 'processing';
                    $payment['updated'] = date('Y-m-d H:i:s');
                    $payment['platform'] = 'paypal';
                    $trackingData['label'] = 'paypal';
                    $this->app['apiclient.default']->put("/pay/$id", $payment+['token' => $params['verifToken']]);
                }
            }
        } elseif ($type === 'casino') {
            if ($request->request->get('returnCode') == '0') {
                 // PAYMENT_ABORTED or PAYMENT_STORED
                $success = true;
                $data = $this->app['apiclient.default']->get("/pay/$this->id?token=".$this->request->get('verifToken')."&trackingUserStats=1")->getContent();
                $data['payment']['status'] = 'complete';
                //62 : 4x - 80 : 3x
                $trackingData['label'] = $request->request->get('paymentOptionRef') === '62' ? "casino4x" : "casino3x";

                try {
                    $this->app['apiclient.default']->put("/pay/$this->id", $data['payment']+['token' => $this->request->get('verifToken'), 'webPostFields' => $this->request->request->all()]);
                } catch (\Exception $ex) {
                    $success = false;
                    $this->getLogger()->critical("Casino return validation error", ['exception' => $ex->getMessage()]);
                }
            }
        } else {
            if ($params['state'] == 'success') {
                $success = true;
                $data = $this->app['apiclient.default']->get("/pay/$this->id?token=".$this->request->get('verifToken')."&trackingUserStats=1")->getContent();
                $payload = $data['payment'];
                $payload['status'] = 'complete';
                $payload['platform'] = $this->request->get('ctype');
                // Used by the API to check that the request came from Etrans
                $payload['webPostFields'] = $this->request->query->all();
                $payload['token'] = $this->request->get('verifToken');
                $trackingData['label'] = 'etrans_'.$this->request->get('ctype');
                try {
                    $this->app['apiclient.default']->put("/pay/$this->id", $payload);
                } catch (\Exception $ex) {
                    $success = false;
                    $this->getLogger()->critical("Etransation return validation error", ['exception' => $ex->getMessage()]);
                }
            }
        }
        if ($success) {
            if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY') && $this->app['security']->getToken()->getUser()) {
                $this->app['service.user']->refreshUser($this->app['security']->getToken()->getUser());
                $user = $this->app['security']->getToken()->getAttribute('user');
                $user['preferences']['hasPaid'] = 1;
                $this->app['security']->getToken()->setAttribute('user', $user);
            }
            //payment tracking
            $this->addPaymentTracking($trackingData, $this->id);

            if ($this->getCheckoutFlow()['hasConfirmationTO']) {
                return $this->renderConfirmation("paiement/confirmation_to.twig", [
                    'paymentType' => 'online',
                    'for' => 'confirmation',
                ]);
            } else {
                if ($productType == 'giftcard') {
                    return $this->renderConfirmation("paiement/confirmation_giftcard.twig", ['paymentType' => 'online', 'for' => 'confirmation', 'paymentId' => $this->id, 'token' => $this->token]);
                } else {
                    if ($type === 'casino') {
                        $this->addPaymentLog("[Casino] Validation du paiement par casino. Retour de la page paiement sur la confirmation LE");
                        return $this->renderConfirmation("paiement/confirmation_casino.twig", [
                            'paymentType'  => 'online',
                            'user' => $this->rApi['user'],
                            'for' => 'confirmation'
                        ]);
                    }

                    return $this->renderConfirmation("paiement/confirmation_classic.twig", [
                        'paymentType' => 'online',
                        'for' => 'confirmation',
                        'isPostPaymentReservation' => ($this->getCheckoutFlow()['hasReservation'] && $this->getCheckoutFlow()['reservationTime'] === 'postPayment'),
                    ]);
                }
            }
        } else {
            $trackPageUrl = "/payment/declined";
            //tracking payment
            $trackingData = [
                'token'     => $params['verifToken'],
                'action'    => 'psp_failure',
                'labelType' => 'referer',
                'label'     => $_SERVER['HTTP_REFERER'] ?? null
            ];
            $this->addPaymentTracking($trackingData, $this->id);
            if ($type === 'casino') {
                $this->addPaymentLog("[Casino] Refus du paiement par casino. Retour de la page paiement sur la page de refus LE");
            }
            return $this->app['twig']->render(
                'paiement/error.twig',
                [
                    'hideExtendedFooter'=> false,
                    'token'             => $params['verifToken'],
                    'id'                => $id,
                    'trackPageUrl'      => $trackPageUrl,
                    'productType'       => 'auction',
                    'paymentId'         => $this->id,
                ]
            );
        }
    }

    public function renderConfirmation($view, array $data = [])
    {
        $data['paymentId'] = $this->id;
        $data['product_id'] = $this->rApi['product']['id'];
        $data['amount'] = $this->rApi['payment']['amount'];
        $data['trackPageUrl']='/paiement/thank-you';
        $data['auction'] = $this->rApi['auction'];
        $data['hideBreadcrumb'] = true;
        $data['hideNavbar'] = true;
        $data['productType'] = $this->productType;
        $data['payment'] = $this->rApi['payment'];
        $data['isPayment'] = true;

        // We build datalayer for EA tag, it will be automatically inject in footer template.
        // Another web tag implementing can be added in this method.
        $eulerianPaymentData = $this->buildEulerianData($data);
        $data['eulerianPaymentNatif'] = base64_encode(json_encode($eulerianPaymentData));
        $data['eulerianPaymentWeb'] = $eulerianPaymentData;

        // Cleanup tag big factory. We do simple stuff
        $this->app['twig']->addGlobal('injectTags', []);
        $this->app['service.tracker']->removeTracker(EulerianTagBuilder::getContainerKey());

        return $this->app['twig']->render($view, $data);
    }

    private function breadcrumbData()
    {
        try {
            $array = $this->getAllBreadcrumbSteps();
            if (!isset($array[$this->flow][$this->step]['title'])) {
                $this->dataView['title'] = $array['classic'][$this->step]['title'];
            } else {
                $this->dataView['title'] = $array[$this->flow][$this->step]['title'];
            }
        } catch (\Exception $ex) {
            $this->app['logger']->error($ex->getMessage());
        }
        return $this;
    }

    /**
     * Define an array with all step by flow
     * @return array
     */
    private function getAllBreadcrumbSteps()
    {
        $array = [
            'classic' => [
                '1' => ['title' => "Mon enchère"],
                '2' => ['title' => 'Validation'],
                '3' => ['title' => 'Paiement']
            ]
        ];

        $array['bookable_calendar_insurance'] = $array['bookable_calendar'] = [
            '1' => ['title' => "Mon enchère"],
            '2' => ['title' => 'Réservation'],
            '3' => ['title' => 'Validation'],
            '4' => ['title' => 'Paiement']
        ];

        $array['delivery'] = [
            1 => [BreadCrumbService::BREADCRUMB_TITLE => 'Mon enchère'],
            2 => [BreadCrumbService::BREADCRUMB_TITLE => 'Adresse de livraison'],
            3 => [BreadCrumbService::BREADCRUMB_TITLE => 'Récapitulatif'],
            4 => [BreadCrumbService::BREADCRUMB_TITLE => 'Paiement']
        ];

        $array['breadcrumbFakeFirstStep'] = true;

        return $array;
    }

    /**
     * Calcul the amount of gift gards used
     * @return $this
     */
    private function calcAmountOfGiftCardsUsed()
    {
        if (count($this->rApi['debits'])) {
            foreach ($this->rApi['debits'] as $debits) {
                $this->dataView['cartecadeau']+= $debits['amount'];
            }
        }
        return $this;
    }

    /**
     * We determine the maximum amount of gift cards
     * @return $this
     */
    private function calcMaxAmountOfGiftCards()
    {
        if (count($this->rApi['giftcards'])) {
            $now = new \DateTime();
            foreach ($this->rApi['giftcards'] as $giftcards) {
                $date = new \DateTime($giftcards['expire_date']);
                if ($date->getTimestamp() >= $now->getTimestamp()) {
                    $this->dataView['giftcardsMax']+= $giftcards['amount_left'];
                }
            }
        }
        return $this;
    }

    private function getPaymentDatas($trackingUserStats = false)
    {
        /** @var $paymentService PaiementService */
        $paymentService = $this->app['service.paiement'];
        $this->rApi = $paymentService->getPaymentDatas($this->productType, $this->id, $this->token, $trackingUserStats);
        if ($this->rApi === null) {
            throw new Exception("getPaymentDatas error, productType:". var_export($this->productType, true).' id:'.$this->id.' token:'.$this->token);
        }
        return $this;
    }

    private function paymentEnded()
    {
        $status = isset($this->rApi['payment']['refund']) && $this->rApi['payment']['refund'] ? 'refund':$this->rApi['payment']['status'];
        $uriChangeMethod = null;
        switch ($status) {
            case 'processing':
            case 'awaiting-bank':
                $title = 'paiement en cours';
                $text = "Le règlement de cette enchère est en attente de confirmation de la part de notre partenaire bancaire";
                $route = 'user.purchase';
                $illustration = '/assets/gfx/pictos/horloge.png';
                if ($this->dataView['isApp']) {
                    $deeplink = $this->app['url_generator']->getDeeplink($route);
                    if ($deeplink !== false) {
                        $route = $deeplink;
                    }
                }
                $link = ['text' => 'Voir mes achats', 'url' => $route];
                break;
            case 'awaiting':
                $title = 'paiement en cours';
                $uriChangeMethod = $this->request->getRequestUri().'&changemethod=1';
                $text = "Le règlement de cette enchère est en cours d'éxécution, mais vous pouvez <a href=\"$uriChangeMethod\">choisir un autre moyen de paiement</a>.";
                if ($this->rApi['payment']['platform'] === 'cheque') {
                    $text.= "<br /><br />Merci de nous envoyer votre chèque à <address><b>LOISIRS ENCHERES SAS, 18 rue de la Porte Dijeaux, 33000 BORDEAUX</b></address> en indiquant vos nom, prénom tels qu'ils apparaissent dans votre compte Loisirs Enchères ainsi que le titre de l'enchère remportée.";
                } elseif ($this->rApi['payment']['platform'] === 'virement') {
                    $text.= "<br /><br />Merci de nous envoyer votre virement à <strong>LOISIRS ENCHERES SAS, IBAN : FR76 1330 6001 5723 0666 1496 431</strong> en indiquant vos nom et prénom tels qu'ils apparaissent dans votre compte Loisirs Enchères ainsi que le titre de l'enchère remportée.";
                }
                $route = 'user.purchase';
                $illustration = '/assets/gfx/pictos/horloge.png';
                if ($this->dataView['isApp']) {
                    $deeplink = $this->app['url_generator']->getDeeplink($route);
                    if ($deeplink !== false) {
                        $route = $deeplink;
                    }
                }
                $link = ['text' => 'Voir mes achats', 'url' => $route];
                break;
            case 'refund':
                $title = 'paiement rembrousé';
                $text = "Cette enchère à été ou est en cours de remboursement";
                $route = 'user.purchase';
                $illustration = '/assets/gfx/logopayment/illustration-echeque.png';
                if ($this->dataView['isApp']) {
                    $deeplink = $this->app['url_generator']->getDeeplink($route);
                    if ($deeplink !== false) {
                        $route = $deeplink;
                    }
                }
                $link = ['text' => 'Voir mes achats', 'url' => $route];
                break;
            case 'failed':
                $title = 'enchère annulée';
                $text = "Cette enchère à été annulée";
                $route = 'user.auctions';
                $illustration = '/assets/gfx/logopayment/illustration-echeque.png';
                if ($this->dataView['isApp']) {
                    $deeplink = $this->app['url_generator']->getDeeplink($route);
                    if ($deeplink !== false) {
                        $route = $deeplink;
                    }
                }
                $link = ['text' => 'Voir mes enchères', 'url' => $route];
                break;
            default: // c omplete
                $title = 'paiement confirmé';
                $text = "Cette enchère a été réglée";
                $route = 'user.purchase';
                $illustration = '/assets/gfx/logopayment/illustration-validation.png';
                if ($this->dataView['isApp']) {
                    $deeplink = $this->app['url_generator']->getDeeplink($route);
                    if ($deeplink !== false) {
                        $route = $deeplink;
                    }
                }
                $link = ['text' => 'Voir mes achats', 'url' => $route];
        }

        return $this->renderConfirmation("paiement/confirmation_ended.twig", [
            'title' => $title,
            'text' => $text,
            'link' => $link,
            'illustration' => $illustration,
            'for' => 'confirmation',
            'status' => $status,
            'uriChangeMethod' => $uriChangeMethod
        ]);
    }

    public function addPaymentTracking($trackingData, $paymentId)
    {
        $data = [];
        $data['token'] = $trackingData['token'];
        $data['userAgent'] = $_SERVER['HTTP_USER_AGENT'];
        $data['ip'] = $_SERVER['REMOTE_ADDR'];
        $data['userId'] = $this->app['security']->getToken()->getUser();
        $data['action'] = $trackingData['action'] ?? null;
        $data['labelType'] = $trackingData['labelType'] ?? null;
        $data['label'] = $trackingData['label'] ?? null;

        try {
            $this->getDefaultClient()->post("/payment/{$paymentId}/paymenttracking/", $data);
        } catch (\Exception $ex) {
            $this->getLogger()->error("payment tracking error : ".$data['action']." - ".$data['labelType']." ".$data['label'], ['exception' => $ex->getMessage()]);
        }

        return true;
    }

    /**
     * Build datalayer for required tags on this page
     *
     * @param array $data
     */
    private function buildEulerianData($data)
    {
        if (is_array($this->rApi['user'])) {
            $user = $this->rApi['user'];

            $encryptedMargin = '';
            if (isset($data['payment']['marginFee'])) {
                $encryptedMargin = $this->app['service.eulerian_encryptor']->encrypt((string) $data['payment']['marginFee']);
            }
            $eaData = [
                'ref' => $data['payment']['id'],
                'currency' => 'euro',
                'prdr0' => $data['product_id'],
                'prda0' => $data['amount'] / 100,
                'prdq0' => 1,
                'prdn0' => $this->rApi['product']['name'] ?? '',
                'prdg0' => $this->rApi['product']['category'] ?? '',
                'amount' => $data['amount'] / 100,
                'newcustomer' => ($user['nbAuctionPaid'] === 0) ? '1' : '0',
                'payment' =>  isset($this->rApi['payment']['platform']) ? $this->rApi['payment']['platform'] : "N/A",
                'pagegroup' => 'page_paiement_panier',
                'code-promo' => isset($this->rApi['promocode']['code']) ? $this->rApi['promocode']['code'] : "N/A",
                'nom_code-promo' => isset($this->rApi['promocode']['campaign']) ? $this->rApi['promocode']['campaign'] : "N/A",
                'montant_code-promo' => isset($this->rApi['promocode']['amount']) ? $this->rApi['promocode']['amount'] / 100 : "N/A",
                'margin' => $encryptedMargin,
                'nb-encheres-gagnant' => $this->rApi['userStats']['nbBidsForWinner'] ?? '',
                'nb-users-sur-enchere' => $this->rApi['userStats']['nbUserOnAuction'] ?? '',
                'uid' => $user ? $user['num'] : '',
                // Eulerian advise to identify user without exposing email in the source.
                'email' => $user ? hash('sha256', $user['email']) : '',
                'profile' => $this->app['service.user']->getUserTrackingProfile(),
                'path' => $this->request->getPathInfo(),
            ];

            if ($this->app['session']->get('mobiletokenClientId') === 'app2-ios') {
                $eaData['edev'] = 'AppNativeIOSphone';
            } elseif ($this->app['session']->get('mobiletokenClientId') === 'app2-android') {
                $eaData['edev'] = 'AppNativeAndroidphone';
            }

            $eaData += $this->app[EulerianTagBuilder::getContainerKey()]->buildEAOptin();
            
            return $eaData;
        }
        return [];
    }

    public function createCheckout(Request $request)
    {
        if ($this->app['security']->isGranted('IS_AUTHENTICATED_FULLY')) {
            $userId = $this->app['security']->getToken()->getUser();

            try {
                $this->app['apiclient.default']->post("/payment/", [
                    "user" => $userId,
                    "product" => $request->get('product'),
                    "buyNow" => true,
                ])->getContent();

                return true;
            } catch (\Exception $exception) {
                if ($request->isXmlHttpRequest()) {
                    return new JsonResponse(['error' => $exception->getMessage()]);
                }
            }
        } else {
            return new JsonResponse(['error' => "Vous devez être connecté pour acheter immédiatement."]);
        }
    }

    /**
     * Add additional log to payment
     *
     * @param $msg
     */
    private function addPaymentLog($msg)
    {
        if (!empty($msg) && is_numeric($this->id)) {
            $this->app['apiclient.finance']->updatePayment($this->id, [
                'onlyPaymentDataLog' => 1,
                'msg' => $msg
            ]);
        }
    }
}
