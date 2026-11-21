const path=require('path'),fs=require('fs');
const savedApp=path.join(__dirname,'../boxing-companion/dist');
const appDir=fs.existsSync(savedApp)?savedApp:path.join(__dirname,'..');
require('esbuild').buildSync({entryPoints:[path.join(__dirname,'vendor-entry.js')],outfile:path.join(appDir,'supabase-client.js'),bundle:true,minify:true,format:'iife',platform:'browser',target:['es2020'],legalComments:'eof'});
