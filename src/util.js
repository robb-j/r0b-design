exports.html = (strings, ...args) => {
  let output = []
  for (let i in strings) {
    output.push(strings[i])
    output.push(args[i])
  }
  return output.join('')
}
