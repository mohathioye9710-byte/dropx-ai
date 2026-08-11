const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'api', 'shopify', 'push', 'route.js');
let content = fs.readFileSync(filePath, 'utf8');

// The goal is to replace the generic light theme with a dark/neon futuristic theme.

// General Backgrounds & Text
content = content.replace(/background:\s*#fff/g, 'background: #050505');
content = content.replace(/background:\s*#f9f9f9/g, 'background: #0a0a0a');
content = content.replace(/color:\s*#111/g, 'color: #ffffff');
content = content.replace(/color:\s*#555/g, 'color: #a1a1aa');
content = content.replace(/color:\s*#666/g, 'color: #999999');
content = content.replace(/color:\s*#888/g, 'color: #888888');

// Pink Accents to Emerald Green
content = content.replace(/background:\s*#fce7f3/g, 'background: rgba(16,185,129,0.1)');
content = content.replace(/background:\s*#fdf2f8/g, 'background: rgba(16,185,129,0.05)');
content = content.replace(/color:\s*#c85a7c/g, 'color: #10b981');

// Borders
content = content.replace(/border:\s*1px solid #eaeaea/g, 'border: 1px solid rgba(255,255,255,0.05)');
content = content.replace(/border:\s*1px solid #eee/g, 'border: 1px solid rgba(255,255,255,0.05)');
content = content.replace(/border:\s*1px solid #ccc/g, 'border: 1px solid rgba(255,255,255,0.1)');
content = content.replace(/border-bottom:\s*1px solid #f0f0f0/g, 'border-bottom: 1px solid rgba(255,255,255,0.05)');
content = content.replace(/border-top:\s*1px solid #eee/g, 'border-top: 1px solid rgba(255,255,255,0.05)');

// Buttons & Specific logic elements in script part
content = content.replace(/'2px solid #16a34a'/g, "'2px solid #10b981'");
content = content.replace(/'#fdf2f8'/g, "'rgba(16,185,129,0.05)'");
content = content.replace(/'#fff'/g, "'#050505'");
content = content.replace(/'#c85a7c'/g, "'#10b981'");
content = content.replace(/'#111'/g, "'#ffffff'");
content = content.replace(/'1px solid #ccc'/g, "'1px solid rgba(255,255,255,0.1)'");

// Add Glowing effect to the Add to Cart button
content = content.replace(/background:\s*#111;\s*color:\s*#fff/g, 'background: #10b981; color: #000; box-shadow: 0 0 20px rgba(16,185,129,0.4)');

// Fix the CSS in <style> block inside the script
content = content.replace(/\.dropx-option-btn \{[^\}]+\}/, ".dropx-option-btn { display: inline-block; padding: 8px 16px; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: #fff; background: #0a0a0a; transition: all 0.2s; margin: 4px; }");
content = content.replace(/\.dropx-option-btn:hover \{[^\}]+\}/, ".dropx-option-btn:hover { border-color: #10b981; }");
content = content.replace(/\.dropx-option-btn\.active \{[^\}]+\}/, ".dropx-option-btn.active { border-color: #10b981; background: rgba(16,185,129,0.1); color: #10b981; }");

// Replace 'Haute Qualité' with a more futuristic term
content = content.replace(/Haute Qualité/g, 'FUTURISTIC & PREMIUM');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update complete');
