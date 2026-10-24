// Pricing calculator for print jobs

const PRICING = {
  BLACK_AND_WHITE: 2.00,  // Rs 2 per page
  COLOR: 5.00,            // Rs 5 per page
  CURRENCY: 'INR'
};

function calculatePrice(pageCount, isColor) {
  const pricePerPage = isColor ? PRICING.COLOR : PRICING.BLACK_AND_WHITE;
  const totalPrice = pageCount * pricePerPage;
  
  return {
    pageCount,
    isColor,
    pricePerPage,
    totalPrice,
    currency: PRICING.CURRENCY
  };
}

module.exports = {
  calculatePrice,
  PRICING
};
