function addElement() {
  const newDiv = document.createElement("div");
  const newCont = document.createTextNode("Hi! This text was generated.");
  newDiv.appendChild(newCont);
  newDiv.classList.add("ins");
  const currentDiv = document.getElementById("div1");
  currentDiv.parentElement.insertBefore(newDiv, currentDiv);
}

function resetPage() {
  document.querySelectorAll("div.ins").forEach((elm) => {
    elm.parentNode.removeChild(elm)
  });
  addElement();
}

function init() {
  //add on-clicks
  document.getElementById("addElm").onclick=addElement;
  document.getElementById("resetPage").onclick=resetPage;
  return;
}

