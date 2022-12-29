<?php

namespace acceptance\QuickOverBid\FromAnonyme;

use AcceptanceTester;
use Facebook\WebDriver\WebDriverElement;

class AllButtonCest
{
    private $amount;
    private $newAmount;
    private $firstOverBidAmount;

    /**
     * @param AcceptanceTester $I
     * @throws \Exception
     */
    public function _before(AcceptanceTester $I)
    {
    }

    public function _after(AcceptanceTester $I)
    {
    }

    /**
     * Test to bid
     *
     * @param AcceptanceTester $I
     * @throws \Exception
     */
    public function tryToTest(AcceptanceTester $I)
    {
        $I->amOnPage('/product/1700');

        $status = count($I->grabMultiple('span[class*="time-status"]'));

        if ($status > 0) {
            $I->comment("L'enchère est terminé, pas de tests.");
        } else {
            $I->waitForElementVisible('.close-cookie-content', 30);
            $I->click(".close-cookie-content");

            $I->waitForElementVisible('div[id="bidmodule"]', 30);

            $end = $I->grabAttributeFrom('#detailAuctionBids', 'data-time-end');
            $dateEnd = new \DateTime($end);
            $dateEnd->modify('- 60 seconds');
            $now = new \DateTime();
            if ($now > $dateEnd) {
                $I->comment("L'enchère va bientot se terminer, on attend qu'une nouvelle redemarre pour continuer.");
                $I->waitForText('L\'enchère est terminée', 60);
                $I->amOnPage('/product/1700');
                $I->waitForElementVisible('div[id="bidmodule"]', 30);
            }

            $I->waitForElementVisible('.btInput', 30);
            $I->waitForElementClickable('.btInput > button:first-child', 30);
            $I->waitForElementClickable('.btInput > button:nth-child(2)', 30);
            $I->waitForElementClickable('.btInput > button:nth-child(3)', 30);

            for ($i = 1; $i <= 3; $i++) {
                $I->waitForElementChange('span[class*="bid-amount"]', function (WebDriverElement $element) {
                    return $element->getText() != '';
                }, 30);

                $this->amount = $I->grabTextFrom('span[class*="bid-amount"]');
                $this->firstOverBidAmount = $I->grabTextFrom('.btInput > button:nth-child(' . $i . ')');
                $this->firstOverBidAmount = str_replace('+', '', $this->firstOverBidAmount);
                $this->firstOverBidAmount = str_replace(' #', '', $this->firstOverBidAmount);
                $this->firstOverBidAmount = (int) $this->firstOverBidAmount;

                $I->clickWithLeftButton('.btInput > button:nth-child(' . $i . ')');

                if ($i === 1) {
                    $I->waitForElementVisible('#registerModal', 30);
                    $I->waitForElementVisible('button[class*="btn btn-warning btn-block center-block"]', 30);
                    $I->canSee('Inscription avec e-mail', 'button[class*="btn btn-warning btn-block center-block"]');

                    $I->canSee('Vous êtes déjà membre ?');
                    $I->canSee('Connexion');
                    $I->click('Connexion', '#registerModal');

                    $I->waitForElementVisible('#loginModal', 30);
                    $I->submitForm('#loginModal form', [
                        '_username' => 'mathieu.dumez@loisirsencheres.com',
                        '_password' => 'testtest',
                    ], '#btn_connect_popup button');
                    $I->waitForElementVisible('button[id="userMenuBtn"]', 30);
                }

                $I->waitForElementVisible('form[id="confirmBidSteps"]', 30);

                $I->submitForm('form[id="confirmBidSteps"]', [
                    'engagement' => true
                ], ['class*="btn btn-warning center-block"']);
                $I->cantSee('Une erreur est survenue.', 'div[class*="error_unknown"]');

                // wait for firebase
                $I->waitForElementChange('span[class*="bid-amount"]', function (WebDriverElement $element) {
                    return $element->getText() == ($this->amount + $this->firstOverBidAmount);
                }, 30);

                $this->newAmount = $I->grabTextFrom('span[class*="bid-amount"]');

                $I->canSee($this->newAmount, 'span[class*="bid-amount"]');
                $I->canSee('Mat', 'span[id="currentBidOwner"]');
            }
        }
    }
}
