import { bindAuction, gaSendImpressionAuction } from "../../function/ass.auctionManager";

/**
 * initAuctions bind every auction and returns a promise resolved when all auctions have been bound
 * @param {Array} auctions
 * @param {Object} context
 * @return {Promise}
 */
export const initAuctions = (auctions, context) => new Promise((resolve) => {
    auctions.forEach((auction, index) => {
      bindAuction(auction, context, index);
      if (index === auctions.length - 1) {
        gaSendImpressionAuction();
        resolve();
      }
    })
  })
