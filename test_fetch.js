const url = "https://www.aliexpress.com/item/1005010435055773.html";
fetch(url, {headers: {'User-Agent': 'Mozilla/5.0'}})
  .then(r=>r.text())
  .then(t => { 
    console.log('Length:', t.length); 
    const matches = t.match(/"formatedActivityPrice":"([^"]+)"/g); 
    console.log('formatedActivityPrice:', matches ? matches.slice(0, 10) : 'Not found'); 
    const minPrice = t.match(/"minPrice":([0-9.]+)/g); 
    console.log('minPrice:', minPrice ? minPrice.slice(0, 5) : 'Not found'); 
    const targetPriceMatch = t.match(/"targetSalePrice":"([^"]+)"/g);
    console.log('targetSalePrice:', targetPriceMatch);
    const pdpPrice = t.match(/"price":"([^"]+)"/g);
    console.log('pdpPrice:', pdpPrice ? pdpPrice.slice(0, 5) : 'Not found');
  })
  .catch(console.error);
