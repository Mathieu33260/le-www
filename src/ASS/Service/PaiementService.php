<?php

namespace ASS\Service;

use ASS\Form\LocationType;
use ASS\Form\CasinoType;
use Symfony\Component\Form\FormError;
use CAC\Component\ApiClient\ApiException;

class PaiementService
{
    private $apiclientDefault;
    private $app;

    public function __construct($apiclientDefault, $app)
    {
        $this->apiclientDefault = $apiclientDefault;
        $this->app = $app;
    }

    /**
     * Create array content for insurances options
     * @param array $possibleInsurances
     * @return array
     */
    public function insurancesContent($possibleInsurances)
    {
        $content = [];
        foreach ($possibleInsurances as $type => $price) {
            $content[$type] = [
                'price'     => $price,
                'title'     => '',
                'text'      => '',
                'option'    => false,
                'isOption'  => false,
            ];
            if ($type === 'none') {
                $content[$type]['title'] = 'Aucune';
                $content[$type]['text'] = "J'ai vérifié que je dispose bien d'une assurance rapatriement pour mes vacances.";
                $content[$type]['position'] = 5;
            } elseif ($type === 'multiple-risk') {
                $content[$type]['title'] = "Assurance multirisques ( avant votre départ + sur place )";
                $content[$type]['text'] = "Annulation sur justificatif <b>avant votre départ</b>, remboursement des frais médicaux <b>sur place</b>, assistance rapatriement et couverture de vos bagages sur place";
                $content[$type]['shortText'] = "Annulation sur justificatif <b>avant votre départ</b>, remboursement des frais médicaux <b>sur place</b>, assistance rapatriement et couverture de vos bagages sur place";
                $content[$type]['option'] = 'multiple-risk-no-reason';
                $content[$type]['modal'] = 'multirisque-AX2019200';
                $content[$type]['position'] = 3;
            } elseif ($type === 'multiple-risk-no-reason') {
                $content[$type]['title'] = 'Option Premium';
                $content[$type]['text'] = "Annulation sans motif <b>avant votre départ</b>";
                $content[$type]['shortText'] = "Annulation sans motif <b>avant votre départ</b>";
                $content[$type]['modal'] = 'multirisquePremium-AX2019203';
                $content[$type]['isOption'] = true;
                $content[$type]['position'] = 4;
            } elseif ($type === 'no-reason') {
                $content[$type]['title'] = 'Avant votre départ (annulation sans motif)';
                $content[$type]['text'] = "Soyez serein, annulez sans justificatif et sans motif <b>avant votre départ</b>.";
                $content[$type]['shortText'] = "Soyez serein, annulez sans justificatif et sans motif <b>avant votre départ</b>.";
                $content[$type]['modal'] = 'no-reason-AX2019208';
                $content[$type]['position'] = 1;
            } elseif ($type === 'mid-haul') {
                $content[$type]['title'] = 'Sur place (assistance rapatriement)';
                $content[$type]['text'] = "Remboursement des frais médicaux sur place, assistance rapatriement et couverture de vos bagages <b>sur place</b>";
                $content[$type]['shortText'] = "Remboursement des frais médicaux sur place, assistance rapatriement et couverture de vos bagages <b>sur place</b>";
                $content[$type]['modal'] = 'mid-haul-AX2019205';
                $content[$type]['position'] = 2;
            } elseif ($type === 'long-haul') {
                $content[$type]['title'] = 'Sur place (assistance rapatriement)';
                $content[$type]['text'] = "Remboursement des frais médicaux sur place, assistance rapatriement et couverture de vos bagages <b>sur place</b>";
                $content[$type]['shortText'] = "Remboursement des frais médicaux sur place, assistance rapatriement et couverture de vos bagages <b>sur place</b>";
                $content[$type]['modal'] = 'mid-haul-AX2019205';
                $content[$type]['position'] = 2;
            }
        }

        // Order the array by param position
        uasort($content, function ($a, $b) {
            if ($a['position'] == $b['position']) {
                return 0;
            }
            return ($a['position'] < $b['position']) ? -1 : 1;
        });

        return $content;
    }

    public function processingInsurance($insuranceType, $paymentId, $token)
    {
        return $this->apiclientDefault->post("/pay/$paymentId/insurance/?token=$token", ['insuranceType'=>$insuranceType])->getContent();
    }

    public function casinoEligibilite($paymentId, $token)
    {
        try {
            $payment = $this->apiclientDefault->get('/pay/'.$paymentId, ['token' => $token])->getContent();
            $paymentAmount = $payment['payment']['amount']/100;
            return [
                'threeTimes' => $paymentAmount >= $this->app['casino']['3x']['minAmount']
                    && $paymentAmount <= $this->app['casino']['3x']['maxAmount'],
                'fourTimes' => $paymentAmount >= $this->app['casino']['4x']['minAmount']
                    && $paymentAmount <= $this->app['casino']['4x']['maxAmount']];
        } catch (\Exception $ex) {
            $this->app['logger']->error($ex->getMessage(), ['exception'=>$ex]);
            return false;
        }
    }

    public function locationForm($request, $payment)
    {
        $dataView = [];
        $paymentLocation = [];
        if ($payment['location'] !== null) {
            $location = $payment['location'];
            $paymentLocation['street'] = $location['street'];
            $paymentLocation['housenumber'] = $location['housenumber'];
            $paymentLocation['zipcode'] = $location['zipcode'];
            $paymentLocation['city'] = $location['city'];
            $paymentLocation['country'] = $location['country'];
            if (!is_array($payment['location'])) {
                $paymentLocation['id'] = $payment['location'];
            }
        }

        $form = $this->app['form.factory']->create(new LocationType(['country' => 'blocked']), $paymentLocation);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $data = $form->getNormData();
            try {
                $locationDatas = [
                    'street'        => $data['street'] == null ? '':$data['street'],
                    'housenumber'   => '' ,
                    'zipcode'       => $data['zipcode'] == null ? '':$data['zipcode'],
                    'city'          => $data['city'] == null ? '':$data['city'],
                    'country'       => $data['country'] == null ? '':$data['country'],
                    'token'         => $request->get('token')
                ];

                $datasIsValide = true;
                if ($data['street'] == '') {
                    $dataView['error']['street'] = "Vous devez indiquer une adresse.";
                    $form->get('street')->addError(new FormError("Vous devez indiquer une adresse."));
                    $datasIsValide = false;
                }
                if ($data['zipcode'] == '') {
                    $dataView['error']['zipcode'] = "Vous devez indiquer un code postal.";
                    $form->get('zipcode')->addError(new FormError("Vous devez indiquer un code postal."));
                    $datasIsValide = false;
                }
                if ($data['city'] == '') {
                    $dataView['error']['city'] = "Vous devez indiquer une ville.";
                    $form->get('city')->addError(new FormError("Vous devez indiquer une ville."));
                    $datasIsValide = false;
                }
                if ($data['country'] == '') {
                    $dataView['error']['country'] = "Vous devez indiquer un pays.";
                    $form->get('country')->addError(new FormError("Vous devez indiquer un pays."));
                    $datasIsValide = false;
                }

                if ($datasIsValide) {
                    // update / insert payment location
                    if (isset($paymentLocation['id'])) {
                        $this->app['apiclient.default']->put("/payment/{$payment['id']}/location/{$paymentLocation['id']}", $locationDatas)->getContent();
                    } else {
                        $this->app['apiclient.default']->post("/payment/{$payment['id']}/location/", $locationDatas)->getContent();
                    }
                    return true;
                }
            } catch (ApiDataException $e) {
                $errors = $e->getErrors();
                foreach ($errors as $error) {
                    $form->get($error['field'])->addError(new FormError($this->app['translator']->trans('form.error'.$error['code'])));
                }
                return $form;
            }
        }

        $dataView['locationForm'] = $form->createView();
        return $dataView;
    }

    public function casinoForm($request, $rApi)
    {
        $dataView = [];
        $paymentCasinoLocation = [
            'userGender' => $rApi['payment']['userGender'],
            'userPhone' => $rApi['payment']['userPhone'],
            'userDateOfBirth' => $rApi['payment']['userDateOfBirth'],
            'userBirthZipcode' => $rApi['payment']['userBirthZipcode'],
            'userMaidenName' => $rApi['payment']['userMaidenName']
        ];

        if ($rApi['location'] !== null) {
            $location = $rApi['location'];
            $paymentCasinoLocation['street'] = $location['street'];
            $paymentCasinoLocation['zipcode'] = $location['zipcode'];
            $paymentCasinoLocation['city'] = $location['city'];
            $paymentCasinoLocation['country'] = $location['country'];
            $paymentCasinoLocation['location'] = $location['name'];
            if (!is_array($rApi['location'])) {
                $paymentCasinoLocation['id'] = $rApi['location'];
            }
        }

        $paymentCasinoLocation['userFirstName'] = (isset($rApi['payment']['userFirstName']) && $rApi['payment']['userFirstName'] != '') ? $rApi['payment']['userFirstName'] : $rApi['user']['userFirstName'] ;
        $paymentCasinoLocation['userLastName'] = (isset($rApi['payment']['userLastName']) && $rApi['payment']['userLastName'] != '') ? $rApi['payment']['userLastName'] : $rApi['user']['userLastName'] ;
        if (isset($rApi['payment']['platform'])) {
            $paymentCasinoLocation['method'] = $rApi['payment']['platform'];
        }

        if ($rApi['user'] !== null) {
            $user = $rApi['user'];
            if (!$paymentCasinoLocation['userGender']) {
                if ($user['gender'] == 'mr') {
                    $paymentCasinoLocation['userGender'] = '1';
                } elseif ($user['gender'] == 'mme') {
                    $paymentCasinoLocation['userGender'] = '2';
                }
            }
            if (!$paymentCasinoLocation['userDateOfBirth']) {
                $paymentCasinoLocation['userDateOfBirth'] = $user['birthday'];
            }
            if (!$paymentCasinoLocation['userPhone']) {
                $paymentCasinoLocation['userPhone'] = $user['telephone'];
            }
        }

        $form = $this->app['form.factory']->create(new CasinoType(['country' => 'blocked', 'choice' => $request->get('choice')]), $paymentCasinoLocation);
        $form->handleRequest($request);

        if ($form->isValid()) {
            $data = $form->getNormData();
            try {
                $locationDatas = [
                    'street'        => $data['street'] == null ? '':$data['street'],
                    'housenumber'   => '',
                    'zipcode'       => $data['zipcode'] == null ? '':$data['zipcode'],
                    'city'          => $data['city'] == null ? '':$data['city'],
                    'country'       => $data['country'] == null ? '':$data['country'],
                    'token'         => $request->get('token')
                ];

                $datasIsValide = true;
                if ($data['street'] == '') {
                    $dataView['error']['street'] = "Vous devez indiquer une adresse.";
                    $form->get('street')->addError(new FormError($dataView['error']['street']));
                    $datasIsValide = false;
                }
                if ($data['zipcode'] == '' || $data['zipcode'] == null) {
                    $dataView['error']['zipcode'] = "Vous devez indiquer un code postal.";
                    $form->get('zipcode')->addError(new FormError($dataView['error']['zipcode']));
                    $datasIsValide = false;
                }
                if ($data['city'] == '' || $data['city'] == null) {
                    $dataView['error']['city'] = "Vous devez indiquer une ville.";
                    $form->get('city')->addError(new FormError($dataView['error']['city']));
                    $datasIsValide = false;
                }
                if ($data['country'] == '') {
                    $dataView['error']['country'] = "Vous devez indiquer un pays.";
                    $form->get('country')->addError(new FormError($dataView['error']['country']));
                    $datasIsValide = false;
                }
                if ($data['userGender'] == '') {
                    $dataView['error']['userGender'] = "Vous devez indiquer votre civilité.";
                    $form->get('userGender')->addError(new FormError($dataView['error']['userGender']));
                    $datasIsValide = false;
                }
                if ($data['userGender'] == '2' && ($data['userMaidenName'] == '' || $data['userMaidenName'] == null)) {
                    $dataView['error']['userMaidenName'] = "Vous devez indiquer votre nom de jeune fille.";
                    $form->get('userMaidenName')->addError(new FormError($dataView['error']['userMaidenName']));
                    $datasIsValide = false;
                }
                if ($data['userFirstName'] == '') {
                    $dataView['error']['userFirstName'] = "Vous devez indiquer votre prénom.";
                    $form->get('userFirstName')->addError(new FormError($dataView['error']['userFirstName']));
                    $datasIsValide = false;
                }
                if ($data['userDateOfBirth'] == '') {
                    $dataView['error']['userDateOfBirth'] = "Vous devez indiquer votre date de naissance.";
                    $form->get('userDateOfBirth')->addError(new FormError($dataView['error']['userDateOfBirth']));
                    $datasIsValide = false;
                }
                if ($data['userBirthZipcode'] == '') {
                    $dataView['error']['userBirthZipcode'] = "Vous devez indiquer le code postal de votre ville de naissance.";
                    $form->get('userBirthZipcode')->addError(new FormError($dataView['error']['userBirthZipcode']));
                    $datasIsValide = false;
                }

                if ($datasIsValide) {
                    // update / insert payment location
                    if (isset($paymentCasinoLocation['id'])) {
                        $result = $this->app['apiclient.default']->put("/payment/{$rApi['payment']['id']}/location/{$paymentCasinoLocation['id']}", $locationDatas)->getContent();
                    } else {
                        $result = $this->app['apiclient.default']->post("/payment/{$rApi['payment']['id']}/location/", $locationDatas)->getContent();
                    }
                    return true;
                }
            } catch (ApiDataException $e) {
                $errors = $e->getErrors();
                foreach ($errors as $error) {
                    $dataView['error'][$error['field']] = new FormError($this->app['translator']->trans('location.form.error'.$error['code']));
                    $form->get($error['field'])->addError($dataView['error'][$error['field']]);
                }
                $dataView['casinoForm'] = $form->createView();
                return $dataView;
            } catch (\Exception $e) {
                $errors = $e->getErrors();
                foreach ($errors as $error) {
                    $dataView['error'][$error['field']] = new FormError($this->app['translator']->trans('location.form.error'.$error['code']));
                    $form->get($error['field'])->addError($dataView['error'][$error['field']]);
                }
                $dataView['casinoForm'] = $form->createView();
                return $dataView;
            }
        }

        $dataView['casinoForm'] = $form->createView();
        return $dataView;
    }

    public function getPayment($productType, $id)
    {
        switch ($productType) {
            case 'auction':
                return $this->app['apiclient.finance']->getPayment($id)->getContent();
            case 'giftcard':
                return $this->app['apiclient.finance']->getGiftcardPayment($id)->getContent();
            default:
                return null;
        }
    }

    /**
     * return all datas for an payment
     * @param string $productType
     * @param int $id
     * @param string $token
     * @param string $trackingUserStats
     */
    public function getPaymentDatas($productType, $id, $token, $trackingUserStats = false)
    {
        switch ($productType) {
            case 'auction':
                if ($trackingUserStats) {
                    return $this->app['apiclient.default']->get("pay/{$id}?token=$token&trackingUserStats=1")->getContent();
                }
                return $this->app['apiclient.default']->get("pay/{$id}?token=$token")->getContent();
            break;
            case 'giftcard':
                $result = ['productVoucher' => null];
                $result['payment'] = $this->app['apiclient.finance']->getGiftcardPayment($id)->getContent();
                return $result;
            break;
            default:
                return null;
        }
    }

    /**
     * Define methods payment
     * @param array $dataView
     * @param array $product
     * @return array
     */
    public function getPaymentMethods($dataView, $product, $payment)
    {
        $dataView['ancv'] = ($product != null && ($product['category'] == 'TO' || $product['category'] == 'HO')) ? true:false;
        $dataView['telephone'] = ($product != null && $product['category'] == 'TO') || $product == null ? false:true;
        $dataView['allowPaypal'] = ($dataView['isApp'] && $dataView['productType'] == 'auction') ? true : false;

        if ($dataView['productType'] === 'auction') {
            $dateCreated = new \DateTime($payment['created']);
            $dateCreated->add(new \DateInterval('P7D'));
            $currentDate = new \DateTime();
            $productFlow = isset($product['flow'])? $product['flow'] : '';
            $checkoutFlow =  $this->app['service.auction']->getCheckoutFlow($productFlow);
            if ($dateCreated < $currentDate || $checkoutFlow['hasConfirmationTO']) {
                $dataView['cheque'] = false;
                $dataView['virement'] = false;
            } else if ($dataView['order']) {
                $dataView['telephone'] = false;
                $dataView['cheque'] = false;
                $dataView['virement'] = false;
                $dataView['useNxcb'] = $this->casinoEligibilite($payment['id'], $payment['verification_token']);
                $dataView['useCasino'] = true;
            } else {
                $dataView['cheque'] = true;
                $dataView['virement'] = true;
            }
        } else {
            $dataView['cheque'] = false;
            $dataView['virement'] = false;
        }

        return $dataView;
    }
}
