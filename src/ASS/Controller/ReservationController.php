<?php

namespace ASS\Controller;

use ASS\Service\BreadCrumbService;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use CAC\Component\ApiClient\ApiDataException;
use Symfony\Component\HttpFoundation\JsonResponse;

class ReservationController extends AbstractReservationController
{
    /**
     * Reservation page by step for postpayment
     *
     * @param Request $request
     * @param int $resId
     * @return RedirectResponse
     */
    public function reserve(Request $request, $resId)
    {
        $token = $request->get('token');
        $reservation = $this->app['apiclient.default']->get('/reservation/' . $resId, ['combined' => 1, 'token' => $token])->getContent();

        if ($reservation === null) {
            return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
        }
        if ($reservation['paymentStatus'] != 'complete') {
            return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
        }

        $passengers = $this->app['apiclient.default']->get('/reservation/' . $resId . '/passenger/', ['token' => $token, 'fieldsStatus' => [1]])->getContent();
        $dataView['passengersCustomFields'] = $this->getPassengersCustomFields($reservation['id']);
        $payment = $this->app['service.paiement']->getPaymentDatas('auction', $reservation['paymentId'], $token);

        $this->request = $request;
        $error = [];
        try {
            $dataView['productType'] = 'auction';
            $dataView['isApp'] = $this->isApp($request);
            $dataView['useCasino'] = false;

            // Form data in case of error
            $dataView['dataSave'] = $this->app['session']->get('paiement');
            $this->app['session']->remove('paiement');

            // valide forms
            if ($this->request->getMethod() === 'POST') {
                if ($this->request->request->has('update')) {
                    // Define operation type, insert, update or delete
                    $this->operation = $this->request->request->get('update') == 0 ? 'insert' : 'update';
                }

                // Check data reservation
                if ($this->request->request->has('availabilitie')) {
                    // get current datas
                    try {
                        $errors = $this->getReservationService()->processingReservation([
                            'reservation' => $reservation,
                            'availability' => $this->request->request->get('availabilitie'),
                            'token' => $this->request->get('token'),
                            'customFieldsValues' => $this->getCustomFieldsFromRequest(),
                            'email' => $this->request->request->get('email'),
                            'phone' => $this->request->request->get('telephone'),
                        ]);
                        if (!empty($errors)) {
                            $error = array_merge($error, $errors);
                            $this->app['session']->set('paiement', $_POST);
                        } else {
                            $payment = $this->app['service.paiement']->getPaymentDatas('auction', $reservation['paymentId'], $token);
                        }
                    } catch (\Exception $ex) {
                        $error['reservation'] = 'Une erreur, sur la réservation, est survenue.';
                        $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                        $this->app['session']->set('paiement', $_POST);
                        $this->getLogger()->critical('Payment page error :' . $ex->getMessage());
                        $this->newRelicNoticeError("Payment page error", $ex);
                        if ($ex->getMessage() === '') {
                            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
                        }
                    }
                }

                // Check data passager
                if ($this->request->request->has('passager')) {
                    // get current datas
                    try {
                        // nbPassengers = 1, only 1 passenger is required
                        $errors = $this->getReservationService()->processingPassenger(
                            $reservation['id'],
                            1,
                            $passengers,
                            $this->request->request->get('passager'),
                            $this->request->request->get('dateTrip'),
                            $this->request->get('token'),
                            $this->getPassengerCustomFieldsFromRequest()
                        );
                        if (!empty($errors)) {
                            $error = array_merge($error, $errors);
                            $this->app['session']->set('paiement', $_POST);
                        } else {
                            $passengers = $this->app['apiclient.default']->get('/reservation/' . $resId . '/passenger/', ['token' => $token, 'fieldsStatus' => [1]])->getContent();
                        }
                    } catch (ApiDataException $ex) {
                        $error['reservation'] = 'Une erreur, sur la réservation, est survenue.';
                        $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                        $this->app['session']->set('paiement', $_POST);
                        $this->getLogger()->critical('Payment page error :' . $ex->getMessage());
                        $this->newRelicNoticeError("Payment page error (ApiDataException)", $ex);
                        if ($ex->getMessage() === '') {
                            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
                        }
                    } catch (\Exception $ex) {
                        $error['reservation'] = 'Une erreur, sur la réservation, est survenue.';
                        $this->app['session']->set('paiement', $_POST);
                        $this->getLogger()->critical('Payment page error :' . $ex->getMessage());
                        $this->newRelicNoticeError("Payment page error (Exception)", $ex);
                        if ($ex->getMessage() === '') {
                            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
                        }
                    }
                }

                // Reservation or passenger may have changed, check the whole reservation data
                if ($this->request->request->has('passager') || $this->request->request->has('availabilitie')) {
                    $error = $this->validateReservation($error, $reservation['id'], $this->request->get('token'));
                }
            }

            if ($reservation['status'] != 'post_payment' && $reservation['status'] != 'date_blocked') {
                $this->app['session']->getFlashBag()->add('error', "Cette réservation est déjà validée par le partenaire.");
                return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
            }

            $dataView['productImgs'] = $payment['images'];
            $dataView['product'] = $payment['product'];

            $dataView['confirmation'] = true;
            $dataView['voucher'] = $payment['productVoucher'];
            $dataView['userData'] = $this->app['apiclient.default']->get($payment['payment']['_links']['user'])->getContent();
            $dataView['userData']['location'] = $this->app['apiclient.default']->get($dataView['userData']['_links']['location'])->getContent();
            $dataView['hideOption'] = false;
            $dataView['token'] = $token;
            $dataView['useNxcb'] = false;
            $dataView['onlyReservation'] = true;
            $dataView['giftcardsMax'] = 0;
            $dataView['hideOption'] = true;
            $dataView['possibleInsurances'] = [];
            $dataView['isPostPayment'] = true;

            // Common datas
            $dataView['isPayment'] = false;

            // Define DEFAULT flow step
            $step = 1;
            if ($this->request->getMethod() === 'POST') {
                if (empty($error)) {
                    if ($this->request->request->has('back')) {
                        // back to prev step
                        $step = $this->request->request->get('back');
                    } else {
                        $step = $this->request->request->get('step') + 1;
                    }
                } else {
                    $step = $this->request->request->get('step');
                }
            }
            if (isset($reservation['payment']['step']) && $step > $reservation['payment']['step']) {
                $this->dataUpdate['step'] = $step;
            }

            $dataView['customFields'] = $payment['reservation']['customFields'];

            if ($step == 3) {
                $this->app['apiclient.default']->put(
                    "/reservation/{$reservation['id']}",
                    ['token' => $token, 'completed' => 1]
                );
                return $this->app['twig']->render('reservation/confirmation.twig');
            }

            // View data
            $dataView['checkoutFlow'] = $this->getAuctionService()->getCheckoutFlow($payment['product']['flow']);
            $dataView['currentStep'] = $step;
            $dataView['payment'] = $payment['payment'];
            $dataView['error'] = $error;

            $departureCities = $this->app['apiclient.default']->get($dataView['product']['_links']['departureCities'])->getContent();
            if (empty($departureCities)) {
                $availabilityParams = [
                    'product' => $payment['product']['id'],
                    'orderBy' => 'dateTrip',
                    'orderByDirection' => 'ASC',
                    'fromNow' => '1',
                ];
                if (isset($auction['id'])) {
                    $availabilityParams['auctionId'] = $payment['auction']['id'];
                    $availabilityParams['relativeToNbDay'] = true;
                }

                // Add the current reservation date to availabilities
                if (!empty($reservation['id'])) {
                    $availabilityParams['reservationId'] = $reservation['id'];
                }

                $departureCities[0] = [
                    'availabilities' => $this->app['apiclient.default']->getContentCached('/availability/', $availabilityParams),
                    'id' => 1, // So that the return corresponds to the existing one. CF: private function availabilities in ProductController
                    'name' => '', // Idem
                ];
                $dataView['availabilities'] = $departureCities;
            } else {
                $dataView['departureCities'] = $departureCities;
            }

            $dataView['reservation'] = $payment['reservation'];
            if ($reservation !== null) {
                if ($reservation['dateTrip']) {
                    $dataView['reservation']['dateTrip'] = date("d/m/Y", strtotime($reservation['dateTrip']));
                } else {
                    $dataView['reservation']['dateTrip'] = "";
                }
                if ($this->app['session']->get('paiement') === null || empty($this->app['session']->get('paiement'))) {
                    $passengers = array_map(function ($passenger) {
                        $passenger['birthDay'] = date('d/m/Y', strtotime($passenger['birthDay']));
                        return $passenger;
                    }, $passengers);

                    $dataView['dataSave'] = ['passager' => $passengers];
                    if ($payment['reservation']['_links']['availability'] !== null) {
                        $query = $this->app['apiclient.default']->get($payment['reservation']['_links']['availability'])->getContent();
                        $departureCity = $query['departureCity'];
                        $dataView['dataSave']['departureCity'] = $departureCity;
                    }
                } else {
                    $dataView['dataSave'] = $this->app['session']->get('paiement');
                }
            } else {
                $dataView['reservation']['dateTrip'] = null;
            }

            if ($step == 2) {
                $dataView['passengers'] = $passengers;
                $dataView['reservation']['departureCity'] = $departureCity = $this->app['apiclient.default']->get($payment['reservation']['_links']['availability'])->getContent();
                $dataView['reservation']['departureCity']['location'] = $this->app['apiclient.default']->get($departureCity['_links']['departureCity'])->getContent();
            }

            if ($dataView['isApp']) {
                $dataView['hideNavbar'] = true;
                $dataView['hideHeader'] = true;
            }

            $dataView['hideGototop'] = true;
            $dataView['breadcrumb'] = BreadCrumbService::getBreadCrumbByFlow($payment['product']['flow'])['steps'];
            $dataView['title'] = $dataView['breadcrumb'][$step]['title'];

            $twigTemplate = "reservation/step{$step}.twig";
        } catch (ApiDataException $e) {
            $this->getLogger()->critical('Payment page error :' . $e->getMessage());
            $this->app['logger']->critical('Payment page error :' . $e->getMessage());
            $this->app['session']->getFlashBag()->add('error', "Une erreur, sur le paiement, est survenue. Si le problème persiste, n'hésitez pas à nous contacter.");
            return $this->app->redirect($this->app['url_generator']->generate('user.auctions'));
        } catch (\Exception $ex) {
            $this->getLogger()->critical('Payment page error :' . $ex->getMessage());
            $this->newRelicNoticeError("Payment page error", $ex);
            if ($this->request->isXmlHttpRequest()) {
                return new JsonResponse(null, 400);
            } else {
                $this->app['session']->getFlashBag()->add('error', $ex->getMessage());
                $this->app['session']->set('paiement', $_POST);
            }

            switch ($dataView['productType']) {
                case 'auction':
                    return $this->app->redirect($this->app['url_generator']->generate('user.auctions'), 301);
                default:
                    return $this->app->redirect($this->app['url_generator']->generate('user.profile'), 301);
            }
        }

        return $this->app['twig']->render($twigTemplate, $dataView);
    }

    public function bookingOption(Request $request)
    {
        try {
            if (!$this->getLoggedInUser()) {
                throw new \Exception("Vous devez être connecté à votre compte");
            }

            $action = 'post';
            $uri = '/bookingoption/';
            if ($request->request->has('bookingOptionId')) {
                $action = $request->request->has('cancel') ? 'delete' : 'patch';
                $uri .= $request->request->get('bookingOptionId');
            }

            $result = $this->getDefaultClient()->$action($uri, [
                'userId' => $this->app['security']->getToken()->getUser(),
                'auctionId' => $request->request->get('auctionId'),
                'availabilityId' => $request->request->get('availabilityId'),
            ]);

            return new JsonResponse($result);
        } catch (\Exception $e) {
            return new JsonResponse($e->getMessage());
        }
    }
}
