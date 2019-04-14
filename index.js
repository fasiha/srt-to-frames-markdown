var USAGE = `USAGE:
$ node index.js SUBTITLES.SRT VIDEO.AVI
`;
var {parse} = require('subtitle');
var fs = require('fs');
if (process.argv.length < 3) {
  console.error(USAGE);
  process.exit(1);
}
var [srtFname, videoFname] = process.argv.slice(2);
var srtObj = parse(fs.readFileSync(srtFname, 'utf8'));
function* enumerate(v) {
  let i = 0;
  for (const x of v) { yield [i++, x]; }
}
function num2fname(num) { return (num + 1).toString().padStart(3, '0'); }
{
  let cmds = [];
  for (const [num, o] of enumerate(srtObj)) {
    let seconds = (0.5 * (o.start + o.end) * 1e-3).toFixed(3);
    let cmd = `ffmpeg -ss ${seconds} -i ${videoFname} -vframes 1 -q:v 2 ${num2fname(num)}.jpg`;
    cmds.push(cmd);
  }
  fs.writeFileSync('cmds.sh', cmds.join('\n'));
}
{
  let mdlines = [];
  for (const [num, o] of enumerate(srtObj)) {
    let fname = num2fname(num);
    let textNolines = o.text.replace(/\n/g, '');
    let quotedText = o.text.split('\n').map(x => '## ◊sent :: ? :: ' + x).join('\n\n');
    let block = `# ${fname}
![${textNolines}](${fname}.jpg)

${quotedText}

`;
    mdlines.push(block);
  }
  fs.writeFileSync('subs.md', mdlines.join('\n'));
}

console.log(`With a recent Pandoc you may now run
$ pandoc -f markdown-implicit_figures -i subs.md -o subs.html`);