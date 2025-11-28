// config/imageKit.js
// import ImageKit from "@imagekit/nodejs";

// export const imagekit = new ImageKit({
//   publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
//   privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
//   urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
// });
// export default imagekit;
// import ImageKit from "@imagekit/nodejs";

// const imagekit = new ImageKit({
//   publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
//   privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
//   urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
// });

// export default imagekit;

// config/imageKit.js
// This file is now optional since we're using manual upload
// You can remove it if not used elsewhere, or keep it for URL generation

// For now, let's keep it empty or remove it
// If you need URL generation elsewhere, you can use this:
const getImageKitUrl = (filePath, transformations = []) => {
  const transformString = transformations.map(t => 
    Object.entries(t).map(([key, value]) => `${key}-${value}`).join(',')
  ).join('/');
  
  return `https://ik.imagekit.io/${process.env.IMAGEKIT_URL_ENDPOINT?.split('/').pop()}/${transformString ? `tr:${transformString}/` : ''}${filePath}`;
};

export default { getImageKitUrl };