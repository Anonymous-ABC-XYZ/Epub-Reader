import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
function unpackEpub(epubPath, epubName) {
  const zip = new AdmZip(epubPath);
  const zipEntries = zip.getEntries();

  zipEntries.forEach((entry) => {
    const entryName = entry.entryName;
    const outputFilePath = path.join(
      __dirname,
      "../../public/books/",
      epubName,
      entryName,
    );

    console.log(`Extracting to: ${outputFilePath}`);

    if (entry.isDirectory) {
      if (!fs.existsSync(outputFilePath)) {
        fs.mkdirSync(outputFilePath, { recursive: true });
      }
    } else {
      const dir = path.dirname(outputFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputFilePath, entry.getData());
    }
  });
  const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../../public/books.json"), "utf8"),
  );
  data.push({
    title: epubName,
    href: `/books/${epubName}`,
    manifest: `/books/${epubName}.json`,
  });
  var txt = JSON.stringify(data);
  fs.writeFileSync(path.join(__dirname, "../../public/books.json"), txt);
}

unpackEpub(
  "/home/abc/Programming/Web-Development/book-reading/src/assets/Malazan Book of the Fallen -01- Gardens of the Moon (Steven Erikson) (Z-Library).epub",
  "Malazan",
);
