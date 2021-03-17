class SplitterEntry {
  constructor (name, update_cb) {
    [this.gui_ref, this.name_display, this.amount_display]
      = Gui.newFriendListItem(name, ()=>{this.editAmount();});
    this.is_rest_splitter = true;
    this.personal_slice = [];
    Gui.appendToFriendlist(this.gui_ref);
    this.update_cb=update_cb; //has to implement method update(e)
  }
  editAmount () {
    let edit = new EditGui(this.personal_slice, this.name, this.is_rest_splitter, this);
    edit.show();
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
  update(amounts, name, is_splitter){
    this.personal_slice=amounts;
    this.name=name;
    this.is_rest_splitter=is_splitter;
    this.update_cb.update(this);
  }
}

class SplitterColl {
  constructor () {
    this.splitters = [];
    this.update_handlers = new Set();
  }
  add (name) {
    const newSplitter = new SplitterEntry(name,this);
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
  addUpdateListener(handler) { //must implement handler.update(SplitterColl e)
    if(typeof(handler.update) != "function"){
      throw(handler +"contains no function 'update'");
    }
    return !!this.update_handlers.add(handler);
  }
  removeUpdateListener(handler) {
    return this.update_handlers.delete(handler);
  }
  update(e) { //only intended to be used for SplitterEntry
    for (const elm of this.update_handlers){
      elm.update(this);
    }
  }
  handleEvent(e) {
    switch(e.target) {
      case Gui.add_people_button:
        this.add_splitter_from_Gui();
        break;
      case Gui.add_people_name:
        if(e.type == "keydown" && e.key == "Enter"){
          this.add_splitter_from_Gui();
        }
        break;
      default:
        console.log("Event source unknown to SplitterColl.");
        console.log(e);
        break;
    }
  }
  add_splitter_from_Gui(){
    let name = Gui.nameInput;
    if(name == ""){
      Gui.add_people_name.blur();
      return;
    }
    this.add(name);
    Gui.nameInput="";
    this.update();
  }
}

const splitters = new SplitterColl();

class MoneyManager {
  constructor (splitters) {
    this.splitters = splitters;
    this.splitters.addUpdateListener(this);
  }
  get total_amount() {
    return Gui.amountInput || 0;
  }
  updateSplitters () { //calculation in cents
    let splitter_data = [...splitters.monetaryData()];
    let rest_splitter_count = 0;
    let total_personal_amount = 0;
    let total_cents = this.total_amount * 100;
    for (const elm of splitter_data) {
      rest_splitter_count += elm.splits_rest ? 1 : 0;
      total_personal_amount += Math.round(elm.personal_sum * 100); //conv to cents
    }
    let remain_amount = total_cents - total_personal_amount;
    if (remain_amount != 0 && rest_splitter_count == 0) {
      this.calcError("Values don't add up. No one to split the rest with.");
    }
    let split_per_splitter = Math.floor(remain_amount / rest_splitter_count); //may leave up to n-1 cents
    let left_over_cents = remain_amount - split_per_splitter * rest_splitter_count; //how many cents left?
    let pers_tmp; //calc-buffer
    for (const elm of splitter_data) {
      pers_tmp=Math.round(elm.personal_sum * 100); // convert to cents
      if(elm.splits_rest) {
        pers_tmp += split_per_splitter;
        if(left_over_cents) { //0 -> false
          pers_tmp++;
          left_over_cents--;
        }
      }
      elm.update_text((pers_tmp / 100).toFixed(2));
    }
  }
  calcError(errmsg){
    console.log(errmsg);
  }
  update(e) {
    //implement SplitterColl-interface
    if(e !== this.splitters){
      return;
    }
    this.updateSplitters();
  }
  handleEvent(e) {
    switch(e.target) {
      case Gui.grand_total_input:
        this.updateSplitters();
        break;
      default:
        console.log(e);
    }
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
    amount_list.push(0);
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
  }
  teardown () {
    Gui.enableInputs();
    this.edit_root.hidden=true;
    this.name="";
    this.splits_rest=true;
    this.edit_root.querySelector("div.mid").removeChild(this.piece_container);
    for (const elm of this.edit_root.querySelectorAll(".button")){
      elm.removeEventListener("click",this);
    }
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
  handleEvent(e) {
    switch(e.target?.id) {
      case "approve_edit":
        this.submit();
        break;
      case "cancel_edit":
        this.teardown();
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
  document.getElementById("addPeopleButton").addEventListener("click",splitters);
  document.getElementById("addPeopleName").addEventListener("keydown",splitters);
  document.getElementById("rSumVal").addEventListener("change",m_manager);
  return;
}

class EventCollector {
  constructor(selector_string, e_type="click"){
    this.caughtEvents=new Map();
    for (const elm of document.querySelectorAll(selector_string)) {
      this.caughtEvents.set(elm);
      elm.addEventListener(e_type, this);
    }
  }
  handleEvent(e) {
    this.caughtEvents.set(e.target,e);
    e.target.removeEventListener(e.type, this);
  }
}

