
/**
 * toCsvString - will return a csv string that can be directly written as a csv file
 *
 * @param  {Array} array Should be an array of objects
 *                       where each object's key is the same in each object
 *                       they will be the headers in the csv file
 *
 * @return {String}       csv string
 */
export default function toCsvString(array) {
  const csvString = [
    Object.keys(array[0]),
    ...array.map(item => Object.values(item))
  ].map(e => e.join(","))
  .join("\n");

  return csvString;
}
