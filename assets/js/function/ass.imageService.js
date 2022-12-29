let useWebp = false;

const removeXlImg = (images) => {
  const result = [];
  images.forEach(($img) => {
    if ($img.indexOf("1140x500") === -1) {
      result.push($img);
    }
  });

  return result;
};

/**
 * Ask cloudinary to resize the image to improve page load time or transform in another ratio
 * Input examples :
 *  http://img.loisirsencheres.fr/loisirs/image/upload/v1463153505/product/p1139_750x459_vue-jardin.jpg
 *  http://img.loisirsencheres.fr/loisirs/image/upload/g_north_east,l_icon-vol/v1467641983/product/p1417_Orangerie_Lanniron_750x459_4.jpg
 * @param string $url
 * @param string string example : "c_fit,w_640"
 * @return string
 */
export const transf = (url, string) => {
  if (url.indexOf("cloudinary.com") !== -1 || url.indexOf("d1rzpnuhmq7w9v.cloudfront.net") !== -1 || url.indexOf("img.loisirsencheres.fr") !== -1) {
    const replacement = "$1" + string + "/$2";
    const img = url.replace(/(.*\/image\/upload.*)(v[0-9]{10}\/.*)/i, replacement);
    return useWebp ? img.replace(/(.*)(.jpg|.png|.jpeg)$/, "$1.webp") : img;
  }
  return url;
};

export const noprotocol = url => url.replace(/(https:|http:)/g, "");

/**
 * setExtension replaces jpg with webP if the browser supports it
 * @param {Object or String} images
 */
const setExtension = (images) => {
  const supportsWebp = useWebp;

  /* only select last 4 characters in string that match ".jpg" */
  const extensionRegex = /(.*)(.jpg|.png|.jpeg)$/;

  if (typeof images === 'object') {
    return images.map(image => (supportsWebp ? image.replace(extensionRegex, "$1.webp") : image));
  }
  return supportsWebp ? images.replace(extensionRegex, "$1.webp") : images;
};

/**
 * @param array images
 * @return string one url
 */
export const imgForList = (images) => {
  // Don't use XL image
  images = removeXlImg(images);
  // If there is a new format image return it otherwise return the first
  images.forEach(($img) => {
    if ($img.indexOf("750x459") !== -1) {
      return $img;
    }
  });
  return setExtension(images[0]);
};

/**
 * Update value of useWebp
 * @param val
 * @returns {*}
 */
/* eslint no-return-assign: 0 */
export const setUseWebp = val => useWebp = val;
/* eslint no-return-assign: 1 */
/**
 * prepareImages returns an image URL prepared with setExtension, imgForList and noProtocol
 * @param {Array} images
 */
export const prepareImages = images => noprotocol(imgForList(setExtension(images)));
