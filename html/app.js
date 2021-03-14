class SplitterEntry {
  constructor (name) {
    [this.gui_ref, this.name_display, this.amount_display]
      = Gui.newFriendListItem(name, ()=>{this.editAmount();});
    this.is_rest_splitter = true;
    this.personal_slice = [];
    Gui.appendToFriendlist(this.gui_ref);
  }
  editAmount () {
    console.log("Clicked Amount-display for user "+this.name);
  }
  //getters & setters
  get pers_total() {
    let sum = 0;
    this.personal_slice.forEach((elm) => {
      sum += elm;
    });
    return sum;
  }

  get name() {
    return this.name_display.innerText;
  }
  set name(new_name) {
    return this.name_display.innerText = new_name;
  }

  get amount() {
    return this.amount_display.innerText;
  }
  set amount(new_amount) {
    return this.amount_display.innerText = new_amount;
  }
}

class SplitterColl {
  constructor () {
    this.splitters = [];
  }
  add (name) {
    const newSplitter = new SplitterEntry(name);
    this.splitters.push(newSplitter);
  }
  *monetaryData () {
    for (const elm of this.splitters) {
      yield {
        splits_rest: elm.is_rest_splitter,
        personal_sum: elm.pers_total,
        update_text: (text) => {elm.amount = text;}
      };
    }
  }
}

const splitters = new SplitterColl();

class MoneyManager {
  constructor (splitters) {
    this.splitters = splitters;
    this.total_amount=0;
  }
  updateSplitters () {
    let splitter_data = [...splitters.monetaryData()];
    let rest_splitter_count = 0;
    let total_personal_amount = 0;
    for (const elm of splitter_data) {
      rest_splitter_count += elm.splits_rest ? 1 : 0;
      total_personal_amount += elm.personal_sum;
    }
    let remain_amount = this.total_amount - total_personal_amount;
    if (remain_amount != 0 && rest_splitter_count == 0) {
      this.calcError("Values don't add up. No one to split the rest with.");
      return;
    }
    let split_up_left = Math.floor(remain_amount * 100 / rest_splitter_count) / 100;
    for (const elm of splitter_data) {
      elm.update_text(elm.personal_sum + elm.splits_rest ? split_up_left : 0)
    }
  }
  calcError(errmsg){
    console.log(errmsg);
  }
  updateTotal(newVal) {
    this.total_amount = newVal || 0;
    this.updateSplitters();
  }
}

const m_manager=new MoneyManager(splitters);

class Gui {
  static newFriendListItem (friendName, edit_callback) {
    const newLI = document.createElement("li");
    newLI.classList.add("friendsListItem");

    const newName = document.createElement("div");
    newName.appendChild(document.createTextNode(friendName));
    newName.classList.add("friendName");

    const newSplitBox = document.createElement("div");
    newSplitBox.classList.add("splitAmountBox");
    newSplitBox.onclick = edit_callback;
    const newSplitAmount = document.createElement("div");
    newSplitAmount.classList.add("splitAmount");
    newSplitAmount.appendChild(document.createTextNode("0.00"));
    newSplitBox.appendChild(newSplitAmount);
    newSplitBox.appendChild(document.createTextNode("€"));

    newLI.appendChild(newName);
    newLI.appendChild(newSplitBox);
    return [newLI, newName, newSplitAmount];
  }
  static appendToFriendlist(new_elm) {
    this.friend_list.appendChild(new_elm);
  }
  static get friend_list() {
    delete this.friend_list;
    return this.friend_list=document.querySelector("#friendsListContainer > ul.friendslist");
  }
}

class EditGui {
  //workaround to define static value in class-definition
  static get SoloPiece() {
    //EditGui.SoloPiece
    delete this.SoloPiece;
    return this.SoloPiece = class {
      constructor(initAmount, manager) {
        this.piece_input = document.createElement("input");
        this.piece_input.type = "number";
        this.piece_input.step = "0.01";
        this.piece_input.setAttribute("inputmode","decimal");

        const inputContainer=document.createElement("div");
        inputContainer.classList.add("solo_piece_input");
        inputContainer.appendChild(this.piece_input);

        this.piece_container = document.createElement("li");
        this.piece_container.classList.add("solo_piece");
        this.piece_container.appendChild(inputContainer);

        this.value = initAmount;
        this.manager = manager;

        if(this.value == 0) {
          this.piece_input.addEventListener("input",this);
        } else {
          this.piece_input.addEventListener("change",this);
        }
      }

      set value(val) {
        val=Math.floor(val * 100 + 0.5) / 100 || 0;
        return this.piece_input.value = val.toFixed(2);
      }
      get value() {
        return this.piece_input.valueAsNumber || 0;
      }

      handleEvent(e) {
        let val = e.target.value;
        switch (e.type) {
          case "change":
            if (val == 0) { //val == 0 works on "" and "0"
              e.target.addEventListener("input",this);
              e.target.removeEventListener("change",this);
              this.manager?.pieceNowEmpty?.(this);
            }
            return;
          case "input":
            if (val !== "") { // if not really empty
              e.target.addEventListener("change",this);
              e.target.removeEventListener("input",this);
              this.manager?.pieceNowFilled?.(this);
            }
            return;
        }
      }
      appendTo(element) {
        return element.appendChild?.(this.piece_container);
      }
      remove() {
        return this.piece_container.parentNode?.removeChild(this.piece_container);
      }
    };
  }
  constructor (amount_list, name, splits_rest,
    callback,
    edit_root=document.getElementById("edit_interface")){
    // init members
    this.name_box=edit_root.getElementById("username");
    this.splitter_box=edit_root.getElementById("isSplitter");
    this.piece_container=edit_root.querySelector("div.mid > ul");
    this.edit_root=edit_root

    // create edits for pieces
    this.pieces = amount_list.map(elm => new EditGui.SoloPiece(elm, this));
    this.pieces.push(new EditGui.SoloPiece("", this));
    for (const elm of this.pieces){
      elm.appendTo(this.piece_container);
    }
    this.name = name;
    this.splits_rest = splits_rest;
    this.callback = callback; // object with "update"-method
  }
  get edit_root() {
    delete this.edit_root;
    return this.edit_root = document.getElementById("edit_interface");
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
  m_manager.updateSplitters();
}

function init() {
  //add on-clicks
  document.getElementById("addPeopleButton").onclick=dummySplitter;
  document.getElementById("rSumVal").oninput=(e) => {m_manager.updateTotal(e.srcElement.valueAsNumber);};
  return;
}

