const constants = require('./constants.js');
const specs = require('./specs.js');
const async = require('async');

// Offers

// Pre:
// Post:
export function syncOffer(id, callback) {
  let exchangeContract;
  Exchange.deployed()
  .then((result) => {
    exchangeContract = result;
    return exchangeContract.offers(id);
  })
  .then((res) => {
    const [sellHowMuch, sellWhichTokenAddress, buyHowMuch, buyWhichTokenAddress, owner, active] = res;
    if (active) {
      const sellPrecision = specs.getTokenPrecisionByAddress(sellWhichTokenAddress);
      const buyPrecision = specs.getTokenPrecisionByAddress(buyWhichTokenAddress);
      const sellSymbol = specs.getTokenSymbolByAddress(sellWhichTokenAddress);
      const buySymbol = specs.getTokenSymbolByAddress(buyWhichTokenAddress);
      const buyHowMuchValue = buyHowMuch / (Math.pow(10, buyPrecision));
      const sellHowMuchValue = sellHowMuch / (Math.pow(10, sellPrecision));
      const offer = {
        id,
        owner,
        buyWhichTokenAddress,
        buyWhichToken: buySymbol,
        sellWhichTokenAddress,
        sellWhichToken: sellSymbol,
        buyHowMuch: buyHowMuchValue.toString(10),
        sellHowMuch: sellHowMuchValue.toString(10),
        ask_price: buyHowMuchValue / sellHowMuchValue,
        bid_price: sellHowMuchValue / buyHowMuchValue,
      };
      callback(null, offer);
    } else {
      callback('Not active', undefined);
    }
  });
}

// Pre:
// Post:
export function sync(callback) {
  let exchangeContract;
  Exchange.deployed()
  .then((result) => {
    exchangeContract = result;
    return exchangeContract.lastOfferId();
  })
  .then((result) => {
    const numOffers = result.toNumber();
    async.times(numOffers, (id, callbackMap) => {
      syncOffer(id + 1, (err, offer) => {
        if (!err) {
          callbackMap(null, offer);
        } else if (err === 'Not active') {
          callbackMap(null, undefined);
        } else {
          callbackMap(err, undefined);
        }
      });
    }, (err, offers) => {
      callback(null, offers);
    });
  });
}
