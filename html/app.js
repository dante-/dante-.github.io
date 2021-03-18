import {Gui, EditGui} from "./gui.js";

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

function init() {
  //add on-clicks
  document.getElementById("addPeopleButton").addEventListener("click",splitters);
  document.getElementById("addPeopleName").addEventListener("keydown",splitters);
  document.getElementById("rSumVal").addEventListener("change",m_manager);
  return;
}

window.onload=init;
