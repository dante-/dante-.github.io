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
      Gui.appendToFriendlist(this.guiElm);
    }
    this.guiElm.querySelector("div.splitAmountBox").onclick=() => {this.editAmount();};
    this.amount = this.guiElm.querySelector("div.splitAmount");
  }
  editAmount () {
    console.log("Clicked Amount-display for user "+this.name);
  }
  getPersonalSlice () {
    let sum = 0;
    this.personal_slice.forEach((elm) => {
      sum += elm;
    });
    return sum;
  }
  getRestSplitter () {
    return this.splits_rest;
  }
  updateAmountDisplay () {
    this.amount.innerText = new_amount;
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
  static friend_list = null;
  static appendToFriendlist(new_elm) {
    this.friend_list.appendChild(new_elm);
  }
  static init () {
    this.friend_list = document.querySelector("#friendsListContainer > ul.friendslist");
  }
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
  Gui.init();
  //add on-clicks
  document.getElementById("addPeopleButton").onclick=dummySplitter;
  return;
}

