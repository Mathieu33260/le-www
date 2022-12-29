<?php

namespace ASS\Service;

use ASS\Api\ApiClient\DefaultClient;
use CAC\Component\ApiClient\ApiException;

class ReservationService
{

    private $app;

    public function __construct($app)
    {
        $this->app = $app;
    }

    /**
     * Check if all reservation data are valid
     * Put reservation if valid else returns errors
     * @param array $params
     * @return array
     */
    public function processingReservation($params)
    {
        $isValid = true;
        $errors = [];
        $params['reservation']['customFields'] = $params['customFieldsValues'];

        // Date availability
        if ($params['availability'] == 0) {
            if ($params['reservation']['status'] === 'post_payment') {
                $errors['availabilitie'] = "Vous devez choisir une date de séjour.";
            } elseif (isset($params['transportType']) && $params['transportType'] !== 'notincluded') {
                $errors['availabilitie'] = "Vous devez choisir une ville et une date de départ.";
            } else {
                $errors['availabilitie'] = "Merci de finaliser vos choix";
            }
            $isValid = false;
        } else {
            $params['reservation']['availability'] = $params['availability'];
        }
        // Email
        if (isset($params['email']) && $params['email'] !== null) {
            if ($params['email'] == '') {
                $errors['email'] = "Vous devez indiquer votre adresse email.";
                $isValid = false;
            } else {
                $params['reservation']['email'] = $params['email'];
            }
        }
        // Phone
        if (isset($params['phone']) && $params['phone'] !== null) {
            if ($params['phone'] == '') {
                $errors['telephone'] = "Vous devez indiquer votre numéro de téléphone.";
                $isValid = false;
            } else {
                $params['reservation']['telephone'] = $params['phone'];
            }
        }

        if ($isValid) {
            unset($params['reservation']['status']);
            unset($params['reservation']['dateBlocked']);
            try {
                $this->app['apiclient.default']->put(
                    "/reservation/{$params['reservation']['id']}",
                    $params['reservation']+['token' => $params['token']]
                )->getContent();
            } catch (ApiException $e) {
                if (\is_array(json_decode($e->getMessage(), true))) {
                    return json_decode($e->getMessage(), true);
                } else {
                    throw $e;
                }
            }
        }

        return $errors;
    }

    /**
     * @param $passager
     * @param int $key index of the user
     * @param $dateTrip
     * @param null $minNbPassagers
     * @return array|null
     */
    public function validatePassenger($passager, $key, $dateTrip, $minNbPassagers = null)
    {
        $errors = [];

        $nbErrors = 0;
        $PASSAGER_EMPTY_NB_ERRORS = 4;

        $sentence = 'Ce champ est obligatoire';
        if ($key >= $minNbPassagers) {
            $sentence = 'Ce champ est manquant';
        }

        if (!isset($passager['firstName']) || $passager['firstName'] === '') {
            $errors['passager'][$key]['firstName'] = $sentence;
            $nbErrors++;
        }
        if (!isset($passager['lastName']) || $passager['lastName'] === '') {
            $errors['passager'][$key]['lastName'] = $sentence;
            $nbErrors++;
        }
        if (!isset($passager['birthDay']) || $passager['birthDay'] === '') {
            $errors['passager'][$key]['birthDay'] = $sentence;
            $nbErrors++;
        }
        if (isset($passager['birthDay']) && $passager['birthDay'] !== '' && $key == 0) {
            // check if first passenger is major
            $a_birthDay = explode('/', $passager['birthDay']);
            $birthDay = new \DateTime("{$a_birthDay[2]}-{$a_birthDay[1]}-{$a_birthDay[0]}");
            $dateTrip = new \DateTime($dateTrip);
            $diff = $birthDay->diff($dateTrip);
            if (ceil($diff->y) < 18) {
                $errors['passager'][$key]['birthDay'] = "Le premier passager doit être majeur le jour du départ.";
                $nbErrors = 100; // it is always an error
            }
        }
        if (!isset($passager['gender'])) {
            $errors['passager'][$key]['gender'] = $sentence;
            $nbErrors++;
        } elseif ($nbErrors == $PASSAGER_EMPTY_NB_ERRORS-1) { // can't cancel radio button
            $nbErrors++;
        }
        if ($minNbPassagers != null && $key >= $minNbPassagers && $nbErrors == $PASSAGER_EMPTY_NB_ERRORS) { // if passenger is optional and no field is filled
            return null;
        }
        return $errors;
    }

    /**
     * @param $reservationId
     * @param $postPassenger
     * @param $dateTrip
     * @param $token
     * @param null $minNbPassagers
     * @param array $customFields
     * @return array|null
     */
    private function insertPassenger($reservationId, $postPassenger, $dateTrip, $token, $minNbPassagers = null, $customFields = null)
    {
        foreach ($postPassenger as $key => $passenger) {
            $errors = $this->validatePassenger($passenger, $key, $dateTrip, $minNbPassagers);

            if ($errors === null) {
                continue;
            } elseif (empty($errors)) {
                if (empty($customFields[$key])) {
                    $customFieldsData = null;
                } else {
                    $customFieldsData = $customFields[$key];
                }
                $data = [
                    'token'         => $token,
                    'reservation'   => $reservationId,
                    'firstName'     => ucfirst($passenger['firstName']),
                    'lastName'      => strtoupper($passenger['lastName']),
                    'birthDay'      => date($postPassenger[$key]['birthDay']),
                    'gender'        => $passenger['gender'],
                    'passengerIndex' => $key,
                    'customFields'  => $customFieldsData
                ];
                try {
                    $this->app['apiclient.default']->post("/passenger/", $data)->getContent();
                } catch (ApiException $e) {
                    if (\is_array(json_decode($e->getMessage(), true))) {
                        return json_decode($e->getMessage(), true);
                    } else {
                        throw $e;
                    }
                }
            } else {
                return $errors;
            }
        }
        return [];
    }

    /**
     * @param $reservationId
     * @param $passengers
     * @param $postPassenger
     * @param $dateTrip
     * @param $token
     * @param null $minNbPassagers
     * @param array $customFields
     * @return array|null
     */
    private function updatePassenger($reservationId, $passengers, $postPassenger, $dateTrip, $token, $minNbPassagers = null, $customFields = null)
    {
        foreach ($passengers as $key => $passenger) {
            $errors = $this->validatePassenger($postPassenger[$key], $key, $dateTrip, $minNbPassagers);

            if ($errors === null) {
                continue;
            } elseif (empty($errors)) {
                if (empty($customFields[$key])) {
                    $customFieldsData = null;
                } else {
                    $customFieldsData = $customFields[$key];
                }
                $data = [
                    'firstName'     => ucfirst($postPassenger[$key]['firstName']),
                    'lastName'      => strtoupper($postPassenger[$key]['lastName']),
                    'birthDay'      => date($postPassenger[$key]['birthDay']),
                    'gender'        => $postPassenger[$key]['gender'],
                    'token'         => $token,
                    'passengerIndex' => $key,
                    'customFields'  => $customFieldsData
                ];
                try {
                    $this->app['apiclient.default']->put("/passenger/{$passenger['id']}", $data)->getContent();
                    unset($postPassenger[$key]);
                } catch (ApiException $e) {
                    if (\is_array(json_decode($e->getMessage(), true))) {
                        return json_decode($e->getMessage(), true);
                    } else {
                        throw $e;
                    }
                }
            } else {
                return $errors;
            }
        }
        $errors = [];
        if (!empty($postPassenger)) {
            // Add passenger missing
            $errors = $this->insertPassenger($reservationId, $postPassenger, $dateTrip, $token, $minNbPassagers, $customFields);
        }
        return $errors;
    }

    /**
     * @param $reservationId
     * @param $nbPassenger
     * @param $passengers
     * @param $postPassenger
     * @param $dateTrip
     * @param $token
     * @param array $customFields
     * @return array|null
     */
    public function processingPassenger($reservationId, $nbPassenger, $passengers, $postPassenger, $dateTrip, $token, $customFields = null)
    {
        if (empty($passengers)) {
            // Insert passengers
            $errors = $this->insertPassenger($reservationId, $postPassenger, $dateTrip, $token, $nbPassenger, $customFields);
            if (!empty($errors)) {
                return $errors;
            }
        } else {
            // Update passenger
            $errors = $this->updatePassenger($reservationId, $passengers, $postPassenger, $dateTrip, $token, $nbPassenger, $customFields);
            if (!empty($errors)) {
                return $errors;
            }
        }
        $errors = [];

        if ($nbPassenger > count($postPassenger)) {
            for ($i=count($postPassenger); $i<$nbPassenger; $i++) {
                $errors['passager'][$i]['firstName'] = 'Ce champ est obligatoire';
                $errors['passager'][$i]['lastName'] = 'Ce champ est obligatoire';
                $errors['passager'][$i]['birthDay'] = 'Ce champ est obligatoire';
            }
        }

        return $errors;
    }

    /**
     * Validate data
     * @param $reservationId
     * @param $token
     * @return mixed
     * @throws ApiException
     */
    public function processingValidation($reservationId, $token)
    {
        try {
            return $this->app['apiclient.default']->get(
                "/reservation/$reservationId",
                ['token' => $token, 'validate' => 1]
            )->getContent();
        } catch (ApiException $e) {
            if (\is_array(json_decode($e->getMessage(), true))) {
                return json_decode($e->getMessage(), true);
            } else {
                throw $e;
            }
        }
    }
}
