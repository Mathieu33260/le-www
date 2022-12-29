<?php

namespace ASS\Service;

use ASS\Api\ApiClient\DefaultClient;
use Symfony\Component\HttpFoundation\Request;

class OrderService
{
    /** @var DefaultClient */
    private $client;

    public function __construct($client)
    {
        $this->client = $client;
    }

    /**
     * @param Request $request
     * @param $order
     */
    public function updateOrderAndLocation(Request $request, $order): void
    {
        $payload = [
            'customer' => [
                'gender' => $request->get('gender'),
                'firstName' => $request->get('firstName'),
                'lastName' => $request->get('lastName'),
                'email' => $request->get('email'),
                'phone' => $request->get('phone'),
                'mobile' => $request->get('mobile'),
            ],
            'location' => [
                'houseNumber' => $request->get('houseNumber'),
                'street' => $request->get('street'),
                'addressSupplement' => $request->get('addressSupplement'),
                'mailbox' => $request->get('mailbox'),
                'zipCode' => $request->get('zipCode'),
                'city' => $request->get('city'),
                'country' => 'FR'
            ]
        ];
        $this->client->put('/order/' . $order['id'], $payload);
    }

    /**
     * Update the order status by patch method
     * @param $id
     * @param $status
     */
    public function updateStatus($id, $status)
    {
        $this->client->patch('/order/' . $id, ['status' => $status])->getContent();
    }

    /**
     * Return true if merchant accept the transaction, false if not available, null if product is not related to merchant validation
     * @param $orderId
     * @return bool|null
     */
    public function isOrderAcceptedByMerchant($orderId): ?bool
    {
        return $this->client->post('/order/' . $orderId . '/validation/')->getContent();
    }
}
