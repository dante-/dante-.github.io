import {SwipeToDeleteController} from "./swipe_ctrl.js";

export class Gui {
  static newFriendListItem (friendName, edit_callback) {
    const newSplitAmount = document.createElement("div");
    newSplitAmount.classList.add("splitAmount");
    newSplitAmount.appendChild(document.createTextNode("0.00"));

    const newSplitBox = document.createElement("div");
    newSplitBox.classList.add("splitAmountBox");
    newSplitBox.onclick = edit_callback;
    newSplitBox.appendChild(newSplitAmount);
    newSplitBox.appendChild(document.createTextNode("€"));

    const newName = document.createElement("div");
    newName.appendChild(document.createTextNode(friendName));
    newName.classList.add("friendName");

    const slider = document.createElement("div");
    slider.classList.add("friendsListSlider");
    slider.appendChild(newName);
    slider.appendChild(newSplitBox);

    const spacer = document.createElement("div");
    spacer.classList.add("fli-spacer");

    const deleter = document.createElement("div");
    deleter.classList.add("fli-deleter");

    const newLI = document.createElement("li");
    newLI.classList.add("friendsListItem");
    newLI.appendChild(slider);
    newLI.appendChild(spacer);
    newLI.appendChild(deleter);

    this.swicon.add(slider);
    newLI.addEventListener('RS_deleting', function(evt) {
      newLI.classList.remove("open");
      newLI.classList.add("deleting");
    });
    newLI.addEventListener('RS_open', function(evt) {
      newLI.classList.remove("deleting");
      newLI.classList.add("open");
    });
    newLI.addEventListener('RS_close', function(evt) {
      newLI.classList.remove("deleting");
      newLI.classList.remove("open");
    });
    newLI.addEventListener('RS_slideEnd',function(evt) {
      if(this.classList.contains('deleting')){
        this.addEventListener('transitionend', function(e){
          if(e.propertyName == 'width'){
            this.dispatchEvent(new Event('RS_destroy'));
          }
        });
        this.style.transition='width 0.2s';
        this.style.width='200%';
      }
    });
    return [newLI, newName, newSplitAmount];
  }
  static get swicon() {
    delete this.swicon;
    return this.swicon = new SwipeToDeleteController();
  }
  static appendToFriendlist(new_elm) {
    this.friend_list.appendChild(new_elm);
  }
  static removeFromFriendlist(elm) {
    elm.parentElement.removeChild(elm);
  }
  static get friend_list() {
    delete this.friend_list;
    return this.friend_list=document.querySelector("#friendsListContainer > ul.friendslist");
  }
  static get add_people_button() {
    delete this.add_people_button;
    return this.add_people_button=document.getElementById("addPeopleButton");
  }
  static get add_people_name() {
    delete this.add_people_name;
    return this.add_people_name=document.getElementById("addPeopleName");
  }
  static set nameInput(name) {
    if(typeof(name) == "string"){
      return this.add_people_name.value = name;
    }
    throw 'Parameter name not of type string.';
  }
  static get nameInput() {
    return this.add_people_name.value;
  }
  static get grand_total_input () {
    delete this.grand_total_input;
    return this.grand_total_input = document.getElementById("rSumVal");
  }
  static set amountInput(amount) {
    amount = +amount;
    if(typeof(amount) != "number" || isNaN(amount)){
      throw("Amount is not a valid number.");
    }
    return this.grand_total_input.valueAsNumber = amount;
  }
  static get amountInput() {
    return this.grand_total_input.valueAsNumber;
  }
  static enableInputs() {
    this.grand_total_input.disabled=false;
    this.add_people_name.disabled=false;
  }
  static disableInputs() {
    this.grand_total_input.disabled=true;
    this.add_people_name.disabled=true;
  }
  static get clear_all() {
    delete this.clear_all;
    return this.clear_all = document.getElementById("clear_all_button");
  }
}

class CustMap extends Map {
  constructor(...args) {
    super(...args);
    this._last=null;
    this._last_deleted=true;
  }
  set(key,value){
    this._last=key;
    this._last_deleted=false;
    return super.set(key,value);
  }
  get last() {
    if(this._last_deleted) {
      if(this.size == 0){
        return undefined;
      }
      for (const elm of this.keys()) {
        this._last = elm;
      }
      this._last_deleted = false;
    }
    return this._last;
  }
  _delete (key) {
    if(key === this._last){
      this._last_deleted = true;
    }
    return super.delete(key);
  }
  clear() {
    this._last_deleted = true;
    return super.clear();
  }
}
CustMap.prototype.delete = CustMap.prototype._delete;

export class EditGui {
  //workaround to define static value in class-definition
  static get SoloPiece() {
    //EditGui.SoloPiece
    delete this.SoloPiece;
    return this.SoloPiece = class {
      constructor(initAmount, manager) {
        this.piece_input = document.createElement("input");
        this.piece_input.type = "number";
        this.piece_input.step = "0.01";
        this.piece_input.placeholder="0";
        this.piece_input.setAttribute("inputmode","decimal");
        this.piece_input.classList.add("solo_piece_input");

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
        this.piece_input.addEventListener("keydown",this);
      }

      set value(val) {
        val=Math.floor(val * 100 + 0.5) / 100 || 0;
        if (val == 0){
          return this.piece_input.value = "";
        }
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
            break;
          case "input":
            if (val !== "") { // if not really empty
              e.target.addEventListener("change",this);
              e.target.removeEventListener("input",this);
              this.manager?.pieceNowFilled?.(this);
            }
            break;
          case "keydown":
            switch(e.key){
              case "Enter":
                this.manager?.piecePressedEnter?.(this);
                break;
            }
            break;
          default:
            console.log(e);
            break;
        }
      }
      appendTo(element) {
        return element.appendChild?.(this.piece_container);
      }
      remove() {
        return this.piece_container.parentNode?.removeChild(this.piece_container);
      }
      focus() {
        this.piece_input.focus();
      }
    };
  }
  constructor (amount_list, name, splits_rest,
    callback,
    edit_root=document.getElementById("edit_interface")){
    // init members
    this.name_box=edit_root.querySelector("#username");
    this.splitter_box=edit_root.querySelector("#isSplitter");
    this.piece_container=document.createElement("ul");
    edit_root.querySelector("div.mid").appendChild(this.piece_container);
    this.edit_root=edit_root

    // create edits for pieces
    this.pieces = new CustMap();
    amount_list = [...amount_list, 0];
    for (const piece of amount_list.map(elm => new EditGui.SoloPiece(elm, this))){
      this.pieces.set(piece);
      piece.appendTo(this.piece_container);
    }
    for (const elm of this.edit_root.querySelectorAll(".button")){
      elm.addEventListener("click",this);
    }
    this.name = name;
    this.splits_rest = splits_rest;
    this.callback = callback; // object with "update"-method
  }
  show () {
    Gui.disableInputs();
    this.edit_root.hidden=false;
    setTimeout(() => this.edit_root.classList.add('slide_in'),5);
  }
  teardown () {
    this.edit_root.addEventListener('transitionend',this);
    this.edit_root.classList.remove('slide_in');
  }
  set name(_name) {
    return this.name_box.value = _name;
  }
  get name() {
    return this.name_box.value;
  }
  get splits_rest () {
    return this.splitter_box.checked;
  }
  set splits_rest (_splits) {
    return this.splitter_box.checked = !!_splits;
  }
  pieceNowEmpty(piece) {
    if (this.pieces.last != piece) {
      this.pieces.delete(piece);
      piece.remove();
    }
  }
  pieceNowFilled(piece) {
    if(this.pieces.last == piece) {
      const nu_piece = new EditGui.SoloPiece(0, this);
      this.pieces.set(nu_piece);
      nu_piece.appendTo(this.piece_container);
      nu_piece.focus();
      piece.focus();
    }
  }
  piecePressedEnter(piece){
    if(this.pieces.last == piece){
      if(piece.value == 0){
        this.submit();
        return;
      }
      const nu_piece = new EditGui.SoloPiece(0, this);
      this.pieces.set(nu_piece);
      nu_piece.appendTo(this.piece_container);
      nu_piece.focus();
    } else {
      this.pieces.last.focus();
    }
  }
  handleTransition(e) {
    Gui.enableInputs();
    this.edit_root.hidden=true;
    this.name="";
    this.splits_rest=true;
    this.edit_root.querySelector("div.mid").removeChild(this.piece_container);
    for (const elm of this.edit_root.querySelectorAll(".button")){
      elm.removeEventListener("click",this);
    }
    this.edit_root.removeEventListener('transitionend', this);
  }
  handleClick(e) {
    switch(e.target?.id) {
      case "approve_edit":
        this.submit();
        break;
      case "cancel_edit":
        this.teardown();
        break;
    }
  }
  handleEvent(e) {
    switch(e.type) {
      case 'click':
        this.handleClick(e);
        break;
      case 'transitionend':
        this.handleTransition(e);
        break;
    }
  }
  submit(){
    const new_amounts=[];
    for (const key of this.pieces.keys()){
      if(key.value != 0){
        new_amounts.push(key.value);
      }
    }
    this.callback.update?.(new_amounts, this.name, this.splits_rest);
    this.teardown()
  }
}

