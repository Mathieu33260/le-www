<?php

declare(strict_types=1);

namespace ASS\Service;

final class EulerianEncryptor
{
    private const MAGIC = 'Salted__';
    private const ENCRYPTION_METHOD = 'AES-256-CBC';
    private const SHA_METHOD = 'SHA256';
    private const NKEY = 32;
    private const NIV = 16;
    private const EULERIAN_RECOGNITION_PREFIX = 0;

    /**
     * @var string
     */
    private $secret;

    public function __construct(string $secret)
    {
        $this->secret = $secret;
    }

    public function encrypt(string $value): string
    {
        $salt = $this->generateSalt();
        $keyiv = $this->evpBytesToKey($salt);
        $encryptedValue = openssl_encrypt($value, self::ENCRYPTION_METHOD, $keyiv['key'], OPENSSL_RAW_DATA, $keyiv['iv']);

        $encodedValue = base64_encode(sprintf('%s%s%s', self::MAGIC, $salt, $encryptedValue));

        return sprintf('%s%s', self::EULERIAN_RECOGNITION_PREFIX, $encodedValue);
    }

    public function decrypt(string $value): string
    {
        $valueMinusEulerianPrefix = substr($value, 1);
        $decodedValue = base64_decode($valueMinusEulerianPrefix);
        $magic = substr($decodedValue, 0, 8);
        if (!$this->isSameMagic($magic)) {
            return '';
        }
        $salt = substr($decodedValue, 8, 8);
        $decodedValue = substr($decodedValue, 16);
        $keyiv = $this->evpBytesToKey($salt);
        
        return openssl_decrypt($decodedValue, self::ENCRYPTION_METHOD, $keyiv['key'], OPENSSL_RAW_DATA, $keyiv['iv']);
    }

    private function generateSalt(): string
    {
        return random_bytes(8);
    }

    private function isSameMagic(string $magic): bool
    {
        return $magic === self::MAGIC;
    }

    /**
     * @return string[string]
     */
    private function evpBytesToKey(string $salt): array
    {
        $mdBuf = '';
        $key = '';
        $iv = '';
        $addmd = 0;
        while (strlen($key) < self::NKEY || strlen($iv) < self::NIV) {
            $mdSbuf = '';
            if ($addmd) {
                $mdSbuf .= $mdBuf;
            } else {
                $addmd++;
            }

            $mdSbuf .= $this->secret;
            $mdSbuf .= $salt;
            $mdBuf = openssl_digest($mdSbuf, self::SHA_METHOD, true);
            $mdBuf2 = $mdBuf;
            $pos = self::NKEY - strlen($key);
            $key .= substr($mdBuf2, 0, $pos);
            $mdBuf2 = substr($mdBuf2, $pos);

            $iv .= substr($mdBuf2, 0, self::NIV - strlen($iv));
        }

        return ['key' => $key, 'iv' => $iv];
    }
}
