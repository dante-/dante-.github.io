function addElement() {
  const newDiv = document.createElement("div");
  const newCont = document.createTextNode("Hi! This text was generated.");
  newDiv.appendChild(newCont);
  newDiv.classList.add("ins");
  const currentDiv = document.getElementById("div1");
  document.body.insertBefore(newDiv, currentDiv);
}

