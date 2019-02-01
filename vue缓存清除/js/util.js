const hasOwnProperty = Object.prototype.hasOwnProperty

function inArray(ele, array) {
  let i = array.indexOf(ele)
  let o = {
    include: i !== -1,
    index: i
  }
  return o
}

function isArray (array) {
  return Array.isArray(array)
}

function hasOwn (key, obj) {
  return hasOwnProperty.call(obj, key)
}
