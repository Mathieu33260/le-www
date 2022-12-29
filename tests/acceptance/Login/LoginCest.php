<?php

namespace acceptance\Login;

use AcceptanceTester;

class LoginCest
{
    public function _before(AcceptanceTester $I)
    {
    }

    public function _after(AcceptanceTester $I)
    {
    }

    /**
     * Test login with modal
     *
     * @param AcceptanceTester $I
     * @throws \Exception
     */
    public function tryToTest(AcceptanceTester $I)
    {
        $I->amOnPage('/');
        $I->waitForElementVisible('button[class="btn btn-sm login btn-transparent"]', 30);
        $I->click('button[class="btn btn-sm login btn-transparent"]');
        $I->waitForElementVisible('#loginModal', 30);
        $I->submitForm('#loginModal form', [
            '_username' => 'user@loisirsentest.com',
            '_password' => 'testtest',
        ], '#btn_connect_popup button');
        $I->waitForElementVisible('button[id="userMenuBtn"]', 30);
        $I->waitForText("User", 30);
        $I->see("Mon compte");
    }
}
