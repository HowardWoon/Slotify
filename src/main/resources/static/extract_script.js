const fs = require('fs');
const html = fs.readFileSync('C:/Users/Acer/Documents/Slotify/src/main/resources/static/index.html', 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatch) {
    const scriptContent = scriptMatch[1];
    fs.writeFileSync('C:/Users/Acer/Documents/Slotify/src/main/resources/static/test_script.js', scriptContent);
    console.log("Script extracted. Run node test_script.js to check for syntax errors.");
} else {
    console.log("No script tag found.");
}
