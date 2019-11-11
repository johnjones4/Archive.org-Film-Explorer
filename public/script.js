document.getElementById('reset').addEventListener('click', event => {
  event.preventDefault()
  const selects = document.getElementsByTagName('select')
  for (let i = 0; i < selects.length; i++) {
    selects[i].selectedIndex = 0
  }
  return false
})
