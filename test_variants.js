async function test() {
  const r = await fetch('https://www.aliexpress.com/item/1005008169143762.html');
  const html = await r.text();
  const match = html.match(/"productSKUPropertyList":(\[.*?\]),"hasSkuProperty"/);
  if(match) {
     console.log(match[1].substring(0, 200));
     const data = JSON.parse(match[1]);
     console.log(data.map(p => ({ name: p.skuPropertyName, values: p.skuPropertyValues.map(v => v.propertyValueDefinitionName) })));
  } else {
     console.log('not found');
  }
}
test();
