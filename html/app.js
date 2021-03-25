import {Gui, EditGui} from "./gui.js";

try{
  navigator.serviceWorker.register('./servwork.js', {
    scope: '.'
});
} catch {};

class SplitterEntry {
  constructor (name, update_cb) {
    [this.gui_ref, this.name_display, this.amount_display]
      = Gui.newFriendListItem(name, ()=>{this.editAmount();});
    this.is_rest_splitter = true;
    this.personal_slice = [];
    Gui.appendToFriendlist(this.gui_ref);
    this.update_cb=update_cb; //has to implement method update(e) and remove_child(e)
    this.gui_ref.addEventListener('RS_destroy',(evt) => this.update_cb.remove_child(this));
  }
  editAmount () {
    let edit = new EditGui(this.personal_slice, this.name, this.is_rest_splitter, this);
    edit.go().then(({amounts, name, is_splitter}) => this.update(amounts, name, is_splitter),() => {});
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
  notify(){
    this.gui_ref.dispatchEvent(new Event("RS_splitterUpdate",{bubbles: true}));
  }
  update(amounts, name, is_splitter){
    this.personal_slice=amounts;
    this.name=name;
    this.is_rest_splitter=is_splitter;
    this.notify();
  }
  destroy(){
    Gui.removeFromFriendlist(this.gui_ref);
    this.is_rest_splitter=false;
    this.personal_slice=[0];
    this.notify();
  }
}

class SplitterColl {
  constructor () {
    this.splitters = new Set();
  }
  add (name) {
    const newSplitter = new SplitterEntry(name,this);
    this.splitters.add(newSplitter);
    newSplitter.notify();
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
  addRS_splitterUpdate(handler) {
    Gui.friend_list.addEventListener("RS_splitterUpdate",handler);
  }
  removeRS_splitterUpdate(handler){
    Gui.friend_list.removeEventListener("RS_splitterUpdate",handler);
  }
  remove_child(e){
    if(this.splitters.delete(e)){
      e.destroy();
    } else {
      console.log(`Failed to delete`);
      console.log(e);
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
  constructor (splitters, grand_total_input) {
    this.splitters = splitters;
    this.splitters.addRS_splitterUpdate(this);
    this.grand_total_input = grand_total_input;
  }

  get total_amount() {
    return this._gti?.valueAsNumber || 0;
  }
  set grand_total_input(gti){
    this._gti?.removeEventListener("change", this);
    this._gti = gti;
    this._gti?.addEventListener("change", this);
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
  handleEvent(e) {
    switch(e.type) {
      case "RS_splitterUpdate":
        this.updateSplitters();
        break;
      default:
        switch(e.target) {
          case this._gti:
            this.updateSplitters();
            break;
          default:
            console.log(e);
        }
    }
  }
}

const m_manager=new MoneyManager(splitters,Gui.grand_total_input);

function init() {
  //add on-clicks
  document.getElementById("addPeopleButton").addEventListener("click",splitters);
  document.getElementById("addPeopleName").addEventListener("keydown",splitters);
  return;
}

window.onload=init;
