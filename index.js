const program = require('commander');
const { DOMParser, XMLSerializer } = require('xmldom');
const xpath = require('xpath');
const fsPromises = require('fs').promises;
const fs = require('fs');


const masktHtmlInFolder = async (inputFolders, outputFolders, xpathExp) => {
  const domParser = new DOMParser();
  const xmlSerializer = new XMLSerializer();
  const inputFolderArray = inputFolders.split(',');
  const outputFolderArray = outputFolders.split(',');
  if (inputFolderArray.length !== outputFolderArray.length) {
    console.error('input folder length number need to be same as output folder array length!');
    process.exit(1);
  }
  for (let i = 0; i < inputFolderArray.length; i++) {
    const inputFolder = inputFolderArray[i];
    const outputFolder = outputFolderArray[i];
    const fileList = await fsPromises.readdir(inputFolder);
    fileList.forEach(async (file) => {
      const url = `${inputFolder}/${file}`;
      const htmlStr = await fsPromises.readFile(url, 'utf8');
      const doc = domParser.parseFromString(htmlStr);
      const nodes = xpath.select(xpathExp, doc);

      if (nodes.length > 0) {
        const node = nodes[0];
        const text = node.textContent;
        const { length } = text;
        const lengthToKeep = Math.floor(text.length / 4);
        const lengthToMask = text.length - lengthToKeep * 2;
        const newText = `${text.substring(0, length / 4)}${'x'.repeat(lengthToMask)}${text.substring((length * 3) / 4)}`;
        node.textContent = newText;
        const newDocStr = xmlSerializer.serializeToString(doc);
        const outputUrl = `${outputFolder}/${file}`;

        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder);
        }
        await fsPromises.writeFile(outputUrl, newDocStr);
      }
    });
  }
};

program
  .option('-d, --dirs <dirs>', 'array of directory of html to convert seperate in comma');
program
  .option('-o, --outputDirs <outputDirs>', 'the directory to export the masked html');
program
  .option('-x, --xpath <xpath>', 'the element to mask using by xpath expression');
program.parse(process.argv);

if (program.dirs) {
  masktHtmlInFolder(program.dirs, program.outputDirs, program.xpath);
}
