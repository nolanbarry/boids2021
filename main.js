// toggle sidebar
document.addEventListener("keypress", event => {
  if (event.key != "q") return;
  let sidebar = document.querySelector('#sidebar');
  if(sidebar.classList.contains('closed')) {
    sidebar.classList.add('open');
    sidebar.classList.remove('closed');
  }
  else {
    sidebar.classList.add('closed');
    sidebar.classList.remove('open');
  }
});
