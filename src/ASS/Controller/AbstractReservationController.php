<?php


namespace ASS\Controller;

use ASS\Library\ArraysUtil;
use Symfony\Component\HttpFoundation\Request;

class AbstractReservationController extends BaseController
{
    /** @var Request */
    protected $request;

    protected function getPassengersCustomFields($reservationId)
    {
        return $this->app['apiclient.default']->get('/customfields/', ['reservationId' => $reservationId, 'target' => 1, 'status' => [1]])->getContent();
    }

    /**
     * Return array of different custom fields from request
     * @return mixed
     */
    protected function getCustomFieldsFromRequest()
    {
        $customFields = $this->request->get('customField') ?? [];
        $customFieldsDate = $this->request->get('customFieldDate') ?? [];
        $customFieldsTel = $this->request->get('customFieldTel') ?? [];

        return $customFields + $customFieldsDate + $customFieldsTel;
    }

    /**
     * Return array of different custom fields from request for passenger
     * @return array
     */
    protected function getPassengerCustomFieldsFromRequest()
    {
        $customFields = $this->request->get('passengerCustomField') ?? [];
        $customFieldsDate = $this->request->get('passengerDateCustomField') ?? [];
        $customFieldsTel = $this->request->get('passengerTelCustomField') ?? [];

        $allCustomFields = [];
        $allCustomFields = ArraysUtil::arrayMergeRecursiveDistinct($allCustomFields, $customFields);
        $allCustomFields = ArraysUtil::arrayMergeRecursiveDistinct($allCustomFields, $customFieldsDate);
        return ArraysUtil::arrayMergeRecursiveDistinct($allCustomFields, $customFieldsTel);
    }

    /**
     * Call validate endpoint, display error if something is wrong in the reservation data
     *
     * @param $error
     * @param $reservationId
     * @param $token
     * @return array
     */
    protected function validateReservation($error, $reservationId, $token)
    {
        try {
            $reservationError = $this->getReservationService()->processingValidation($reservationId, $token);
            if (!empty($reservationError['error'])) {
                $error = array_merge($error, $reservationError);
                $this->app['session']->set('paiement', $_POST);
                $this->app['session']->getFlashBag()->add('error', $reservationError['error']);
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

        return $error;
    }
}
