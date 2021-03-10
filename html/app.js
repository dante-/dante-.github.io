class SplitterEntry {
  constructor (name) {
    this.name = name;
    this.guiElm = null;
    this.splits_rest = true;
    this.personal_slice = [];
  }
  addGui () {
    if(this.guiElm == null) {
      this.guiElm = Gui.newFriendListItem(this.name);
    }
    this.guiElm.querySelector("div.splitAmount").onclick=this.editAmount;
    document.querySelector("#friendsListContainer > ul.friendslist").appendChild(this.guiElm);
  }
  editAmount () {
    console.log("Clicked Amount-display for user "+name);
  }
}

class SplitterColl {
  constructor () {
    this.splitters = [];
  }
  add (name) {
    const newSplitter = new SplitterEntry(name);
    this.splitters.push(newSplitter);
    newSplitter.addGui();
  }
}

const splitters = new SplitterColl();

class Gui {
  static newFriendListItem (friendName) {
    const newLI = document.createElement("li");
    newLI.classList.add("friendsListItem");

    const newName = document.createElement("div");
    newName.appendChild(document.createTextNode(friendName));
    newName.classList.add("friendName");

    const newSplitBox = document.createElement("div");
    newSplitBox.classList.add("splitAmountBox");
    const newSplitAmount = document.createElement("div");
    newSplitAmount.classList.add("splitAmount");
    newSplitAmount.appendChild(document.createTextNode("0.00"));
    newSplitBox.appendChild(newSplitAmount);
    newSplitBox.appendChild(document.createTextNode("€"));

    newLI.appendChild(newName);
    newLI.appendChild(newSplitBox);
    return newLI;
  }
}

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


function genID() {
  let r4= () => {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return r4() + r4();
}

function dummySplitter() {
  splitters.add(genID());
}

function init() {
  //add on-clicks
  document.getElementById("addElm").onclick=addElement;
  document.getElementById("resetPage").onclick=resetPage;
  document.getElementById("addPeopleButton").onclick=dummySplitter;
  return;
}

