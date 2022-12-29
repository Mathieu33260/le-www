<?php

namespace acceptance\Register;

use AcceptanceTester;

class RegistrationCest
{
    public function _before(AcceptanceTester $I)
    {
    }

    public function _after(AcceptanceTester $I)
    {
    }

    /**
     * Test register with modal
     *
     * @param AcceptanceTester $I
     * @throws \Exception
     */
    public function tryToTest(AcceptanceTester $I)
    {
        $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < 10; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }
        $email = $randomString . '@acceptance.com';
        $I->amOnPage('/');
        $I->waitForElementVisible('button[class="btn btn-sm register btn-default"]', 30);
        $I->click('button[class="btn btn-sm register btn-default"]');
        $I->waitForElementVisible('#registerModal', 30);
        $I->canSee('Inscription avec e-mail', 'button[class="btn btn-warning btn-block center-block"]');
        $I->click('button[class="btn btn-warning btn-block center-block"]');
        $I->submitForm('#formulaire', [
            'email' => $email,
            'firstName' => 'Acceptance',
            'lastName' => 'Register',
            'password' => 'testtest',
            'newsletter' => "1",
        ], 'button[class="Form__button btn btn-warning"]');
        $I->waitForText('Consultez votre adresse ' . $email . ' et cliquez sur le lien dans l\'e-mail que nous venons de vous envoyer pour confirmer votre inscription.', 30);
        $I->cantSee('Cet e-mail est déjà associé à un compte, veuillez vous connecter pour continuer');
    }
}
