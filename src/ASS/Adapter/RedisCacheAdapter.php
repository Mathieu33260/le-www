<?php

namespace ASS\Adapter;

use Guzzle\Cache\AbstractCacheAdapter;
use Predis\Client;

/**
 * @todo remove
 */
class RedisCacheAdapter extends AbstractCacheAdapter
{

    private $client;

    /**
     * @param Client $client
     */
    public function __construct(Client $client)
    {
        $this->client = $client;
    }

    public function contains($id, array $options = null)
    {
        return $this->client->exists($id) > 0;
    }

    public function delete($id, array $options = null)
    {
        return $this->client->del($id);
    }

    public function fetch($id, array $options = null)
    {
        $result = $this->client->get($id);

        if (null === $result) {
            return false;
        }

        return unserialize($result);
    }

    public function save($id, $data, $lifeTime = false, array $options = null)
    {
        $data = serialize($data);
        if ($lifeTime > 0) {
            $response = $this->client->setex($id, $lifeTime, $data);
        } else {
            $response = $this->client->set($id, $data);
        }
        return $response->getPayload()=== true || $response->getPayload() == 'OK';
    }

    public function purge($id)
    {
        return $this->client->del($id);
    }
}
