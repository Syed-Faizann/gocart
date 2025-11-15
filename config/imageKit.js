import ImageKit from "@imagekit/nodejs";

const client = new ImageKit({
  privateKey: process.env["IMAGEKIT_PRIVATE_KEY"],
  publicKey: process.env["IMAGEKIT_PUBLIC_KEY"],
  urlEndpoint: process.env["IMAGE_URL_ENDPOINT"], // This is the default and can be omitted
});

const response = await client.files.upload({
  file: fs.createReadStream("path/to/file"),
  fileName: "file-name.jpg",
});

console.log(response);
